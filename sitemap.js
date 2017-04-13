class Node {
    constructor(hash) {
        this.hash = hash;
        this.out = new Array();
        this.in = new Array();
    }

}

module.exports.Node = Node;

class Link {
    constructor(from, to) {
        this.from = from;
        this.to = to;
        this.actions = new Array();
    }

    addAction(action) {
        this.actions.push(action);
    }

    getOneAction() {
        if (actions.length !== 0) {
            return actions[0];
        } else {
            return undefined;
        }
    }
}

module.exports.Link = Link;

class SiteMap {
    constructor(url) {
        this.url = url;
        this.root = new Node('ROOT');
        this.nodes = new Array();
        this.links = new Array();
    }

    existNode(node) {
        for (var i = 0; i < this.nodes.length; i++) {
            if (node === this.nodes[i]) {
                return true;
            }
        }
        return false;
    }

    existNodeWithHash(hash) {
        for (var i = 0; i < this.nodes.length; i++) {
            if (hash === this.nodes[i].hash) {
                return true;
            }
        }
        return false;
    }

    getNodeWithHash(hash) {
        for (var i = 0; i < this.nodes.length; i++) {
            if (hash === this.nodes[i].hash) {
                return this.nodes[i];
            }
        }
        return undefined;
    }

    existLink(from, to) {
        for (var i = 0; i < this.links.length; i++) {
            if (from === this.links[i].from && to === this.links[i].to) {
                return true;
            }
        }
        return false;
    }

    getLink(from, to) {
        for (var i = 0; i < this.links.length; i++) {
            if (from === this.links[i].from && to === this.links[i].to) {
                return this.links[i];
            }
        }
        return undefined;
    }

    createNode(hash) {
        if (!this.existNodeWithHash(hash)) {
            var node = new Node(hash);
            this.nodes.push(node);
            return node;
        } else {
            return getNodeWithHash(hash);
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
            return getLink(from, to);
        }
    }
}

module.exports.SiteMap = SiteMap;