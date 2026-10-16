'use strict';
// These checks execute actual screen handlers without rendering in a browser.
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var root = path.resolve(__dirname, '..');
var nodes = {}, storage = {}, storageBlocked = false, registered = {}, modal, toast;
function node(id) {
  if (!nodes[id]) nodes[id] = { innerHTML: '', textContent: '', value: '', focus: function () {}, classList: { add: function () {}, remove: function () {} } };
  return nodes[id];
}
var context = vm.createContext({
  window: {}, URL: URL, console: console, setTimeout: setTimeout, clearTimeout: clearTimeout,
  document: { addEventListener: function () {}, querySelectorAll: function () { return []; }, querySelector: function () { return null; }, getElementById: node },
  location: { hash: '#/welcome', href: 'file:///demo/index.html' },
  localStorage: {
    getItem: function (key) { if (storageBlocked) throw new Error('disabled'); return storage[key] || null; },
    setItem: function (key, value) { if (storageBlocked) throw new Error('disabled'); storage[key] = value; }
  },
  FormData: function (form) {
    this.get = function (key) { return form.values[key]; };
    this.forEach = function (callback) { Object.keys(form.values).forEach(function (key) { callback(form.values[key], key); }); };
  }
});
function load(file) { vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file }); }
['data', 'calc', 'core', 'guide'].forEach(function (name) { load('assets/js/' + name + '.js'); });
var D = context.window.Demo;
var register = D.register;
D.register = function (route, screen) { registered[route] = screen; register(route, screen); };
fs.readdirSync(path.join(root, 'assets/js/screens')).filter(function (name) { return name.endsWith('.js'); }).forEach(function (name) { load('assets/js/screens/' + name); });
D.toast = function (message) { toast = message; };
D.modal = function (title, content) { modal = { title: title, content: content }; };
D.confirm = async function (title, content, labels) { if (title === '出品前の最終確認') assert.strictEqual(labels.length, 3); return true; };
D.loading = async function (title, steps, duration) { assert(steps.length >= 2); assert(duration >= 500 && duration <= 1000); return true; };
function visit(route) { context.location.hash = '#/' + route; D.render(); }
function form(values, extras) { return Object.assign({ values: values, matches: function () { return true; }, reportValidity: function () { return true; } }, extras); }
function button(id, extras) { return Object.assign({ dataset: { id: id } }, extras); }
var count = 0;
async function test(name, run) { await run(); count += 1; console.log('PASS ' + name); }
(async function () {
  await test('yen formatting places the loss sign before the currency symbol', function () {
    assert.strictEqual(D.yen(-7167), '-¥7,167');
    assert.strictEqual(D.yen(2138), '¥2,138');
    assert.strictEqual(D.yen(-0.1), '¥0');
  });
  await test('all 14 screens render with an automation note and local initial data', function () {
    assert.strictEqual(Object.keys(registered).length, 14);
    Object.keys(registered).forEach(function (route) {
      var html = registered[route].render();
      assert(html.includes('real-note'), route);
      assert(!html.includes('undefined'), route);
    });
    assert.strictEqual(D.state.listings.length, 2);
    D.data.products.forEach(function (p) {
      assert(p.title.length <= 80);
      assert(p.description.split('\n').length >= 4 && p.description.split('\n').length <= 6);
    });
    assert.strictEqual(D.guide.index(), 0);
    assert(registered.summary.render().endsWith('<!-- CTA_PLACEHOLDER -->'));
  });
  await test('URL rejection and actual product acquisition', async function () {
    D.state.started = true; D.state.marketOpened = true;
    visit('products');
    node('import-url').value = '/market/item-9.html';
    await registered.products.submit({ target: { id: 'import-form' } });
    assert.strictEqual(D.state.products.length, 0);
    assert.strictEqual(D.state.urlInvalid, true);
    node('import-url').value = 'file:///demo/market/item-1.html';
    await registered.products.submit({ target: { id: 'import-form' } });
    assert.strictEqual(D.state.products.length, 1);
    assert.strictEqual(D.guide.index(), 3);
  });
  await test('AI processing, editable output, and result acknowledgement', async function () {
    await registered.products.click('ai-open', button('item-1'));
    registered.products.input({ target: { id: 'ai-instruction', value: '状態を詳しく説明', dataset: {} } });
    await registered.products.click('ai-run', button('item-1'));
    assert(D.state.products[0].processed);
    assert(D.state.products[0].title.length <= 80);
    assert(registered.products.render().includes('注意 · 1 件'));
    registered.products.input({ target: { dataset: { result: 'title' }, value: 'Edited Japanese Holo Card' } });
    assert.strictEqual(D.state.products[0].title, 'Edited Japanese Holo Card');
    await registered.products.click('review-result', button('item-1'));
    assert.strictEqual(D.guide.index(), 5);
  });
  await test('profit display and actual publish action use configured values', async function () {
    visit('profit');
    D.state.profitInputs['item-1'] = { sale: 160, cost: 14000, weight: 0.36, rate: 155, buyerShipping: 5, carrier: 'EMS' };
    assert(registered.profit.render().includes('手残りが最大'));
    visit('listings');
    await registered.listings.click('publish', button('item-1'));
    var own = D.state.listings.find(function (l) { return l.own; });
    assert(own);
    assert.strictEqual(own.sale, 160);
    assert.strictEqual(own.carrier, 'EMS');
    assert(modal.content.includes('Edited Japanese Holo Card'));
    visit('dashboard');
    assert.strictEqual(D.guide.index(), 8);
  });
  await test('inventory withdrawal preserves the participant listing and updates the dashboard', async function () {
    visit('monitor');
    await registered.monitor.click('sold-out', button('seed-1'));
    assert.strictEqual(D.state.listings[0].status, 'withdrawn');
    assert.strictEqual(D.state.listings.find(function (l) { return l.own; }).status, 'live');
    assert(registered.dashboard.render().includes('仕入れ元が売り切れ'));
    assert.strictEqual(D.guide.index(), 9);
  });
  await test('purchase creates exactly one order, buyer message and report row', async function () {
    visit('orders');
    var own = D.state.listings.find(function (l) { return l.own; });
    await registered.orders.click('buy', button(own.id));
    await registered.orders.click('buy', button(own.id));
    assert.strictEqual(D.state.orders.length, 1);
    assert.strictEqual(D.state.messages.length, 1);
    assert.strictEqual(D.state.report.length, 4);
    assert.strictEqual(D.state.orders[0].sale, 160);
    assert.strictEqual(D.state.orders[0].buyerShipping, 5);
    assert.strictEqual(D.state.messages[0].read, false);
  });
  await test('shipment registration changes status and creates a shipping record', function () {
    var order = D.state.orders[0];
    registered.orders.submit({ target: form({ tracking: 'DEMO-TRACK-TEST', carrier: 'DHL' }, { dataset: { id: order.id } }) });
    assert.strictEqual(order.status, 'shipped');
    assert.strictEqual(D.state.shipping.length, 4);
    assert.strictEqual(D.state.shipping[3].actual - D.state.shipping[3].estimate, 240);
    assert.strictEqual(D.guide.index(), 10);
  });
  await test('tracking examples avoid already-used numbers', async function () {
    var field = {}, shippingForm = { dataset: { id: D.state.orders[0].id }, querySelector: function () { return field; } };
    D.state.shipping.push({ tracking: 'DEMO-TRACK-101', carrier: 'EMS', estimate: 1, actual: 1 });
    await registered.orders.click('tracking-example', { closest: function () { return shippingForm; } });
    assert.strictEqual(field.value, 'DEMO-TRACK-102');
    D.state.shipping.pop();
  });
  await test('AI reply reflects shipment and saves the edited response', async function () {
    visit('messages'); var m = D.state.messages[0];
    await registered.messages.click('translate', button(m.id));
    assert(m.translated && m.read);
    await registered.messages.click('reply-ai', button(m.id));
    assert(m.draft.includes('has been shipped'));
    assert(m.draft.includes('DEMO-TRACK-TEST'));
    await registered.messages.submit({ target: form({ reply: m.draft + ' Thank you!' }, { dataset: { id: m.id } }) });
    assert(m.sent.endsWith('Thank you!'));
    assert.strictEqual(m.draft, '');
    assert.strictEqual(D.guide.index(), 11);
  });
  await test('price changes leave existing order prices untouched, then offers advance the guide', async function () {
    visit('watchers');
    var own = D.state.listings.find(function (l) { return l.own; });
    registered.watchers.submit({ target: form({ sale: '150' }, { dataset: { id: own.id } }) });
    assert.strictEqual(own.sale, 150);
    assert.strictEqual(D.state.orders[0].sale, 160);
    visit('offers');
    await registered.offers.submit({ target: form({ discount: '10' }, { dataset: { id: 'seed-2' } }) });
    assert.strictEqual(D.state.offers.length, 1);
    assert.strictEqual(D.state.offers[0].sale, 162);
    assert.strictEqual(D.guide.index(), 12);
  });
  await test('templates support creation, pause, resume, deletion and final guide progress', async function () {
    visit('auto-list');
    registered['auto-list'].submit({ target: form({ category: 'トレカ', frequency: '毎週', time: '10:30', count: '3' }, { id: 'auto-form' }) });
    var t = D.state.templates[0];
    await registered['auto-list'].click('toggle', button(t.id)); assert(t.paused);
    await registered['auto-list'].click('toggle', button(t.id)); assert(!t.paused);
    await registered['auto-list'].click('delete', button(t.id)); assert.strictEqual(D.state.templates.length, 0);
    assert.strictEqual(D.guide.index(), 13);
    visit('profit-report'); visit('shipping');
    assert.strictEqual(D.guide.index(), 14);
    registered.shipping.change({ target: { id: 'shipping-filter', value: 'DHL' } });
    assert(registered.shipping.render().includes('DEMO-TRACK-TEST'));
    assert(!registered.shipping.render().includes('DEMO-TRACK-001'));
    assert(registered.summary.render().includes('✓ 体験済み'));
  });
  await test('bag is blocked by the publish handler itself, even after AI processing', async function () {
    visit('products'); node('import-url').value = '/market/item-3.html';
    await registered.products.submit({ target: { id: 'import-form' } });
    await registered.products.click('ai-open', button('item-3'));
    await registered.products.click('ai-run', button('item-3'));
    assert(registered.products.render().includes('この商品は出せません'));
    visit('listings'); var before = D.state.listings.length;
    await registered.listings.click('publish', button('item-3'));
    assert.strictEqual(D.state.listings.length, before);
    assert(modal.content.includes('この商品は出せません'));
  });
  await test('search filters, CSV stub, local persistence and memory fallback', function () {
    visit('monitor');
    registered.monitor.submit({ target: form({ keyword: 'カメラ', min: '0', max: '20000' }, { id: 'monitor-search' }) });
    assert(registered.monitor.render().includes('条件に合う 1 件'));
    registered['profit-report'].click('csv', button(''));
    assert.strictEqual(toast, '体験版ではダウンロードしません');
    D.save(); var saved = JSON.parse(storage['ebase-autopilot-demo-v1']);
    assert.strictEqual(saved.orders.length, 1);
    assert.strictEqual(saved.events.replied, true);
    storageBlocked = true;
    assert.doesNotThrow(function () { D.save(); });
    assert.strictEqual(D.state.orders.length, 1);
    load('assets/js/core.js');
    assert.strictEqual(D.state.listings.length, 2);
    assert.strictEqual(D.state.orders.length, 0);
  });
  console.log('\n' + count + ' workflow checks passed (no browser rendering).');
}()).catch(function (error) { console.error(error); process.exitCode = 1; });
