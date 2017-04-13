var express = require('express');
var application_root = __dirname;

//require('./copyJSLib.js').copy();

var app = express();

//files for HTML pages
app.use(express.static(application_root));

app.listen(8080, function () {
  console.log('Server listening on 8080');
});
