//log
var winston = require('winston');

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


function createInitialScenario(map) {
    var initScenario = new Scenario(map.root_node);
    initScenario.addAction(new GotoAction(map.url));
    initScenario.addAction(new WaitAction(map.options.crawler.wait));
    winston.info(`An initial scenario has been created and registered to the ScenarioManager.`);
    return initScenario;
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
        //click_actions.forEach((action) => new_scenario.addAction(action));
        if (click_actions.length > 0) new_scenario.addAction(click_actions[0]);
        new_scenario.addAction(new WaitAction(map.options.crawler.wait));
        scenarioManager.addScenarioToExecute(new_scenario);
    }
}

function addScrollToScenari(map, current_node) {
    var scenarioManager = map.scenarioManager;
    var new_scenario = new Scenario(current_node);
    var action = new ScrollToAction(map.options.scenario.scroll.scroll_x, map.options.scenario.scroll.scroll_y);
    new_scenario.addAction(action);
    new_scenario.addAction(new WaitAction(map.options.crawler.wait));
    scenarioManager.addScenarioToExecute(new_scenario);
}

function addMouseOverScenari(map, evaluate_res, current_node) {
    var scenarioManager = map.scenarioManager;
    for (var i = 0; i < evaluate_res.selectors.length; i++) {
        var new_scenario = new Scenario(current_node);
        var action = new MouseOverAction(evaluate_res.selectors[i]);
        new_scenario.addAction(action);
        new_scenario.addAction(new WaitAction(map.options.crawler.wait));
        scenarioManager.addScenarioToExecute(new_scenario);
    }
}

function addWaitScenari(map, current_node) {
    var scenarioManager = map.scenarioManager;
    var new_scenario = new Scenario(current_node);
    var action = new WaitAction(map.options.scenario.wait.wait);
    new_scenario.addAction(action);
    new_scenario.addAction(new WaitAction(map.options.crawler.wait));
    scenarioManager.addScenarioToExecute(new_scenario);
}

function addBackScenari(map, current_node) {
    var scenarioManager = map.scenarioManager;
    var new_scenario = new Scenario(current_node);
    var action = new BackAction();
    new_scenario.addAction(action);
    new_scenario.addAction(new WaitAction(map.options.crawler.wait));
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
    scenarioManager.addScenarioToExecute(new_scenario);
}


module.exports.addNewScenari = addNewScenari;
module.exports.createInitialScenario = createInitialScenario;
module.exports.addBackToLevelZeroScenari = addBackToLevelZeroScenari;
