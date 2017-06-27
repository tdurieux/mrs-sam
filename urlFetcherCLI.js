var  argv  =  require('yargs')
    .usage('$0 urlFetcherCLI.js --url=[string] --maxTime=[string] --rmq=[string] --mg=[string]').argv;
var url = argv.url || 'http://localhost:8080/test-site';
var maxTime = argv.maxTime || 60000;
var rmq = argv.rmq || 'localhost';
var mg = argv.mg || 'localhost';
var show = false;


var fs = require('fs');

var mong_client = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var db_url = `mongodb://${mg}:27017/mrssam`;

var URLChecker = require('./URLChecker').URLChecker;
var PageTester = require('./PageTester').PageTester;



mong_client.connect(db_url, (err, db) => {
    db.collection('Fetch', (err, fetchColl) => {
        var fetch_id = ObjectID();
        fs.mkdirSync(`img/${fetch_id}`);
        fetchColl.insertOne({ _id: fetch_id, url: url }, (err, res) => {
            if (!err) {
                startWorkers(fetch_id, url, rmq, mg);
                produceRootURL(fetch_id, url, rmq, mg);
            }

        })
    });
});



function startWorkers(fetch_id, url, rmq, mg) {
    var urlChecker = new URLChecker(fetch_id, url, rmq, mg);
    urlChecker.start();

    for (var i = 0; i < 3; i++) {
        var pageTester = new PageTester(fetch_id, url, rmq, mg, show);
        pageTester.start();
    }

}




function produceRootURL(fetch_id, url, rmq, mg) {
    var queue = `URLToCheck${fetch_id}`;
    var amqp = require('amqplib/callback_api');
    amqp.connect(`amqp://${rmq}`, (err, conn) => {
        if (err) {
            console.log(err)
        } else {
            conn.createChannel((err, ch) => {
                if (err) {
                    console.log(err);
                } else {
                    ch.assertQueue(queue, { durable: false });
                    ch.sendToQueue(queue, new Buffer(url), { persistent: false });
                }
            });
        }
    });
}
