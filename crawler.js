//log
var winston = require('winston');

//monitoring
var present = require('present');
var startTime = present();


//Import of other modules (this should be improved somehow)
var sce = require('./scenario.js');
var GotoAction = sce.GotoAction;
var WaitAction = sce.WaitAction;
var ClickAction = sce.ClickAction;
var Scenario = sce.Scenario;
var ScenarioManager = sce.ScenarioManager;


var Nightmare = require('nightmare');
var nightmare = {}

function crawlMap(map, options, callback) {
    nightmare = Nightmare({ show: options.show });

    winston.info(`Start crawling of ${map} with ${options.maxsteps} maximun steps in ${options.time} min`);
    var scenarioManager = new ScenarioManager();
    var initScenario = new Scenario(map.root);
    initScenario.from = map.root;
    initScenario.addAction(new GotoAction(map.url));
    initScenario.addAction(new WaitAction(options.wait));
    scenarioManager.addScenarioToExecute(initScenario);
    crawl(map, options, scenarioManager, callback);
}

function htmlAnalysis() {
    var hostname = window.location.hostname;

    return {
        hostname: hostname,
        hash: generateHash(),
        selectors: grabSelector()
    };

    function generateHash() {
        //return document.querySelector('body').innerHTML.replace(/\s{2,10}/g, ' ');
        return document.body.innerHTML.replace(/\s{2,10}/g, ' ');
    }

    function grabSelector() {
        var selectors = new Array();
        var a_links = document.getElementsByTagName('a');
        for (var i = 0; i < a_links.length; i++) {
            if (!isMailTo(a_links[i])) selectors.push(computeSelector(a_links[i]));
        }

        var img_links = document.getElementsByTagName('img');
        for (var i = 0; i < img_links.length; i++) {
            selectors.push(computeSelector(img_links[i]));
        }
        return selectors;

    }


    function computeSelector(el) {
        var names = [];
        while (el.parentNode) {
            if (el.id) {
                names.unshift(`#${el.id}`);
                break;
            } else {
                if (el == el.ownerDocument.documentElement)
                    names.unshift(el.tagName);
                else {
                    for (var c = 1, e = el; e.previousElementSibling; e = e.previousElementSibling, c++);
                    names.unshift(`${el.tagName}:nth-child(${c})`);
                }
                el = el.parentNode;
            }
        }
        return names.join(" > ");
    }

    function isMailTo(a_link) {
        return a_link.href.includes('mailto');
    }
}



function crawl(map, options, scenarioManager, callback) {
    var hasTime = (present() - startTime) < (options.time * 60 * 1000);
    if (scenarioManager.hasScenarioToExecute() && hasTime) {
        var scenario = scenarioManager.nextScenarioToExecute();
        winston.info(`Proceed: ${scenario}\n`);
        const wait_actions_factor = 2;
        if (scenario.size <= (options.maxsteps*wait_actions_factor)) {
            scenario.attachTo(nightmare)
                .evaluate(htmlAnalysis)
                .then(function(evaluate_res) {
                    winston.info(`A scenario has been executed and the output has been analyzed`);
                    if (!map.existNodeWithHash(evaluate_res.hash)) {
                        winston.info("A new node was created representing the end of that scenario");
                        var to = map.createNode(evaluate_res.hash);
                        //nightmare.screenshot(`./test/server/img/node${to.id}.png`).then();
                        var new_link = map.createLink(scenario.from, to);
                        new_link.last_action = scenario.getLastAction();
                        if (map.url.includes(evaluate_res.hostname)) {
                            winston.info(`${evaluate_res.selectors.length} selectors have been extracted and transformed into new scenario`);
                            for (var i = 0; i < evaluate_res.selectors.length; i++) {
                                var new_scenario = new Scenario(to);
                                for (var j = 0; j < scenario.actions.length; j++) {
                                    new_scenario.addAction(scenario.actions[j]);
                                }
                                var last_action = new ClickAction(evaluate_res.selectors[i]);
                                new_scenario.addAction(last_action);
                                new_link.addAction(last_action);
                                new_scenario.addAction(new WaitAction(options.wait));
                                scenarioManager.addScenarioToExecute(new_scenario);
                            }
                        } else {
                            winston.info(`The end of the scenario is in another host. The crawler won't go further.`);
                        }
                    } else {
                        winston.info("An existing node corresponds to the end of that scenario");
                        var to = map.getNodeWithHash(evaluate_res.hash);
                        if (to) {
                            var link = map.createLink(scenario.from, to);
                            link.last_action = scenario.getLastAction();
                        }
                        //if (!map.existLink(scenario.from, to)) {
                        //    var link = map.createLink(scenario.from, to);
                        //TODO add action to the link
                        //}
                    }
                    crawl(map, options, scenarioManager, callback);
                })
                .catch(function(err) {
                    winston.error(err);
                    crawl(map, options, scenarioManager, callback);
                });
        } else {
            crawl(map, options, scenarioManager, callback);
        }
    } else {
        nightmare.end()
            .then(res => {
                winston.info(`Finished crawling, found ${map.nodes.length} nodes and ${map.links.length} links`);
                var endTime = present();
                winston.info(`Process duration: ${endTime - startTime} ms`);
                callback(null, `Finished crawling, found ${map.nodes.length} nodes and ${map.links.length} links`);
            })
            .catch(err => {
                winston.error(`Error finishing crawling: ${err}, found ${map.nodes.length} nodes and ${map.links.length} links`);
                callback(`Error finishing crawling: ${err}, rfound ${map.nodes.length} nodes and ${map.links.length} links`);
            });
    }
}




module.exports.crawlMap = crawlMap;
