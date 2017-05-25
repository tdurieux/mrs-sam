class ScenarioManager {
    constructor(maxsteps) {
        this.executed = [];
        this.toexecute = [];
        this.maxsteps = maxsteps;
    }

    addScenarioToExecute(scenario) {
        if (scenario.level <= this.maxsteps) this.toexecute.push(scenario);
    }

    nextScenarioToExecute() {
        var id = Math.floor(Math.random() * this.toexecute.length);
        var scenario = this.toexecute[id];
        this.toexecute.splice(this.toexecute.indexOf(scenario), 1);
        this.executed.push(scenario);
        return scenario;
    }

    hasScenarioToExecute() {
        return this.toexecute.length > 0;
    }

    numberOfScenarioToExecute() {
        return this.toexecute.length;
    }

    numberOfExecutedScenario() {
        return this.executed.length;
    }

    ownsScenario(scenario) {
        
    }
}

module.exports.ScenarioManager = ScenarioManager;