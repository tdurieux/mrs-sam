var Graph = require('scanjs').Graph;
var Scan = require('scanjs').Scan;
var fs = require('fs');

var data = fs.readFileSync('./tmp/metrics_ids.csv','utf8');

var allTextLines = data.split(/\r\n|\n/);
var ids = allTextLines[0].split(',');



Graph.loadCSV('./test/metrics_ref.csv', false, (err, loadGraph) => {
	console.log('Graph is loaded');
    var scan = new Scan(0.6, 10, loadGraph);
    var structuralClustering = scan.doClustering();

    for (var i = 0; i < structuralClustering.clustering.length; i++) {
    	var cluster = structuralClustering.clustering[i];
    	var dirName = `./tmp/cluster_${i}`;
    	fs.mkdirSync(dirName);
    	for (var j = 0; j < cluster.length; j++) {
    		var page = ids[cluster[j]];
    		var src = `./tmp/img/${page}.png`;
    		var dst = `${dirName}/${page}.png`;
    		copySync(src,dst);
    	}
    }

    var dirName = `./tmp/hubs`;
    fs.mkdirSync(dirName);
    for (var i = 0; i < structuralClustering.hubs.length; i++) {
    	var page = ids[structuralClustering.hubs[i]];
    	var src = `./tmp/img/${page}.png`;
    	var dst = `./tmp/hubs/${page}.png`;
    	copySync(src,dst);
    }

    var dirName = `./tmp/outliers`;
    fs.mkdirSync(dirName);
    for (var i = 0; i < structuralClustering.outliers.length; i++) {
    	var page = ids[structuralClustering.outliers[i]];
    	var src = `./tmp/img/${page}.png`;
    	var dst = `./tmp/outliers/${page}.png`;
    	copySync(src,dst);
    }
})



function copySync(src, dest) {
  if (!fs.existsSync(src)) {
    return false;
  }

  var data = fs.readFileSync(src);
  fs.writeFileSync(dest, data);
}