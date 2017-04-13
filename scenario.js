class Action {

    constructor(type) {
        this.type = type;
    }

    toString() {
        return 'action ' + this.type;
    }
}

class GotoAction extends Action {
    constructor(url) {
        super('Goto');
        this.url = url;
    }

    attachTo(promise) {
        return promise.goto(this.url);
    }

    toString() {
        return 'goto ' + this.url;
    }
}

module.exports.GotoAction = GotoAction;

class ClickAction extends Action {
    constructor(selector) {
        super('Click');
        this.selector = selector;
    }

    attachTo(promise) {
        return promise.click(this.selector);
    }

    toString() {
        return 'click ' + this.selector;
    }
}
module.exports.ClickAction = ClickAction;

class WaitAction extends Action {
    constructor(ms) {
        super('Wait');
        this.ms = ms;
    }

    attachTo(promise) {
        return promise.wait(this.ms);
    }
}

module.exports.WaitAction = WaitAction;

class MouseOver extends Action {
    constructor(selector) {
        super('MouseOver');
        this.selector = selector;
    }

    attachTo(promise) {
        return promise.MouseOver(this.selector);
    }
}

module.exports.MouseOver = MouseOver;

class Scenario {
    constructor(from) {
        this.actions = new Array();
        this.from = from;
    }

    toString() {
        var to_string = '';
        for (var i = 0; i < this.actions.length; i++) {
            to_string = to_string + '>' + this.actions[i]
        }
        return to_string;
    }

    addAction(action) {
        this.actions.push(action);
    }

    attachTo(promise) {
        var returnedPromise = promise;
        for (var i = 0; i < this.actions.length; i++) {
            returnedPromise = this.actions[i].attachTo(returnedPromise);
        }
        return returnedPromise;
    }

    get size() {
        return this.actions.length;
    }
}

module.exports.Scenario = Scenario;