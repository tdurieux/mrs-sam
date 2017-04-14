//Import of other modules (this should be improved somehow)
var SiteMap = require('./sitemap.js').SiteMap;
var crawlMap = require('./crawler.js').crawlMap;

var map = new SiteMap('http://www.promyze.com');
const SCENARIO_MAX_SIZE = 20;

crawlMap(map, SCENARIO_MAX_SIZE);

