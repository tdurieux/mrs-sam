var mongo_client = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var Master = require('../Master.js').Master;

module.exports.init = function(mongoServerName, rabbitServerName, fileServerName, webServer) {
    var db_url = `mongodb://${mongoServerName}:27017/mrs-sam-page`;
    var runningMasters = [];
    webServer.post('/site', function(req, res) {
        var options = req.body;
        var url = options.url;
        var numberOfSlave = options.numberOfSlave || 0;

        var siteMaster = new Master(url, numberOfSlave, mongoServerName, rabbitServerName, fileServerName);
        var siteID = siteMaster.siteID;
        siteMaster.start();
        runningMasters.push(siteMaster);

        res.send(`Test request has been received, the ID is ${siteID}.`);
        res.status(200).end();
    })
    .post('/site/:id', function(req, res) { //req.params.id
            mongo_client.connect(db_url, (err, db) => {
                if (!err) {

                    db.collection('site', function(err, scenarioCollection) {
                        if (err) {
                            res.send(err).status(404).end();
                        } else {
                            scenarioCollection.find({ test_id: new ObjectID(req.params.id) }).toArray(function(err, scenarioArray) {
                                if (err) {
                                    res.send(err).status(500).end();
                                } else {
                                    res.send(scenarioArray).status(200).end();
                                }
                            });
                        }
                    })
                } else {
                    res.send(err).status(500).end();
                }
            });
        })
};
