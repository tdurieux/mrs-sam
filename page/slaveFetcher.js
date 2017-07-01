var  argv  =  require('yargs')
    .usage('$0 slaveFetcher.js --rmq=[string] --mg=[string] --oid=[string] --thread=[number] --show=[boolean]').argv;
var rmq = argv.rmq || 'localhost';
var mg = argv.mg || 'localhost';
var oid = argv.oid ? argv.oid : undefined;
var thread = argv.thread || 3;
var show = argv.show === "true";


var fs = require('fs');

var mong_client = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var db_url = `mongodb://${mg}:27017/fetcher`;

var PageTester = require('./PageTester').PageTester;

if (oid === undefined) {
    console.log("oid is required (option --oid is missing)");
    return false;
}



mong_client.connect(db_url, (err, db) => {
    if (!err) {
        db.collection('Fetch', (err, fetchColl) => {
            if (!err) {
                var fetch_id = ObjectID(oid);
                if (!fs.existsSync(`img/${fetch_id}`)) {
                    fs.mkdirSync(`img/${fetch_id}`);
                }
                fetchColl.findOne({ _id: fetch_id }, (err, fetch) => {
                    if (!err) {
                        startWorkers(fetch_id, fetch.url, rmq, mg);
                    }

                })
            } else {
                console.log(err);
            }
        });
    } else {
        console.log(err)
    }
});



function startWorkers(fetch_id, url, rmq, mg) {
    for (var i = 0; i < thread; i++) {
        var pageTester = new PageTester(fetch_id, url, rmq, mg, show);
        pageTester.start();
    }
}
