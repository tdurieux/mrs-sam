var  argv  =  require('yargs')
    .usage('$0 masterFetcher.js --url=[string] --rmq=[string] --mg=[string]').argv;
var url = argv.url || 'http://localhost:8080/test-site';
var rmq = argv.rmq || 'localhost';
var mg = argv.mg || 'localhost';

var mong_client = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var db_url = `mongodb://${mg}:27017/fetcher`;

var URLChecker = require('./URLChecker').URLChecker;

mong_client.connect(db_url, (err, db) => {
    if (!err) {
        db.collection('Fetch', (err, fetchColl) => {
            var fetch_id = ObjectID();
            

            fetchColl.insertOne({ _id: fetch_id, url: url, site:url, from:url }, (err, res) => {
                if (!err) {
                    startWorkers(fetch_id, url, rmq, mg);
                    produceRootURL(fetch_id, url, rmq, mg);
                    console.log('masterFetcher is running with ObjectID='+fetch_id)
                }
            })
        });
    } else {
        console.log(err)
    }
});



function startWorkers(fetch_id, url, rmq, mg) {
    var urlChecker = new URLChecker(fetch_id, url, rmq, mg);
    urlChecker.start();
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
                    var msg = {
                        url: url,
                        site: url,
                        from: url
                    }
                    ch.assertQueue(queue, { durable: false });
                    ch.sendToQueue(queue, new Buffer(JSON.stringify(msg)), { persistent: false });
                }
            });
        }
    });
}
