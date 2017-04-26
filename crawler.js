//log
var winston = require('winston');

//monitoring
var present = require('present');
var startTime = present();


//Import of other modules (this should be improved somehow)
var htmlAnalysis = require('./htmlAnalysis.js');

var sce = require('./scenario.js');
var ScenarioManager = sce.ScenarioManager;
var Scenario = sce.Scenario;

var sceGen = require('./scenarioGenerator.js');
var addNewScenari = sceGen.addNewScenari;
var createInitialScenario = sceGen.createInitialScenario;


var Nightmare = require('nightmare');

function crawlMap(map, callback) {
    map.nightmare = Nightmare({ show: map.options.crawler.show });
    winston.info(`Nightmare has been initialized !`);

    registerEventListener(map);

    map.scenarioManager = new ScenarioManager();
    var initial_scenario = createInitialScenario(map)
    map.scenarioManager.addScenarioToExecute(initial_scenario);
    map.scenarioManager.current_node = map.root_node;

    winston.info(`Start crawling of ${map.url} with ${map.options.crawler.maxsteps} maximun steps in ${map.options.crawler.time} min`);
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




function crawl(map, callback) {
    var scenarioManager = map.scenarioManager;
    var nightmare = map.nightmare;
    var hasTime = (present() - startTime) < (map.options.crawler.time * 60 * 1000);

    if (hasTime) {
        if (scenarioManager.hasScenarioToExecute()) {
            executeNextScenario(map, () => {
                crawl(map, callback);
            });
        } else {
            var initial_scenario = createInitialScenario(map)
            map.scenarioManager.addScenarioToExecute(initial_scenario);
            map.scenarioManager.current_node = map.root_node;
            crawl(map, callback);
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


function executeNextScenario(map, callback) {
    const WAIT_ACTIONS_POWER_FACTOR = 2;

    var nightmare = map.nightmare;
    var scenarioManager = map.scenarioManager;
    var scenario = scenarioManager.nextScenarioToExecute();

    if (scenario.size <= (map.options.crawler.maxsteps * WAIT_ACTIONS_POWER_FACTOR)) {
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



function handleEndOfAction(map, action, analysis_result) {
    var end_node_already_exists = map.existNodeWithHash(analysis_result.hash);
    var end_node = updateMap(map, action, analysis_result);

    if (!end_node_already_exists) {
        if (end_node.level <= map.options.crawler.maxsteps) {
            addNewScenari(map, analysis_result, end_node);
            winston.info(`The action produces a new node. The crawler has created new scenario.`);
        } else {
            addBackToLevelZeroScenari(map, end_node);
            winston.info(`Maxstep : created a back scenario.`);
        }
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
        end_node.level = from_node.level + 1;
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



module.exports.crawlMap = crawlMap;
