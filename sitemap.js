class Node {
    constructor(hash) {
        this.hash = hash;
        this.out = [];
        this.in = [];
    }
}

module.exports.Node = Node;

class Link {
    constructor(from, to) {
        this.from = from;
        this.to = to;
        this.actions = [];
        this.errors = [];
    }

    addAction(action) {
        this.actions.push(action);
    }

    getOneAction() {
        return this.actions[0];
    }
}

module.exports.Link = Link;

class SiteMap {
    constructor(url, options) {
        this.url = url;
        this.options = options;
        this.date = new Date();
        this.nodes = [];
        this.links = [];
        this.root_node = new Node(`ROOT of ${this.url}`);
        this.root_node.id = 0;
        this.root_node.is_root = true;
        this.root_node.is_locale = true;
        this.root_node.is_html = false;
        this.nodes.push(this.root_node);
    }

    existNode(node) {
        return this.nodes.find(n => n === node) != undefined;
    }

    existNodeWithHash(hash) {
        return this.getNodeWithHash(hash) != undefined;
    }

    getNodeWithHash(hash) {
        return this.nodes.find(n => n.hash === hash);
    }

    existLink(from, to) {
        return this.getLink(from, to) != undefined;
    }

    getLink(from, to) {
        return this.links.find(l => l.from === from && l.to === to);
    }

    createNode(hash) {
        if (!this.existNodeWithHash(hash)) {
            var node = new Node(hash);
            node.id = this.nodes.length;
            node.is_root = false;
            this.nodes.push(node);
            return node;
        } else {
            return this.getNodeWithHash(hash);
        }
    }

    createLink(from, to) {
        if (!this.existLink(from, to)) {
            var link = new Link(from, to);
            this.links.push(link);
            from.out.push(link);
            to.in.push(link);
            return link;
        } else {
            return this.getLink(from, to);
        }
    }

    toString() {
        return `${this.url}`;
    }

    generateVisScript() {
        
        const ROOT_NODE_COLOR = "orange";
        const LOCALE_NODE_COLOR = "blue";
        const NON_LOCALE_NODE_COLOR = "green";
        const LINK_ERROR_COLOR = "red";

        var script = `var map_url = "${this.url}";\n\n
            var map_options = ${JSON.stringify(this.options.engine)};\n\n
            var map_date = "${this.date}";\n\n
            var left_scenario = ${this.scenarioManager.numberOfScenarioToExecute()};\n\n
            var executed_scenario = ${this.scenarioManager.numberOfExecutedScenario()};\n\n

            var map_nodes = new vis.DataSet([\n`;



        var first_node = true;
        this.nodes.forEach((node) => {
            var color = LOCALE_NODE_COLOR;

            if (!node.is_locale) color = NON_LOCALE_NODE_COLOR;
            if (node.is_root) color = ROOT_NODE_COLOR;

            //node.node_id = node_id++;
            first_node ? first_node = false : script = script + `,\n`;
            script = script + `\t{id: ${node.id}, 
              label: 'Node ${node.id}',
              color: '${color}',
              hash: ${JSON.stringify(node.hash,null,4)}
            }`
        });
        script = script + "]);\n\n";


        script = script + `var map_edges = new vis.DataSet([\n`;
        var first_link = true;
        this.links.forEach((link) => {
            var color = "";
            if (link.errors.length > 0) {
              color = `color : {color:"${LINK_ERROR_COLOR}"},\n`
            }
            first_link ? first_link = false : script = script + `,\n`;
            script = script + `\t{from: ${link.from.id},
                to: ${link.to.id}, 
                error_info : ${JSON.stringify(link.errors)},
                actions: ${JSON.stringify(link.actions.map(a => a.toString()))},
                ${color}
              }`
        });
        script = script + "]);\n\n";

        return script;

    }
}

module.exports.SiteMap = SiteMap;
