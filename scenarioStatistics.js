var  argv  =  require('yargs')
    .usage('$0 scenaioStatistics.js --in=[string]').argv;
var fs = require('fs');

var fileName = argv.in || "./test/server/localhost_8080_1_scenar.js";
var executed = JSON.parse(fs.readFileSync(fileName, 'utf8'));

makeStatistics(executed);

function makeStatistics(executed) {
    var numberOfExecuted = executed.length;
    var numberOfAborded = 0;
    var numberWithError = 0;
    executed.forEach(sc => {
        aborded = false;
        withError = false;
        sc.actions.forEach(ac => {
            if (!ac.executed) aborded = true;
            if (ac.errors && ac.errors.length > 0) withError = true;
        });
        if (aborded) numberOfAborded++;
        if (withError) numberWithError++;
    });
    console.log(`${numberOfExecuted} scenario were executed.`);
    console.log(`${numberOfAborded} were aborded (${numberOfAborded / numberOfExecuted}).`);
    console.log(`${numberWithError} had errors (${numberWithError / numberOfExecuted}).`);
}
