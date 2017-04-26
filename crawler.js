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
var CheckAction = sce.CheckAction;
var TypeAction = sce.TypeAction;
var BackAction = sce.BackAction;
var Scenario = sce.Scenario;
var ScenarioManager = sce.ScenarioManager;
var htmlAnalysis = require('./htmlAnalysis.js');


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

function createInitialScenario(map) {
    var initScenario = new Scenario(map.root_node);
    initScenario.addAction(new GotoAction(map.url));
    initScenario.addAction(new WaitAction(map.options.crawler.wait));
    initScenario.root_node = map.root_node;
    winston.info(`An initial scenario has been created and registered to the ScenarioManager.`);
    return initScenario;
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

function addNewScenari(map, evaluate_res, current_node) {
    var is_locale = map.url.includes(evaluate_res.hostname);
    if (map.options.scenario.click.active && is_locale) addClickScenari(map, evaluate_res, current_node);
    if (map.options.scenario.scroll.active && is_locale) addScrollToScenari(map, current_node);
    if (map.options.scenario.mouseover.active && is_locale) addMouseOverScenari(map, evaluate_res, current_node);
    if (map.options.scenario.wait.active && is_locale) addWaitScenari(map, current_node);
    if (map.options.scenario.form.active && is_locale) addFormScenari(map, evaluate_res, current_node);
    if (map.options.scenario.back.active || !is_locale) addBackScenari(map, current_node);
}

function addClickScenari(map, evaluate_res, current_node) {
    winston.info(`${evaluate_res.selectors.length} selectors have been extracted and transformed into new scenario`);
    var scenarioManager = map.scenarioManager;
    for (var i = 0; i < evaluate_res.selectors.length; i++) {
        var new_scenario = new Scenario(current_node);
        var action = new ClickAction(evaluate_res.selectors[i]);
        new_scenario.addAction(action);
        new_scenario.addAction(new WaitAction(map.options.crawler.wait));
        new_scenario.root_node = current_node;
        scenarioManager.addScenarioToExecute(new_scenario);
    }

}

function addFormScenari(map, evaluate_res, current_node) {
    winston.info(`${evaluate_res.forms.length} forms have been extracted and transformed into new scenario`);
    for (var i = 0; i < evaluate_res.forms.length; i++) {
        addFormScenario(map, evaluate_res.forms[i], current_node);
    }
}

function addFormScenario(map, form, current_node) {
    var scenarioManager = map.scenarioManager;
    var type_actions = [];
    var check_actions = [];
    var click_actions = [];
    for (var i = 0; i < form.inputs.length; i++) {
        switch (form.inputs[i].type) {
            case 'text':
                type_actions.push(new TypeAction(form.inputs[i].selector, "test"));
                break;
            case 'password':
                type_actions.push(new TypeAction(form.inputs[i].selector, "test"));
                break;
            case 'reset':
                break;
            case 'radio':
                check_actions.push(new CheckAction(form.inputs[i].selector));
                break;
            case 'checkbox':
                check_actions.push(new CheckAction(form.inputs[i].selector));
                break;
            case 'button':
                click_actions.push(new ClickAction(form.inputs[i].selector));
                break;
            case 'submit':
                click_actions.push(new ClickAction(form.inputs[i].selector));
                break;
        }

        var new_scenario = new Scenario(current_node);
        type_actions.forEach((action) => new_scenario.addAction(action));
        check_actions.forEach((action) => new_scenario.addAction(action));
        click_actions.forEach((action) => new_scenario.addAction(action));
        new_scenario.addAction(new WaitAction(map.options.crawler.wait));
        new_scenario.root_node = current_node;
        scenarioManager.addScenarioToExecute(new_scenario);
    }
}

function addScrollToScenari(map, current_node) {
    var scenarioManager = map.scenarioManager;
    var new_scenario = new Scenario(current_node);
    var action = new ScrollToAction(map.options.scenario.scroll.scroll_x, map.options.scenario.scroll.scroll_y);
    new_scenario.addAction(action);
    new_scenario.addAction(new WaitAction(map.options.crawler.wait));
    new_scenario.root_node = current_node;
    scenarioManager.addScenarioToExecute(new_scenario);
}

function addMouseOverScenari(map, evaluate_res, current_node) {
    var scenarioManager = map.scenarioManager;
    for (var i = 0; i < evaluate_res.selectors.length; i++) {
        var new_scenario = new Scenario(current_node);
        var action = new MouseOverAction(evaluate_res.selectors[i]);
        new_scenario.addAction(action);
        new_scenario.addAction(new WaitAction(map.options.crawler.wait));
        new_scenario.root_node = current_node;
        scenarioManager.addScenarioToExecute(new_scenario);
    }
}

function addWaitScenari(map, current_node) {
    var scenarioManager = map.scenarioManager;
    var new_scenario = new Scenario(current_node);
    var action = new WaitAction(map.options.scenario.wait.wait);
    new_scenario.addAction(action);
    new_scenario.addAction(new WaitAction(map.options.crawler.wait));
    new_scenario.root_node = current_node;
    scenarioManager.addScenarioToExecute(new_scenario);
}

function addBackScenari(map, current_node) {
    var scenarioManager = map.scenarioManager;
    var new_scenario = new Scenario(current_node);
    var action = new BackAction();
    new_scenario.addAction(action);
    new_scenario.addAction(new WaitAction(map.options.crawler.wait));
    new_scenario.root_node = current_node;
    scenarioManager.addScenarioToExecute(new_scenario);
}

function addBackToLevelZeroScenari(map, current_node) {
    var scenarioManager = map.scenarioManager;
    var new_scenario = new Scenario(current_node);
    for (var i = 1; i < current_node.level; i++) {
        var action = new BackAction();
        new_scenario.addAction(action);
        new_scenario.addAction(new WaitAction(map.options.crawler.wait));
    }
    new_scenario.root_node = current_node;
    scenarioManager.addScenarioToExecute(new_scenario);
}


module.exports.crawlMap = crawlMap;
