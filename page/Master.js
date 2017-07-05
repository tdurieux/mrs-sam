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
        initSFTP.call(this);
        winston.info('Master is created');
    }

    start() {
        mong_client.connect(this.dbURL)
            .then(db => {
                this.db = db;
                return db.collection('Site').insertOne({ _id: this.siteID, baseurl: this.url, state: 'started' });
            })
            .then(() => {
                startSlave.call(this);
                queueRootURL.call(this);
            })
            .catch(logError);

        winston.log('Master is started');
    }

    stop() {
        this.slaves.forEach(slave => {
            winston.info('slave is stopped!');
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

        this.db.collection('Site').update({ _id: this.siteID, baseurl: this.url }, { baseurl: this.url, state: 'stopped' }).catch(err => { winston.log(err); });
    }
}


function initSFTP() {
    this.sftpConfig = {
        host: this.serverNames.fileServerName,
        username: 'mrssam',
        password: 'mrssam'
    };
    var sftp = new SFTPClient(this.sftpConfig);
    sftp.mkdir(`upload/${this.siteID}`).then(() => { winston.info('directory created'); });
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
            ch.assertQueue(queue, { durable: false });
            ch.sendToQueue(queue, new Buffer(JSON.stringify(msg)), { persistent: false });
        })
        .catch(logError);
}

function logError(err) {
    winston.log(err);
}

module.exports.Master = Master;
