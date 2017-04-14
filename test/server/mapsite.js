var nodes = new vis.DataSet([{id: 1, label: 'Node 1'},{id: 2, label: 'Node 2'}]);var edges = new vis.DataSet([{from: 1, to: 2}]);// create a network
    var container = document.getElementById('mynetwork');

    // provide the data in the vis format
    var data = {
        nodes: nodes,
        edges: edges
    };
    var options = {};

    // initialize your network!
    var network = new vis.Network(container, data, options);