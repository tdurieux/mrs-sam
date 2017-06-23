var  argv  =  require('yargs')
    .usage('$0 metricsCLI.js --mongo=[string] --csv=[string]').argv;

var fs = require('fs');

var mongoServer = argv.mongo || 'localhost';
var csvFile = argv.csv || './test/metrics.csv';

//Import of other modules (this should be improved somehow)
var CrossPageMetrics = require('./CrossPageMetrics.js').CrossPageMetrics;

var cpm = new CrossPageMetrics(mongoServer, csvFile);

cpm.start();