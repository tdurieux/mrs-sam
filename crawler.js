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
var ScrollToAction = sce.ScrollToAction;
var MouseOverAction = sce.MouseOverAction;
var BackAction = sce.BackAction;
var Scenario = sce.Scenario;
var ScenarioManager = sce.ScenarioManager;


var Nightmare = require('nightmare');

function crawlMap(map, callback) {
    map.nightmare = Nightmare({ show: map.options.engine.show });
    winston.info(`Nightmare has been initialized !`);

    registerEventListener(map);

    map.scenarioManager = new ScenarioManager();
    var initial_scenario = createInitialScenario(map)
    map.scenarioManager.addScenarioToExecute(initial_scenario);

    winston.info(`Start crawling of ${map.url} with ${map.options.engine.maxsteps} maximun steps in ${map.options.engine.time} min`);
    crawl(map, callback);
}

function registerEventListener(map) {
    map.response_error = [];
    map.html_error = [];

    map.nightmare.on('console', function(type, arguments) {
            if (type === 'error') {
                map.html_error.push(arguments)
            }
        })
        .on('page', function(type, message, stack) {
            if (type === 'error') {
                map.html_error.push(message);
            }
        })
        .on('did-get-response-details', function(event, status, newURL, originalURL, code, referrer, headers, resourceType) {
            const HTML_ERROR_CODE = 400;
            if (code >= HTML_ERROR_CODE) {
                winston.error(`An error HTTP has been received (code: ${code}, url:${newURL})`);
                map.response_error.push(code);
            }
        });

    winston.info(`EventListerners have been initialized and setted !`);
}

function createInitialScenario(map) {
    var initScenario = new Scenario(map.root_node);
    initScenario.addAction(new GotoAction(map.url));
    initScenario.addAction(new WaitAction(map.options.engine.wait));
    winston.info(`An initial scenario has been created and registered to the ScenarioManager.`);
    return initScenario;
}


