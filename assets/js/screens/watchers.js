(function () {
  'use strict';
  var D = window.Demo;
  D.register('watchers', {
    render: function () {
      var live = D.data.products.map(function (p) { return D.state.listings.find(function (l) { return l.own && l.productId === p.id; }) || D.live().find(function (l) { return l.productId === p.id; }) || { id: '', productId: p.id, status: 'inactive', watchers: 0, views: 0, sold: false }; });
      return D.heading('ウォッチャー分析', '関心のある商品から、次の一手を考える。', 'UNDERSTAND INTEREST') + D.note('閲覧数やウォッチャー数、販売状況をまとめ、関心が多いのに売れていない商品を見つけます。価格変更前に手残りを確認できます。') + (live.length ? '<p class="scroll-hint">表は横にスクロールできます。</p><div class="table-wrap"><table><thead><tr><th>商品</th><th>ウォッチャー</th><th>30 日の閲覧数</th><th>販売状況</th><th>価格変更（例）</th></tr></thead><tbody>' + live.map(function (l) { if (!l.id || l.status !== 'live') return '<tr><td>' + D.image(D.product(l.productId), true) + D.esc(D.product(l.productId).name) + '</td><td>0</td><td>0</td><td><span class="badge">' + (l.sold ? '売れた' : D.product(l.productId).listable ? '出品終了' : '出品不可') + '</span></td><td>価格変更の対象外</td></tr>'; return '<tr><td>' + D.image(D.product(l.productId), true) + D.esc(D.product(l.productId).name) + '<small>' + (l.own ? 'あなたの出品' : '初期デモ出品') + '</small>' + (l.watchers >= 10 && !l.sold ? '<span class="badge warning">値下げ候補</span>' : '') + '</td><td>' + l.watchers + ' 人（例）</td><td>' + l.views + ' 回（例）</td><td>' + (l.sold ? '売れた' : 'まだ売れていない') + '</td><td><form data-price-form data-id="' + l.id + '"><label>売値（USD）<input type="number" name="sale" min="0.01" max="' + l.sale + '" step="0.01" value="' + l.sale + '" required></label><p data-margin class="' + (D.listingProfit(l).net < 0 ? 'negative' : 'positive') + '">' + (D.listingProfit(l).net < 0 ? '赤字 ' : '黒字 ') + D.yen(D.listingProfit(l).net) + '</p><button type="submit">価格を下げて保存</button></form></td></tr>'; }).join('') + '</tbody></table></div>' : D.empty('出品中の商品がありません', 'listings', '出品管理へ')) + '<div class="row section"><a class="button primary" href="#/offers" data-guide-offers>割引オファーを試す →</a></div>';
    },
    input: function (event) {
      var form = event.target.closest('[data-price-form]'); if (!form) return;
      var l = D.state.listings.find(function (item) { return item.id === form.dataset.id; }), output = form.querySelector('[data-margin]');
      if (!event.target.validity.valid || !event.target.value) { output.textContent = '現在の売値以下で、0 より大きい価格を入力してください。'; return; }
      var net = D.listingProfit(l, Number(event.target.value)).net;
      output.className = net < 0 ? 'negative' : 'positive'; output.textContent = (net < 0 ? '赤字 ' : '黒字 ') + D.yen(net) + '（例）';
    },
    submit: function (event) {
      var form = event.target; if (!form.matches('[data-price-form]') || !form.reportValidity()) return;
      var l = D.state.listings.find(function (item) { return item.id === form.dataset.id; });
      if (!l || l.status !== 'live') return;
      l.sale = Number(new FormData(form).get('sale')); D.event('priceChanged'); D.save(); D.render(); D.toast('出品価格を更新しました。過去の注文金額は注文時の価格で保存されています。');
    }
  });
}());
