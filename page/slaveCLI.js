var argv = require('yargs').usage('$0 slaveCLI.js --master=[string] --oid=[string] --show=[string]').argv;
var mongoServerName = argv.master || 'localhost';
var rabbitServerName = argv.master || 'localhost';
var fileServerName = argv.master || 'localhost';
var ObjectID = require('mongodb').ObjectID;
var oid = undefined || new ObjectID(argv.oid);
var show = argv.show || false;

var Slave = require('./Slave.js').Slave;


var winston = require('winston');

var slave = new Slave(oid, rabbitServerName, mongoServerName, fileServerName, show);

slave.start();