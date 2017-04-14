var argv = require('yargs').usage('Usage: $0 -max [num] url')
    .default('max', 10)
	.demandCommand(1)
    .argv;

var max = argv.max;
var ms = argv.ms;
var url = argv._[0];

//Import of other modules (this should be improved somehow)
var SiteMap = require('./sitemap.js').SiteMap;
var crawlMap = require('./crawler.js').crawlMap;

var map = new SiteMap(url);

crawlMap(map, max, function(err, succ) {
    var fs = require('fs');
    console.log(map.generateVisScript());
    fs.writeFile('./test/server/mapsite.js', map.generateVisScript());
});
