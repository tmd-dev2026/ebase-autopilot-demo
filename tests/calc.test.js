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
var products = require('../assets/js/products-data.js').products;
test('six product URLs work across arbitrary hosts and path prefixes', function () {
  products.forEach(function (p) {
    ['https://arbitrary.example/prefix/items/' + p.slug + '.html?x=1#y', 'https://other.example/items/' + p.slug, ' /items/' + p.slug + '/ ', 'file:///demo/items/' + p.slug + '.html/', '商品はこちら https://any.example/path/items/' + p.slug + '.html 続き'].forEach(function (url) { assert.strictEqual(C.matchDemoUrl(url), p.id, url); });
  });
});
test('unsupported, old, unknown and executable URLs are actually rejected', function () {
  ['/market/item-1.html', '/items/unknown.html', 'https://www.example.jp/item/m123', '', ' ', 'javascript:alert(1)', 'javascript:alert(1)//items/holo-card.html', 'data:text/plain,/items/holo-card.html', '/items/holo-card.htmlx', '/items/holo-card/extra', 'https://example.test/?next=/items/holo-card.html', '//example.test/items/holo-card.html', null, 123].forEach(function (url) { assert.strictEqual(C.matchDemoUrl(url), null, String(url)); });
});
test('all six product profits match the explicit fee formula and the figure loses money', function () {
  products.forEach(function (p) {
    var shipping = Math.round(2900 + 2100 * p.weightKg);
    var expected = Math.round((p.sale - (p.sale * (0.1325 + 0.0135) + 0.40)) * 155 - shipping - p.cost);
    var actual = C.calcProfit({ sale: p.sale, cost: p.cost, rate: 155, shipping: shipping }).net;
    assert.strictEqual(actual, expected, p.id);
    if (p.id === 'figure-large') assert(actual < 0); else if (p.id !== 'shoulder-bag') assert(actual > 0, p.id);
  });
});
test('bag prohibition fires, while all five listable products pass', function () {
  products.forEach(function (p) { var check = C.checkListable(p); assert.strictEqual(check.ok, p.listable); if (!p.listable) assert(check.reasons.length); });
  assert.strictEqual(C.checkListable({ brandLogo: true, authenticityProof: false }).ok, false);
  assert.strictEqual(C.checkListable({ brandLogo: true, authenticityProof: true }).ok, true);
});
console.log(count + ' calculation checks passed.');
