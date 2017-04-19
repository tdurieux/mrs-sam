var  argv  =  require('yargs')
    .usage('$0 index.js --maxsteps=[num] --time=[num] --show=[boolean] --wait=[num] --url=[string]').argv;

var options = {
    engine: {
        maxsteps: argv.maxsteps || 5,
        time: argv.time || 3,
        wait: argv.wait || 1000,
        show: argv.show || false
    },
    scenario: {
        click: {
            active: true,
            selectors: ['a', 'div']
        },
        scroll: {
            active: true,
            scroll_x: 2000,
            scroll_y: 4000
        },
        wait: {
            active: true,
            wait: 4000
        },
        mouseover: {
            active: true,
            selectors: ['a', 'div']
        },
        back: {
        	active: true
        }
    }
};

var url = argv.url || 'http://localhost:8080';


//Import of other modules (this should be improved somehow)
var SiteMap = require('./sitemap.js').SiteMap;
var crawlMap = require('./crawler.js').crawlMap;

var map = new SiteMap(url, options);




crawlMap(map, function(err, succ) {

	console.log('crawling is done');

	computeDiff(map);

	console.log('diff is done');

    var fs = require('fs');
    fs.writeFile('./test/server/computed_map.js', map.generateVisScript());
});


function computeDiff(map) {
	var jsdiff = require('diff');

	map.links.forEach(l => {
		l.diff = jsdiff.diffLines(l.from.hash, l.to.hash);
	})
}
