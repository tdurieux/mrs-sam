var mongo_client = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

module.exports.init = function(serverNames, webServer) {
    var db_url = `mongodb://${serverNames.mongoServerName}:27017/mrs-sam-page`;
    webServer.get('/site', function(req, res) {
            mongo_client.connect(db_url, (err, db) => {
                if (!err) {
                    db.collection('Site', function(err, siteCollection) {
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
                db.close();
            });
        })
        .get('/site/:id', function(req, res) { //req.params.id
            mongo_client.connect(db_url, (err, db) => {
                if (!err) {

                    db.collection('Site', function(err, scenarioCollection) {
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
                db.close();
            });
        })
}
