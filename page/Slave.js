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
        winston.info('slave: created');
    }

    initSFTP() {
        this.sftpConfig = {
            host: this.fileServerName,
            username: 'mrssam',
            password: 'mrssam'
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
                this.ch.assertQueue(this.queue, { durable: false });
                this.isRunning = true;
                this.getMsg();
                winston.info(`slave ${this.slaveId}: started`);
            })
            .catch(err => {
                winston.error(err);
            });
    }

    stop() {
        this.isRunning = false;
    }

    getMsg() {
        if (this.isRunning) {
            this.ch.get(this.queue, { noAck: false })
                .then(msgOrFalse => {
                    this.handleMsg(msgOrFalse);
                })
                .catch(err => {
                    winston.error(err);
                    setTimeout(() => {
                        this.getMsg();
                    }, 2000);
                });
        }
    }

    handleMsg(msgOrFalse) {
        if (msgOrFalse && msgOrFalse !== false) {
            var msgContent = JSON.parse(msgOrFalse.content.toString());
            var currentURL = msgContent.url;
            var fromURL = msgContent.from;
            var siteURL = msgContent.site;
            winston.info(`slave ${this.slaveId}: trying processing ${msgContent.url}`);

            var pageColl = this.db.collection(`Pages_${this.siteID}`);
            pageColl.findOne({
                url: currentURL,
                from: fromURL,
                site: siteURL,
                siteID: this.siteID
            })
                .then(recordedPage => {
                    if (recordedPage === null) {
                        winston.info(`slave ${this.slaveId}: starting processing ${msgContent.url}`);
                        crawlAndSave.call(this, currentURL, siteURL);
                    } else {
                        winston.info(`slave ${this.slaveId}: aborting processing ${msgContent.url} ( already processed)`);
                        this.getMsg();
                    }
                })
                .catch(err => {
                    winston.error(err);
                });
        } else {
            setTimeout(() => {
                this.getMsg();
            }, 2000);
        }
    }
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
    //var screenShotPath = this.siteImgDirPath + "/" + oid + ".png";
    var nightmare = new Nightmare({ show: this.show });
    nightmare.goto(currentURL)
        .wait(2000)
        .screenshot()
        .then(buffer => {
            this.sftpClient.putBuffer(buffer, `upload/${this.siteID}/${oid}.png`).then(() => {
                winston.info(`slave ${this.slaveId}: screenshot of ${currentURL} saved`);
            });
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
                            new Buffer(msg), { persistent: false }
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
                this.getMsg();
            });
        })
        .catch(err => {
            winston.error(err);
            this.getMsg();
        });
}

module.exports.Slave = Slave;
