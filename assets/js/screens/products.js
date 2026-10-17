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
    return '<section class="card section"><h2>価格設定（利益）</h2><p>売値 ' + D.usd(values.sale) + '（例） · 最も手残りが多い配送方法: ' + best.carrier + '（例）</p>' + D.formula(Object.assign({}, values, { shipping: best.price })) + '<p class="field-note">表示はすべて例です。手残りは保証されません。</p><div class="row"><button data-action="to-profit">利益計算で詳しく見る</button><a class="button" href="#/listings">出品管理へ</a></div></section>';
  }
  function readiness() {
    return D.state.products.filter(function (it) { return it.priceSet || it.blocked; }).map(function (item) {
      var p = D.product(item.id);
      if (item.blocked) return D.blocked(p);
      if (item.lossWarning && !item.lossAcknowledged) return '<section class="card"><h2 class="negative">赤字です。送料と売値を確認してください</h2><p>' + D.esc(p.name) + ' · 手残り（例） <span class="negative">赤字 ' + D.yen(item.net) + '</span></p><div class="row"><button data-action="profit-product" data-id="' + p.id + '">利益計算で見直す</button><button data-action="ack-loss" data-id="' + p.id + '">赤字を確認して先へ進む</button></div></section>';
      if (!item.ready) return '';
      return '<section class="card"><h2>出品準備ができました</h2><p>' + D.esc(item.title) + '</p><p>売値（例） ' + D.usd(D.profitValues(p.id).sale) + ' · <span class="' + (item.net < 0 ? 'negative' : 'positive') + '">' + (item.net < 0 ? '赤字 ' : '黒字 ') + D.yen(item.net) + '（例）</span></p>' + (item.title.length > 80 ? '<p class="warning-box">要修正: タイトルを 80 文字以内に編集してください。</p><a class="button" href="#/ai-process/' + item.id + '">結果を編集</a> ' : '') + '<a class="button" href="#/listings">出品管理へ</a></section>';
    }).join('');
  }
  function result(item, p) {
    var warnings = p.ai.warnings.slice();
    var invalid = item.title.length > 80 || !item.title.trim() || !item.description.trim();
    return '<section class="card section"><div class="row between"><h2>AI処理の結果</h2><span class="badge scheduled">AI処理済</span></div><p class="field-note">体験版の英文は固定の例です。テンプレートと指示は保存されます。</p><div class="stack"><label>英語タイトル<input id="ai-title" data-result="title" value="' + D.esc(item.title) + '"><span id="title-count" class="field-note">' + item.title.length + ' / 80 文字</span></label><label>英語の説明文<textarea data-result="description" rows="7">' + D.esc(item.description) + '</textarea></label><label>カテゴリ<input data-result="category" value="' + D.esc(item.category) + '"></label><label>コンディション<input data-result="condition" value="' + D.esc(item.condition) + '"></label></div><h3>商品詳細（Item Specifics）</h3><div class="table-wrap spec-table"><table><tbody>' + item.specifics.map(function (row, i) { return '<tr><th scope="row">' + D.esc(row[0]) + '</th><td><textarea rows="1" data-specific="' + i + '" aria-label="' + D.esc(row[0]) + '">' + D.esc(row[1]) + '</textarea></td></tr>'; }).join('') + '</tbody></table></div><h3 class="section">出品前チェック</h3><div id="title-validation" role="status">' + (invalid ? '要修正: 英語タイトルは 1〜80 文字、説明文は必須です。' : '') + '</div>' + warnings.map(function (w) { return '<p class="warning-box"><strong>' + D.esc(w.level) + '</strong> · ' + D.esc(w.text) + '</p>'; }).join('') + (!C.checkListable(p).ok ? D.blocked(p) : '<p class="success-box">問題なし · ' + 'カテゴリと商品詳細の確認項目' + '。実物の状態は出品者が確認してください。</p>') + '<button data-action="review-result">結果と出品前チェックを確認しました</button></section>' + priceCard(item, p);
  }
  function row(item, sample) {
    var p = D.product(item.id);
    return '<article class="card product-row"><label class="product-select"><input type="checkbox" data-select="' + p.id + '" aria-label="' + D.esc(p.name) + ' を選択"' + (D.state.selection.includes(p.id) ? ' checked' : '') + (sample ? ' disabled' : '') + '></label>' + D.image(p, true) + '<div><h3 class="product-title">' + D.esc(p.name) + '</h3><p>仕入れ ' + D.yen(p.cost) + '（例）</p><p class="field-note">' + D.esc(p.conditionNote) + '</p><span class="badge">eBaseマーケット(デモ)</span> <span class="badge ' + (item.blocked ? 'warning' : 'scheduled') + '">' + (item.blocked ? 'エラー · 出品不可' : item.processed ? 'AI処理済' : '取得済') + '</span>' + (sample ? ' <span class="badge">過去の見本（例）</span>' : '') + '</div><div class="row product-actions" style="grid-column:1/-1"><a class="button" href="' + D.esc(D.productUrl(p)) + '" target="_blank" rel="noopener">元ページ ↗</a><button data-action="images" data-id="' + p.id + '">画像 4</button><button data-action="detail" data-id="' + p.id + '">詳細</button><button data-action="ai-open" data-id="' + p.id + '"' + (sample ? ' data-sample="true"' : '') + '>AI処理</button>' + (!sample ? '<button data-action="delete" data-id="' + p.id + '">削除</button>' : '') + '</div></article>';
  }
  function gallery(p) {
    D.modal('商品詳細', '<img id="gallery-image" class="gallery-main" src="assets/img/' + p.images[0].file + '" alt="' + D.esc(p.images[0].caption) + '"><p id="gallery-caption" aria-live="polite">' + D.esc(p.images[0].caption) + '</p><div class="gallery-thumbs" aria-label="商品画像を選択">' + p.images.map(function (img, i) { return '<button data-gallery="' + i + '" data-product="' + p.id + '" aria-label="' + D.esc(img.caption) + '" aria-pressed="' + (i === 0) + '"><img src="assets/img/' + img.file + '" alt=""></button>'; }).join('') + '</div><h3 class="section">' + D.esc(p.name) + '</h3><div class="table-wrap spec-table"><table><tbody>' + p.specs.map(function (s) { return '<tr><th scope="row">' + D.esc(s[0]) + '</th><td>' + D.esc(s[1]) + '</td></tr>'; }).join('') + '</tbody></table></div><p class="pre-line section">' + D.esc(p.description.join('\n')) + '</p><p>状態: ' + D.esc(p.condition) + '<br>出品者: ' + D.esc(p.seller.name) + ' · ' + D.esc(p.seller.rating) + '<br>出品日: ' + D.esc(p.posted) + '</p>');
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
    if (action === 'images' || action === 'detail') gallery(D.product(id));
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
    if (action === 'review-result' || action === 'to-profit') { D.event('resultReviewed'); D.refreshGuide(); if (action === 'to-profit') D.go('profit'); }
    if (action === 'profit-product') { D.state.selected = id; D.save(); D.go('profit'); }
    if (action === 'ack-loss') { W.acknowledgeLoss(D.state, id); D.save(); D.render(); }
    if (action === 'ai-run' && item) {
      if (item.processed && !await D.confirm('AI処理をやり直す', '<p>編集した結果をデモの初期英文に戻します。</p>')) return;
      await run(function () { return W.process(D.state, item.id, false, hooks(false, D.state)); });
    }
    if (action === 'template' && item) { item.template = button.dataset.template; D.save(); D.render(); }
  }
  D.register('products', {
    render: function () {
      var s = D.state, batch = s.inputMode === 'batch', samples = s.dateFilter === 'yesterday';
      return D.heading('商品取得', 'URL から、AI が出品の準備を進めます。') + D.note('商品情報を取得すると、そのまま AI 処理が始まります。全自動モードでは送料の比較と価格設定まで進めます。') + '<section class="card"><div class="row between"><h2>商品取得 <span class="badge">今月: ' + s.importCount + ' / 300 件</span></h2><div class="segmented">' + [['single', '単品入力'], ['batch', '一括入力']].map(function (m) { return '<button data-action="input-mode" data-mode="' + m[0] + '" aria-pressed="' + (s.inputMode === m[0]) + '">' + m[1] + '</button>'; }).join('') + '</div></div><form id="import-form"><div class="import-toolbar"><label for="import-mode">モード</label><select id="import-mode"><option value="normal"' + (s.importMode === 'normal' ? ' selected' : '') + '>通常モード</option><option value="auto"' + (s.importMode === 'auto' ? ' selected' : '') + '>全自動モード</option></select></div><label for="import-url">商品 URL を入力（『eBaseマーケット(デモ)』対応）</label><div class="import-row">' + (batch ? '<textarea id="import-url" rows="6" placeholder="1 行に 1 URL、最大 6 行" required aria-describedby="import-help"></textarea>' : '<input id="import-url" type="text" placeholder="商品ページの URL を貼り付け" required autocomplete="off" aria-describedby="import-help">') + '<button class="primary" type="submit"' + (D.working ? ' disabled' : '') + '>取得</button></div><p id="import-help" class="field-note">' + (batch ? '通常: 取得後に一括AI処理。' : '通常: 取得後に AI 処理へ。') + '全自動: 取得・AI 処理・価格設定をまとめて実行。</p></form><div role="status">' + s.batchErrors.map(function (e) { return '<p class="warning-box">' + e.line + ' 行目: ' + D.esc(e.reason) + '</p>'; }).join('') + '</div></section>' + (s.urlInvalid ? choices() : '') + jobs() + readiness() + '<div class="row between date-chips"><div class="segmented"><button data-action="date" data-date="today" aria-pressed="' + !samples + '">今日 ' + s.products.length + '</button><button data-action="date" data-date="yesterday" aria-pressed="' + samples + '">昨日 ' + s.samples.length + '（例）</button></div><button data-action="batch-ai"' + (!s.selection.length || D.working ? ' disabled' : '') + '>一括AI処理（' + s.selection.length + ' 件）</button></div>' + (samples ? s.samples.map(function (it) { return row(it, true); }).join('') : s.products.length ? s.products.map(function (it) { return row(it, false); }).join('') : D.empty('まだ商品を取り込んでいません。商品 URL を入力して取得してください。'));
    },
    submit: async function (event) {
      if (event.target.id !== 'import-form') return;
      var s = D.state, text = document.getElementById('import-url').value, inline = s.importMode === 'auto' || s.inputMode === 'batch';
      s.jobs = []; s.batchErrors = []; s.dateFilter = 'today';
      if (s.inputMode === 'batch') {
        var parsed = W.parseBatch(text); s.urlInvalid = parsed.errors.length > 0;
        await run(function () { return W.batch(s, text, s.importMode, hooks(inline, s)); });
        s.selection = parsed.valid.map(function (v) { return v.id; }).filter(function (id, i, ids) { return ids.indexOf(id) === i; });
        s.urlInvalid = parsed.errors.length > 0; D.save(); D.render(); return;
      }
      var id = C.matchDemoUrl(text);
      if (!id) { s.urlInvalid = true; D.save(); D.render(); return; }
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
      if (el.dataset.result === 'title' || el.dataset.result === 'description') document.getElementById('title-validation').textContent = item.title.length > 80 || !item.title.trim() || !item.description.trim() ? '要修正: 英語タイトルは 1〜80 文字、説明文は必須です。' : '';
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
