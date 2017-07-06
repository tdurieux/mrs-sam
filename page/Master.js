var mong_client = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var SFTPClient = require('sftp-promises');
var Slave = require('./Slave.js').Slave;
var winston = require('winston');
var amqp = require('amqplib');

class Master {
    constructor(url, numberOfSlave, serverNames) {
        this.url = url;
        this.numberOfSlave = numberOfSlave;
        this.serverNames = serverNames;
        this.siteID = new ObjectID();
        this.dbURL = `mongodb://${this.serverNames.mongoServerName}:27017/mrs-sam-page`;
        this.slaves = [];
        winston.info('master created');
    }

    start() {
        initSftp.call(this)
            .then(() => {
                return mong_client.connect(this.dbURL);
            }).then(db => {
                this.db = db;
                return db.collection('Site').insertOne({ _id: this.siteID, baseurl: this.url, state: 'started' });
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

        var queue = `urlOf${this.siteID}`;
        amqp.connect(`amqp://${this.serverNames.rabbitServerName}`)
            .then(conn => {
                return conn.createChannel();
            })
            .then(ch => {
                ch.deleteQueue(queue);
            })
            .catch(logError);

        this.db.collection('Site').update({ _id: this.siteID, baseurl: this.url }, { baseurl: this.url, state: 'stopped' }).catch(logError);
    }
}

function initSftp() {
    this.sftpConfig = {
        host: this.serverNames.fileServerName,
        username: 'mrssam',
        password: 'mrssam',
        port: 22
    };
    winston.info(`creating directory upload/${this.siteID}`);
    return new SFTPClient(this.sftpConfig).mkdir(`upload/${this.siteID}`);
}

function startSlave() {
    for (var i = 0; i < this.numberOfSlave; i++) {
        var show = false;
        var slave = new Slave(this.siteID, this.serverNames, show);
        this.slaves.push(slave);
        slave.start();
    }
}

function queueRootURL() {
    var queue = `urlOf${this.siteID}`;
    amqp.connect(`amqp://${this.serverNames.rabbitServerName}`)
        .then(conn => {
            return conn.createChannel();
        })
        .then(ch => {
            var msg = {
                url: this.url,
                site: this.url,
                from: this.url
            };
            ch.assertQueue(queue, { durable: true });
            ch.sendToQueue(queue, new Buffer(JSON.stringify(msg)), { persistent: true });
        })
        .catch(logError);
}

function logError(err) {
    winston.info(err);
}

module.exports.Master = Master;
