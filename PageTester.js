var amqp = require('amqplib/callback_api');
var URI = require('urijs');
var Nightmare = require('nightmare');
var htmlAnalysis = require('./htmlAnalysis.js');

class PageTester {
    constructor(base) {
        this.baseURI = new URI(base)
        this.consumingQ = 'PageToTest';
        this.producingQ = 'URLToCheck';
        //this.nightmare = new Nightmare({ show: true });
    }

    start() {
        amqp.connect('amqp://localhost', (err, conn) => {
            if (err) {
                console.log(err)
            } else {
                conn.createChannel((err, ch) => {
                    if (err) {
                        console.log(err);
                    } else {
                        this.ch = ch;
                        this.ch.assertQueue(this.consumingQ, { durable: false });
                        this.getMsg(ch, this.consumingQ);
                        console.log("PageTester is running!");
                    }
                });
            }
        });
    }

    consume(ch, queue) {
        setTimeout(() => {
            this.getMsg(ch, queue);
            this.consume(ch, queue);
        }, 2000, ch, queue);
    }


    getMsg(ch, queue) {
        ch.get(queue, { noAck: false }, (err, msgOrFalse) => {
            if (err) {
                this.getMsg(ch, queue);
            } else {
                if (msgOrFalse && msgOrFalse !== false) {
                    var url = msgOrFalse.content.toString();
                    console.log(`consume ${JSON.stringify(url)}`);
                    var nightmare = new Nightmare({ show: true });
                    nightmare.goto(url)
                        .wait(3000)
                        .evaluate(htmlAnalysis)
                        .end()
                        .then(analysisResult => {
                            analysisResult.hrefs.forEach(selector => {
                                this.produce(selector);
                            });
                            this.getMsg(ch, queue);
                        })
                        .catch(e => {
                            this.getMsg(ch, queue);
                        });
                } else {
                    setTimeout(() => {
                        this.getMsg(ch, queue);
                    }, 2000, ch, queue);
                }
            }
        })
    }

    produce(selector) {
        this.ch.assertQueue(this.producingQ, { durable: false });
        this.ch.sendToQueue(this.producingQ, new Buffer(selector), { persistent: false });

    }
}

var urc = new PageTester('http://www.amazon.fr');
urc.start();
