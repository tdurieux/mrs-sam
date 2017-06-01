module.exports.init = function(ws, db, ObjectID) {
    ws.post('/crawl', function(req, res) {
        var options = req.body;
        options.map = {active: false};
        options.crawler.show = false;
        options.diff = {active: false};
        options.replay = {active: false};
        
        res.send(`Crawl request has been received, please look at the result page in ${options.crawler.time} minutes.`);
        res.status(200).end();

        var Crawler = require('../crawler.js').Crawler;
        var crawler = new Crawler(options.URL, options);
        crawler.start(function(err) {}, function (result) {
            db.collection("results", function(err, resultsCollection) {
                if (!err) {
                    resultsCollection.insert(result);
                }
            })
        });
    }) 
}
