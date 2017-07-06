const ObjectId = require('mongodb').ObjectID;
const Master = require('../Master.js').Master;
const winston = require('winston');
const MongoClient = require('mongodb').MongoClient;

module.exports.init = function(serverNames, webServer) {
    var runningMasters = [];
    webServer.post('/site', function(req, res) {
        var options = req.body;
        var url = options.url;
        var numberOfSlaves = options.numberOfSlaves || 0;
        var master = new Master(url, numberOfSlaves, serverNames);
        master.start();
        runningMasters.push(master);
        res.send(`Test request has been received, the ID is ${master.siteId}.`);
        res.status(200).end();
    }).post('/site/:id', function(req, res) {
        console.log(`stop ${req.params.id}`);
        var oid = new ObjectId(req.params.id);
        var master = runningMasters.find( master => {
            return master.siteId.equals(oid);
        });
        if (master) {
            master.stop();
        } else {
            winston.info(`no running master found with siteId ${oid}, cleaning database`);
            MongoClient.connect(`mongodb://${serverNames.mongoServerName}:27017/mrs-sam-page`).then( db => {
                db.collection('Site').update({
                    _id: oid
                },{
                    state: 'stopped'
                });
            });
        }
        res.status(200).end();
    });
};
