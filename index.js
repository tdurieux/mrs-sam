var argv = require('yargs').usage('Usage: $0 -maxsteps [num] -time [ms] -show url')
    .default('time', 30000)
	.default('maxsteps', 6 )
	.alias('m', 'maxsteps')
	.alias('t', 'time')
	.alias('s', 'show')
	.boolean('show')
	.demandCommand(1)
    .argv;

var max = argv.maxsteps;
var ms = argv.ms;
var url = argv._[0];
var time = argv.time;
var show = argv.show;

//Import of other modules (this should be improved somehow)
var SiteMap = require('./sitemap.js').SiteMap;
var crawlMap = require('./crawler.js').crawlMap;

var map = new SiteMap(url);

var options = {
	max: max,
	time:time,
	show:show
};

crawlMap(map, options, function(err, succ) {
    var fs = require('fs');
    fs.writeFile('./test/server/mapsite.js', map.generateVisScript());
});
