var mong_client = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var SFTPClient = require('sftp-promises');
var Slave = require('./Slave.js').Slave;
var winston = require('winston');

class Master {
    constructor(url, numberOfSlave, mongoServerName, rabbitMQServerName, fileServerName ) {
        this.url = url;
        this.numberOfSlave = numberOfSlave;
        this.mongoServerName = mongoServerName;
        this.rabbitMQServerName = rabbitMQServerName;
        this.fileServerName = fileServerName;
        this.siteID = new ObjectID();
        this.dbURL = `mongodb://${this.mongoServerName}:27017/mrs-sam-page`;
        this.initSFTP();
    }


    initSFTP() {
        this.sftpConfig = {
            host: this.fileServerName,
            username: 'mrssam',
            password: 'mrssam'
        };
        var sftp = new SFTPClient(this.sftpConfig);
        sftp.mkdir(`upload/${this.siteID}`).then(() => {winston.info('directory created');});
        
    }

    start() {
        mong_client.connect(this.dbURL, (err, db) => {
            if (!err) {
                db.collection('Site', (err, siteColl) => {
                    siteColl.insertOne({ _id: this.siteID, baseurl: this.url }, (err, res) => {
                        if (!err) {
                            var slaveCFG = {
                                siteID: this.siteID,
                                url:this.url,
                                numberOfSlave: this.numberOfSlave,
                                rabbitMQServerName: this.rabbitMQServerName,
                                mongoServerName: this.mongoServerName,
                                fileServerName: this.fileServerName
                            };
                            startSlave(slaveCFG);
                            queueRootURL(this.siteID, this.url, this.rabbitMQServerName);
                        }
                    });
                });
            } else {
                winston.log(err);
            }
        });
    }
}


function startSlave(slaveCFG) {
    for (var i = 0; i < slaveCFG.numberOfSlave; i++) {
        var show = false;
        var slave = new Slave(slaveCFG.siteID, slaveCFG.url, slaveCFG.rabbitMQServerName, slaveCFG.mongoServerName, slaveCFG.fileServerName, show);
        slave.start();
    }
}




function queueRootURL(siteID, baseURL, rabbitMQServerName) {
    var queue = `urlOf${siteID}`;
    var amqp = require('amqplib/callback_api');
    amqp.connect(`amqp://${rabbitMQServerName}`, (err, conn) => {
        if (err) {
            winston.log(err);
        } else {
            conn.createChannel((err, ch) => {
                if (err) {
                    winston.log(err);
                } else {
                    var msg = {
                        url: baseURL,
                        site: baseURL,
                        from: baseURL
                    };
                    ch.assertQueue(queue, { durable: false });
                    ch.sendToQueue(queue, new Buffer(JSON.stringify(msg)), { persistent: false });
                }
            });
        }
    });
}


module.exports.Master = Master;
