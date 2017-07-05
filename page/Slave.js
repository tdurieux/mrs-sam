const amqp = require('amqplib');
const URI = require('urijs');
const Nightmare = require('nightmare');
const htmlAnalysis = require('./htmlAnalysis.js');
const mong_client = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const SFTPClient = require('sftp-promises');
const winston = require('winston');

class Slave {
    constructor(siteID, serverNames, show) {
        this.slaveId = uuidv4();
        this.siteID = siteID;
        this.queue = `urlOf${siteID}`;
        this.rmq_url = `amqp://${serverNames.rabbitServerName}`;
        this.db_url = `mongodb://${serverNames.mongoServerName}:27017/mrs-sam-page`;
        this.fileServerName = serverNames.fileServerName;
        this.show = show;
        this.ch = undefined;
        this.db = undefined;
        this.initSFTP();
        winston.info(`slave ${this.slaveId}: created`);
    }

    initSFTP() {
        this.sftpConfig = {
            host: this.fileServerName,
            username: 'mrssam',
            password: 'mrssam',
            port: 2222
        };
        this.sftpClient = new SFTPClient(this.sftpConfig);
    }

    start() {
        amqp.connect(this.rmq_url)
            .then(conn => {
                return conn.createChannel();
            })
            .then(ch => {
                this.ch = ch;
                return mong_client.connect(this.db_url);
            })
            .then(db => {
                this.db = db;
                return db.collection('Site').findOne({ _id: this.siteID, state: 'started' });
            })
            .then(recordedSite => {
                this.baseURI = new URI(recordedSite.baseurl);
                this.ch.assertQueue(this.queue, { durable: true });
                this.ch.prefetch(1);
                var worker = newWorker(this);
                this.ch.consume(this.queue, worker);
                this.isRunning = true;
                winston.info(`slave ${this.slaveId}: started`);
            })
            .catch(err => {
                winston.info(err);
            });
    }

    stop() {
        this.isRunning = false;
    }
}

function newWorker(obj) {
    return function(msg) {
        var content = JSON.parse(msg.content.toString());
        var currentURL = content.url;
        var fromURL = content.from;
        var siteURL = content.site;
        winston.info(`slave ${obj.slaveId}: trying processing ${content.url}`);

        var pageColl = obj.db.collection(`Pages_${obj.siteID}`);
        pageColl.findOne({
            url: currentURL,
            from: fromURL,
            site: siteURL,
            siteID: obj.siteID
        })
            .then(recordedPage => {
                if (recordedPage === null) {
                    winston.info(`slave ${obj.slaveId}: starting processing ${content.url}`);
                    return crawlAndSave.call(obj, currentURL, siteURL);
                } else {
                    winston.info(`slave ${obj.slaveId}: aborting processing ${content.url} ( already processed)`);
                }
            })
            .then(() => obj.ch.ack(msg))
            .catch(err => {
                winston.info(err);
            });
    };
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
    var oid = ObjectID();
    var nightmare = new Nightmare({ show: this.show });
    return nightmare.goto(currentURL)
        .wait(2000)
        .screenshot()
        .then(buffer => {
            winston.info(`slave ${this.slaveId}: saving screenshot of ${currentURL}`);
            return this.sftpClient.putBuffer(buffer, `upload/${this.siteID}/${oid}.png`);
        })
        .then(() => {
            return nightmare.evaluate(htmlAnalysis).end();
        })
        .then(analysisResult => {
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
                siteID: this.siteID,
                body: analysisResult.hash
            };
            this.db.collection(`Pages_${this.siteID}`).save(testedPage, null, () => {
                winston.info(`slave ${this.slaveId}: body of ${currentURL} saved`);
            });
        })
        .catch(err => {
            winston.info(err);
        });
}

module.exports.Slave = Slave;
