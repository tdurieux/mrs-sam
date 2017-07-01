var  argv  =  require('yargs')
    .usage('$0 metricsCLI.js --id=[string] --mongo=[string] --csv=[string]').argv;

var fs = require('fs');

var mongoServer = argv.mongo || 'localhost';
var csvFile = argv.csv || './test/metrics';
var fetchID = argv.id || '59520c0527114136e4108ef3';

//Import of other modules (this should be improved somehow)
var CrossPageMetrics = require('./CrossPageMetrics.js').CrossPageMetrics;

var cpm = new CrossPageMetrics(fetchID, mongoServer, csvFile);

cpm.start();