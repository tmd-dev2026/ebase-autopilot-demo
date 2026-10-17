'use strict';
var assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
var core = fs.readFileSync(path.join(__dirname, '../assets/js/core.js'), 'utf8');
var css = fs.readFileSync(path.join(__dirname, '../assets/css/app.css'), 'utf8');
var guide = fs.readFileSync(path.join(__dirname, '../assets/js/guide.js'), 'utf8');
var renderRoute = core.match(/function renderRoute\(\) \{([\s\S]*?)\n    \}/);
assert(renderRoute, 'Route rendering must manage focus and scroll together');
var calls = [], scrollY = 160;
var context = {
  D: { render: function () { calls.push('render'); } },
  document: { getElementById: function (id) {
    assert.strictEqual(id, 'main');
    return { focus: function (options) {
      assert.strictEqual(options.preventScroll, true);
      calls.push('focus');
    } };
  } },
  window: { scrollTo: function (x, y) {
    assert.strictEqual(x, 0);
    scrollY = y;
    calls.push('scroll');
  } }
};
vm.runInNewContext('(' + renderRoute[0] + ')()', context);
assert.strictEqual(scrollY, 0, 'Route navigation resets the page to the top');
assert.deepStrictEqual(calls, ['render', 'focus', 'scroll']);
assert(/renderRoute\(\);\s*window.addEventListener\('hashchange',[^\n]*renderRoute\(\)/.test(core), 'Initial load and hash changes use the same focus handling');
assert(!/getElementById\('main'\)\.focus\(\)/.test(core), 'All main focus calls prevent scrolling');
assert(/body\{[^}]*overflow-anchor:none/.test(css), 'Guide height changes must not trigger viewport scroll anchoring');
assert(!/\.focus\(|scrollIntoView\(|scrollTo\(/.test(guide), 'Guide updates must not move focus or scroll');
console.log('Navigation focus, scroll reset and guide scroll regression checks passed.');
