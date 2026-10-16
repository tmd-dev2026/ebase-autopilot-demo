(function () {
  'use strict';
  var D = window.Demo;
  D.register('orders', {
    render: function () {
      var candidates = D.live().filter(function (l) { return !l.sold; }).sort(function (a, b) { return Number(b.own) - Number(a.own); });
      return D.heading('注文管理', '購入から発送登録までを体験。', 'AFTER THE SALE') + D.note('購入された商品と買い手の情報を自動で取り込みます。発送時は運送会社と追跡番号を登録して管理できます。') + '<section class="card"><h2>購入を再現する</h2><p class="muted">1 出品につき 1 回、架空の買い手から注文を受けます。</p>' + (candidates.length ? '<div class="stack">' + candidates.map(function (l) { return '<div class="row between"><div><strong>' + D.esc(D.product(l.productId).name) + '</strong><br><span class="badge">' + (l.own ? 'あなたの出品' : '初期デモ出品') + '</span> ' + D.usd(l.sale) + '（例）</div><button data-action="buy" data-id="' + l.id + '">購入された状況を再現</button></div>'; }).join('') + '</div>' : '<p>購入を再現できる出品がありません。<a href="#/listings">出品管理で商品を出品してください。</a></p>') + '</section><h2 class="section">今回の体験の注文</h2>' + (D.state.orders.length ? D.state.orders.map(function (o) {
        return '<article class="card"><div class="row between"><h3>' + D.esc(D.product(o.productId).name) + '</h3><span class="badge ' + (o.status === 'shipped' ? 'success' : 'warning') + '">' + (o.status === 'shipped' ? '発送済み' : '発送待ち') + '</span></div><dl class="formula"><div><dt>注文番号</dt><dd>' + D.esc(o.id) + '</dd></div><div><dt>買い手（架空）</dt><dd>buyer_demo_01</dd></div><div><dt>発送先</dt><dd>米国（住所は扱いません）</dd></div><div><dt>商品金額 / 買い手送料（例）</dt><dd>' + D.usd(o.sale) + ' / ' + D.usd(o.buyerShipping || 0) + '</dd></div></dl>' + (o.status === 'shipped' ? '<p class="success-box">' + D.esc(o.carrier) + ' / ' + D.esc(o.tracking) + ' で発送登録済み</p>' : '<form data-shipping-form data-id="' + o.id + '"><div class="form-grid"><label>追跡番号（架空の番号を入力）<input name="tracking" maxlength="40" pattern="[A-Za-z0-9-]{4,40}" placeholder="DEMO-TRACK-101" required></label><label>運送会社<select name="carrier">' + D.data.carriers.map(function (c) { return '<option' + (o.carrier === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></label></div><div class="row section"><button type="button" data-action="tracking-example">例を入れる</button><button type="submit">発送登録</button></div></form>') + '</article>';
      }).join('') : D.empty('まだ注文はありません')) + '<a class="button" href="#/messages">買い手からのメッセージへ →</a>';
    },
    click: async function (action, button) {
      if (action === 'tracking-example') {
        var shippingForm = button.closest('form');
        var orderIndex = D.state.orders.findIndex(function (order) { return order.id === shippingForm.dataset.id; });
        var exampleNumber = 101 + orderIndex;
        while (D.state.shipping.some(function (row) { return row.tracking === 'DEMO-TRACK-' + exampleNumber; })) exampleNumber += 1;
        shippingForm.querySelector('[name="tracking"]').value = 'DEMO-TRACK-' + exampleNumber;
        return;
      }
      if (action !== 'buy') return;
      var l = D.state.listings.find(function (item) { return item.id === button.dataset.id; });
      if (!l || l.sold || l.status !== 'live') return;
      if (!await D.loading('注文を取り込んでいます', ['購入を検知しました（デモ）', '注文とメッセージを取り込み中…'], 700)) return;
      var quote = window.DemoCalc.shippingRates(l.weight).find(function (r) { return r.carrier === l.carrier; });
      var o = { id: D.id('order'), productId: l.productId, listingId: l.id, buyer: 'buyer_demo_01', country: '米国', sale: l.sale, buyerShipping: l.buyerShipping || 0, rate: l.rate, cost: l.cost, weight: l.weight, shipping: quote.price, carrier: l.carrier, domestic: 0, ads: 0, status: 'pending', tracking: '' };
      D.state.orders.push(o); l.sold = true;
      D.state.report.push({ id: o.id, label: '今回の体験 / ' + D.product(l.productId).name, sale: o.sale, buyerShipping: o.buyerShipping, rate: o.rate, cost: o.cost, shipping: o.shipping, domestic: 0, ads: 0 });
      D.state.messages.push({ id: D.id('message'), orderId: o.id, productId: o.productId, read: false, translated: false, text: 'Hello! Could you confirm that you will ship to the United States? When do you expect to ship my item?', translation: 'こんにちは！ 米国へ発送することを確認できますか？ 商品はいつ発送する予定ですか？', draft: '', meaning: '', sent: '', sentMeaning: '' });
      D.event('purchased'); D.save(); D.render(); D.toast('注文が入りました。買い手からのメッセージも届いています。');
    },
    submit: function (event) {
      var form = event.target; if (!form.matches('[data-shipping-form]')) return;
      if (!form.reportValidity()) return;
      var o = D.state.orders.find(function (item) { return item.id === form.dataset.id; });
      if (!o || o.status === 'shipped') return;
      var values = new FormData(form), tracking = values.get('tracking').trim();
      if (D.state.shipping.some(function (s) { return s.tracking === tracking; })) { D.toast('この追跡番号は使用済みです。別の架空番号を入力してください。'); return; }
      o.status = 'shipped'; o.tracking = tracking; o.carrier = values.get('carrier');
      var estimate = window.DemoCalc.shippingRates(o.weight).find(function (q) { return q.carrier === o.carrier; }).price;
      o.shipping = estimate;
      var report = D.state.report.find(function (row) { return row.id === o.id; });
      if (report) report.shipping = estimate;
      D.state.shipping.push({ tracking: o.tracking, carrier: o.carrier, estimate: estimate, actual: estimate + 240 });
      D.event('shipped'); D.save(); D.render(); D.toast('発送済みに更新しました。送料管理で差額も確認できます。');
    }
  });
}());
