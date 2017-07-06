const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const winston = require('winston');
const amqp = require('amqplib');

const Slave = require('./Slave.js').Slave;
const CrawlerElement = require('./CrawlerElement.js').CrawlerElement;

class Master extends CrawlerElement {

    constructor(url, numberOfSlaves, serverNames) {
        super(new ObjectId(), serverNames);
        this.url = url;
        this.slaves = [];
        this.numberOfSlaves = numberOfSlaves;
        winston.info('master created');
    }

    start() {
        winston.info(`creating directory ${this.folder}`);
        this.sftpClient.mkdir(this.folder).then(() => {
            return MongoClient.connect(this.dbUrl);
        }).then(db => {
            this.db = db;
            return db.collection('Site').insertOne({
                _id: this.siteId,
                baseurl: this.url,
                state: 'started'
            });
        }).then(() => {
            startSlave.call(this);
            queueRootURL.call(this);
            winston.info('master started');
        }).catch(logError);
    }

    stop() {
        this.slaves.forEach(slave => {
            winston.info(`slave ${slave.slaveId} has been stopped`);
            slave.stop();
        });

        amqp.connect(this.rmqUrl)
            .then(conn => {
                return conn.createChannel();
            }).then(ch => {
                ch.deleteQueue(this.queue);
            }).catch(logError);

        this.db.collection('Site').update({
            _id: this.siteId
        },{
            state: 'stopped'
        }).catch(logError);
    }
}

function startSlave() {
    for (var i = 0; i < this.numberOfSlaves; i++) {
        var show = false;
        var slave = new Slave(this.siteId, this.serverNames, show);
        this.slaves.push(slave);
        slave.start();
    }
}

function queueRootURL() {
    amqp.connect(this.rmqUrl)
        .then(conn => {
            return conn.createChannel();
        })
        .then(ch => {
            var msg = {
                url: this.url,
                site: this.url,
                from: this.url
            };
            ch.assertQueue(this.queue, { durable: true });
            ch.sendToQueue(this.queue, new Buffer(JSON.stringify(msg)), { persistent: true });
        })
        .catch(logError);
}

function logError(err) {
    winston.info(err);
}

module.exports.Master = Master;
