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
    map.scenarioManager.current_node = map.root_node;

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
    initScenario.root_node = map.root_node;
    winston.info(`An initial scenario has been created and registered to the ScenarioManager.`);
    return initScenario;
}


function crawl(map, callback) {
    var scenarioManager = map.scenarioManager;
    var nightmare = map.nightmare;
    var hasTime = (present() - startTime) < (map.options.engine.time * 60 * 1000);

    if (scenarioManager.hasScenarioToExecute() && hasTime) {
        executeNextScenario(map, () => {            
            crawl(map,callback);
        });
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
        executeScenario(map, scenario, callback);
    } else {
        callback();
    }

}


function executeScenario(map, scenario, callback) {
    var nightmare = map.nightmare;
    if (scenario.hasNext()) {
        var next_action = scenario.next();
        next_action.from = scenario.root_node;
        next_action.attachTo(nightmare)
            .evaluate(htmlAnalysis)
            .then(function(analysis_result) {
                winston.info(`An action has been executed and after the HTML has been analyzed`);
                scenario.root_node = handleEndOfAction(map, next_action, analysis_result);
                map.scenarioManager.current_node = scenario.root_node;
                executeScenario(map, scenario, callback)
            })
            .catch((err) => {
                winston.error(`An action cannot be executed ${err}, scenario is aborded.`);
                callback()
            })
    } else {
        callback();
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

function handleEndOfAction(map, action, analysis_result) {
    var end_node_already_exists = map.existNodeWithHash(analysis_result.hash);
    var end_node = updateMap(map, action, analysis_result);

    if (!end_node_already_exists) {
        addNewScenari(map, analysis_result, end_node);
        winston.info(`The action produces a new node. The crawler has created new scenario.`);
    }

    return end_node;
}

function updateMap(map, action, analysis_result) {
    var from_node = action.from;
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

    link.actions.push(action);
    markError(map, link);

    map.current_node = end_node;

    return end_node;
}


function markError(map, link) {
    map.response_error.forEach((err) => link.errors.push(err));
    map.html_error.forEach((err) => link.errors.push(err));
    map.response_error = [];
    map.html_error = [];
}

function addNewScenari(map, evaluate_res, current_node) {
    var is_locale = map.url.includes(evaluate_res.hostname);
    if (map.options.scenario.click.active && is_locale) addNewClickScenari(map, evaluate_res, current_node);
    if (map.options.scenario.scroll.active && is_locale) addScrollToScenari(map, evaluate_res, current_node);
    if (map.options.scenario.mouseover.active && is_locale) addMouseOverScenari(map, evaluate_res, current_node);
    if (map.options.scenario.wait.active && is_locale) addWaitScenari(map, evaluate_res, current_node);
    if (map.options.scenario.back.active || ! is_locale) addBackScenari(map, evaluate_res, current_node);
}

function addNewClickScenari(map, evaluate_res, current_node) {
    winston.info(`${evaluate_res.selectors.length} selectors have been extracted and transformed into new scenario`);
    var scenarioManager = map.scenarioManager;
    for (var i = 0; i < evaluate_res.selectors.length; i++) {
        var new_scenario = new Scenario(current_node);
        var action = new ClickAction(evaluate_res.selectors[i]);
        new_scenario.addAction(action);
        new_scenario.addAction(new WaitAction(map.options.engine.wait));
        new_scenario.root_node = current_node;
        scenarioManager.addScenarioToExecute(new_scenario);
    }
}

function addScrollToScenari(map, evaluate_res, current_node) {
    var scenarioManager = map.scenarioManager;
    var new_scenario = new Scenario(current_node);
    var action = new ScrollToAction(map.options.scenario.scroll.scroll_x, map.options.scenario.scroll.scroll_y);
    new_scenario.addAction(action);
    new_scenario.addAction(new WaitAction(map.options.engine.wait));
    new_scenario.root_node = current_node;
    scenarioManager.addScenarioToExecute(new_scenario);
}

function addMouseOverScenari(map, evaluate_res, current_node) {
    var scenarioManager = map.scenarioManager;
    for (var i = 0; i < evaluate_res.selectors.length; i++) {
        var new_scenario = new Scenario(current_node);
        var action = new MouseOverAction(evaluate_res.selectors[i]);
        new_scenario.addAction(action);
        new_scenario.addAction(new WaitAction(map.options.engine.wait));
        new_scenario.root_node = current_node;
        scenarioManager.addScenarioToExecute(new_scenario);
    }
}

function addWaitScenari(map, evaluate_res, current_node) {
    var scenarioManager = map.scenarioManager;
    var new_scenario = new Scenario(current_node);
    var action = new WaitAction(map.options.scenario.wait.wait);
    new_scenario.addAction(action);
    new_scenario.addAction(new WaitAction(map.options.engine.wait));
    new_scenario.root_node = current_node;
    scenarioManager.addScenarioToExecute(new_scenario);
}

function addBackScenari(map, evaluate_res, current_node) {
    var scenarioManager = map.scenarioManager;
    var new_scenario = new Scenario(current_node);
    var action = new BackAction();
    new_scenario.addAction(action);
    new_scenario.addAction(new WaitAction(map.options.engine.wait));
    new_scenario.root_node = current_node;
    scenarioManager.addScenarioToExecute(new_scenario);
}


module.exports.crawlMap = crawlMap;
