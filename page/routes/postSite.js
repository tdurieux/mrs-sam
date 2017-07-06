const ObjectId = require('mongodb').ObjectID;
const Master = require('../Master.js').Master;
const winston = require('winston');

module.exports.init = function(serverNames, webServer) {
    var runningMasters = [];
    webServer.post('/site', function(req, res) {
        var options = req.body;
        var url = options.url;
        var numberOfSlave = options.numberOfSlave || 0;
        var siteMaster = new Master(url, numberOfSlave, serverNames);
        siteMaster.start();
        runningMasters.push(siteMaster);
        res.send(`Test request has been received, the ID is ${siteMaster.siteId}.`);
        res.status(200).end();
    }).post('/site/:id', function(req, res) {
        console.log(`stop ${req.params.id}`);
        var oid = new ObjectId(req.params.id);
        var siteMaster = runningMasters.find( master => {
            return master.siteId.equals(oid);
        });
        if (siteMaster) {
            siteMaster.stop();
        } else {
            winston.info(`no master found with siteId ${oid}`);
        }
        res.status(200).end();
    });
};
