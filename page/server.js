var  argv  =  require('yargs')
    .usage('$0 server.js --mongo=[string] --rabbit=[string] --ftp=[string]').argv;
var mongoServerName = argv.mongo || 'localhost';
var rabbitServerName = argv.rabbit || 'localhost';
var ftpServerName = argv.ftp || 'localhost';

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var application_root = __dirname;
var app = express();


var mong_client = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var db_url = `mongodb://${mongoServerName}:27017/mrs-sam-page`;






//files for HTML pages
app.use(express.static(path.join(application_root, './webApp')));
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
});



var fs = require('fs');
var RouteDir = 'routes';
var files = fs.readdirSync(RouteDir);

files.forEach(function(file) {
    var filePath = path.resolve('./', RouteDir, file);
    var route = require(filePath);
    route.init(mongoServerName, rabbitServerName, ftpServerName, app);
});




app.listen(8080, function() {
    console.log('Mrs Sam Page is listening on port 8080!');
});
