var argv = require('yargs')
			.usage('$0 index.js --maxsteps=[num] --time=[num] --show=[boolean] --wait=[num] --url=[string]').argv;

var options = {
	maxsteps: argv.maxsteps || 5,
	time: argv.time || 3,
	wait: argv.wait || 1000,
	show:argv.show || false,
};

var url = argv.url || 'http://localhost:8080';

console.log(options);


//Import of other modules (this should be improved somehow)
var SiteMap = require('./sitemap.js').SiteMap;
var crawlMap = require('./crawler.js').crawlMap;

var map = new SiteMap(url, options);




crawlMap(map, function(err, succ) {
    var fs = require('fs');
    fs.writeFile('./test/server/computed_map.js', map.generateVisScript());
});
