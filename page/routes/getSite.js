var mongo_client = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

module.exports.init = function(mongoServerName, rabbitServerName, fileServerName, webServer) {
    var db_url = `mongodb://${mongoServerName}:27017/mrs-sam-page`
    webServer.get('/site', function(req, res) {
            mongo_client.connect(db_url, (err, db) => {
                if (!err) {
                    db.collection("site", function(err, siteCollection) {
                        if (err) {
                            res.send(err).status(404).end();
                        } else {
                            siteCollection.find().toArray(function(err, sitesArray) {
                                if (err) {
                                    res.send(err).status(500).end();
                                } else {
                                    res.send(sitesArray).status(200).end();
                                }
                            });
                        }
                    });
                } else {
                    res.send(err).status(500).end;
                }
            });
        })
        .get('/test/:id', function(req, res) { //req.params.id
            mongo_client.connect(db_url, (err, db) => {
                if (!err) {

                    db.collection("site", function(err, scenarioCollection) {
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
}
