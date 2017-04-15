var argv = require('yargs')
			.usage('$0 index.js --maxsteps=[num] --time=[num] --show=[boolean] --url=[string]').argv;

var options = {
	maxsteps: argv.maxsteps || 5,
	time: argv.time || 300000,
	show:argv.show || true,
};

var url = argv.url || 'http://localhost:8080';

console.log(options);


//Import of other modules (this should be improved somehow)
var SiteMap = require('./sitemap.js').SiteMap;
var crawlMap = require('./crawler.js').crawlMap;

var map = new SiteMap(url);




crawlMap(map, options, function(err, succ) {
    var fs = require('fs');
    fs.writeFile('./test/server/mapsite.js', map.generateVisScript());
});
