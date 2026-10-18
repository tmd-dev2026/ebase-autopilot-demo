(function () {
  'use strict';
  var D = window.Demo;
  function searchResults() {
    var rule = D.state.monitorRule;
    var products = D.data.products.filter(function (p) { return (!rule.keyword || p.name.includes(rule.keyword)) && (rule.min === '' || p.cost >= Number(rule.min)) && (rule.max === '' || p.cost <= Number(rule.max)); });
    return products.length ? '<p class="muted">監視条件に一致する見本: ' + products.length + ' 件（例）</p><ul class="check-list">' + products.map(function (p) { return '<li>' + D.esc(p.name) + ' · ' + D.yen(p.cost) + '（例） · 監視対象</li>'; }).join('') + '</ul>' : '<p class="warning-box">条件に一致する商品はありません。</p>';
  }
  D.register('monitor', {
    render: function () {
      return D.heading('在庫監視', '仕入れ元の変化に、すばやく対応。', 'INVENTORY WATCH') + D.note('仕入れ元の売り切れを定期的に検知し、対象の出品を自動で取り下げます。キーワードや価格帯で新着商品も探せます。') + '<p class="warning-box">ガイドでは「初期デモ出品」のカードを売り切れにします。注文の練習には、別の初期デモ出品やあなたの出品を使えます。</p>' + D.filterNotice('monitor') + D.state.listings.filter(function (l) { return D.filter !== 'unavailable' || (l.source === 'soldout' || l.source === 'deleted'); }).map(function (l) {
        return '<article class="card"><div class="row between"><div><h3>' + D.esc(D.product(l.productId).name) + '</h3><span class="badge">' + (l.own ? 'あなたの出品' : '初期デモ出品') + '</span> <span class="badge">' + (l.status === 'live' ? '出品中' : l.sold ? '売れた' : '取り下げ済み') + '</span><p class="section">仕入れ元の状態: <strong class="' + ((l.source === 'soldout' || l.source === 'deleted') ? 'muted' : 'scheduled') + '">' + ((l.source === 'soldout' || l.source === 'deleted') ? (l.source === 'deleted' ? '削除 · 自動取り下げ済み' : '売り切れ · 自動取り下げ済み') : '在庫あり') + '</strong></p></div>' + (l.status === 'live' ? '<button data-action="sold-out" data-id="' + l.id + '">仕入れ先が売り切れた状況を再現</button>' : '') + '</div></article>';
      }).join('') + '<section class="card section"><h2>新着監視</h2><p class="muted">この体験版では用意された 6 商品のデータで監視条件を確認します。</p><form id="monitor-search"><label>キーワード<input name="keyword" value="' + D.esc(D.state.monitorRule.keyword) + '" placeholder="空欄ならすべての商品"></label><div class="form-grid section"><label>価格の下限（円・例）<input type="number" name="min" min="0" value="' + D.esc(D.state.monitorRule.min) + '"></label><label>価格の上限（円・例）<input type="number" name="max" min="0" value="' + D.esc(D.state.monitorRule.max) + '"></label></div><button class="primary section" type="submit">検索</button></form></section>' + (D.state.monitorResults ? searchResults() : '');
    },
    click: async function (action, button) {
      if (action !== 'sold-out') return;
      var l = D.state.listings.find(function (item) { return item.id === button.dataset.id; });
      if (!l || l.status !== 'live') return;
      if (!await D.loading('在庫監視（デモ）', ['仕入れ元の在庫を確認中…', '売り切れを検知しました', '対象の出品を自動で取り下げ中…'], 800)) return;
      l.source = 'soldout'; l.status = 'withdrawn'; D.event('monitorDone'); D.save(); D.render(); D.toast('出品を自動で取り下げました。ダッシュボードにも反映されます。');
    },
    submit: function (event) {
      if (event.target.id !== 'monitor-search') return;
      var values = new FormData(event.target);
      var min = values.get('min'), max = values.get('max');
      if (min !== '' && max !== '' && Number(min) > Number(max)) { D.toast('上限は下限以上にしてください'); return; }
      D.state.monitorRule = { keyword: values.get('keyword').trim(), min: min, max: max }; D.state.monitorResults = true; D.save(); D.render();
    }
  });
}());
