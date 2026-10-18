(function (root) {
  'use strict';
  var C = typeof module !== 'undefined' && module.exports ? require('./calc.js') : root.DemoCalc;
  var products = (typeof module !== 'undefined' && module.exports ? require('./products-data.js') : root.DemoProducts).products;
  var aiSteps = ['画像を解析', '英語タイトルを作成', '説明文を作成', 'カテゴリと商品詳細を決定', '出品前チェック'];
  function parseBatch(text) {
    var lines = String(text).split(/\r?\n/), valid = [], errors = [];
    lines.forEach(function (line, index) {
      if (index >= 6) { errors.push({ line: index + 1, reason: '最大 6 行です。7 行目以降は受け付けません。' }); return; }
      var id = C.matchDemoUrl(line);
      if (id) valid.push({ line: index + 1, id: id });
      else errors.push({ line: index + 1, reason: '対応する商品 URL ではありません。6 商品の商品ページ URL を入力してください。' });
    });
    return { valid: valid, errors: errors };
  }
  function product(id) { return products.find(function (p) { return p.id === id; }); }
  async function stage(hooks, job, label, steps) {
    job.stage = label; job.status = 'running';
    return !hooks.step || (await hooks.step(job, steps)) !== false;
  }
  function jobFor(state, id) {
    var job = { id: id, stage: '取得', status: 'running', completed: [] };
    state.jobs.push(job); return job;
  }
  async function process(state, id, automatic, hooks, job) {
    hooks = hooks || {}; job = job || jobFor(state, id);
    var p = product(id), item = state.products.find(function (it) { return it.id === id; });
    if (!p || !item) return null;
    if (!await stage(hooks, job, 'AI 処理', aiSteps)) { job.status = 'cancelled'; return item; }
    item.processed = true; item.title = p.ai.titleEn; item.description = p.ai.descriptionEn.join('\n');
    item.category = p.ai.category; item.condition = p.ai.conditionEn; item.specifics = p.ai.specifics.map(function (row) { return row.slice(); });
    item.ready = false;
    job.completed.push('AI 処理');
    if (automatic) {
      if (!await stage(hooks, job, '価格設定', ['送料を比較', '手残りを計算', '価格設定を適用'])) { job.status = 'cancelled'; return item; }
      var values = Object.assign({ sale: p.sale, cost: p.cost, weight: p.weightKg, rate: 155, buyerShipping: 0 }, state.profitInputs[id]);
      var quotes = C.shippingRates(values.weight).map(function (q) { return { carrier: q.carrier, shipping: q.price, net: C.calcProfit(Object.assign({}, values, { shipping: q.price })).net }; });
      quotes.sort(function (a, b) { return b.net - a.net; });
      values.carrier = quotes[0].carrier; state.profitInputs[id] = values;
      item.net = quotes[0].net; item.priceSet = true; job.completed.push('価格設定');
      item.ready = true;
    }
    job.status = 'done'; return item;
  }
  async function acquire(state, id, mode, hooks) {
    hooks = hooks || {};
    if (!product(id)) return null;
    var job = jobFor(state, id);
    if (!await stage(hooks, job, '取得', ['ページを読み込み中…', 'タイトル・価格・画像を取り込み中…', '完了'])) { job.status = 'cancelled'; return null; }
    var item = state.products.find(function (it) { return it.id === id; });
    if (!item) { item = { id: id, processed: false, template: '自動判定', instruction: '', acquiredOn: new Date().toISOString().slice(0, 10) }; state.products.push(item); state.importCount += 1; }
    state.selected = id; state.started = true; state.urlInvalid = false; job.completed.push('取得');
    if (mode === 'batch') { job.status = 'done'; return item; }
    if (mode === 'normal' && hooks.navigate) await hooks.navigate('ai-process/' + id);
    return process(state, id, mode === 'auto', hooks, job);
  }
  async function batch(state, text, mode, hooks) {
    var parsed = parseBatch(text); state.batchErrors = parsed.errors;
    for (var entry of parsed.valid) await acquire(state, entry.id, mode === 'auto' ? 'auto' : 'batch', hooks);
    return parsed;
  }
  var api = { acquire: acquire, process: process, batch: batch, parseBatch: parseBatch, aiSteps: aiSteps };
  if (root) root.DemoWorkflow = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
}(typeof window !== 'undefined' ? window : null));
