//log
var winston = require('winston');

//monitoring
var present = require('present');
var startTime = present();


//Import of other modules (this should be improved somehow)
var htmlAnalysis = require('./htmlAnalysis.js');


var ScenarioManager = require('./scenario.js').ScenarioManager;
var ScenarioGenerator = require('./scenarioGenerator.js').ScenarioGenerator;
var SiteMap = require('./siteMap.js').SiteMap;

var Nightmare = require('nightmare');

class Crawler {
    constructor(url, options) {
        this.url = url;
        this.options = options;
        this.scenarioManager = new ScenarioManager(this.options.crawler.maxsteps);
        this.scenarioGenerator = new ScenarioGenerator(this.url, this.options);

        var initial_scenario = this.scenarioGenerator.generateInitialScenario();
        this.scenarioManager.addScenarioToExecute(initial_scenario);

        if (options.map.active) {
            this.siteMap = new SiteMap(this.url, this.options);
        }
    }



    start(errcallback, okcallback) {
        this.nightmare = Nightmare({ show: this.options.crawler.show });
        winston.info(`Nightmare has been initialized !`);

        this.registerEventListener();
        winston.info(`Start crawling of ${this.url} with ${this.options.crawler.maxsteps} maximun steps in ${this.options.crawler.time} min`);
        this.crawl(errcallback, okcallback);
    }

    registerEventListener() {
        this.response_error = [];
        this.html_error = [];

        this.nightmare.on('console', (type, args) => {
                if (type === 'error') {
                    this.html_error.push(args)
                }
            })
            .on('page', (type, message, stack) => {
                if (type === 'error') {
                    this.html_error.push(message);
                }
            })
            .on('did-get-response-details', (event, status, newURL, originalURL, code, referrer, headers, resourceType) => {
                const HTML_ERROR_CODE = 400;
                if (code >= HTML_ERROR_CODE) {
                    winston.error(`An error HTTP has been received (code: ${code}, url:${newURL})`);
                    this.response_error.push(code);
                }
            });

        winston.info(`EventListerners have been initialized and setted !`);
    }




    crawl(errcallback, okcallback) {
        var scenarioManager = this.scenarioManager;
        var nightmare = this.nightmare;
        var hasTime = (present() - startTime) < (this.options.crawler.time * 60 * 1000);

        if (hasTime) {
            if (scenarioManager.hasScenarioToExecute()) {
                this.executeNextScenario(
                    () => this.crawl(errcallback, okcallback),
                    () => this.crawl(errcallback, okcallback));
            } else {
                var initial_scenario = this.scenarioGenerator.generateInitialScenario();
                this.scenarioManager.addScenarioToExecute(initial_scenario);
                this.crawl(errcallback, okcallback);
            }
        } else {
            nightmare.end()
                .then(res => {
                    winston.info(`Finished crawling`);
                    var endTime = present();
                    winston.info(`Process duration: ${endTime - startTime} ms`);
                    var result = {
                        duration: endTime - startTime,
                        executedScenario: this.scenarioManager.executed
                    };
                    if (this.siteMap) result.siteMap = this.siteMap;
                    okcallback(result);
                })
                .catch(err => {
                    winston.error(`Error finishing crawling: ${err}`);
                    errcallback(err);
                });
        }
    }


    executeNextScenario(errcallback, okcallback) {
        var nightmare = this.nightmare;
        var scenarioManager = this.scenarioManager;
        var scenario = scenarioManager.nextScenarioToExecute();

        if (scenario) {
            winston.info(`Proceed: ${scenario}\n`);
            this.executeScenario(scenario,
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


    executeScenario(scenario, errcallback, okcallback) {
        var nightmare = this.nightmare;
        if (scenario.hasNext()) {
            var next_action = scenario.next();
            next_action.attachTo(nightmare)
                .wait(this.options.crawler.wait)
                .evaluate(htmlAnalysis)
                .then(analysis_result => {
                    winston.info(`An action has been executed and after the HTML has been analyzed`);
                    this.handleEndOfAction(next_action, analysis_result);
                    if (!scenario.hasNext()) {
                        this.scenarioGenerator.generateNewScenari(scenario, analysis_result).forEach(sc => this.scenarioManager.addScenarioToExecute(sc));
                    }
                    this.executeScenario(scenario, errcallback, okcallback)
                })
                .catch((err) => {
                    winston.error(`An action (${next_action}) cannot be executed (error: ${err}), the scenario is aborded.`);
                    next_action.executed = false;
                    errcallback()
                })
        } else {
            okcallback();
        }
    }



    handleEndOfAction(action, analysis_result) {
        action.executed = true;
        this.markError(action);
        this.cleanError();

        if (this.siteMap) {
            this.siteMap.updateMap(action, analysis_result);
        }
    }




    markError(ent) {
        ent.errors = ent.erros || [];
        this.response_error.forEach((err) => ent.errors.push(err));
        this.html_error.forEach((err) => ent.errors.push(err));
    }

    cleanError() {
        this.response_error = [];
        this.html_error = [];
    }

}

module.exports.Crawler = Crawler;
