(function () {
  'use strict';
  var D = window.Demo;
  function offerSummary(l, discount) {
    var sale = Math.round(l.sale * (1 - discount / 100) * 100) / 100, r = D.listingProfit(l, sale);
    return '<p>割引後の価格（例）: <strong>' + D.usd(sale) + '</strong></p><p class="' + (r.net < 0 ? 'warning-box negative' : 'success-box positive') + '"><strong>' + (r.net < 0 ? '警告: 赤字 ' : '見込みの手残り（黒字） ') + D.yen(r.net) + '（例）</strong>' + (r.net < 0 ? '<br>この割引では赤字になります。割引率と費用を見直してください。' : '') + '</p><small>出品時の仕入れ・重さ・為替・運送会社から再計算しています。</small>';
  }
  D.register('offers', {
    render: function () {
      var live = D.live().filter(function (l) { return l.watchers > 0 && !l.sold; });
      return D.heading('オファー', 'ウォッチ中の人へ、価格を提案。', 'SEND AN OFFER') + D.note('ウォッチ中の買い手に割引価格を提示できます。割引後の手残りも計算して、条件を判断しやすくします。') + (live.length ? '<div class="grid two">' + live.map(function (l) { var discount = l.offerDiscount || 5; var sent = D.state.offers.filter(function (o) { return o.listingId === l.id; }).length; return '<article class="card"><h2 class="product-title">' + D.esc(D.product(l.productId).name) + '</h2><p>通常価格 ' + D.usd(l.sale) + ' / ウォッチャー ' + l.watchers + ' 人（例）</p><form data-offer-form data-id="' + l.id + '"><label>割引率 <output data-discount>' + discount + '</output>%（例）<input type="range" name="discount" min="5" max="20" step="1" value="' + discount + '"></label><div data-offer-summary>' + offerSummary(l, discount) + '</div><button class="section" type="submit">送信（デモ）</button></form><small>送信済み ' + sent + ' 回（例）</small></article>'; }).join('') + '</div>' : D.empty('オファーできる出品がありません', 'listings', '出品管理へ')) + '<p class="field-note section">送信しても購入は保証されません。この体験版では実際の買い手に届きません。</p><a class="button" href="#/auto-list">自動出品設定へ →</a>';
    },
    input: function (event) {
      var form = event.target.closest('[data-offer-form]'); if (!form) return;
      var l = D.state.listings.find(function (item) { return item.id === form.dataset.id; }), discount = Number(event.target.value);
      l.offerDiscount = discount; D.save(); form.querySelector('[data-discount]').textContent = discount; form.querySelector('[data-offer-summary]').innerHTML = offerSummary(l, discount);
    },
    submit: async function (event) {
      var form = event.target; if (!form.matches('[data-offer-form]')) return;
      var l = D.state.listings.find(function (item) { return item.id === form.dataset.id; }), discount = Number(new FormData(form).get('discount'));
      var sale = Math.round(l.sale * (1 - discount / 100) * 100) / 100;
      if (D.listingProfit(l, sale).net < 0 && !await D.confirm('赤字のオファーです', offerSummary(l, discount) + '<p>この条件でデモ送信しますか。</p>')) return;
      if (!await D.loading('オファーを送信しています', ['割引価格を確認中…', 'ウォッチ中の人に送信しました（デモ）'], 700)) return;
      D.state.offers.push({ id: D.id('offer'), listingId: l.id, discount: discount, sale: sale }); D.event('offered'); D.save(); D.render(); D.toast('割引オファーを送信しました（デモ）');
    }
  });
}());
