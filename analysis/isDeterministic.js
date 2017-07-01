var jsdiff = require('diff');
var Nightmare = require('nightmare');
var nightmare = Nightmare({ show: true });

var  argv  =  require('yargs')
    .usage('$0 isDeterministic.js --n=[num] --url=[string] --out=[string]').argv;
var url = argv.url || 'http://localhost:8080';
var n = argv.n || 5;


var rootPages = []

/*fetchRootPageAndGenerateHash(n, rootPages, generateBodyHash, () => {
    var oneDiff = findOneDiff();
    var isDeterministic = oneDiff === undefined ? true : false ;
    console.log(`${url} Body deterministic is ${isDeterministic}`);
});
*/

fetchRootPageAndGenerateHash(n, rootPages, generateStructuralWithIdPageHash, () => {
    var oneDiff = findOneDiff();
    var isDeterministic = oneDiff === undefined ? true : false ;
    console.log(`${url} Structural with ID deterministic is ${isDeterministic}`);
});


/*fetchRootPageAndGenerateHash(n, rootPages, generateStructuralPageHash, () => {
    var oneDiff = findOneDiff();
    var isDeterministic = oneDiff === undefined ? true : false ;
    console.log(`${url} Structural deterministic is ${isDeterministic}`);
});
*/



function fetchRootPageAndGenerateHash(n, rootPages, hashGenerator, callback) {
    if (n > 0) {
        n--;
        nightmare.goto(url)
            .wait(2000)
            .evaluate(hashGenerator)
            .then(hash => {
                rootPages.push(hash);
                fetchRootPageAndGenerateHash(n, rootPages, hashGenerator, callback);
            })
            .catch(err => console.log(err));
    } else {
        console.log('root pages have been fetched');
        nightmare.end()
            .then(() => callback())
            .catch(err => console.log(err));
    }
}


function generateBodyHash() {
    return document.body.innerHTML;
}

function generateStructuralPageHash() {
    return generateStructuralElementHash(document.body);

    function generateStructuralElementHash(element) {
        var openTagName = element.tagName ? `<${element.tagName}` : "";
        var hash = openTagName;
        for (var i = 0; i < element.childNodes.length; i++) {
            hash = hash + generateStructuralElementHash(element.childNodes[i]);
        }
        var closeTagName = element.tagName ? `</${element.tagName}>` : "";
        hash = hash + closeTagName;
        return hash.replace(/\s{2,10}/g, ' ');
    }

}


function generateStructuralWithIdPageHash() {
    return generateStructuralWithIdElementHash(document.body);

    function generateStructuralWithIdElementHash(element) {
        var idAttribute = (element.attributes && element.hasAttribute("id")) ? `id="${element.getAttribute('id')}"` : "";
        var openTagName = element.tagName ? `<${element.tagName} ${idAttribute}>` : "";
        var hash = openTagName;
        for (var i = 0; i < element.childNodes.length; i++) {
            hash = hash + generateStructuralWithIdElementHash(element.childNodes[i]);
        }
        var closeTagName = element.tagName ? `</${element.tagName}>` : "";
        hash = hash + closeTagName;
        return hash.replace(/\s{2,10}/g, ' ');
    }

}



function findOneDiff() {
    var numDiff = (rootPages.length * (rootPages.length - 1)) / 2;
    var done = 1;
    for (var i = 0; i < rootPages.length; i++) {
        for (var j = (i + 1); j < rootPages.length; j++) {
            var diff = jsdiff.diffLines(rootPages[i], rootPages[j]);
            console.log(`${done++} diff computed on ${numDiff} diff to compute`);
            var oneDiff = diff.find(part => {return (part.added || part.removed)});
            if (oneDiff) return oneDiff.value
        }
    }
    return undefined;
}
