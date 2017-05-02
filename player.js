var  argv  =  require('yargs')
    .usage('$0 player.js --in=[string] --url=[string]').argv;

var sce  = require('./scenario.js');
var ScenarioManager = sce.ScenarioManager;
var Scenario = sce.Scenario;

var Nightmare = require('Nightmare');
var nightmare = Nightmare({show:true});

response_error = [];
html_error = [];

nightmare.on('console', (type, args) => {
        if (type === 'error') {
            html_error.push(args)
        }
    })
    .on('page', (type, message, stack) => {
        if (type === 'error') {
            html_error.push(message);
        }
    })
    .on('did-get-response-details', (event, status, newURL, originalURL, code, referrer, headers, resourceType) => {
        const HTML_ERROR_CODE = 400;
        if (code >= HTML_ERROR_CODE) {
            response_error.push(code);
        }
    });


var fs = require('fs');
var fileName = argv.in || "./test/server/localhost_8080_1_scenar.js";
var executed = JSON.parse(fs.readFileSync(fileName, 'utf8'));


var toPlay = [];

executed.forEach(sc => {
    if (sc.actions.find(ac => ac.errors && ac.errors > 0)) toPlay.push(sc);
});

console.log(`${toPlay.length} scenario to play (only play scenario with errors`);

var scenarioManager = new ScenarioManager(100);
toPlay.forEach(sc => {
	var new_scenario = new Scenario(sc.actions);
    scenarioManager.addScenarioToExecute(new_scenario);
});


play(err, success);

function err(e) {
	console.log(e);

}

function success() {
	console.log(checkReplay());
}


function play(errcallback, okcallback) {
    if (scenarioManager.hasScenarioToExecute()) {
        executeNextScenario(
            () => play(errcallback, okcallback),
            () => play(errcallback, okcallback));
    } else {
        nightmare.end()
            .then(res => {
                okcallback(res);
            })
            .catch(err => {
                errcallback(err);
            });
    }
}


function executeNextScenario(errcallback, okcallback) {
    var scenario = scenarioManager.nextScenarioToExecute();
    console.log("executed a new scenario");
    if (scenario) {
        executeScenario(scenario,
            () => {
                errcallback();
            },
            () => {
                okcallback();
            });
    } else {
        okcallback();
    }
}


function executeScenario(scenario, errcallback, okcallback) {
    if (scenario.hasNext()) {
        var next_action = scenario.next();
        next_action.attachTo(nightmare)
            .wait(1000)
            .then((res) => {
            	console.log(`${next_action} is executed`);
            	next_action.executed = true;
            	markError(next_action);
            	cleanError();
            	executeScenario(scenario, errcallback, okcallback);
            })
            .catch((err) => {
            	console.log(`${next_action} is not executed (scenario aborded)`);
            	next_action.executed = false;
            	markError(next_action);
            	cleanError();
                errcallback()
            })
    } else {
        okcallback();
    }
}

function markError(ent) {
    ent.errors = ent.errors || [];
    response_error.forEach((err) => ent.errors.push(err));
    html_error.forEach((err) => ent.errors.push(err));
}

function cleanError() {
    response_error = [];
    html_error = [];
}

function checkReplay() {
    var numberOfSameScenario = 0;
    if (toPlay.length !== scenarioManager.executed.length) return false;

    for (var i = 0; i < toPlay.length; i++) {
    	var originalScenario = toPlay[i];
    	var replayScenario = scenarioManager.executed[i];
    	if (originalScenario.actions.length !== replayScenario.actions.length) return false;

    	for (var j = 0; j < originalScenario.actions.length; j++) {
    		var originalAction = originalScenario.actions[j];
    		var replayAction = replayScenario.actions[j];
    		if (originalAction.executed !== replayAction.executed) return false;
    		if ((originalAction.errors.length > 0) && (replayAction.errors.length === 0)) return false;
            if ((originalAction.errors.length === 0) && (replayAction.errors.length > 0)) return false;
    	}
    }
    return true;
}
