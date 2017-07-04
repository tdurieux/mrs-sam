var amqp = require('amqplib/callback_api');
var URI = require('urijs');
var Nightmare = require('nightmare');
var htmlAnalysis = require('./htmlAnalysis.js');
var mong_client = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var fs = require('fs');
var  JSFtp  =  require("jsftp");

class Slave {
    constructor(siteID, baseURL, rabbitMQServer, mongoServer, ftpServerName, show) {
        this.siteID = siteID;
        this.baseURI = new URI(baseURL);
        this.queue = `urlOf${siteID}`;
        this.rmq_url = `amqp://${rabbitMQServer}`;
        this.db_url = `mongodb://${mongoServer}:27017/mrs-sam-page`;
        this.ftpServerName = ftpServerName;
        this.show = show;
        this.ch = undefined;
        this.db = undefined;

        this.initFTP();

        console.log("Slave is ok");
    }


    initFTP() {
        this.ftpClient  =  new  JSFtp({  
            host:  this.ftpServerName,
            port: 21,
            user:   "mrssam",
            pass:   "mrssam"  // defaults to "@anonymous" 
        });
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
                                this.ch.assertQueue(this.queue, { durable: false });
                                this.getMsg();
                            }
                        });
                    }
                });
            }
        });
    }

    getMsg() {
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

    handleMsg(msgOrFalse) {
        if (msgOrFalse && msgOrFalse !== false) {
            var msgContent = JSON.parse(msgOrFalse.content.toString());
            var currentURL = msgContent.url;
            var fromURL = msgContent.from;
            var siteURL = msgContent.site;
            console.log(`Page Tester is consuming ${msgOrFalse.content.toString()}}`);


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
                            //this.
                            nightmare.goto(currentURL)
                                .wait(2000)
                                .screenshot()
                                .then(buffer => {
                                    console.log('buffer');
                                    console.log(buffer);
                                    this.ftpClient.put(buffer,  `${this.siteID}/${oid}.png`,  function(hadError)  {  
                                        if  (!hadError)  {
                                            console.log("File transferred successfully!");
                                        }
                                        else {
                                            console.log('FTP Error');
                                            console.log(hadError);
                                        }
                                    });
                                    return nightmare;
                                })
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
                                    }
                                    pageColl.save(testedPage, null, (err, savePage) => {
                                        this.getMsg();
                                    });
                                })
                                .catch(e => {
                                    console.log(e);
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

module.exports.Slave = Slave;
