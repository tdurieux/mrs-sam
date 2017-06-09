var amqp = require('amqplib/callback_api');
var URI = require('urijs');

class URLChecker {
    constructor(base) {
        this.baseURI = new URI(base)
        this.consumingQ = 'URLToCheck';
        this.producingQ = 'PageToTest';
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
                        this.consume(ch, this.consumingQ);
                    }
                });
            }
        });
    }

    consume(ch, queue) {
    	console.log("URLChecker is running!");
        ch.consume(queue, msg => {
        	var url = msg.content.toString();
            try {
                var uri = new URI(url);
                this.produce(uri.absoluteTo(this.baseURI).toString());

            } catch (e) {

            }
        }, { noAck: false });
    }

    produce(checkedURL) {
    	console.log(`produce ${checkedURL}`)
    	this.ch.assertQueue(this.producingQ, { durable: false });
    	this.ch.sendToQueue(this.producingQ, new Buffer(checkedURL), {persistent: false});

    }
}

var urc = new URLChecker('http://www.amazon.fr');
urc.start();
