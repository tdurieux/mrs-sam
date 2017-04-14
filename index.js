//Import of other modules (this should be improved somehow)
var SiteMap = require('./sitemap.js').SiteMap;
var crawlMap = require('./crawler.js').crawlMap;

var map = new SiteMap('http://localhost:8080');
const SCENARIO_MAX_SIZE = 20;

crawlMap(map, SCENARIO_MAX_SIZE, function(err, succ) {
    var fs = require('fs');
    console.log(map.generateVisScript());
    fs.writeFile('./test/server/mapsite.js', map.generateVisScript());
});
