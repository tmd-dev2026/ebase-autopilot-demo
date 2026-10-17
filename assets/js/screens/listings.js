(function () {
  'use strict';
  var D = window.Demo;
  function preview(listing) {
    var p = D.product(listing.productId), item = D.state.products.find(function (it) { return it.id === p.id; });
    D.modal('出品しました（デモ）', '<span class="badge">汎用の出品ページプレビュー</span>' + D.image(p) + '<h3>' + D.esc(item ? item.title : p.title) + '</h3><p><strong>' + D.usd(listing.sale) + '（例）</strong></p><p class="pre-line">' + D.esc(item ? item.description : p.ai.descriptionEn.join('\n')) + '</p><p class="field-note">外部には送信していません。実際の出品ページは作成されません。</p><button data-modal-close>確認して閉じる</button>');
  }
  D.register('listings', {
    render: function () {
      var s = D.state;
      var rows = s.products.map(function (item) {
        var p = D.product(item.id), listing = s.listings.find(function (l) { return l.own && l.productId === item.id; });
        var status = listing ? (listing.status === 'live' ? '出品中' : listing.sold ? '売れた' : '取り下げ済み') : item.processed ? 'AI処理済' : '取得済';
        return '<article class="card"><div class="row between"><div class="row">' + D.image(p, true) + '<div><h3 class="product-title">' + D.esc(p.name) + '</h3><span class="badge">あなたの出品</span> <span class="badge ' + (status === '出品中' ? 'success' : status === '売れた' ? 'sold' : '') + '">' + status + '</span></div></div><div class="row">' + (listing && listing.status === 'live' ? '<button data-action="preview" data-id="' + listing.id + '">プレビュー</button><button data-action="withdraw" data-id="' + listing.id + '">取り下げる</button>' : listing && listing.sold ? '<span class="badge sold">販売済み</span>' : item.processed ? '<button data-action="publish" data-id="' + p.id + '">出品する</button>' : '<a class="button" href="#/ai-process/' + p.id + '">AI処理へ</a>') + '</div></div>' + (item.processed ? '<a href="#/ai-process/' + p.id + '">出品内容を確認・編集</a>' : '') + (!p.listable && item.processed ? D.blocked(p) : '') + (listing && listing.source === 'soldout' ? '<p class="warning-box">仕入れ元は売り切れです。この商品の再出品はできません。</p>' : '') + '</article>';
      });
      return D.heading('出品管理', '準備から出品まで、商品の工程を確認。', 'LISTING WORKSPACE') + D.note('AI処理が済んだ商品の出品を進め、公開状態をまとめて管理します。出品前チェックと最終確認を経て送信します。') + '<div class="card row between"><strong><span class="status-dot"></span>スケジューラー 稼働中（デモ）</strong><a class="button" href="#/products">商品を追加する</a></div><h2>あなたが取り込んだ商品</h2>' + (rows.join('') || D.empty('商品を取得して、AI処理を試しましょう', 'products', 'AI出品へ')) + '<h2 class="section">初期デモ出品</h2><p class="muted">在庫監視や注文の練習用です。あなたの出品とは別に管理します。</p>' + s.listings.filter(function (l) { return !l.own; }).map(function (l) { return '<article class="card row between"><div class="row">' + D.image(D.product(l.productId), true) + '<div><h3>' + D.esc(D.product(l.productId).name) + '</h3><span class="badge">初期デモ出品</span> <span class="badge">' + (l.status === 'live' ? '出品中' : l.sold ? '売れた' : '取り下げ済み') + '</span></div></div><span>' + D.usd(l.sale) + '（例）</span></article>'; }).join('');
    },
    click: async function (action, button) {
      var p = D.product(button.dataset.id), listing = D.state.listings.find(function (l) { return l.id === button.dataset.id; });
      if (action === 'preview' && listing) preview(listing);
      if (action === 'withdraw' && listing && await D.confirm('出品を取り下げる', '<p>このデモ出品を取り下げます。</p>')) { listing.status = 'withdrawn'; D.save(); D.render(); }
      if (action !== 'publish' || !p) return;
      if (!window.DemoCalc.checkListable(p).ok) { D.modal('出品前チェック · 出品不可', D.blocked(p)); return; }
      var item = D.state.products.find(function (it) { return it.id === p.id; });
      if (!item || !item.processed) return;
      if (item.lossWarning && !item.lossAcknowledged) { D.toast('赤字です。商品取得画面で送料と売値を確認してください'); return; }
      if (!item.title.trim() || item.title.length > 80 || !item.description.trim()) { D.toast('英語タイトル（1〜80 文字）と説明文を入力してください'); return; }
      var existing = D.state.listings.find(function (l) { return l.own && l.productId === p.id; });
      if (existing && existing.sold) { D.toast('販売済みの商品の再出品はできません'); return; }
      if (existing && existing.source === 'soldout') { D.toast('仕入れ元が売り切れのため、再出品できません'); return; }
      if (!await D.confirm('出品前の最終確認', '<p>' + D.esc(item.title) + '</p><p>実際の取引は発生しません。</p>', ['商品状態・英語の説明文・注意点を確認しました', '本物であることと出品可能な商品であることを確認しました', '送料・手数料・仕入れを含めた手残りを確認しました'])) return;
      if (!await D.loading('出品しています（デモ）', ['eBay に送信中…', '出品しました（デモ）'], 850)) return;
      var values = D.profitValues(p.id);
      var record = Object.assign({ id: existing ? existing.id : D.id('listing'), productId: p.id, own: true, status: 'live', source: 'available', watchers: 12, views: 125, sold: false }, values);
      if (existing) Object.assign(existing, record); else D.state.listings.push(record);
      D.event('listed'); D.save(); D.render(); preview(record);
    }
  });
}());
