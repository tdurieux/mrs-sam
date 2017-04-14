var nodes = new vis.DataSet([{id: 1, label: 'Node 1'},{id: 2, label: 'Node 2'},{id: 3, label: 'Node 3'},{id: 4, label: 'Node 4'},{id: 5, label: 'Node 5'},{id: 6, label: 'Node 6'},{id: 7, label: 'Node 7'},{id: 8, label: 'Node 8'},{id: 9, label: 'Node 9'},{id: 10, label: 'Node 10'},{id: 11, label: 'Node 11'},{id: 12, label: 'Node 12'},{id: 13, label: 'Node 13'},{id: 14, label: 'Node 14'},{id: 15, label: 'Node 15'}]);var edges = new vis.DataSet([{from: 1, to: 2},{from: 2, to: 3},{from: 3, to: 4},{from: 3, to: 5},{from: 3, to: 6},{from: 3, to: 7},{from: 3, to: 8},{from: 3, to: 9},{from: 3, to: 10},{from: 3, to: 11},{from: 3, to: 12},{from: 3, to: 13},{from: 3, to: 14},{from: 3, to: 15}]);// create a network
    var container = document.getElementById('mynetwork');

    // provide the data in the vis format
    var data = {
        nodes: nodes,
        edges: edges
    };
    var options = {};

    // initialize your network!
    var network = new vis.Network(container, data, options);