const MongoClient = require('mongodb').MongoClient;

module.exports.init = function(serverNames, webServer) {
    var dbUrl = `mongodb://${serverNames.mongoServerName}:27017/mrs-sam-page`;
    webServer.get('/site', function(req, res) {
        MongoClient.connect(dbUrl, (err, db) => {
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
    }).get('/site/:id', function(req, res) { //req.params.id
        MongoClient.connect(dbUrl).then(db => {
            db.collection(`Pages_${req.params.id}`).count().then(nb => {
                var msg = {
                    numberOfPages : nb
                };
                res.send(JSON.stringify([ msg ])).status(200).end();
            }).catch(err => {
                res.send(err).status(500).end();
            });
            db.close();
        }).catch(err => {
            res.send(err).status(500).end();
        });
    });
};
