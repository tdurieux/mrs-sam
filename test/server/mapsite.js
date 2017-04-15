var nodes = new vis.DataSet([{id: 1, label: 'Node 1'}]);var edges = new vis.DataSet([]);// create a network
    var container = document.getElementById('mynetwork');

    // provide the data in the vis format
    var data = {
        nodes: nodes,
        edges: edges
    };
    var options = {};

    // initialize your network!
    var network = new vis.Network(container, data, options);