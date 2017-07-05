var argv = require('yargs').usage('$0 slaveCLI.js --master=[string] --oid=[string] --show=[string]').argv;
var serverNames = {
	mongoServerName : argv.master || 'localhost',
	rabbitServerName : argv.master || 'localhost',
	fileServerName : argv.master || 'localhost'
}
var ObjectID = require('mongodb').ObjectID;
var oid = undefined || new ObjectID(argv.oid);
var show = argv.show || false;

var Slave = require('./Slave.js').Slave;


var winston = require('winston');

var slave = new Slave(oid, serverNames, show);

slave.start();