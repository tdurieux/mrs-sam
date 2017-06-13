var amqp = require('amqplib/callback_api');
var URI = require('urijs');
var mong_client = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;


class URLChecker {
    constructor(fetch_id, base, rabbitMQServer, mongoServer) {
        this.fetch_id = fetch_id;
        this.baseURI = new URI(base)
        this.consumingQ = `URLToCheck${fetch_id}`;
        this.producingQ = `PageToTest${fetch_id}`;
        this.rmq_url = `amqp://${rabbitMQServer}`;
        this.db_url = `mongodb://${mongoServer}:27017/mrssam`;
        this.ch = undefined;
        this.db = undefined;
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
                        this.ch.assertQueue(this.consumingQ, { durable: false });
                        this.ch.assertQueue(this.producingQ, { durable: false });
                        mong_client.connect(this.db_url, (err, db) => {
                            if (err) {
                                console.log(err);
                            } else {
                                this.db = db;
                                this.consume();
                            }
                        });
                    }
                });
            }
        });
    }

    consume() {
        console.log("URLChecker is running!");
        this.ch.consume(this.consumingQ, msg => {
            var url = msg.content.toString();
            console.log(`URLChecker is consuming ${url}`);
            try {
                var uri = new URI(url);
                if (uri.hostname() === this.baseURI.hostname()) {
                    this.produce(uri.absoluteTo(this.baseURI).toString());
                }
            } catch (e) {
                console.log(e);
            }
        }, { noAck: false });
    }

    produce(checkedURL) {
        this.db.collection('TestedPage', (err, pageColl) => {
            pageColl.findOne({ url: checkedURL, fetch_id: this.fetch_id }, (err, pageToTest) => {
                if (!err && !pageToTest) {
                    console.log(`URLChecker is producing ${checkedURL}`);
                    this.ch.sendToQueue(this.producingQ, new Buffer(checkedURL), { persistent: false });
                } else {
                    //console.log(`URLChecker founds exiting ${JSON.stringify(pageToTest)}`);
                }
            })

        });

    }
}

module.exports.URLChecker = URLChecker;
