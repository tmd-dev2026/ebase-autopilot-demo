'use strict';
var assert = require('assert'), W = require('../assets/js/workflow.js'), products = require('../assets/js/products-data.js').products;
function state() { return { products: [], jobs: [], importCount: 0, profitInputs: {} }; }
function url(p) { return 'https://any.example/demo/items/' + p.slug + '.html'; }
(async function () {
  var s = state(), events = [];
  await W.acquire(s, 'holo-card', 'normal', {
    navigate: function (route) { events.push(route); assert.strictEqual(s.products[0].processed, false); },
    step: function (job, steps) { events.push(job.stage); if (job.stage === 'AI 処理') assert.strictEqual(steps.length, 5); return true; }
  });
  assert.deepStrictEqual(events, ['取得', 'ai-process/holo-card', 'AI 処理']);
  assert(s.products[0].processed); assert.strictEqual(s.products[0].title, products[0].ai.titleEn);
  for (var p of products) {
    s = state(); events = [];
    await W.acquire(s, p.id, 'auto', { navigate: function () { assert.fail('auto mode must not navigate'); }, step: function (job) { events.push(job.stage); } });
    var item = s.products[0];
    assert.deepStrictEqual(events, ['取得', 'AI 処理', '価格設定']);
    assert.strictEqual(s.profitInputs[p.id].carrier, 'SpeedPAK');
    assert.strictEqual(s.jobs[0].status, 'done');
    assert.strictEqual(item.ready, true);
    assert.deepStrictEqual(s.jobs[0].completed, ['取得', 'AI 処理', '価格設定']);
    if (p.id === 'figure-large') assert(item.net < 0);

  }
  s = state();
  await W.batch(s, products.map(url).join('\n'), 'normal', {});
  assert.strictEqual(s.products.length, 6); assert.strictEqual(s.importCount, 6); assert(s.products.every(function (it) { return !it.processed; }));
  for (var item of s.products) await W.process(s, item.id, false, {});
  assert(s.products.every(function (it) { return it.processed; }));
  var lines = [url(products[0]), 'bad URL', '', url(products[1]), url(products[2]), url(products[3]), url(products[4]), url(products[5])].join('\n');
  s = state(); var parsed = await W.batch(s, lines, 'normal', {});
  assert.deepStrictEqual(parsed.errors.map(function (e) { return e.line; }), [2, 3, 7, 8]);
  assert(parsed.errors.every(function (e) { return e.reason.length > 0; }));
  assert.strictEqual(s.products.length, 4); assert(!s.products.some(function (it) { return it.id === 'fd-lens' || it.id === 'figure-large'; }));
  s = state(); await W.acquire(s, 'holo-card', 'normal', { step: function () { return false; } }); assert.strictEqual(s.products.length, 0);
  s = state(); await W.acquire(s, 'holo-card', 'normal', { step: function (job) { return job.stage !== 'AI 処理'; } }); assert.strictEqual(s.products[0].processed, false); assert.strictEqual(s.jobs[0].status, 'cancelled');
  console.log('Import workflows passed: automatic normal route + AI, three-stage auto, all six products finish including losses, six-row batch, line errors, limits and cancellation.');
}()).catch(function (error) { console.error(error); process.exitCode = 1; });
