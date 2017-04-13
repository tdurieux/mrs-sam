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


var Nightmare = require('nightmare');
var nightmare = Nightmare({ show: true });



function crawlMap(map, max_action) {
  winston.info(`Start crawling of ${map}`);
  var scenarioList = new Array();
  var initScenario = new Scenario(map.root);
  initScenario.addAction(new GotoAction(map.url));
  initScenario.addAction(new WaitAction(2000));
  scenarioList.push(initScenario);
  crawl(map, max_action, scenarioList);
}

function evaluate_cb() {
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
        if (el == el.ownerDocument.documentElement)
          names.unshift(el.tagName);
        else {
          for (var c = 1, e = el; e.previousElementSibling; e = e.previousElementSibling, c++);
          names.unshift(el.tagName + ":nth-child(" + c + ")");
        }
        el = el.parentNode;
      }
    }
    return names.join(" > ");
  }
}

function crawl(map, max_action, scenarioList) {
  if (scenarioList.length !== 0) {
    var scenario = scenarioList.pop();
    winston.info(`Retrieve state for scenario ${scenario}`);
    if (scenario.size <= max_action) {
      scenario.attachTo(nightmare)
      .evaluate(evaluate_cb)
      .then(function(evaluate_res) {
        winston.info(`Extracted selectors [${evaluate_res.selectors.join(', ')}]`);
        if (!map.existNodeWithHash(evaluate_res.hash)) {
          winston.info("New state created, extracting new scenarios");
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
          winston.info("Reusing a previously computed state");
          var to = map.getNodeWithHash(evaluate_res.hash);
          if (!map.existLink(scenario.from, to)) {
            var link = map.createLink(scenario.from, to);
            //TODO add action to the link
          }
        }
        crawl(map, max_action, scenarioList);
      })
      .catch(function(err) {
        winston.error(err);
        crawl(map, max_action, scenarioList);
      });
    } else {
      crawl(map, max_action, scenarioList);
    }
  } else {
    nightmare.end()
    .then(res => {
      winston.info(`Finished crawling, found ${map.nodes.length} nodes and ${map.links.length} links`);
      var endTime = present();
      winston.info(`Process duration: ${endTime - startTime} ms`);
    })
    .catch(err => {
      winston.error(`Error finishing crawling: ${err}, found ${map.nodes.length} nodes and ${map.links.length} links`);
    });
  }
}


module.exports.crawlMap = crawlMap;