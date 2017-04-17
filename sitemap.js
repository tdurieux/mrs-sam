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
    this.nodes = [];
    this.links = [];
    this.root = new Node(`ROOT of ${this.url}`);
    this.root.id = 0;
    this.nodes.push(this.root);
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
    var script = `var site_url = "${this.url}"\n\n`;

    script = script + "var nodes = new vis.DataSet([\n";

    var first_node = true;
    this.nodes.forEach((node)=>{
      //node.node_id = node_id++;
      first_node ? first_node = false : script = script +`,\n`;
      script = script +`\t{id: ${node.id}, label: 'Node ${node.id}'}`
    });
    script = script +  "]);\n\n";


    script = script + `var edges = new vis.DataSet([\n`;
    var first_link = true;
    this.links.forEach((link)=> {
      first_link ? first_link = false : script = script +`,\n`;
      script = script + `\t{from: ${link.from.id}, to: ${link.to.id}}`

    })
    script = script + "]);\n\n";

    return script;

  }
}

module.exports.SiteMap = SiteMap;
