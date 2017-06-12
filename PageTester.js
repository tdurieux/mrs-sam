var amqp = require('amqplib/callback_api');
var URI = require('urijs');
var Nightmare = require('nightmare');
var htmlAnalysis = require('./htmlAnalysis.js');
var mong_client = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;


class PageTester {
    constructor(fetch_id, base, rabbitMQServer, mongoServer) {
        this.fetch_id = fetch_id;
        this.baseURI = new URI(base)
        this.consumingQ = `PageToTest${fetch_id}`;
        this.producingQ = `URLToCheck${fetch_id}`;
        this.rmq_url = `amqp://${rabbitMQServer}`;
        this.db_url = `mongodb://${mongoServer}:27017/mrssam`;
        this.ch = undefined;
        this.db = undefined;
        this.nightmare = new Nightmare({ show: false });
    }

    start() {
        amqp.connect(this.rmq_url, (err, conn) => {
            if (err) {
                console.log(err)
            } else {
                conn.createChannel((err, ch) => {
                    if (err) {
                        console.log(err);
                    } else {
                        this.ch = ch;
                        mong_client.connect(this.db_url, (err, db) => {
                            if (err) {
                                console.log(err);
                            } else {
                                this.db = db;
                                console.log("PageTester is running!");
                                this.ch.assertQueue(this.consumingQ, { durable: false });
                                this.ch.assertQueue(this.producingQ, { durable: false });
                                this.getMsg();
                            }
                        });
                    }
                });
            }
        });
    }

    getMsg() {
        this.ch.get(this.consumingQ, { noAck: false }, (err, msgOrFalse) => {
            if (err) {
                setTimeout(() => {
                    this.getMsg();
                }, 2000);
            } else {
                this.handleMsg(msgOrFalse);
            }
        });
    }

    handleMsg(msgOrFalse) {
        if (msgOrFalse && msgOrFalse !== false) {
            var url = msgOrFalse.content.toString();
            //console.log(`Page Tester is consuming ${JSON.stringify(url)}`);


            this.db.collection('TestedPage', (err, pageColl) => {
                pageColl.findOne({ url: url, fetch_id: this.fetch_id }, (err, recoredPage) => {
                    if (err || !recoredPage) {
                        var oid = ObjectID();
                        var screenShotPath = "img/" + oid + ".png";
                        //var nightmare = new Nightmare({ show: true });
                        this.nightmare.goto(url)
                            .wait(2000)
                            .screenshot(screenShotPath)
                            .evaluate(htmlAnalysis)
                            //.end()
                            .then(analysisResult => {
                                var testedPage = {
                                    _id: oid,
                                    url: url,
                                    fetch_id: this.fetch_id,
                                    hrefs: analysisResult.hrefs,
                                    body: analysisResult.hash
                                }
                                analysisResult.hrefs.forEach(href => {
                                    this.ch.sendToQueue(this.producingQ,
                                        new Buffer(href), { persistent: false }
                                    );
                                });
                                pageColl.save(testedPage, null, (err, savePage) => {
                                    this.getMsg();
                                });
                            })
                            .catch(e => {
                                this.getMsg();
                            });

                    } else {
                        this.getMsg();
                    }
                });
            });


        } else {
            setTimeout(() => {
                this.getMsg();
            }, 2000);
        }
    }

}

module.exports.PageTester = PageTester;
