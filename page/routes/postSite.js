var Master = require('../Master.js').Master;
module.exports.init = function(mongoServerName, rabbitServerName, fileServerName, webServer) {
    webServer.post('/site', function(req, res) {
        var options = req.body;
        var url = options.url;
        var numberOfSlave = options.numberOfSlave || 0;

        var siteMaster = new Master(url, numberOfSlave, mongoServerName, rabbitServerName, fileServerName);
        var siteID = siteMaster.siteID;
        siteMaster.start();

        res.send(`Test request has been received, the ID is ${siteID}.`);
        res.status(200).end();
    })
};
