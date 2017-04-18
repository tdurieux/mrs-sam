document.getElementById('site_url').innerHTML = map_url;
document.getElementById('maxsteps_option').innerHTML = map_options.maxsteps;
document.getElementById('time_option').innerHTML = map_options.time;
document.getElementById('wait_option').innerHTML = map_options.wait;
document.getElementById('date').innerHTML = map_date;
document.getElementById('executed_scenario').innerHTML = executed_scenario;
document.getElementById('left_scenario').innerHTML = left_scenario;

var container = document.getElementById('mynetwork');
var data = {nodes: map_nodes,edges: map_edges};

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
    var node = map_nodes.get(node_id);
    var html = `<h2>${node.label}</h2>`
    html = html + `state : <xmp>${node.hash}</xmp>`;
    return html;
}

function showEdge(edge_id) {
    //var html  = `<h2>Node ${getNodeById(node_id).label}`;
    var edge = map_edges.get(edge_id);

    var html = `<h2>From (${map_nodes.get(edge.from).label}) To (${map_nodes.get(edge.to).label})</h2>
    Actions: ${toUL(edge.actions)}`

    if (edge.error_info.length > 0) {
        html = html + `Errors: ${toUL(edge.error_info)}`;
    }
    return html;

    function toUL(arr) {
        var html = `<ul>`

        html = html + arr.map(function(e) {
            return "<li>" + e + "</li>" }).join('');
        html = html + "</ul>";
        return html;
    }
}
