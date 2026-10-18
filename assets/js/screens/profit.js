(function () {
  'use strict';
  var D = window.Demo, C = window.DemoCalc;
  function results(values) {
    var rates = C.shippingRates(values.weight);
    var selected = rates.find(function (q) { return q.carrier === values.carrier; }) || rates[0];
    var net = rates.map(function (r) { return C.calcProfit(Object.assign({}, values, { shipping: r.price })).net; });
    var r = C.calcProfit(Object.assign({}, values, { shipping: selected.price }));
    var usdYen = function (yen) { return D.yen(yen) + ' / ' + (values.rate > 0 ? D.usd(yen / values.rate) : '— USD'); };
    var margin = r.revenueYen ? r.net / r.revenueYen * 100 : 0;
    return '<div class="grid two"><article class="card"><h2>収入 / 控除 / ' + (r.net < 0 ? '⚠ 純損失' : '純利益') + '（例）</h2><h3>収入</h3><dl class="formula"><div><dt>売値 ' + D.usd(values.sale) + ' + 買い手送料 ' + D.usd(values.buyerShipping) + '<br>× 為替 ' + values.rate + ' 円/USD（例）</dt><dd>' + usdYen(r.revenueYen) + '</dd></div></dl><h3>控除</h3><dl class="formula"><div><dt>− eBay手数料</dt><dd>' + D.yen(r.feeYen) + ' / ' + D.usd(r.feeUsd) + '</dd></div><div><dt>− 国際送料</dt><dd>' + usdYen(r.shipping) + '</dd></div><div><dt>− 仕入れ</dt><dd>' + usdYen(r.cost) + '</dd></div><div class="total"><dt>' + (r.net < 0 ? '⚠ 純損失' : '純利益') + '</dt><dd class="' + (r.net < 0 ? 'negative' : 'positive') + '">' + usdYen(r.net) + (r.net < 0 ? ' <span class="badge negative">⚠ 赤字</span>' : ' 黒字') + '</dd></div></dl><p>利益率（例） ' + (r.revenueYen ? margin.toFixed(1) + '%' : '—') + '</p><meter class="profit-gauge" min="-100" max="100" value="' + Math.max(-100, Math.min(100, margin)) + '" aria-label="見込み利益率（例）">' + margin.toFixed(1) + '%</meter><p class="field-note">円表示は四捨五入。純利益は丸め前の手数料から計算します。表示はすべて例であり、手残りは保証されません。</p></article><article class="card"><h2>国際送料を比較</h2><p class="muted">SpeedPAK / EMS / DHL は配送方法です。料金は例です。</p><div class="table-wrap mobile-cards shipping-comparison"><table><thead><tr><th>配送方法</th><th>送料(円)</th><th>送料(USD)</th><th>備考</th><th>手残り(例)</th></tr></thead><tbody>' + rates.map(function (q, i) { return '<tr><th scope="row">' + q.carrier + '</th><td data-label="送料(円)">' + D.yen(q.price) + '</td><td data-label="送料(USD)">' + (values.rate > 0 ? D.usd(q.price / values.rate) : '—') + '</td><td data-label="備考">重さからの見積もり（例）' + (q.price === Math.min.apply(null, rates.map(function (rate) { return rate.price; })) ? '<span class="badge">最安</span>' : '') + '</td><td data-label="手残り(例)" class="' + (net[i] < 0 ? 'negative' : 'positive') + '">' + (net[i] < 0 ? '<span class="badge negative">⚠ 赤字</span> ' : '黒字 ') + D.yen(net[i]) + '</td></tr>'; }).join('') + '</tbody></table></div>' + D.calculationDetails() + '</article></div>';

  }
  D.register('profit', {
    render: function () {
      var v = D.profitValues(D.state.selected);
      var fields = [['cost', '仕入れ値（円・例）', 1], ['sale', '売値（USD・例）', 0.01], ['buyerShipping', '買い手が払う送料（USD・例）', 0.01], ['weight', '梱包後の重さ（kg・例）', 0.01], ['rate', '為替（例・円/USD）', 0.01]];
      return D.heading('利益計算', '売る前に、数字をひとつずつ確かめる。', 'KNOW YOUR MARGIN') + D.note('仕入れ値や重さを商品情報から反映し、送料と手数料を含めた手残りを自動計算します。条件を変えて比較できます。') + '<section class="card"><form id="profit-form"><label>計算する商品<select id="profit-product">' + D.data.products.map(function (p) { return '<option value="' + p.id + '"' + (p.id === D.state.selected ? ' selected' : '') + '>' + D.esc(p.name) + (D.state.products.some(function (it) { return it.id === p.id; }) ? '（取得済）' : '（例）') + '</option>'; }).join('') + '</select></label><div class="form-grid section">' + fields.map(function (f) { return '<label>' + f[1] + '<input type="number" name="' + f[0] + '" value="' + v[f[0]] + '" min="0" max="100000000" step="' + f[2] + '" required></label>'; }).join('') + '<label>計算に使う運送会社<select name="carrier">' + D.data.carriers.map(function (c) { return '<option' + (v.carrier === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></label></div></form><p id="profit-error" role="status"></p></section><div id="profit-results">' + results(v) + '</div><div class="row section"><a class="button primary" href="#/listings" data-action="to-listings">出品管理へ →</a></div>';
    },
    input: function (event) {
      if (!event.target.closest('#profit-form') || event.target.id === 'profit-product') return;
      var form = document.getElementById('profit-form');
      if (!form.checkValidity()) { document.getElementById('profit-error').textContent = '0 以上の数字を入力してください。計算結果は直前の有効な入力です。'; return; }
      var values = {};
      new FormData(form).forEach(function (value, key) { values[key] = key === 'carrier' ? value : Number(value); });
      D.state.profitInputs[D.state.selected] = values;
      var item = D.state.products.find(function (it) { return it.id === D.state.selected; });
      if (item && item.priceSet) {
        var quote = C.shippingRates(values.weight).find(function (q) { return q.carrier === values.carrier; });
        item.net = C.calcProfit(Object.assign({}, values, { shipping: quote.price })).net;
        item.ready = true;
      }
      D.save();
      document.getElementById('profit-error').textContent = ''; document.getElementById('profit-results').innerHTML = results(values);
    },
    click: function (action) { if (action === 'to-listings') { D.event('profitCompared'); D.refreshGuide(); } },
    change: function (event) {
      if (event.target.name === 'carrier') { D.screens.profit.input(event); D.event('profitCompared'); D.refreshGuide(); }
      if (event.target.id === 'profit-product') { D.state.selected = event.target.value; D.save(); D.render(); }
    }
  });
}());
