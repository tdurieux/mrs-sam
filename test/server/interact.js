
document.getElementById('site_url').innerHTML = site_url;
var container = document.getElementById('mynetwork');


// provide the data in the vis format
  
var data = {     nodes: nodes,     edges: edges   };  
var options = {
    edges: {
        arrows: {
            to: true
        }
    },
    interaction: { hover: true }
};


// initialize your network!
  
var network = new vis.Network(container, data, options);

network.on("hoverNode", function(params) {
    params.event = "[original event]";
    document.getElementById('iframe').innerHTML = showNode(params.node);
});
network.on("hoverEdge", function(params) {
    params.event = "[original event]";
    document.getElementById('iframe').innerHTML = showEdge(params.edge);
});

function showNode(node_id) {
	var node  = nodes.get(node_id);
	var html  = `<h2>${node.label}</h2>
    state : <xmp>${node.hash}</xmp>`;
	return html;
}

function showEdge(edge_id) {
	//var html  = `<h2>Node ${getNodeById(node_id).label}`;
	var edge = edges.get(edge_id);

	var html  = `<h2>From (${nodes.get(edge.from).label}) To (${nodes.get(edge.to).label})</h2>
    last action : ${edge.last_action}`;
	return html;
}
