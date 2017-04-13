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

module.exports.GotoAction = GotoAction;

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

module.exports.ClickAction = ClickAction;

class MouseOverAction extends Action {
  attachTo(promise) {
    return promise.mouseover(this.selector);
  }
}

module.exports.MouseOverAction = MouseOverAction;

class WaitAction extends Action {
  constructor(ms) {
    super();
    this.ms = ms;
  }

  attachTo(promise) {
    return promise.wait(this.ms);
  }
}

module.exports.WaitAction = WaitAction;

class Scenario {
  constructor(from) {
    this.actions = [];
    this.from = from;
  }

  toString() {
    return this.actions.map(a => a.toString).join('>');
  }

  addAction(action) {
    this.actions.push(action);
  }

  attachTo(promise) {
    var returnedPromise = promise;
    this.actions.map(a => { returnedPromise = a.attachTo(returnedPromise)});
    return returnedPromise;
  }

  get size() {
    return this.actions.length;
  }
}

module.exports.Scenario = Scenario;
