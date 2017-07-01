var amqp = require('amqplib/callback_api');
var URI = require('urijs');
var Nightmare = require('nightmare');
var htmlAnalysis = require('../htmlAnalysis.js');
var mong_client = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;


class PageTester {
    constructor(fetch_id, base, rabbitMQServer, mongoServer, show) {
        this.fetch_id = fetch_id;
        this.baseURI = new URI(base)
        this.consumingQ = `PageToTest${fetch_id}`;
        this.producingQ = `URLToCheck${fetch_id}`;
        this.rmq_url = `amqp://${rabbitMQServer}`;
        this.db_url = `mongodb://${mongoServer}:27017/fetcher`;
        this.show = show;
        this.ch = undefined;
        this.db = undefined;
        //this.nightmare = new Nightmare({ show: true });
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
            var msgContent = JSON.parse(msgOrFalse.content.toString());
            var currentURL = msgContent.url;
            var fromURL = msgContent.from;
            var siteURL = msgContent.site;
            console.log(`Page Tester is consuming ${msgOrFalse.content.toString()}}`);


            this.db.collection(`Pages_${this.fetch_id}`, (err, pageColl) => {
                if (!err) {
                    pageColl.findOne({
                        url: currentURL,
                        from: fromURL,
                        site: siteURL,
                        fetch_id: this.fetch_id
                    }, (err, recoredPage) => {
                        if (err || !recoredPage) {
                            var oid = ObjectID();
                            var screenShotPath = "img/" + this.fetch_id + "/" + oid + ".png";
                            var nightmare = new Nightmare({ show: this.show });
                            //this.
                            nightmare.goto(currentURL)
                                .wait(2000)
                                .screenshot(screenShotPath)
                                .evaluate(htmlAnalysis)
                                .end()
                                .then(analysisResult => {
                                    analysisResult.hrefs.forEach(href => {
                                        var msg = JSON.stringify({
                                            url: href,
                                            from: currentURL,
                                            site: siteURL
                                        });
                                        if (!isMailTo(href) && !isPdfFile(href)) {
                                            this.ch.sendToQueue(this.producingQ,
                                                new Buffer(msg), { persistent: false }
                                            );
                                        }
                                    });
                                    var testedPage = {
                                        _id: oid,
                                        url: currentURL,
                                        from: siteURL,
                                        fetch_id: this.fetch_id,
                                        //hrefs: analysisResult.hrefs,
                                        body: analysisResult.hash
                                    }
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
                } else {
                    console.log(err);
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

module.exports.PageTester = PageTester;
