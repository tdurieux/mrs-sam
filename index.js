var  argv  =  require('yargs')
    .usage('$0 index.js --maxsteps=[num] --time=[num] --show=[boolean] --wait=[num] --diff=[boolean] --url=[string]').argv;

var options = {
    engine: {
        maxsteps: argv.maxsteps || 5,
        time: argv.time || 3,
        wait: argv.wait || 1000,
        backmode: argv.wait || true,
        show: argv.show || false,
        diff: argv.diff || false
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
            active: false,
            wait: 4000
        },
        mouseover: {
            active: false,
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
    var fs = require('fs');
    var fileName = map.url.slice(7, map.url.length).replace('.', '_').replace(':', '_') + "_" + map.options.engine.time
    console.log(fileName);
    fs.writeFileSync(`./test/server/${fileName}_map.js`, map.generateVisScript());

    if (options.diff) {
        computeDiff(map);
        console.log('diff is done');

        fs.writeFileSync(`./test/server/${fileName}_diff.js`, map.generateVisScript());
    }
});


function computeDiff(map) {
    var jsdiff = require('diff');

    map.links.forEach(l => {
        l.diff = jsdiff.diffLines(l.from.hash, l.to.hash);
        console.log('a diff is done');
        //l.diff = jsdiff.diffWordsWithSpace(l.from.hash, l.to.hash);		
    })
}
