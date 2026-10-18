'use strict';
// Execute the actual guide, shell listeners and toast timer without a browser.
var assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
var root = path.resolve(__dirname, '..'), ready = [], frames = [], timers = [], nodes = {}, events = {}, reduced = false, phone = false, phoneChange;
function node(id) {
  if (nodes[id]) return nodes[id];
  var classes = new Set();
  return nodes[id] = {
    id: id, innerHTML: '', textContent: '', dataset: {}, attrs: {}, hidden: false,
    classList: { add: function (name) { classes.add(name); }, remove: function (name) { classes.delete(name); }, contains: function (name) { return classes.has(name); } },
    appendChild: function (child) { child.parentNode = this; },
    addEventListener: function (type, callback) { this[type] = callback; },
    setAttribute: function (name, value) { this.attrs[name] = value; }, getAttribute: function (name) { return this.attrs[name]; },
    matches: function () { return true; }, focus: function (options) { this.focusOptions = options; },
    scrollIntoView: function (options) { this.scrollOptions = options; this.scrollCount = (this.scrollCount || 0) + 1; },
    getBoundingClientRect: function () { return { height: 80 }; },
    querySelectorAll: function () { return []; }
  };
}
var target = node('start');
var document = {
  documentElement: { dataset: {}, style: { setProperty: function () {} } }, body: node('body'), activeElement: node('menu-toggle'),
  addEventListener: function (type, callback) { if (type === 'DOMContentLoaded') ready.push(callback); },
  getElementById: node, querySelectorAll: function () { return []; },
  querySelector: function (selector) {
    if (selector === '.modal') return null;
    if (selector === '.header-tools' || selector === '.app-header' || selector === '.disclaimer' || selector === '#guide-shell') return node(selector);
    if (selector === '[data-guide-next]') return node('next-link');
    return target;
  }
};
var context = vm.createContext({
  document: document, location: { hash: '#/welcome' }, console: console, URL: URL,
  localStorage: { getItem: function () { return null; }, setItem: function () {} },
  setTimeout: function (callback, duration) { timers.push({ callback: callback, duration: duration }); return timers.length; }, clearTimeout: function () {},
  window: {
    matchMedia: function (query) { return { get matches() { return query.includes('640px') ? phone : query.includes('reduced-motion') && reduced; }, addEventListener: function (name, callback) { if (query.includes('640px')) phoneChange = callback; } }; },
    addEventListener: function (name, callback) { events[name] = callback; },
    scrollTo: function () {}, requestAnimationFrame: function (callback) { frames.push(callback); }
  }
});
function load(name) { vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/' + name + '.js'), 'utf8'), context); }
['config', 'products-data', 'calc', 'data', 'theme', 'core', 'guide'].forEach(load);
var D = context.window.Demo;
['welcome', 'products', 'profit', 'summary', 'shipping'].forEach(function (route) { D.register(route, { render: function () { return ''; } }); });
ready.forEach(function (fn) { fn(); });
assert.strictEqual(node('reset-button').parentNode, node('.header-tools'));
phone = true; phoneChange();
assert.strictEqual(node('reset-button').parentNode, node('drawer-reset'));
assert.strictEqual(typeof node('reset-button').click, 'function', 'Moved button keeps confirmation handler');
phone = false; phoneChange();
assert.strictEqual(node('reset-button').parentNode, node('.header-tools'));
function guideClick(action) { node('guide').click({ target: { closest: function () { return { dataset: { guide: action } }; } } }); }
assert(node('guide').innerHTML.includes('ここで操作する'));
guideClick('target');
assert.strictEqual(target.scrollCount, 1);
assert.strictEqual(target.scrollOptions.behavior, 'smooth');
assert.strictEqual(target.focusOptions.preventScroll, true);
assert.strictEqual(D.state.guide, true, 'The target button must not turn the guide off');
reduced = true; guideClick('target'); assert.strictEqual(target.scrollOptions.behavior, 'auto');
D.state.started = true; D.guide.render();
assert(node('guide').innerHTML.includes('data-guide-market'));
assert(node('guide').innerHTML.includes('フリマを開く ↗'));
assert(!node('guide').innerHTML.includes('class="guide-market"'), 'Market link must not add a third row');
assert(node('guide').innerHTML.includes('target="_blank" rel="noopener" data-market'));
D.state.marketOpened = true; D.route = 'products'; target = node('import-url'); D.guide.render();
frames.splice(0).forEach(function (fn) { fn(); });
assert.strictEqual(D.guide.index(), 2); assert.strictEqual(target.scrollCount, 1, 'Step change reveals URL input');
D.guide.render(); assert.strictEqual(frames.length, 0, 'Unchanged steps do not steal focus');
D.route = 'welcome'; D.guide.render(); assert(node('guide').innerHTML.includes('体験する画面へ'));
assert(node('guide').innerHTML.includes('href="#/products"'));
D.state.products.push({ processed: true }); D.state.events = { priceSeen: true }; D.route = 'profit'; D.guide.render();
assert.strictEqual(D.guide.index(), 4); assert(node('guide').innerHTML.includes('配送方法を切り替えて'));
D.state.events.profitCompared = true; D.guide.render();
assert.strictEqual(D.guide.index(), 5); assert(node('guide').innerHTML.includes('出品管理へ進み'));
D.state.events = { priceSeen: true, profitCompared: true, listed: true, dashboardSeen: true, monitorDone: true, purchased: true, shipped: true, replied: true, watchersSeen: true, templateCreated: true, reportSeen: true };
D.state.offers.push({}); D.route = 'summary'; D.guide.render();
assert.strictEqual(D.guide.index(), 11); assert(node('guide').innerHTML.includes('収益の下の『送料管理』'));
D.state.events.shippingSeen = true; D.guide.render();
assert(node('guide').innerHTML.includes('ひと通り体験できました'));
assert(!node('guide').innerHTML.includes('data-guide-next'));
assert(!node('guide').innerHTML.includes('data-guide="target"'));

// Core dispatch prevents a second acquisition while the first is in flight.
var acquisitions = 0;
D.screens.products.submit = function () { acquisitions += 1; D.working = true; };
context.location.hash = '#/products'; D.render();
var submitEvent = { preventDefault: function () {} };
node('main').submit(submitEvent); node('main').submit(submitEvent);
assert.strictEqual(acquisitions, 1); D.working = false;

D.toast('保存しました'); assert.strictEqual(timers.at(-1).duration, 3000);
node('toast').click(); assert.strictEqual(node('toast').textContent, '');
D.toast('入力を確認してください', true); assert.strictEqual(timers.at(-1).duration, 5000);
timers.at(-1).callback(); assert.strictEqual(node('toast').textContent, '');
node('menu-toggle').click(); assert(node('sidebar').classList.contains('open'));
node('navigation').click({ target: { closest: function () { return { href: context.location.hash }; } } });
assert(!node('sidebar').classList.contains('open'), 'Current-page navigation also closes drawer');
assert.strictEqual(node('menu-toggle').attrs['aria-expanded'], 'false');

// Formula details are closed and all raw calculation syntax is inside them.
var detail = D.calculationDetails();
assert(/^<details\b(?![^>]*\bopen)/.test(detail));
assert(detail.includes('<summary>計算の式を見る</summary>'));
assert(detail.includes('round(2900 + 2100 × kg)'));
assert(detail.includes('粗額 × (13.25% + 1.35%) + $0.40'));
var formula = D.formula({ sale: 150, cost: 14000, shipping: 3656, rate: 155 });
assert(formula.includes('<dl class="formula">'));
assert(!formula.split('<details')[0].includes('13.25%'));

var css = fs.readFileSync(path.join(root, 'assets/css/app.css'), 'utf8');
Array.from(css.matchAll(/font-size\s*:\s*([\d.]+)(px|rem|em|%)/g)).forEach(function (m) {
  var pixels = Number(m[1]) * (m[2] === 'px' ? 1 : m[2] === '%' ? 0.14 : 14);
  assert(pixels >= 12, 'Font below 12px: ' + m[0]);
});
assert(/\.sidebar\{[^}]*visibility:hidden\}/.test(css));
assert(/\.sidebar\.open\{visibility:visible\}/.test(css));
assert(/#guide-shell\{position:sticky;top:var\(--header-height\)/.test(css));
assert(css.includes('scroll-margin-bottom:calc(var(--footer-height)'));
assert(css.includes('.import-intro>.import-card{order:-1}'));
assert(css.includes('.mobile-cards>table,.mobile-cards tbody'));
assert(css.includes('@media(prefers-reduced-motion:reduce)'));
assert(css.includes('outline:3px solid var(--primary)'));
console.log('Usability checks passed: guide actions/advance/completion, reduced motion, drawer close, toast timers/dismiss, formulas, mobile sizing.');

assert(css.includes('--header-height:56px;--guide-height:80px'));
assert(css.includes('scroll-margin-top:calc(var(--header-height) + var(--guide-height) + 16px)'));
assert(css.includes('.guide-actions{display:flex;flex-wrap:nowrap;'));
(async function () {
  phone = true; phoneChange();
  node('menu-toggle').click();
  var original = D.state, confirmed = 0;
  D.confirm = async function () { confirmed += 1; return false; };
  await node('reset-button').click();
  assert.strictEqual(confirmed, 1);
  assert.strictEqual(D.state, original, 'Cancelling phone reset preserves state');
  assert(!node('sidebar').classList.contains('open'));
  D.state.started = true;
  D.confirm = async function () { confirmed += 1; return true; };
  await node('reset-button').click();
  assert.strictEqual(confirmed, 2);
  assert.strictEqual(D.state.started, false, 'Confirming phone reset restores initial state');
})().catch(function (error) { console.error(error); process.exitCode = 1; });
