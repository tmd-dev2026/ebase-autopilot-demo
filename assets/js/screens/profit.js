(function () {
  'use strict';
  var D = window.Demo, C = window.DemoCalc;
  function results(values) {
    var rates = C.shippingRates(values.weight);
    var selected = rates.find(function (q) { return q.carrier === values.carrier; }) || rates[0];
    var net = rates.map(function (r) { return C.calcProfit(Object.assign({}, values, { shipping: r.price })).net; });
    return '<div class="grid two"><article class="card"><h2>手残りの内訳（例）</h2>' + D.formula(Object.assign({}, values, { shipping: selected.price })) + '<p class="field-note">手残りは売上から手数料・送料・仕入れを引いた額です。プラスでも、追加の費用がないか確認しましょう。</p></article><article class="card"><h2>国際送料を比較</h2><p class="muted">料金は例です。実際の料金表ではありません。</p><div class="stack">' + rates.map(function (r, i) { return '<div><div class="row between"><strong>' + r.carrier + '（例）</strong>' + (net[i] === Math.max.apply(null, net) ? '<span class="badge success">手残りが最大</span>' : '') + '</div><p>送料 ' + D.yen(r.price) + ' / <span class="' + (net[i] < 0 ? 'negative' : 'positive') + '">' + (net[i] < 0 ? '赤字 ' : '手残り ') + D.yen(net[i]) + '</span></p></div>'; }).join('') + '</div><small>重さ kg から算出: SpeedPAK = round(2900 + 2100 × kg)、EMS = round(3300 + 2800 × kg)、DHL = round(4200 + 3100 × kg)</small></article></div>';
  }
  D.register('profit', {
    render: function () {
      var v = D.profitValues(D.state.selected);
      var fields = [['cost', '仕入れ値（円・例）', 1], ['sale', '売値（USD・例）', 0.01], ['buyerShipping', '買い手が払う送料（USD・例）', 0.01], ['weight', '梱包後の重さ（kg・例）', 0.01], ['rate', '為替（例・円/USD）', 0.01]];
      return D.heading('利益計算', '売る前に、数字をひとつずつ確かめる。', 'KNOW YOUR MARGIN') + D.note('仕入れ値や重さを商品情報から反映し、送料と手数料を含めた手残りを自動計算します。条件を変えて比較できます。') + '<section class="card"><form id="profit-form"><label>計算する商品<select id="profit-product">' + D.data.products.map(function (p) { return '<option value="' + p.id + '"' + (p.id === D.state.selected ? ' selected' : '') + '>' + D.esc(p.name) + (D.state.products.some(function (it) { return it.id === p.id; }) ? '（取得済）' : '（例）') + '</option>'; }).join('') + '</select></label><div class="form-grid section">' + fields.map(function (f) { return '<label>' + f[1] + '<input type="number" name="' + f[0] + '" value="' + v[f[0]] + '" min="0" max="100000000" step="' + f[2] + '" required></label>'; }).join('') + '<label>計算に使う運送会社<select name="carrier">' + D.data.carriers.map(function (c) { return '<option' + (v.carrier === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></label></div></form><p id="profit-error" role="status"></p></section><div id="profit-results">' + results(v) + '</div><div class="row section"><a class="button primary" href="#/listings">出品管理へ →</a></div>';
    },
    input: function (event) {
      if (!event.target.closest('#profit-form') || event.target.id === 'profit-product') return;
      var form = document.getElementById('profit-form');
      if (!form.checkValidity()) { document.getElementById('profit-error').textContent = '0 以上の数字を入力してください。計算結果は直前の有効な入力です。'; return; }
      var values = {};
      new FormData(form).forEach(function (value, key) { values[key] = key === 'carrier' ? value : Number(value); });
      D.state.profitInputs[D.state.selected] = values; D.save();
      document.getElementById('profit-error').textContent = ''; document.getElementById('profit-results').innerHTML = results(values);
    },
    change: function (event) {
      if (event.target.id === 'profit-product') { D.state.selected = event.target.value; D.save(); D.render(); }
    }
  });
}());
