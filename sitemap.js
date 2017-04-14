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
  constructor(url) {
    this.url = url;
    this.root = new Node('ROOT');
    this.nodes = [];
    this.links = [];
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
}

module.exports.SiteMap = SiteMap;
