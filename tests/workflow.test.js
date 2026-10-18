'use strict';
// These checks execute actual screen handlers without rendering in a browser.
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var root = path.resolve(__dirname, '..');
var hashListeners = [];
var nodes = {}, storage = {}, storageBlocked = false, registered = {}, modal, toast;
function node(id) {
  if (!nodes[id]) nodes[id] = { innerHTML: '', textContent: '', value: '', attributes: {}, matches: function () { return false; }, setAttribute: function (key, value) { this.attributes[key] = value; }, focus: function () { this.focused = true; }, scrollIntoView: function (options) { this.scrolled = options; }, addEventListener: function (type, callback) { this[type] = callback; }, classList: { add: function () {}, remove: function () {} } };
  return nodes[id];
}
var context = vm.createContext({
  window: { requestAnimationFrame: function () {}, addEventListener: function (type, callback) { if (type === 'hashchange') hashListeners.push(callback); } }, URL: URL, console: console, setTimeout: setTimeout, clearTimeout: clearTimeout,
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
['config', 'products-data', 'calc', 'data', 'theme', 'workflow', 'core', 'guide'].forEach(function (name) { load('assets/js/' + name + '.js'); });
var D = context.window.Demo;
D.go = function (route) { context.location.hash = '#/' + route; D.render(); var callbacks = hashListeners.splice(0); callbacks.forEach(function (callback) { callback(); }); };
var register = D.register;
D.register = function (route, screen) { registered[route] = screen; register(route, screen); };
fs.readdirSync(path.join(root, 'assets/js/screens')).filter(function (name) { return name.endsWith('.js'); }).forEach(function (name) { load('assets/js/screens/' + name); });
D.toast = function (message) { toast = message; };
D.modal = function (title, content) { modal = { title: title, content: content }; };
var confirmations = [];
D.confirm = async function (title) { confirmations.push(title); return true; };
D.loading = async function (title, steps, duration) { assert(steps.length >= 2); assert(duration >= 500 && duration <= 1000); return true; };
function visit(route) { context.location.hash = '#/' + route; D.render(); }
function form(values, extras) { return Object.assign({ values: values, matches: function () { return true; }, reportValidity: function () { return true; } }, extras); }
function button(id, extras) { return Object.assign({ dataset: { id: id } }, extras); }
// Reduce innermost disclosures first so nested closed details cannot leak text.
function visibleMarkup(html) {
  while (/<details\b/.test(html)) {
    html = html.replace(/<details\b([^>]*)>((?:(?!<details\b)[\s\S])*?)<\/details>/g, function (_, attributes, body) {
      if (/\bopen(?:\s|=|$)/.test(attributes)) return body;
      assert(!/<(?:dt|td|dd)\b[^>]*>[^<]*見込み利益/.test(body), 'Profit rows must not be collapsed');
      assert(!body.includes('赤字'), 'Loss badges must not be collapsed');
      return '';
    });
  }
  return html;
}
function visibleText(html) { return visibleMarkup(html).replace(/<[^>]*>/g, ' '); }
var count = 0;
async function test(name, run) { await run(); count += 1; console.log('PASS ' + name); }
(async function () {
  await test('yen formatting places the loss sign before the currency symbol', function () {
    assert.strictEqual(D.yen(-7167), '-¥7,167');
    assert.strictEqual(D.yen(2138), '¥2,138');
    assert.strictEqual(D.yen(-0.1), '¥0');
  });
  await test('all 16 screens render with an automation note and local initial data', function () {
    assert.strictEqual(Object.keys(registered).length, 16);
    Object.keys(registered).forEach(function (route) {
      var html = registered[route].render();
      assert(html.includes('real-note'), route);
      assert(!html.includes('undefined'), route);
    });
    assert.strictEqual(D.state.listings.length, 5);
    assert.strictEqual(D.state.orders.length, 5);
    [D.state.listings, D.state.orders].forEach(function (rows) { assert.strictEqual(new Set(rows.map(function (r) { return D.product(r.productId).name; })).size, rows.length); });
    assert.strictEqual(D.state.messages.length, 3);
    assert.strictEqual(D.state.templates.length, 2);
    assert.strictEqual(D.state.shipping.length, 8);
    assert.strictEqual(D.state.report.length, 4);
    assert.strictEqual(D.live().reduce(function (n, l) { return n + l.watchers; }, 0), 87);
    assert.strictEqual(D.state.products.length, 0);
    assert.strictEqual((registered.watchers.render().match(/<tr>/g) || []).length, 7);
    assert.strictEqual(D.guide.index(), 0);
    assert(registered.summary.render().endsWith('<!-- CTA_PLACEHOLDER -->'));
    var summary = registered.summary.render();
    assert.strictEqual((summary.match(/○ 未体験/g) || []).length, (summary.match(/<a href=/g) || []).length);
    assert(summary.includes('href="#/profit-report"'));
    assert(registered.monitor.render().includes('おすすめ'));
    assert(registered.listings.render().includes('おすすめ'));
  });
  await test('URL rejection and actual product acquisition', async function () {
    D.state.started = true; D.state.marketOpened = true;
    visit('products');
    node('import-url').value = '/items/unknown.html';
    await registered.products.submit({ target: { id: 'import-form' } });
    assert.strictEqual(D.state.products.length, 0);
    assert.strictEqual(D.state.urlInvalid, true);
    assert(registered.products.render().includes('value="/items/unknown.html"'));
    assert(registered.products.render().includes('このURLは体験版では使えません。下の商品から選んでください'));
    node('import-url').value = '';
    await registered.products.submit({ target: { id: 'import-form' } });
    assert(registered.products.render().includes('URLを貼り付けてください'));
    assert(registered.products.render().includes('novalidate'));
    node('import-url').value = 'file:///demo/items/holo-card.html';
    await registered.products.submit({ target: { id: 'import-form' } });
    assert.strictEqual(D.state.products.length, 1);
    assert.strictEqual(context.location.hash, '#/ai-process/holo-card');
    assert(D.state.products[0].processed);
    assert.strictEqual(D.guide.index(), 3);
  });
  await test('AI processing, editable output, and next-screen guide advance', async function () {
    await registered.products.click('ai-open', button('holo-card'));
    registered['ai-process'].input({ target: { id: 'ai-instruction', value: '状態を詳しく説明', dataset: {} } });
    await registered['ai-process'].click('ai-run', button('holo-card'));
    assert(D.state.products[0].processed);
    assert(D.state.products[0].title.length <= 80);
    assert(registered['ai-process'].render().includes('食い違い'));
    var resultHtml = registered['ai-process'].render();
    assert(resultHtml.includes('class="primary" data-action="to-profit"'));
    [resultHtml, registered.profit.render()].forEach(function (html) {
      var visible = visibleMarkup(html);
      assert(visible.includes('class="formula"'));
      assert(!visible.includes('13.25%') && !visible.includes('round('));
    });
    registered['ai-process'].input({ target: { dataset: { result: 'title' }, value: 'Edited Japanese Holo Card' } });
    assert.strictEqual(D.state.products[0].title, 'Edited Japanese Holo Card');
    assert(!registered['ai-process'].render().includes('review-result'));
    await registered['ai-process'].click('to-profit', button('holo-card'));
    assert.strictEqual(context.location.hash, '#/profit');
    assert.strictEqual(D.guide.index(), 4);
  });
  await test('profit display and actual publish action use configured values', async function () {
    visit('profit');
    assert.strictEqual(D.guide.index(), 4, 'Opening profit alone does not skip the comparison');
    registered.profit.click('to-listings');
    assert.strictEqual(D.guide.index(), 5);
    D.state.profitInputs['holo-card'] = { sale: 160, cost: 14000, weight: 0.36, rate: 155, buyerShipping: 5, carrier: 'EMS' };
    var comparison = registered.profit.render();
    assert(comparison.includes('手残り(例)'));
    assert(!comparison.includes('手残りが最大'));
    var rows = comparison.match(/<tr><th scope="row">[\s\S]*?<\/tr>/g);
    assert.strictEqual(rows.filter(function (row) { return row.includes('>最安</span>'); }).length, 1);
    assert(rows[0].includes('SpeedPAK') && rows[0].includes('>最安</span>'));
    assert(!rows[1].includes('>最安</span>'), 'Selected EMS does not get cheapest badge');
    var shippingRates = context.window.DemoCalc.shippingRates;
    context.window.DemoCalc.shippingRates = function () { return [{ carrier: 'EMS', price: 5000 }, { carrier: 'DHL', price: 2000 }]; };
    var changedRows = registered.profit.render().match(/<tr><th scope="row">[\s\S]*?<\/tr>/g);
    assert(!changedRows[0].includes('>最安</span>'));
    assert(changedRows[1].includes('>最安</span>'), 'Badge follows cheapest quote even when not first');
    context.window.DemoCalc.shippingRates = shippingRates;
    D.state.events.profitCompared = false;
    node('profit-form').checkValidity = function () { return true; };
    node('profit-form').values = { sale: 160, cost: 14000, weight: 0.36, rate: 155, buyerShipping: 5, carrier: 'EMS' };
    registered.profit.change({ target: { name: 'carrier', closest: function () { return node('profit-form'); } } });
    assert.strictEqual(D.state.events.profitCompared, true);
    assert.strictEqual(D.state.profitInputs['holo-card'].carrier, 'EMS');
    visit('listings');
    await registered.listings.click('publish', button('holo-card'));
    var own = D.state.listings.find(function (l) { return l.own; });
    assert(own);
    assert.strictEqual(own.sale, 160);
    assert.strictEqual(own.carrier, 'EMS');
    assert(modal.content.includes('Edited Japanese Holo Card'));
    visit('dashboard');
    assert.strictEqual(D.guide.index(), 7);
  });
  await test('inventory withdrawal preserves the participant listing and updates the dashboard', async function () {
    visit('monitor');
    await registered.monitor.click('sold-out', button('seed-1'));
    assert.strictEqual(D.state.listings[0].status, 'withdrawn');
    assert.strictEqual(D.state.listings.find(function (l) { return l.own; }).status, 'live');
    assert(registered.dashboard.render().includes('仕入れ元が売り切れ'));
    assert.strictEqual(D.guide.index(), 8);
  });
  await test('purchase creates exactly one order, buyer message and report row', async function () {
    visit('orders');
    var own = D.state.listings.find(function (l) { return l.own; });
    await registered.orders.click('buy', button(own.id));
    await registered.orders.click('buy', button(own.id));
    assert.strictEqual(D.state.orders.length, 6);
    assert.strictEqual(D.state.messages.length, 4);
    assert.strictEqual(D.state.report.length, 5);
    assert.strictEqual(D.state.orders[5].sale, 160);
    assert.strictEqual(D.state.orders[5].buyerShipping, 5);
    assert.strictEqual(D.state.messages[3].read, false);
    assert(node('order-' + D.state.orders[5].id).scrolled);
    assert(node('order-' + D.state.orders[5].id).focused);
  });
  await test('shipment registration changes status and creates a shipping record', function () {
    var order = D.state.orders[5];
    var invalidForm = form({ tracking: '日本語の番号', carrier: 'DHL' }, { dataset: { id: order.id }, querySelector: function () { return node('tracking-input'); } });
    registered.orders.submit({ target: invalidForm });
    assert.strictEqual(order.status, 'pending');
    assert.strictEqual(node('tracking-error-' + order.id).textContent, '英数字とハイフンで4〜40文字');
    var pattern = registered.orders.render().match(/pattern="([^"]+)"/)[1];
    var regex = new RegExp('^(?:' + pattern + ')$', 'v');
    assert(regex.test('DEMO-TRACK-TEST')); assert(!regex.test('日本語の番号'));
    registered.orders.submit({ target: form({ tracking: 'DEMO-TRACK-TEST', carrier: 'DHL' }, { dataset: { id: order.id } }) });
    assert.strictEqual(order.status, 'shipped');
    assert.strictEqual(D.state.shipping.length, 9);
    assert.strictEqual(D.state.shipping[8].actual - D.state.shipping[8].estimate, 240);
    assert.strictEqual(D.guide.index(), 9);
  });
  await test('tracking examples avoid already-used numbers', async function () {
    var field = {}, shippingForm = { dataset: { id: D.state.orders[5].id }, querySelector: function () { return field; } };
    D.state.shipping.push({ tracking: 'DEMO-TRACK-106', carrier: 'EMS', estimate: 1, actual: 1 });
    await registered.orders.click('tracking-example', { closest: function () { return shippingForm; } });
    assert.strictEqual(field.value, 'DEMO-TRACK-107');
    D.state.shipping.pop();
  });
  await test('AI reply reflects shipment and saves the edited response', async function () {
    visit('messages'); var m = D.state.messages[3];
    await registered.messages.click('translate', button(m.id));
    assert(m.translated && m.read);
    await registered.messages.click('reply-ai', button(m.id));
    assert(m.draft.includes('has been shipped'));
    assert(m.draft.includes('DEMO-TRACK-TEST'));
    await registered.messages.submit({ target: form({ reply: m.draft + ' Thank you!' }, { dataset: { id: m.id } }) });
    assert(m.sent.endsWith('Thank you!'));
    assert.strictEqual(m.draft, '');
    assert.strictEqual(D.guide.index(), 10);
  });
  await test('price changes leave existing order prices untouched, then offers advance the guide', async function () {
    visit('watchers');
    var own = D.state.listings.find(function (l) { return l.id === 'seed-2'; });
    registered.watchers.submit({ target: form({ sale: '150' }, { dataset: { id: own.id } }) });
    assert.strictEqual(own.sale, 150);
    assert.strictEqual(D.state.orders[5].sale, 160);
    visit('offers');
    await registered.offers.submit({ target: form({ discount: '10' }, { dataset: { id: 'seed-2' } }) });
    assert.strictEqual(D.state.offers.length, 1);
    assert.strictEqual(D.state.offers[0].sale, 135);
    assert.strictEqual(D.guide.index(), 10);
  });
  await test('templates support creation, pause, resume, deletion and final guide progress', async function () {
    visit('auto-list');
    registered['auto-list'].submit({ target: form({ category: 'トレカ', frequency: '毎週', time: '10:30', count: '3' }, { id: 'auto-form' }) });
    var t = D.state.templates[2];
    await registered['auto-list'].click('toggle', button(t.id)); assert(t.paused);
    await registered['auto-list'].click('toggle', button(t.id)); assert(!t.paused);
    await registered['auto-list'].click('delete', button(t.id)); assert.strictEqual(D.state.templates.length, 2);
    assert.strictEqual(D.guide.index(), 11);
    visit('profit-report');
    assert.strictEqual(D.guide.index(), 11);
    node('shipping-section').open = true; node('shipping-section').toggle();
    visit('shipping');
    assert.strictEqual(D.guide.index(), 12);
    registered.shipping.change({ target: { id: 'shipping-filter', value: 'DHL' } });
    assert(registered.shipping.render().includes('DEMO-TRACK-TEST'));
    assert(!registered.shipping.render().includes('DEMO-TRACK-001'));
    assert(registered.summary.render().includes('✓ 体験済み'));
  });
  await test('bag publishes directly after AI processing', async function () {
    visit('products'); node('import-url').value = '/items/shoulder-bag.html';
    await registered.products.submit({ target: { id: 'import-form' } });
    assert(registered['ai-process'].render().includes('要修正・注意はありません'));
    visit('listings'); var before = D.state.listings.length, count = confirmations.length;
    await registered.listings.click('publish', button('shoulder-bag'));
    assert.strictEqual(D.state.listings.length, before + 1);
    assert.strictEqual(confirmations.length, count);
  });
  await test('auto loss completes and publishes; invalid edits are still rejected', async function () {
    await context.window.DemoWorkflow.acquire(D.state, 'figure-large', 'auto', {});
    var item = D.state.products.find(function (it) { return it.id === 'figure-large'; });
    var product = D.product('figure-large');
    assert(item.ready && item.net < 0);
    visit('ai-process/figure-large');
    var aiHtml = registered['ai-process'].render();
    assert(aiHtml.includes('要修正・注意はありません'));
    ['仕入値(USD)', '送料(USD)', 'eBay手数料', '出品価格', '見込み利益', '見込み利益率', '⚠ 赤字'].forEach(function (label) { assert(aiHtml.includes(label), label); });
    var priceHtml = registered.products.render();
    assert(priceHtml.includes('全自動が完了しました:'));
    assert(priceHtml.includes('⚠ 赤字'));
    assert(!priceHtml.includes('先へ進む'));
    assert(registered.profit.render().includes('⚠ 純損失'));
    var before = D.state.listings.length;
    registered['ai-process'].input({ target: { dataset: { result: 'title' }, value: 'A'.repeat(81) } });
    assert(registered['ai-process'].render().includes('要修正(1件)'));
    await registered.listings.click('publish', button('figure-large'));
    assert.strictEqual(D.state.listings.length, before);
    assert(toast.includes('1〜80'));
    registered['ai-process'].input({ target: { dataset: { result: 'title' }, value: product.ai.titleEn } });
    assert(node('title-validation').innerHTML.includes('要修正・注意はありません'));
    registered['ai-process'].input({ target: { dataset: { result: 'category' }, value: '' } });
    await registered.listings.click('publish', button('figure-large'));
    assert.strictEqual(D.state.listings.length, before);
    assert(registered['ai-process'].render().includes('必須項目が空'));
    registered['ai-process'].input({ target: { dataset: { result: 'category' }, value: product.ai.category } });
    var count = confirmations.length;
    await registered.listings.click('publish', button('figure-large'));
    assert.strictEqual(D.state.listings.length, before + 1);
    assert.strictEqual(confirmations.length, count);
  });
  await test('v3 sidebar, tabs, parent highlighting and shipping disclosure', function () {
    var state = D.state; D.state = D.initialState();
    visit('dashboard');
    var navigation = node('navigation').innerHTML;
    assert.deepStrictEqual(Array.from(navigation.matchAll(/<summary>(.*?)<\/summary>/g), function (m) { return m[1]; }), ['仕入れ・出品', '販売・利益', '成長', 'サポート']);
    assert.deepStrictEqual(Array.from(navigation.matchAll(/<a[^>]*>([^<]*)/g), function (m) { return m[1]; }), ['ダッシュボード', 'AI出品', '出品管理', 'その他出品', '販売・収益', '利益計算', 'マーケティング', 'メッセージ']);
    ['在庫監視', '注文管理', '収益管理', '送料管理', 'ウォッチャー分析', 'オファー', '自動出品設定'].forEach(function (label) { assert(!navigation.includes(label)); });
    [['auto-list', 'manual-list', 'その他出品'], ['profit-report', 'orders', '販売・収益'], ['shipping', 'orders', '販売・収益'], ['offers', 'watchers', 'マーケティング'], ['monitor', 'listings', '出品管理'], ['ai-process/holo-card', 'products', 'AI出品']].forEach(function (entry) {
      visit(entry[0]);
      assert(node('navigation').innerHTML.includes('aria-current="page" href="#/' + entry[1] + '">' + entry[2]));
    });
    [['manual-list', '手動出品', '自動出品設定'], ['orders', '注文', '収益'], ['watchers', 'ウォッチャー分析', 'オファー']].forEach(function (entry) {
      visit(entry[0]); var tabs = node('main').innerHTML.match(/<nav class="page-tabs"[\s\S]*?<\/nav>/)[0];
      assert(tabs.includes(entry[1]) && tabs.includes(entry[2]));
      assert(tabs.includes('aria-current="page"'));
    });
    visit('profit-report');
    assert(node('main').innerHTML.includes('<details id="shipping-section" class="card section">'));
    node('shipping-section').open = true; node('shipping-section').toggle();
    assert(D.state.shippingOpen && D.state.events.shippingSeen);
    registered['profit-report'].change({ target: { id: 'shipping-filter', value: 'EMS' } });
    assert(!D.shippingContent().includes('DEMO-PAST-0'));
    assert(D.shippingContent().includes('DEMO-PAST-1'));
    visit('shipping');
    assert(node('main').innerHTML.includes('<details id="shipping-section" class="card section" open>'));
    assert(node('main').innerHTML.includes('href="#/profit-report" aria-current="page"'));
    assert(D.state.events.reportSeen);
    D.state = state;
  });
  await test('priority types, severity ordering, thresholds and all list filters', async function () {
    var state = D.state; D.state = D.initialState();
    var W = context.window.DemoWorkflow;
    for (var p of D.data.products) await W.acquire(D.state, p.id, 'normal', {});
    D.state.products[0].title = 'A'.repeat(81);
    D.state.products[1].processed = false; D.state.products[1].aiError = true;
    D.state.products[2].processed = false;
    D.state.products[3].priceSet = true;
    D.state.listings[0].source = 'soldout'; D.state.listings[0].status = 'withdrawn';
    D.state.listings[1].source = 'deleted'; D.state.listings[1].status = 'withdrawn';
    D.state.listings[2].status = 'error';
    var priorities = D.priorities();
    assert.deepStrictEqual(Array.from(priorities, function (p) { return p.title; }).sort(), ['出品エラー', '仕入れ元が売り切れ・削除', '発送待ちの注文', '出品待ち', '値下げ候補', '価格設定待ち', 'AI処理待ち'].sort());
    assert(!registered.dashboard.render().includes('メッセージ未読'));
    assert.strictEqual(priorities.find(function (p) { return p.filter === 'errors'; }).count, 3);
    function sorted(rows) { rows.forEach(function (p, i) { if (i) assert(rows[i - 1].severity < p.severity || (rows[i - 1].severity === p.severity && rows[i - 1].count >= p.count)); }); }
    sorted(priorities);
    assert.strictEqual(priorities.find(function (p) { return p.filter === 'pending'; }).severity, 1);
    D.state.orders.forEach(function (o) { o.status = 'pending'; });
    assert.strictEqual(D.priorities().find(function (p) { return p.filter === 'pending'; }).severity, 0);
    sorted(D.priorities());
    D.state.dateFilter = 'yesterday';
    priorities.forEach(function (p) {
      visit(p.route + '?filter=' + p.filter);
      assert.strictEqual(D.route, p.route); assert.strictEqual(D.filter, p.filter);
      var html = node('main').innerHTML;
      assert(html.includes('絞り込み: ' + p.title));
      var rows = p.filter === 'markdown' ? (html.match(/data-price-form/g) || []).length : p.filter === 'pending' ? (html.match(/data-shipping-form/g) || []).length : p.filter === 'unavailable' ? (html.match(/<article\b/g) || []).length : p.filter === 'ai-pending' ? (html.match(/class="card product-row"/g) || []).length : (html.match(/<article\b/g) || []).length;
      assert.strictEqual(rows, p.filter === 'pending' ? 5 : p.count, p.filter);
      assert(html.includes('href="#/' + p.route + '">すべて表示'));
    });
    D.state.products = []; D.state.listings = []; D.state.orders = [];
    assert.strictEqual(D.priorities().length, 0);
    assert(registered.dashboard.render().includes('今日やることはありません'));
    D.state = state;
  });
  await test('profit rows and loss badges are visible with disclosures closed', async function () {
    var state = D.state; D.state = D.initialState();
    for (var id of ['figure-large', 'film-camera']) {
      await context.window.DemoWorkflow.acquire(D.state, id, 'normal', {});
      D.state.events.priceSeen = false;
      visit('ai-process/' + id);
      var html = node('main').innerHTML, text = visibleText(html);
      ['仕入値(USD)', '送料(USD)', 'eBay手数料', '出品価格', '見込み利益', '見込み利益率'].forEach(function (label) { assert(text.includes(label), label); });
      assert.strictEqual(text.includes('⚠ 赤字'), id === 'figure-large');
      assert(html.includes('<details class="calculation-details"><summary>計算の式を見る</summary>'));
      assert(!text.includes('round(') && !text.includes('13.25%'));
      assert(html.includes('</section><div class="row price-actions"><button class="primary" data-action="to-profit">'));
      var p = D.product(id), shipping = Math.round(2900 + 2100 * p.weightKg);
      var expected = Math.round((p.sale - (p.sale * 0.146 + 0.40)) * 155 - shipping - p.cost);
      assert(text.includes(D.usd(expected / 155) + ' / ' + D.yen(expected)));
      visit('profit');
      text = visibleText(node('main').innerHTML);
      assert(text.includes(D.yen(expected)));
      assert(text.includes(id === 'figure-large' ? '⚠ 純損失' : '純利益'));
      assert.strictEqual(text.includes('⚠ 赤字'), id === 'figure-large');
      assert(!text.includes('round(') && !text.includes('13.25%'));
    }
    visit('profit-report');
    var reportHtml = node('main').innerHTML;
    D.state.report.forEach(function (row) {
      var rowHtml = reportHtml.match(new RegExp('<tr data-report-row="' + row.id + '">[\\s\\S]*?</tr>'))[0];
      var text = visibleText(reportHtml), rowText = visibleText(rowHtml);
      var net = context.window.DemoCalc.calcProfit(row).net;
      assert(text.includes(D.yen(net)));
      assert.strictEqual(rowText.includes('⚠ 赤字'), net < 0);
    });
    assert(visibleText(reportHtml).includes('⚠ 赤字'));
    D.state = state;
  });
  await test('image-only modal, numerical pricing and direct publishing for all six products', async function () {
    var state = D.state; D.state = D.initialState();
    for (var p of D.data.products) {
      await context.window.DemoWorkflow.acquire(D.state, p.id, 'auto', {});
      visit('ai-process/' + p.id);
      var html = node('main').innerHTML, shipping = Math.round(2900 + 2100 * p.weightKg);
      var expected = Math.round((p.sale - (p.sale * 0.146 + 0.40)) * 155 - shipping - p.cost);
      assert(html.includes(D.usd(p.cost / 155) + ' / ' + D.yen(p.cost)));
      assert(html.includes(D.usd(shipping / 155) + ' / ' + D.yen(shipping)));
      assert(html.includes(D.usd(expected / 155) + ' / ' + D.yen(expected)));
      assert(html.includes((expected / (p.sale * 155) * 100).toFixed(1) + '%'));
      var count = confirmations.length;
      await registered.listings.click('publish', button(p.id));
      assert(D.state.listings.some(function (l) { return l.own && l.productId === p.id && l.status === 'live'; }));
      assert.strictEqual(confirmations.length, count);
    }
    visit('offers');
    var figure = D.state.listings.find(function (l) { return l.own && l.productId === 'figure-large'; });
    var confirmationsBeforeOffer = confirmations.length;
    await registered.offers.submit({ target: form({ discount: '20' }, { dataset: { id: figure.id } }) });
    assert.strictEqual(D.state.offers.length, 1);
    assert.strictEqual(confirmations.length, confirmationsBeforeOffer);
    visit('products');
    assert(!node('main').innerHTML.includes('>詳細</button>'));
    await registered.products.click('images', button('holo-card'));
    assert.strictEqual(modal.title, '商品画像');
    assert.strictEqual((modal.content.match(/data-gallery=/g) || []).length, 4);
    assert(!modal.content.includes('<table>'));
    D.product('holo-card').images.forEach(function (img) { assert(modal.content.includes(D.esc(img.caption))); });
    visit('profit');
    ['送料(円)', '送料(USD)', '備考', '手残り', '収入', '控除'].forEach(function (label) { assert(node('main').innerHTML.includes(label)); });
    D.state = state;
  });
  await test('search filters, CSV stub, local persistence and memory fallback', function () {
    visit('monitor');
    registered.monitor.submit({ target: form({ keyword: 'ニコラ', min: '0', max: '30000' }, { id: 'monitor-search' }) });
    assert(registered.monitor.render().includes('監視条件に一致する見本: 1 件'));
    registered['profit-report'].click('csv', button(''));
    assert.strictEqual(toast, '体験版ではダウンロードしません');
    D.save(); var saved = JSON.parse(storage['ebase-autopilot-demo-v3']);
    assert.strictEqual(saved.orders.length, 6);
    assert.strictEqual(saved.events.replied, true);
    storageBlocked = true;
    assert.doesNotThrow(function () { D.save(); });
    assert.strictEqual(D.state.orders.length, 6);
    load('assets/js/core.js');
    assert.strictEqual(D.state.listings.length, 5);
    assert.strictEqual(D.state.orders.length, 5);
  });
  console.log('\n' + count + ' workflow checks passed (no browser rendering).');
}()).catch(function (error) { console.error(error); process.exitCode = 1; });
