const argv = require('yargs').usage('$0 slaveCLI.js --master=[string] --oid=[string] --show=[string]').argv;
const mongoServerName = argv.master || 'localhost';
const rabbitServerName = argv.master || 'localhost';
const fileServerName = argv.master || 'localhost';
const ObjectID = require('mongodb').ObjectID;
const mong_client = require('mongodb').MongoClient;
const show = argv.show || false;
const Slave = require('./Slave.js').Slave;
const winston = require('winston');
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var oid = undefined;
if (argv.oid)
  oid = new ObjectID(argv.oid);
if (!oid) {
		console.log("Active crawlings:");
    mong_client.connect(`mongodb://${mongoServerName}:27017/mrs-sam-page`).then(db => {
        db.collection('Site').find({ state: 'started' }).toArray((err, res) => {
            res.forEach((val, idx) => {
							console.log(`${idx}: ${val._id} (${val.baseurl})`);
						});
						rl.question('Please choose an active crawling: ', answer => {
							oid = res[parseInt(answer)]._id;
							startSlave(oid, rabbitServerName, mongoServerName, fileServerName, show);
						});
        });
    });
} else {
	startSlave(oid, rabbitServerName, mongoServerName, fileServerName, show)
}

function startSlave(id, rabbitServerName, mongoServerName, fileServerName, show) {
	new Slave(oid, rabbitServerName, mongoServerName, fileServerName, show).start();
}
