var amqp = require('amqplib/callback_api');
var queue = 'URLToCheck';

var rootURL = 'http://www.amazon.fr'

amqp.connect('amqp://localhost', (err, conn) => {
    if (err) {
        console.log(err)
    } else {
        conn.createChannel((err, ch) => {
            if (err) {
                console.log(err);
            } else {
                ch.assertQueue(queue, { durable: false });
                ch.sendToQueue(queue, new Buffer(rootURL), {persistent: false});
            }
        });
    }
});


