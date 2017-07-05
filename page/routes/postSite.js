var mongo_client = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var Master = require('../Master.js').Master;

module.exports.init = function(serverNames, webServer) {
    var runningMasters = [];
    webServer.post('/site', function(req, res) {
        var options = req.body;
        var url = options.url;
        var numberOfSlave = options.numberOfSlave || 0;

        var siteMaster = new Master(url, numberOfSlave, serverNames);
        var siteID = siteMaster.siteID;
        siteMaster.start();
        runningMasters.push(siteMaster);

        res.send(`Test request has been received, the ID is ${siteID}.`);
        res.status(200).end();
    })
    .post('/site/:id', function(req, res) { //req.params.id
            console.log(`stop ${req.params.id}`);
            var oid = new ObjectID(req.params.id);
            var siteMaster = runningMasters.find( master => {return master.siteID.equals(oid)});
            if (siteMaster) {
                siteMaster.stop();
            } else {
                console.log('no siteID');
            }
            res.status(200).end();
        })
};
