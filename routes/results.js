module.exports.init = function(ws, db, ObjectID) {
    ws.get('/results', function(req, res) {
            db.collection("results", function(err, resultsCollection) {
                if (err) {
                    res.send(err).status(404).end();
                } else {
                    resultsCollection.find().toArray(function(err, resultsArray) {
                        if (err) {
                            res.send(err).status(500).end();
                        } else {
                            res.send(resultsArray.map(r => {
                                return {
                                    _id: r._id,
                                    url: r.url,
                                    options: r.options
                                }
                            })).status(200).end();
                        }
                    });
                }
            })
        })
        .get('/results/:id', function(req, res) { //req.params.id
            db.collection("results", function(err, resultsCollection) {
                if (err) {
                    res.send(err).status(404).end();
                } else {
                    resultsCollection.find({_id: new ObjectID(req.params.id)}).toArray(function(err, resultsArray) {
                        if (err) {
                            res.send(err).status(500).end();
                        } else {
                            res.send(resultsArray).status(200).end();
                        }
                    });
                }
            })
        })
}
