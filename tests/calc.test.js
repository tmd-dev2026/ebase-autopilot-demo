'use strict';
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var C = require('../assets/js/calc.js');
var count = 0;
function test(name, run) {
  try { run(); count += 1; console.log('PASS ' + name); }
  catch (error) { console.error('FAIL ' + name); throw error; }
}
test('specified profit formula, including a separately specified shipping input', function () {
  var expected = Math.round((150 - (150 * (0.1325 + 0.0135) + 0.40)) * 155 - 3654 - 14000);
  var actual = C.calcProfit({ sale: 150, rate: 155, shipping: 3654, cost: 14000 });
  assert.strictEqual(actual.net, expected);
  assert.strictEqual(actual.net, 2140);
  assert.strictEqual(actual.feeUsd, 22.3);
});
test('buyer-paid shipping is included in the fee base and gross revenue', function () {
  var result = C.calcProfit({ sale: 150, buyerShipping: 10, rate: 155, shipping: 3656, cost: 14000 });
  assert.strictEqual(result.gross, 160);
  assert.strictEqual(result.net, Math.round((160 - (160 * 0.146 + 0.40)) * 155 - 3656 - 14000));
});
test('past-order large figure results in a loss', function () {
  assert.strictEqual(C.calcProfit({ sale: 40, cost: 3700, rate: 155, shipping: 8700 }).net, -7167);
});
test('shipping formulas and rounding', function () {
  var rates = C.shippingRates(0.36);
  assert.deepStrictEqual(rates, [{ carrier: 'SpeedPAK', price: 3656 }, { carrier: 'EMS', price: 4308 }, { carrier: 'DHL', price: 5316 }]);
  assert.strictEqual(C.shippingRates(1.25)[0].price, 5525);
});
test('domestic shipping and advertising costs reduce net profit', function () {
  var base = { sale: 180, rate: 155, shipping: 5525, cost: 11000 };
  assert.strictEqual(C.calcProfit(Object.assign({}, base, { domestic: 400, ads: 800 })).net, C.calcProfit(base).net - 1200);
});
test('invalid numeric inputs are rejected', function () {
  [-1, NaN, Infinity, 'not-a-number'].forEach(function (value) {
    assert.throws(function () { C.shippingRates(value); }, RangeError);
    assert.throws(function () { C.calcProfit({ sale: value }); }, RangeError);
  });
});
test('only the three supported demo URL paths match', function () {
  [
    ['https://example.com/market/item-2.html?x=1#y', 'item-2'],
    ['https://example.com/market/item-1', 'item-1'],
    ['https://example.com/market/item-2/', 'item-2'],
    ['  https://example.com/market/item-3.html/  ', 'item-3'],
    ['/market/item-1.html?query=value#hash', 'item-1'],
    ['  /market/item-2/  ', 'item-2'],
    ['商品はこちら https://example.com/demo/market/item-1.html 続き', 'item-1'],
    ['file:///demo/market/item-2.html', 'item-2'],
    ['file:///demo/market/item-3.html?x=1#y', 'item-3']
  ].forEach(function (example) { assert.strictEqual(C.matchDemoUrl(example[0]), example[1], example[0]); });
});
test('unsupported and executable URLs are actually rejected', function () {
  ['https://www.example.jp/item/m123456', '/market/item-4.html', '', '   ', 'javascript:alert(1)',
    'javascript:alert(1)//market/item-1.html', 'data:text/plain,/market/item-1.html',
    '/market/item-1.html/extra', '/market/item-11.html', '/market/item-1.htmlx',
    'https://example.com/?next=/market/item-1.html', '/market/item-2.php', '//example.com/market/item-1.html', null, 123
  ].forEach(function (input) { assert.strictEqual(C.matchDemoUrl(input), null, String(input)); });
});
test('brand restriction really blocks the unverified bag', function () {
  var blocked = C.checkListable({ id: 'item-3', brandLogo: true, authenticityProof: false });
  assert.strictEqual(blocked.ok, false);
  assert(blocked.reasons.length >= 1);
  assert.strictEqual(C.checkListable({ id: 'item-1' }).ok, true);
  assert.strictEqual(C.checkListable({ id: 'item-2' }).ok, true);
  assert.strictEqual(C.checkListable({ id: 'other', brandLogo: true, authenticityProof: false }).ok, false);
  assert.strictEqual(C.checkListable({ id: 'other', brandLogo: true, authenticityProof: true }).ok, true);
});
var root = path.resolve(__dirname, '..');
function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(function (entry) {
    var full = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(full) : [full];
  });
}
var appFiles = [path.join(root, 'index.html')].concat(filesIn(path.join(root, 'market')), filesIn(path.join(root, 'assets')));
test('static guard: no external communication, brand names, logos, modules or secrets', function () {
  var banned = [
    /\bfetch\s*\(/i, /XMLHttpRequest/i, /WebSocket/i, /sendBeacon/i,
    /\b(?:import|export)\s+(?:\{|\*|default|[A-Za-z_$])/,
    /(?:src|href|srcset|poster|action)\s*=\s*["']\s*(?:https?:)?\/\//i,
    /url\(\s*["']?\s*(?:https?:)?\/\//i,
    /@import/i,
    /Pokemon|ポケモン|Canon|Gucci|Mercari|メルカリ|ヤフオク/i,
    /(?:src|href)\s*=\s*["'][^"']*ebay[^"']*\.(?:svg|png|jpg|jpeg|gif|webp)/i,
    /\b(?:api[_-]?key|password|secret[_-]?key|access[_-]?token)\s*[:=]/i,
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
    /必ず売れる|月\s*\d+\s*万円稼げる|\d+\s*人が使用中/
  ];
  appFiles.forEach(function (file) {
    var text = fs.readFileSync(file, 'utf8');
    banned.forEach(function (rule) { assert(!rule.test(text), path.relative(root, file) + ' violates ' + rule); });
    if (/\.(svg|png|jpg|jpeg|gif|webp)$/i.test(file)) assert(!/ebay/i.test(path.basename(file)), 'Logo-like image filename');
  });
});
test('all HTML files use local resources that exist and load classic deferred scripts', function () {
  appFiles.filter(function (file) { return file.endsWith('.html'); }).forEach(function (file) {
    var source = fs.readFileSync(file, 'utf8');
    assert(/name="viewport"/.test(source), file + ' has no viewport');
    var references = Array.from(source.matchAll(/(?:src|href)="([^"#][^"]*)"/g));
    references.forEach(function (match) {
      var target = match[1].split(/[?#]/)[0];
      assert(fs.existsSync(path.resolve(path.dirname(file), target)), file + ' missing resource ' + target);
    });
    Array.from(source.matchAll(/<script\b([^>]*)>/g)).forEach(function (match) {
      assert(/\bdefer\b/.test(match[1]), file + ' script must defer');
      assert(!/type="module"/.test(match[1]), file + ' module is not allowed');
    });
  });
});
console.log('\n' + count + ' tests passed. ' + appFiles.length + ' app files scanned.');
