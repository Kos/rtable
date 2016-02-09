require("babel-core/register")({
  "presets": ["es2015", "react"]
});

var jsdom = require('jsdom').jsdom;

global.document = jsdom('<!doctype html><html><body></body></html>');
global.window = document.defaultView;
global.navigator = global.window.navigator;
