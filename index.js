//Import of other modules (this should be improved somehow)
var SiteMap = require('./sitemap.js').SiteMap;
var crawlMap = require('./crawler.js').crawlMap;

var map = new SiteMap('http://localhost:8080');
const SCENARIO_MAX_SIZE = 5;

crawlMap(map, SCENARIO_MAX_SIZE);

