(function () {
  'use strict';
  var D = window.Demo;
  function imported() { return D.state.products.find(function (p) { return p.id === D.state.selected; }); }
  function choices() {
    return '<div class="grid three">' + D.data.products.map(function (p) { return '<article class="card">' + D.image(p) + '<h3 class="product-title">' + D.esc(p.name) + '</h3><p>' + D.yen(p.cost) + '（例）</p><div class="row"><button data-action="choose-url" data-id="' + p.id + '">この商品で試す</button><a href="market/' + p.id + '.html" target="_blank" rel="noopener" data-market>商品を見る ↗</a></div></article>'; }).join('') + '</div>';
  }
  function result(item, p) {
    var check = window.DemoCalc.checkListable(p);
    return '<section class="card section"><div class="row between"><h2>AI処理の結果</h2><span class="badge success">AI処理済</span></div><p class="muted">テンプレート: ' + D.esc(item.template === '自動判定' ? (p.id === 'item-1' ? 'トレカ（自動判定）' : p.id === 'item-2' ? 'カメラ（自動判定）' : 'デフォルト（自動判定）') : item.template) + '</p>' + (item.instruction ? '<p class="message-bubble">今回の指示: ' + D.esc(item.instruction) + '</p>' : '') + '<p class="field-note">体験版の英文は固定の例です。テンプレートと指示は保存されます。</p><div class="stack"><label>英語タイトル<input id="ai-title" data-result="title" maxlength="80" value="' + D.esc(item.title) + '"><span id="title-count" class="field-note">' + item.title.length + ' / 80 文字</span></label><label>英語の説明文<textarea data-result="description" rows="7">' + D.esc(item.description) + '</textarea></label><div><strong>カテゴリ（例）</strong><p>' + D.esc(p.category) + '</p><strong>コンディション</strong><p>' + D.esc(p.condition) + '</p></div></div><h3>商品詳細（Item Specifics）</h3><div class="table-wrap"><table><tbody>' + Object.keys(p.specifics).map(function (key) { return '<tr><th scope="row">' + D.esc(key) + '</th><td>' + D.esc(p.specifics[key]) + '</td></tr>'; }).join('') + '</tbody></table></div><h3 class="section">出品前チェック</h3>' + (!check.ok ? '<span class="badge danger">要修正 · 出品不可</span>' + D.blocked(p) : p.id === 'item-1' ? '<div class="warning-box"><strong>注意 · 1 件</strong><p>コンディションの表記と説明文に食い違いがあります。「美品」と、縁の使用感の説明を見比べてください。</p><span class="badge success">問題なし · タイトルの文字数 / 必須項目</span></div>' : '<div class="success-box"><strong>問題なし</strong><p>このデモの出品前チェックでは注意点は見つかりませんでした。実物の状態は出品者が確認してください。</p></div>') + '<div class="row section"><button data-action="review-result">結果を確認しました</button><button data-action="to-profit">利益計算へ →</button></div></section>';
  }
  D.register('products', {
    render: function () {
      var item = imported(), p = D.selected();
      return D.heading('AI出品', 'URL を取り込み、英語の出品文を整えましょう。', 'SOURCE → PREPARE') + D.note('仕入れ先の URL から商品情報を取得し、AI が英語タイトル・説明文・カテゴリを作成します。出品前に内容と注意点を確認できます。') + '<section class="card"><div class="row between"><h2>01 商品を取得</h2><a class="button" href="market/index.html" target="_blank" rel="noopener" data-market data-guide-market>仕入れ先を開く ↗</a></div><form id="import-form" class="inline-form"><label>商品ページの URL<input id="import-url" name="url" type="text" placeholder="商品ページでコピーした URL を貼り付け" required autocomplete="off"><span class="field-note">架空フリマの 3 商品専用。ファイルを直接開いても体験できます。</span></label><button class="primary" type="submit">取得</button></form><div id="url-feedback" role="status">' + (D.state.urlInvalid ? '<p class="warning-box">体験版ではこの 3 つの商品で試せます</p>' : '') + '</div></section>' + (D.state.urlInvalid || !D.state.products.length ? choices() : '') + '<section class="section"><h2>取り込んだ商品</h2>' + (D.state.products.length ? '<div class="stack">' + D.state.products.map(function (it) { var product = D.product(it.id); return '<article class="card row between"><div class="row">' + D.image(product, true) + '<div><h3 class="product-title">' + D.esc(product.name) + '</h3><span class="badge">' + (it.processed ? 'AI処理済' : '取得済') + '</span> <small>仕入れ ' + D.yen(product.cost) + '（例）</small></div></div><button data-action="ai-open" data-id="' + it.id + '">' + (it.processed ? '結果を見る / AI処理' : 'AI処理') + '</button></article>'; }).join('') + '</div>' : '<p class="muted">まだ商品はありません。上の商品からも URL を入力できます。</p>') + '</section>' +
        (item && D.state.aiOpen ? '<section class="card section"><h2>02 AI処理 · ' + D.esc(p.name) + '</h2><div class="segmented" aria-label="テンプレート">' + ['自動判定', 'デフォルト', 'トレカ', 'カメラ'].map(function (t) { return '<button data-action="template" data-template="' + t + '" aria-pressed="' + (item.template === t) + '">' + t + '</button>'; }).join('') + '</div><label>今回のAI処理への指示（任意）<textarea id="ai-instruction" rows="3" placeholder="例: 商品の状態をわかりやすく説明してください">' + D.esc(item.instruction) + '</textarea></label><p class="field-note">個人情報は入力しないでください。実際の AI には送信されません。</p><button data-action="ai-run">AI処理を実行</button></section>' + (item.processed ? result(item, p) : '') : '') + '<section class="section"><button data-action="show-choices">3 つの商品から選び直す</button></section>';
    },
    submit: async function (event) {
      if (event.target.id !== 'import-form') return;
      var id = window.DemoCalc.matchDemoUrl(document.getElementById('import-url').value);
      if (!id) { D.state.urlInvalid = true; D.save(); D.render(); return; }
      if (D.state.products.some(function (p) { return p.id === id; })) { D.state.selected = id; D.state.aiOpen = true; D.save(); D.render(); D.toast('取得済みの商品を開きました'); return; }
      if (!await D.loading('商品を取得しています', ['ページを読み込み中…', 'タイトル・価格・画像を取り込み中…', '完了'], 600)) return;
      D.state.products.push({ id: id, processed: false, template: '自動判定', instruction: '' });
      D.state.selected = id; D.state.urlInvalid = false; D.state.aiOpen = false; D.state.started = true;
      D.save(); D.render(); D.toast('商品を取得しました。次は AI処理です。');
    },
    click: async function (action, button) {
      if (action === 'choose-url') { document.getElementById('import-url').value = new URL('market/' + button.dataset.id + '.html', location.href).href; document.getElementById('import-url').focus(); }
      if (action === 'show-choices') { D.state.urlInvalid = true; D.render(); }
      if (action === 'ai-open') { D.state.selected = button.dataset.id; D.state.aiOpen = true; D.save(); D.render(); }
      var item = imported(), p = D.selected();
      if (action === 'template' && item) { item.template = button.dataset.template; D.save(); D.render(); }
      if (action === 'ai-run' && item) {
        if (item.processed && !await D.confirm('AI処理をやり直す', '<p>編集したタイトルと説明文を、デモの初期英文に戻します。</p>')) return;
        if (!await D.loading('AI が出品の準備をしています', ['画像を解析', '英語タイトルを作成', '説明文を作成', 'カテゴリと商品詳細(Item Specifics)を決定', '出品前チェック'], 700)) return;
        item.processed = true; item.title = p.title; item.description = p.description; D.save(); D.render(); D.toast('AI処理が完了しました。出品前チェックをご確認ください。');
      }
      if (action === 'review-result' || action === 'to-profit') {
        D.event('resultReviewed');
        if (action === 'to-profit') D.go('profit'); else { D.guide.render(); D.toast('結果の確認を記録しました'); }
      }
    },
    input: function (event) {
      var item = imported(); if (!item) return;
      if (event.target.id === 'ai-instruction') item.instruction = event.target.value;
      if (event.target.dataset.result) {
        item[event.target.dataset.result] = event.target.value;
        if (event.target.dataset.result === 'title') document.getElementById('title-count').textContent = event.target.value.length + ' / 80 文字';
      }
      D.save();
    }
  });
}());
