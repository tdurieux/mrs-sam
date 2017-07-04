var mong_client = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var Slave = require('./Slave.js').Slave;

class Master {
    constructor(url, numberOfSlave, mongoServerName, rabbitMQServerName) {
        this.url = url;
        this.numberOfSlave = numberOfSlave;
        this.mongoServerName = mongoServerName;
        this.rabbitMQServerName = rabbitMQServerName;
        this.siteID = new ObjectID();
        this.dbURL = `mongodb://${this.mongoServerName}:27017/mrs-sam-page`;
    }

    start() {
        mong_client.connect(this.dbURL, (err, db) => {
            if (!err) {
                db.collection('Site', (err, siteColl) => {
                    siteColl.insertOne({ _id: this.siteID, baseurl: this.url }, (err, res) => {
                        if (!err) {
                            startSlave(this.siteID, this.url, this.numberOfSlave, this.mongoServerName, this.rabbitMQServerName);
                            queueRootURL(this.siteID, this.url, this.rabbitMQServerName);
                            console.log('masterFetcher is running with ObjectID=' + this.siteID)
                        }
                    })
                });
            } else {
                console.log(err)
            }
        });
    }
}


function startSlave(siteID, baseURL, numberOfSlave, mongoServerName, rabbitMQServerName) {
    for (var i = 0; i < numberOfSlave; i++) {
        var show = false;
        var slave = new Slave(siteID, baseURL, rabbitMQServerName, mongoServerName, show);
        slave.start();
    }
}




function queueRootURL(siteID, baseURL, rabbitMQServerName) {
    var queue = `urlOf${siteID}`;
    var amqp = require('amqplib/callback_api');
    amqp.connect(`amqp://${rabbitMQServerName}`, (err, conn) => {
        if (err) {
            console.log(err)
        } else {
            conn.createChannel((err, ch) => {
                if (err) {
                    console.log(err);
                } else {
                    var msg = {
                        url: baseURL,
                        site: baseURL,
                        from: baseURL
                    }
                    ch.assertQueue(queue, { durable: false });
                    ch.sendToQueue(queue, new Buffer(JSON.stringify(msg)), { persistent: false });
                }
            });
        }
    });
}


module.exports.Master = Master;
