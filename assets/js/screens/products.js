(function () {
  'use strict';
  var D = window.Demo, W = window.DemoWorkflow, C = window.DemoCalc;
  function imported() { return D.state.products.find(function (p) { return p.id === D.state.selected; }); }
  function choices() {
    return '<section class="card"><h2>対応する商品 URL</h2><p>体験版では『eBaseマーケット(デモ)』の 6 つの商品で試せます</p>' + D.marketLink() + D.data.products.map(function (p) {
      return '<div class="url-choice"><label>' + D.esc(p.name) + '<input readonly id="url-' + p.id + '" value="' + D.esc(D.productUrl(p)) + '" aria-label="' + D.esc(p.name) + ' の URL"></label><button data-action="copy-url" data-id="' + p.id + '">URL をコピー</button></div>';
    }).join('') + '</section>';
  }
  function jobs() {
    if (!D.state.jobs.length) return '';
    return '<section class="card" aria-live="polite"><h2>処理の進捗</h2><ol class="job-list">' + D.state.jobs.map(function (job) {
      return '<li><strong>' + D.esc(D.product(job.id).name) + '</strong><br>' + ['取得', 'AI 処理', '価格設定'].map(function (step) { return (job.completed.includes(step) ? '✓ ' : job.stage === step && job.status === 'running' ? '… ' : '○ ') + step; }).join(' → ') + '<br><span class="badge">' + D.esc(job.status === 'done' ? '完了' : job.status === 'cancelled' ? '中断' : job.message || job.detail || '処理中') + '</span></li>';
    }).join('') + '</ol></section>';
  }
  function priceCard(item, p) {
    var values = D.profitValues(p.id), quotes = C.shippingRates(values.weight);
    var best = quotes.map(function (q) { return { carrier: q.carrier, price: q.price, net: C.calcProfit(Object.assign({}, values, { shipping: q.price })).net }; }).sort(function (a, b) { return b.net - a.net; })[0];
    var r = C.calcProfit(Object.assign({}, values, { shipping: best.price }));
    var money = function (yen) { return (values.rate > 0 ? D.usd(yen / values.rate) : '— USD') + ' / ' + D.yen(yen); };
    var rows = [['仕入値(USD)', money(r.cost)], ['送料(USD)', money(r.shipping)], ['eBay手数料', D.usd(r.feeUsd) + ' / ' + D.yen(r.feeYen)], ['出品価格', D.usd(values.sale) + ' / ' + D.yen(values.sale * values.rate)], ['見込み利益', money(r.net)], ['見込み利益率', (r.revenueYen ? (r.net / r.revenueYen * 100).toFixed(1) + '%' : '—') + '（USD・円共通）']];
    return '<details id="price-card" class="card section"' + (D.state.events.priceSeen ? ' open' : '') + '><summary>価格設定（利益）</summary><p>最も手残りが多い配送方法: ' + best.carrier + '（配送方法・例）</p><dl class="formula">' + rows.map(function (row, i) { return '<div><dt>' + row[0] + '</dt><dd class="' + (i >= 4 ? r.net < 0 ? 'negative' : 'positive' : '') + '">' + row[1] + (i === 4 && r.net < 0 ? ' <span class="badge negative">⚠ 赤字</span>' : '') + '</dd></div>'; }).join('') + '</dl><p class="field-note">為替 ' + values.rate + ' 円/USD（例）。表示はすべて例です。手残りは保証されません。</p>' + D.calculationDetails() + '</details><div class="row price-actions"><button class="primary" data-action="to-profit">利益計算で詳しく見る</button><a class="button" href="#/listings">出品管理へ</a></div>';
  }
  function readiness() {
    return D.state.products.filter(function (it) { return it.priceSet && it.ready; }).map(function (item) {
      var p = D.product(item.id), values = D.profitValues(p.id);
      return '<section class="card"><h2>出品準備ができました</h2><p>全自動が完了しました: ' + D.esc(item.title) + ' → ' + D.usd(values.sale) + '</p><p>見込み利益（例） <span class="' + (item.net < 0 ? 'negative' : 'positive') + '">' + D.yen(item.net) + (item.net < 0 ? ' <span class="badge negative">⚠ 赤字</span>' : '') + '</span></p><a class="button" href="#/listings">出品管理へ</a></section>';
    }).join('');
  }
  function checks(item, p) {
    var errors = C.validateListing(item), warnings = p.ai.warnings.filter(function (w) { return w.level === '注意'; });
    return (errors.length ? '<span class="badge warning">要修正(' + errors.length + '件)</span>' + errors.map(function (e) { return '<p>' + D.esc(e) + '</p>'; }).join('') : '') + (warnings.length ? '<span class="badge warning">注意(' + warnings.length + '件)</span>' + warnings.map(function (w) { return '<p>' + D.esc(w.text) + '</p>'; }).join('') : '') + (!errors.length && !warnings.length ? '<small>要修正・注意はありません</small>' : '');
  }
  function result(item, p) {
    return '<section class="card section"><div class="row between"><h2>AI処理の結果</h2><span class="badge scheduled">AI処理済</span></div><p class="field-note">体験版の英文は固定の例です。Near Mint（ほぼ新品）。テンプレートと指示は保存されます。</p><div class="stack"><label>英語タイトル<input id="ai-title" data-result="title" value="' + D.esc(item.title) + '"><span id="title-count" class="field-note">' + item.title.length + ' / 80 文字</span></label><label>英語の説明文<textarea data-result="description" rows="7">' + D.esc(item.description) + '</textarea></label><label>カテゴリ<input data-result="category" value="' + D.esc(item.category) + '"></label><label>コンディション<input data-result="condition" value="' + D.esc(item.condition) + '"></label></div><h3 class="specifics-heading">商品詳細（Item Specifics）</h3><p class="field-note">eBay に渡す商品の項目です。</p><div class="table-wrap spec-table"><table><tbody>' + item.specifics.map(function (row, i) { return '<tr><th scope="row">' + D.esc(row[0]) + '</th><td><textarea rows="1" data-specific="' + i + '" aria-label="' + D.esc(row[0]) + '">' + D.esc(row[1]) + '</textarea></td></tr>'; }).join('') + '</tbody></table></div><h3 class="section">出品前チェック</h3><div id="title-validation" role="status">' + checks(item, p) + '</div></section>' + priceCard(item, p);
  }

  function row(item, sample) {
    var p = D.product(item.id);
    return '<article class="card product-row"><label class="product-select"><input type="checkbox" data-select="' + p.id + '" aria-label="' + D.esc(p.name) + ' を選択"' + (D.state.selection.includes(p.id) ? ' checked' : '') + (sample ? ' disabled' : '') + '></label>' + D.image(p, true) + '<div><h3 class="product-title">' + D.esc(p.name) + '</h3><p>仕入れ ' + D.yen(p.cost) + '（例）</p><p class="field-note">' + D.esc(p.conditionNote) + '</p><span class="badge">eBaseマーケット(デモ)</span> <span class="badge ' + 'scheduled' + '">' + (item.processed ? 'AI処理済' : '取得済') + '</span>' + (sample ? ' <span class="badge">過去の見本（例）</span>' : '') + '</div><div class="row product-actions" style="grid-column:1/-1"><a class="button" href="' + D.esc(D.productUrl(p)) + '" target="_blank" rel="noopener">元ページ ↗</a><button data-action="images" data-id="' + p.id + '">画像 ' + p.images.length + '</button><button data-action="ai-open" data-id="' + p.id + '"' + (sample ? ' data-sample="true"' : '') + '>AI処理</button>' + (!sample ? '<button data-action="delete" data-id="' + p.id + '">削除</button>' : '') + '</div></article>';
  }
  function gallery(p) {
    D.modal('商品画像', '<img id="gallery-image" class="gallery-main" src="assets/img/' + p.images[0].file + '" alt="' + D.esc(p.images[0].caption) + '"><p id="gallery-caption" aria-live="polite">' + D.esc(p.images[0].caption) + '</p><div class="gallery-thumbs" aria-label="商品画像を選択">' + p.images.map(function (img, i) { return '<button data-gallery="' + i + '" data-product="' + p.id + '" aria-label="' + D.esc(img.caption) + '" aria-pressed="' + (i === 0) + '"><img src="assets/img/' + img.file + '" alt=""></button>'; }).join('') + '</div>');
  }
  function hooks(inline, state) {
    return {
      navigate: function (route) {
        return new Promise(function (resolve) {
          if (location.hash === '#/' + route) { D.render(); resolve(); }
          else { window.addEventListener('hashchange', resolve, { once: true }); D.go(route); }
        });
      },
      step: async function (job, steps) {
        if (D.state !== state) return false;
        D.save();
        if (!inline) return D.loading(job.stage + 'しています（デモ）', steps, job.stage === 'AI 処理' ? 700 : 600);
        for (var label of steps) {
          job.detail = label; D.save();
          if (D.route === 'products') D.render();
          await new Promise(function (resolve) { setTimeout(resolve, job.stage === 'AI 処理' ? 700 : 600); });
          if (D.state !== state) return false;
        }
        return true;
      }
    };
  }
  async function run(task) {
    if (D.working) return;
    D.working = true;
    try { await task(); } finally { D.working = false; D.save(); D.render(); }
  }
  async function commonAction(action, button) {
    var id = button.dataset.id, item = imported();
    if (action === 'images') gallery(D.product(id));
    if (action === 'copy-url') {
      var input = document.getElementById('url-' + id); input.focus(); input.select();
      try { await navigator.clipboard.writeText(input.value); D.toast('URL をコピーしました'); } catch (error) { D.toast('URL を選択しました。長押し、またはコピー操作でコピーしてください。'); }
    }
    if (action === 'ai-open') {
      if (button.dataset.sample) {
        D.modal('過去の AI処理済みの見本', '<h3>' + D.esc(D.product(id).ai.titleEn) + '</h3><p class="pre-line">' + D.esc(D.product(id).ai.descriptionEn.join('\n')) + '</p><p>今回の体験では商品 URL を入力して取得してください。</p>'); return;
      }
      D.state.selected = id; D.save(); D.go('ai-process/' + id);
    }
    if (action === 'to-profit') { D.event('priceSeen'); D.go('profit'); }
    if (action === 'profit-product') { D.state.selected = id; D.save(); D.go('profit'); }
    if (action === 'ai-run' && item) {
      if (item.processed && !await D.confirm('AI処理をやり直す', '<p>編集した結果をデモの初期英文に戻します。</p>')) return;
      await run(function () { return W.process(D.state, item.id, false, hooks(false, D.state)); });
    }
    if (action === 'template' && item) { item.template = button.dataset.template; D.save(); D.render(); }
  }
  D.register('products', {
    render: function () {
      var s = D.state, batch = s.inputMode === 'batch', samples = !D.filter && s.dateFilter === 'yesterday';
      return D.heading('商品取得', 'URL から、AI が出品の準備を進めます。') + '<div class="import-intro">' + D.note('商品情報を取得すると、そのまま AI 処理が始まります。全自動モードでは送料の比較と価格設定まで進めます。') + '<section class="card import-card"><div class="row between"><h2>商品取得 <span class="badge">今月: ' + s.importCount + ' / 300 件</span></h2><div class="segmented">' + [['single', '単品入力'], ['batch', '一括入力']].map(function (m) { return '<button data-action="input-mode" data-mode="' + m[0] + '" aria-pressed="' + (s.inputMode === m[0]) + '">' + m[1] + '</button>'; }).join('') + '</div></div><form id="import-form" novalidate><div class="import-toolbar"><label for="import-mode">モード</label><select id="import-mode"><option value="normal"' + (s.importMode === 'normal' ? ' selected' : '') + '>通常モード</option><option value="auto"' + (s.importMode === 'auto' ? ' selected' : '') + '>全自動モード</option></select></div><label for="import-url">商品 URL を入力（『eBaseマーケット(デモ)』対応）</label><div class="import-row"><div class="import-field">' + (batch ? '<textarea id="import-url" rows="6" placeholder="1 行に 1 URL、最大 6 行" required aria-describedby="import-error import-help">' + D.esc(s.importText || '') + '</textarea>' : '<input id="import-url" type="text" placeholder="商品ページの URL を貼り付け" value="' + D.esc(s.importText || '') + '" required autocomplete="off" aria-describedby="import-error import-help">') + '<p id="import-error" class="input-error" role="status">' + D.esc(s.urlError || '') + '</p></div><button class="primary" type="submit"' + (D.working ? ' disabled' : '') + '>取得</button></div><p id="import-help" class="field-note">' + (batch ? '通常: 取得後に一括AI処理。' : '通常: 取得後に AI 処理へ。') + '全自動モード（取得→AI処理→価格計算をまとめて実行）。</p></form><div role="status">' + s.batchErrors.map(function (e) { return '<p class="warning-box">' + e.line + ' 行目: ' + D.esc(e.reason) + '</p>'; }).join('') + '</div></section></div>' + (s.urlInvalid ? choices() : '') + D.filterNotice('products') + jobs() + readiness() + '<div class="row between date-chips"><div class="segmented"><button data-action="date" data-date="today" aria-pressed="' + !samples + '">今日 ' + s.products.length + '</button><button data-action="date" data-date="yesterday" aria-pressed="' + samples + '">昨日 ' + s.samples.length + '（例）</button></div><button data-action="batch-ai"' + (!s.selection.length || D.working ? ' disabled' : '') + '>一括AI処理（' + s.selection.length + ' 件）</button></div>' + (samples ? s.samples.map(function (it) { return row(it, true); }).join('') : s.products.length ? s.products.filter(function (it) { return D.productMatches(it, D.filter); }).map(function (it) { return row(it, false); }).join('') : D.empty('まだ商品を取り込んでいません。商品 URL を入力して取得してください。'));
    },
    submit: async function (event) {
      if (event.target.id !== 'import-form') return;
      var s = D.state, text = document.getElementById('import-url').value, inline = s.importMode === 'auto' || s.inputMode === 'batch';
      s.importText = text; s.urlError = ''; s.urlInvalid = false;
      s.jobs = []; s.batchErrors = []; s.dateFilter = 'today';
      if (!text.trim()) { s.urlError = 'URLを貼り付けてください'; s.urlInvalid = true; D.save(); D.render(); return; }
      if (s.inputMode === 'batch') {
        var parsed = W.parseBatch(text); s.urlInvalid = parsed.errors.length > 0;
        if (s.urlInvalid) s.urlError = 'このURLは体験版では使えません。下の商品から選んでください';
        await run(function () { return W.batch(s, text, s.importMode, hooks(inline, s)); });
        s.selection = parsed.valid.map(function (v) { return v.id; }).filter(function (id, i, ids) { return ids.indexOf(id) === i; });
        s.urlInvalid = parsed.errors.length > 0; D.save(); D.render(); return;
      }
      var id = C.matchDemoUrl(text);
      if (!id) { s.urlError = text.trim() ? 'このURLは体験版では使えません。下の商品から選んでください' : 'URLを貼り付けてください'; s.urlInvalid = true; D.save(); D.render(); return; }
      var existing = s.products.find(function (it) { return it.id === id; });
      if (existing) { s.selected = id; D.go('ai-process/' + id); D.toast('取得済みの商品を開きました'); return; }
      await run(function () { return W.acquire(s, id, s.importMode, hooks(inline, s)); });
    },
    click: async function (action, button) {
      var s = D.state;
      if (action === 'input-mode') { s.inputMode = button.dataset.mode; D.save(); D.render(); }
      if (action === 'date') { s.dateFilter = button.dataset.date; D.save(); D.render(); }
      if (action === 'delete' && await D.confirm('取得した商品を削除', '<p>取得内容と編集内容を削除します。出品・注文の記録は保持します。</p>')) { s.products = s.products.filter(function (it) { return it.id !== button.dataset.id; }); s.selection = s.selection.filter(function (id) { return id !== button.dataset.id; }); s.jobs = s.jobs.filter(function (j) { return j.id !== button.dataset.id; }); D.save(); D.render(); }
      if (action === 'batch-ai') {
        if (s.selection.some(function (id) { return s.products.some(function (it) { return it.id === id && it.processed; }); }) && !await D.confirm('選択した商品の AI処理', '<p>処理済み商品の編集内容は、初期英文に戻ります。</p>')) return;
        s.jobs = [];
        await run(async function () { for (var id of s.selection) await W.process(s, id, s.importMode === 'auto', hooks(true, s)); });
      }
      await commonAction(action, button);
    },
    input: function (event) { if (event.target.id === 'import-url') D.state.importText = event.target.value; },
    change: function (event) {
      if (event.target.id === 'import-mode') D.state.importMode = event.target.value;
      if (event.target.dataset.select) { var id = event.target.dataset.select; D.state.selection = D.state.selection.filter(function (v) { return v !== id; }); if (event.target.checked) D.state.selection.push(id); D.render(); }
      D.save();
    }
  });
  D.register('ai-process', {
    render: function () {
      var item = imported(), p = D.selected();
      return D.heading('AI処理', p.name) + D.note('画像と商品情報をもとに英語の出品文を作り、出品前チェックまでまとめて実行します。') + (!item ? D.empty('この商品はまだ取得されていません', 'products', '商品取得へ') : '<section class="card"><h2>処理設定 <span class="badge">おすすめ: ' + D.esc(p.template) + '</span></h2><div class="segmented" aria-label="テンプレート">' + ['自動判定', 'デフォルト', 'トレカ', 'カメラ'].map(function (t) { return '<button data-action="template" data-template="' + t + '" aria-pressed="' + (item.template === t) + '">' + t + '</button>'; }).join('') + '</div><label>今回のAI処理への指示（任意）<textarea id="ai-instruction" rows="3">' + D.esc(item.instruction) + '</textarea></label><p class="field-note">個人情報は入力しないでください。英文は固定のデモです。</p><button data-action="ai-run"' + (D.working ? ' disabled' : '') + '>' + (item.processed ? 'AI処理をやり直す' : 'AI処理を実行') + '</button></section>' + (item.processed ? result(item, p) : jobs()));
    },
    afterRender: function () {
      var card = document.getElementById('price-card');
      if (card) card.addEventListener('toggle', function () { if (card.open) { D.event('priceSeen'); D.refreshGuide(); } });
    },
    click: commonAction,
    input: function (event) {
      var item = imported(); if (!item) return;
      var el = event.target;
      if (el.id === 'ai-instruction') item.instruction = el.value;
      if (el.dataset.result) item[el.dataset.result] = el.value;
      if (el.dataset.specific !== undefined) item.specifics[Number(el.dataset.specific)][1] = el.value;
      if (el.dataset.result === 'title') {
        document.getElementById('title-count').textContent = el.value.length + ' / 80 文字';
      }
      if (el.dataset.result || el.dataset.specific !== undefined) document.getElementById('title-validation').innerHTML = checks(item, D.selected());
      D.save();
    }
  });
  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-gallery]'); if (!button) return;
    var p = D.product(button.dataset.product), img = p.images[Number(button.dataset.gallery)];
    document.getElementById('gallery-image').src = 'assets/img/' + img.file; document.getElementById('gallery-image').alt = img.caption;
    document.getElementById('gallery-caption').textContent = img.caption;
    document.querySelectorAll('[data-gallery]').forEach(function (el) { el.setAttribute('aria-pressed', String(el === button)); });
  });
}());
