const amqp = require('amqplib');
const URI = require('urijs');
const Nightmare = require('nightmare');
const htmlAnalysis = require('./htmlAnalysis.js');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const winston = require('winston');

const CrawlerElement = require('./CrawlerElement.js').CrawlerElement;

class Slave extends CrawlerElement {

    constructor(siteId, serverNames, show) {
        super(siteId, serverNames);
        this.show = show;
        this.slaveId = uuidv4();
        this.queue = `urlOf${siteId}`;
        this.pageCollectionName = `Pages_${siteId}`;
        winston.info(`slave ${this.slaveId}: created`);
    }

    start() {
        amqp.connect(this.rmqUrl)
            .then(conn => {
                return conn.createChannel();
            }).then(ch => {
                this.ch = ch;
                return MongoClient.connect(this.dbUrl);
            }).then(db => {
                this.db = db;
                return db.collection('Site').findOne({
                    _id: this.siteId,
                    state: 'started'
                });
            }).then(recordedSite => {
                this.baseURI = new URI(recordedSite.baseurl);
                this.ch.assertQueue(this.queue, { durable: true });
                this.ch.prefetch(1);
                this.ch.consume(this.queue, msg => process.call(this, msg));
                this.isRunning = true;
                winston.info(`slave ${this.slaveId}: started`);
            }).catch(err => {
                winston.info(err);
            });
    }

    stop() {
        this.isRunning = false;
    }
}

function process(msg) {
    var content = JSON.parse(msg.content.toString());
    winston.info(`slave ${this.slaveId}: trying processing ${content.url}`);
    this.db.collection(this.pageCollectionName).findOne({
        url: content.url,
        from: content.from,
        site: content.site,
        siteID: this.siteID
    }).then(recordedPage => {
        if (recordedPage === null) {
            winston.info(`slave ${this.slaveId}: starting processing ${content.url}`);
            return crawlAndSave.call(this, content.url, content.site);
        } else {
            winston.info(`slave ${this.slaveId}: aborting processing ${content.url} ( already processed)`);
        }
    }).then(() => {
        this.ch.ack(msg);
    }).catch(err => {
        winston.info(err);
    });
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function isMailTo(href) {
    return href.includes('mailto');
}

function isPdfFile(href) {
    return href.endsWith('.pdf');
}

function crawlAndSave(currentURL, siteURL) {
    var oid = ObjectId();
    var nightmare = new Nightmare({ show: this.show });
    return nightmare.goto(currentURL).wait(2000).screenshot().then(buffer => {
        winston.info(`slave ${this.slaveId}: saving screenshot of ${currentURL}`);
        return this.sftpClient.putBuffer(buffer, `${this.folder}/${oid}.png`);
    }).then(() => {
        return nightmare.evaluate(htmlAnalysis).end();
    }).then(analysisResult => {
        analysisResult.hrefs.forEach(href => {
            var msg = JSON.stringify({
                url: href,
                from: currentURL,
                site: siteURL
            });
            if (!isMailTo(href) && !isPdfFile(href)) {
                var uri = new URI(href);
                if (uri.hostname() === this.baseURI.hostname()) {
                    this.ch.sendToQueue(this.queue,
                        new Buffer(msg), { persistent: true }
                    );
                }
            }
        });
        var testedPage = {
            _id: oid,
            url: currentURL,
            from: siteURL,
            siteID: this.siteId,
            body: analysisResult.hash
        };
        this.db.collection(this.pageCollectionName).save(testedPage, null, () => {
            winston.info(`slave ${this.slaveId}: body of ${currentURL} saved`);
        });
    }).catch(err => {
        winston.info(err);
    });
}

module.exports.Slave = Slave;
