(function () {
  'use strict';
  var D = window.Demo;
  D.shippingContent = function () {
      var filter = D.state.shippingFilter || 'all', rows = D.state.shipping.filter(function (s) { return filter === 'all' || s.carrier === filter; });
      return '<section class="card"><label>運送会社で絞り込む<select id="shipping-filter"><option value="all">すべての運送会社</option>' + D.data.carriers.map(function (c) { return '<option' + (filter === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></label><p class="field-note">料金は例です。今回の発送は、見積もり + ¥240 を実際送料の例として表示します。</p></section><p class="scroll-hint">表は横にスクロールできます。差額 = 実際 − 見積もり。</p><div class="table-wrap"><table><thead><tr><th>追跡番号（架空）</th><th>運送会社</th><th>見積もり送料</th><th>実際にかかった送料</th><th>差額（例）</th></tr></thead><tbody>' + rows.map(function (s) { var diff = s.actual - s.estimate; return '<tr><th scope="row">' + D.esc(s.tracking) + '</th><td>' + D.esc(s.carrier) + '</td><td>' + D.yen(s.estimate) + '</td><td>' + D.yen(s.actual) + '</td><td class="' + 'muted' + '">' + (diff > 0 ? '超過 +' : diff < 0 ? '節約 ' : '差額 ') + D.yen(diff) + '</td></tr>'; }).join('') + (rows.length ? '' : '<tr><td colspan="5">この運送会社の記録はありません。</td></tr>') + '</tbody></table></div>';
  };
  D.shippingChange = function (event) { if (event.target.id === 'shipping-filter') { D.state.shippingFilter = event.target.value; D.save(); D.render(); } };
  D.register('shipping', {
    render: function () { return D.screens['profit-report'].render(); },
    afterRender: function () { D.screens['profit-report'].afterRender(); },
    input: function (event) { D.screens['profit-report'].input(event); },
    click: function (action, button) { D.screens['profit-report'].click(action, button); },
    change: D.shippingChange
  });
}());
