class Action {

    constructor(type) {
        this.type = type;
    }

    toString() {
        return 'action ' + this.type;
    }
}

class GotoAction extends Action {
    constructor(url) {
        super('Goto');
        this.url = url;
    }

    attachTo(promise) {
        return promise.goto(this.url);
    }

    toString() {
        return 'goto ' + this.url;
    }
}

class ClickAction extends Action {
    constructor(selector) {
        super('Click');
        this.selector = selector;
    }

    attachTo(promise) {
        return promise.click(this.selector);
    }

    toString() {
        return 'click ' + this.selector;
    }
}

class WaitAction extends Action {
    constructor(ms) {
        super('Wait');
        this.ms = ms;
    }

    attachTo(promise) {
        return promise.wait(this.ms);
    }
}

class MouseOver extends Action {
    constructor(selector) {
        super('MouseOver');
        this.selector = selector;
    }

    attachTo(promise) {
        return promise.MouseOver(this.selector);
    }
}

class Scenario {
    constructor(from) {
        this.actions = new Array();
        this.from = from;
    }

    toString() {
        var to_string = '';
        for (var i = 0; i < this.actions.length; i++) {
            to_string = to_string + '>' + this.actions[i]
        }
        return to_string;
    }

    addAction(action) {
        this.actions.push(action);
    }

    attachTo(promise) {
        var returnedPromise = promise;
        for (var i = 0; i < this.actions.length; i++) {
            returnedPromise = this.actions[i].attachTo(returnedPromise);
        }
        return returnedPromise;
    }

    get size() {
        return this.actions.length;
    }
}

class Node {
    constructor(hash) {
        this.hash = hash;
        this.out = new Array();
        this.in = new Array();
    }

}

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

class Map {
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


////////////////////////////////////:::



var Nightmare = require('nightmare');
var nightmare = Nightmare({ show: true });

var map = new Map('http://localhost:8080');




crawlMap(map, 5);

//nightmare.then(function(res) {

function crawlMap(map, max_action) {

    var scenarioList = new Array();
    var initScenario = new Scenario(map.root);
    initScenario.addAction(new GotoAction(map.url));
    initScenario.addAction(new WaitAction(2000));
    scenarioList.push(initScenario);

    crawl(map, max_action, scenarioList);


}

function crawl(map, max_action, scenarioList) {

    if (scenarioList.length !== 0) {

        var scenario = scenarioList.pop();

        if (scenario.size <= max_action) {

            scenario.attachTo(nightmare)
                .evaluate(function() {
                    var hash = document.querySelector('body').innerHTML;
                    var a_selectors = new Array();
                    var a_links = document.getElementsByTagName('a');
                    for (var i = 0; i < a_links.length; i++) {
                        a_selectors.push(fullPath(a_links[i]));
                    }
                    return {
                        hash: hash,
                        selectors: a_selectors
                    };

                    function fullPath(el) {
                        var names = [];
                        while (el.parentNode) {
                            if (el.id) {
                                names.unshift('#' + el.id);
                                break;
                            } else {
                                if (el == el.ownerDocument.documentElement) names.unshift(el.tagName);
                                else {
                                    for (var c = 1, e = el; e.previousElementSibling; e = e.previousElementSibling, c++);
                                    names.unshift(el.tagName + ":nth-child(" + c + ")");
                                }
                                el = el.parentNode;
                            }
                        }
                        return names.join(" > ");
                    }

                })
                .then(function(evaluate_res) {
                    //console.log(evaluate_res.hash);
                    console.log(evaluate_res.selectors);
                    if (!map.existNodeWithHash(evaluate_res.hash)) {
                        var to = map.createNode(evaluate_res.hash);
                        var new_link = map.createLink(scenario.from, to);
                        for (var i = 0; i < evaluate_res.selectors.length; i++) {
                            var new_scenario = new Scenario(to);
                            for (var j = 0; j < scenario.actions.length; j++) {
                                new_scenario.addAction(scenario.actions[j]);
                            }
                            var last_action = new ClickAction(evaluate_res.selectors[i]);
                            new_scenario.addAction(last_action);
                            new_link.addAction(last_action);
                            new_scenario.addAction(new WaitAction(1000));
                            scenarioList.push(new_scenario);
                        }
                    } else {
                        var to = map.getNodeWithHash(evaluate_res.hash);
                        if (!map.existLink(scenario.from, to)) {
                            var link = map.createLink(scenario.from, to);
                            //TODO add action to the link
                        }

                    }
                    crawl(map, max_action, scenarioList);
                })
                .catch(function(err) {
                    crawl(map, max_action, scenarioList);
                });
        } else {
            crawl(map, max_action, scenarioList);
        }
    } else {
        nightmare.end().then(function(res) {
            //console.log(res);
            console.log(map.nodes.length);
            console.log(map.links.length);

        }).catch(function(err) {
        	console.log(err);
            console.log(map.nodes.length);
            console.log(map.links.length);

            
        })
    }
}
