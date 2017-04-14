class Action {
  toString() {
    return `${this.constructor.name}`;
  }
}

class GotoAction extends Action {
  constructor(url) {
    super();
    this.url = url;
  }

  attachTo(promise) {
    return promise.goto(this.url);
  }

  toString() {
    return `${super.toString()}: ${this.url}`;
  }
}


class SelectorAction extends Action {
  constructor(selector) {
    super();
    this.selector = selector;
  }

  toString() {
    return `${super.toString()}: ${this.selector}`;
  }
}

class ClickAction extends SelectorAction {
  attachTo(promise) {
    return promise.click(this.selector);
  }
}


class MouseOverAction extends Action {
  attachTo(promise) {
    return promise.mouseover(this.selector);
  }
}


class WaitAction extends Action {
  constructor(ms) {
    super();
    this.ms = ms;
  }

  attachTo(promise) {
    return promise.wait(this.ms);
  }

  toString() {
    return `${super.toString()}: ${this.ms}ms`;
  }
}


class Scenario {
  constructor(from) {
    this.actions = [];
    this.from = from;
  }

  toString() {
    return `[${this.actions.join(', ')}]`;
  }

  addAction(action) {
    this.actions.push(action);
  }

  attachTo(promise) {
    var returnedPromise = promise;
    this.actions.map(a => { returnedPromise = a.attachTo(returnedPromise); });
    return returnedPromise;
  }

  get size() {
    return this.actions.length;
  }
}

class ScenarioManager {
  constructor() {
    this.executed = [];
    this.toexecute = [];
  }

  addScenarioToExecute(scenario) {
    this.toexecute.push(scenario);
  }

  nextScenarioToExecute() {
    var scenario = this.toexecute.pop();
    this.executed.push(scenario);
    return scenario;
  }

  hasScenarioToExecute() {
    return this.toexecute.length > 0;
  }
}

module.exports.ScenarioManager = ScenarioManager;
module.exports.Scenario = Scenario;
module.exports.GotoAction = GotoAction;
module.exports.ClickAction = ClickAction;
module.exports.MouseOverAction = MouseOverAction;
module.exports.WaitAction = WaitAction;