function crawl(map, callback) {
    var scenarioManager = map.scenarioManager;
    var nightmare = map.nightmare;
    var hasTime = (present() - startTime) < (map.options.engine.time * 60 * 1000);

    if (scenarioManager.hasScenarioToExecute() && hasTime) {
        executeNextScenario(map, callback);
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


function executeNextScenario(map, callback) {
    const WAIT_ACTIONS_POWER_FACTOR = 2;

    var nightmare = map.nightmare;
    var scenarioManager = map.scenarioManager;
    var scenario = scenarioManager.nextScenarioToExecute();

    if (scenario.size <= (map.options.engine.maxsteps * WAIT_ACTIONS_POWER_FACTOR)) {
        winston.info(`Proceed: ${scenario}\n`);
        scenario.attachTo(nightmare)
            .evaluate(htmlAnalysis)
            .then(function(analysis_result) {
                winston.info(`A scenario has been executed and after the HTML has been analyzed`);
                handleEndOfScenario(map, scenario, analysis_result);
                crawl(map, callback);
            })
            .catch(function(err) {
                winston.error(err);
                crawl(map, callback);
            });
    } else {
        crawl(map, callback);
    }

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

function handleEndOfScenario(map, scenario, analysis_result) {
    var end_node_already_exists = map.existNodeWithHash(analysis_result.hash);
    var is_locale = map.url.includes(analysis_result.hostname);
    var end_node = updateMap(map, scenario, analysis_result);

    if (!end_node_already_exists && is_locale) {
        addNewScenari(map, analysis_result, scenario, end_node);
        winston.info(`The end of the scenario is new. The crawler has created new scenario.`);
    }
}

function updateMap(map, scenario, analysis_result) {
    var from_node = scenario.from;
    var end_node_already_exists = map.existNodeWithHash(analysis_result.hash);
    var end_node = map.getNodeWithHash(analysis_result.hash);

    if (end_node === undefined) {
        var end_node_hash = analysis_result.hash;
        var is_locale = map.url.includes(analysis_result.hostname);
        if (!is_locale) {
            end_node_hash = analysis_result.hostname
        }
        end_node = map.createNode(end_node_hash);
        end_node.is_locale = is_locale;
    }

    var link = map.getLink(from_node, end_node);
    if (link === undefined) {
        link = map.createLink(from_node, end_node);
    }

    link.actions.push(scenario.getLastAction());
    markError(map, link);

    return end_node;
}


function markError(map, link) {
    map.response_error.forEach((err) => link.errors.push(err));
    map.html_error.forEach((err) => link.errors.push(err));
    map.response_error = [];
    map.html_error = [];
}

function addNewScenari(map, evaluate_res, current_scenario, current_node) {
    if (map.options.scenario.click.active) addNewClickScenari(map, evaluate_res, current_scenario, current_node);
    if (map.options.scenario.scroll.active) addScrollToScenari(map, evaluate_res, current_scenario, current_node);
    if (map.options.scenario.mouseover.active) addMouseOverScenari(map, evaluate_res, current_scenario, current_node);
    if (map.options.scenario.wait.active) addWaitScenari(map, evaluate_res, current_scenario, current_node);
    if (map.options.scenario.back.active) addBackScenari(map, evaluate_res, current_scenario, current_node);
}

function addNewClickScenari(map, evaluate_res, current_scenario, current_node) {
    winston.info(`${evaluate_res.selectors.length} selectors have been extracted and transformed into new scenario`);
    var scenarioManager = map.scenarioManager;
    for (var i = 0; i < evaluate_res.selectors.length; i++) {
        var new_scenario = new Scenario(current_node);
        for (var j = 0; j < current_scenario.actions.length; j++) {
            new_scenario.addAction(current_scenario.actions[j]);
        }
        var last_action = new ClickAction(evaluate_res.selectors[i]);
        new_scenario.addAction(last_action);
        new_scenario.addAction(new WaitAction(map.options.engine.wait));
        scenarioManager.addScenarioToExecute(new_scenario);
    }
}

function addScrollToScenari(map, evaluate_res, current_scenario, current_node) {
    var scenarioManager = map.scenarioManager;
    var new_scenario = new Scenario(current_node);
    for (var j = 0; j < current_scenario.actions.length; j++) {
        new_scenario.addAction(current_scenario.actions[j]);
    }
    var last_action = new ScrollToAction(map.options.scenario.scroll.scroll_x, map.options.scenario.scroll.scroll_y);
    new_scenario.addAction(last_action);
    new_scenario.addAction(new WaitAction(map.options.engine.wait));
    scenarioManager.addScenarioToExecute(new_scenario);
}

function addMouseOverScenari(map, evaluate_res, current_scenario, current_node) {
    var scenarioManager = map.scenarioManager;
    for (var i = 0; i < evaluate_res.selectors.length; i++) {
        var new_scenario = new Scenario(current_node);
        for (var j = 0; j < current_scenario.actions.length; j++) {
            new_scenario.addAction(current_scenario.actions[j]);
        }
        var last_action = new MouseOverAction(evaluate_res.selectors[i]);
        new_scenario.addAction(last_action);
        new_scenario.addAction(new WaitAction(map.options.engine.wait));
        scenarioManager.addScenarioToExecute(new_scenario);
    }
}

function addWaitScenari(map, evaluate_res, current_scenario, current_node) {
    var scenarioManager = map.scenarioManager;
    var new_scenario = new Scenario(current_node);
    for (var j = 0; j < current_scenario.actions.length; j++) {
        new_scenario.addAction(current_scenario.actions[j]);
    }
    var last_action = new WaitAction(map.options.scenario.wait.wait);
    new_scenario.addAction(last_action);
    new_scenario.addAction(new WaitAction(map.options.engine.wait));
    scenarioManager.addScenarioToExecute(new_scenario);
}

function addBackScenari(map, evaluate_res, current_scenario, current_node) {
    var scenarioManager = map.scenarioManager;
    var new_scenario = new Scenario(current_node);
    for (var j = 0; j < current_scenario.actions.length; j++) {
        new_scenario.addAction(current_scenario.actions[j]);
    }
    var last_action = new BackAction();
    new_scenario.addAction(last_action);
    new_scenario.addAction(new WaitAction(map.options.engine.wait));
    scenarioManager.addScenarioToExecute(new_scenario);
}


module.exports.crawlMap = crawlMap;
