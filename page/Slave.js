var amqp = require('amqplib/callback_api');
var URI = require('urijs');
var Nightmare = require('nightmare');
var htmlAnalysis = require('./htmlAnalysis.js');
var mong_client = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var SFTPClient = require('sftp-promises');
var winston = require('winston');

class Slave {
    constructor(siteID, baseURL, rabbitMQServer, mongoServer, fileServerName, show) {
        this.siteID = siteID;
        this.baseURI = new URI(baseURL);
        this.queue = `urlOf${siteID}`;
        this.rmq_url = `amqp://${rabbitMQServer}`;
        this.db_url = `mongodb://${mongoServer}:27017/mrs-sam-page`;
        this.fileServerName = fileServerName;
        this.show = show;
        this.ch = undefined;
        this.db = undefined;

        this.initSFTP();

        winston.info('Slave is ok');
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
        amqp.connect(this.rmq_url, (err, conn) => {
            if (err) {
                winston.log(err);
            } else {
                conn.createChannel((err, ch) => {
                    if (err) {
                        winston.log(err);
                    } else {
                        this.ch = ch;
                        mong_client.connect(this.db_url, (err, db) => {
                            if (err) {
                                winston.log(err);
                            } else {
                                this.db = db;
                                winston.info('PageTester is running!');
                                this.ch.assertQueue(this.queue, { durable: false });
                                this.stop = false;
                                this.getMsg();
                            }
                        });
                    }
                });
            }
        });
    }

    stop() {
        this.stop = true;
    }

    getMsg() {
        if (!this.stop) {
            this.ch.get(this.queue, { noAck: false }, (err, msgOrFalse) => {
                if (err) {
                    setTimeout(() => {
                        this.getMsg();
                    }, 2000);
                } else {
                    this.handleMsg(msgOrFalse);
                }
            });
        }
    }

    handleMsg(msgOrFalse) {
        if (msgOrFalse && msgOrFalse !== false) {
            var msgContent = JSON.parse(msgOrFalse.content.toString());
            var currentURL = msgContent.url;
            var fromURL = msgContent.from;
            var siteURL = msgContent.site;
            winston.info(`Page Tester is consuming ${msgOrFalse.content.toString()}}`);


            this.db.collection(`Pages_${this.siteID}`, (err, pageColl) => {
                if (!err) {
                    pageColl.findOne({
                        url: currentURL,
                        from: fromURL,
                        site: siteURL,
                        siteID: this.siteID
                    }, (err, recoredPage) => {
                        if (err || !recoredPage) {
                            var oid = ObjectID();
                            //var screenShotPath = this.siteImgDirPath + "/" + oid + ".png";
                            var nightmare = new Nightmare({ show: this.show });
                            nightmare.goto(currentURL)
                                .wait(2000)
                                .screenshot()
                                .then(buffer => {
                                    this.sftpClient.putBuffer(buffer, `upload/${this.siteID}/${oid}.png`).then(() => { winston.info('file saved'); });
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
                                        //hrefs: analysisResult.hrefs,
                                        body: analysisResult.hash
                                    };
                                    pageColl.save(testedPage, null, (err, savePage) => {
                                        this.getMsg();
                                    });
                                })
                                .catch(e => {
                                    winston.log(e);
                                    this.getMsg();
                                });

                        } else {
                            this.getMsg();
                        }
                    });
                } else {
                    winston.log(err);
                }
            });


        } else {
            setTimeout(() => {
                this.getMsg();
            }, 2000);
        }


        function isMailTo(href) {
            return href.includes('mailto');
        }

        function isPdfFile(href) {
            return href.endsWith('.pdf');
        }
    }

}

module.exports.Slave = Slave;
