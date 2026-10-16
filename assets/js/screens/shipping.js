(function () {
  'use strict';
  var D = window.Demo;
  D.register('shipping', {
    render: function () {
      var filter = D.state.shippingFilter || 'all', rows = D.state.shipping.filter(function (s) { return filter === 'all' || s.carrier === filter; });
      return D.heading('送料管理', '見積もりと実際の差を確認。', 'SHIPPING COSTS') + D.note('追跡番号ごとに送料の見積もりと実際の費用を並べ、差額を確認できます。運送会社ごとの絞り込みにも対応します。') + '<section class="card"><label>運送会社で絞り込む<select id="shipping-filter"><option value="all">すべての運送会社</option>' + D.data.carriers.map(function (c) { return '<option' + (filter === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></label><p class="field-note">料金は例です。今回の発送は、見積もり + ¥240 を実際送料の例として表示します。</p></section><p class="scroll-hint">表は横にスクロールできます。差額 = 実際 − 見積もり。</p><div class="table-wrap"><table><thead><tr><th>追跡番号（架空）</th><th>運送会社</th><th>見積もり送料</th><th>実際にかかった送料</th><th>差額（例）</th></tr></thead><tbody>' + rows.map(function (s) { var diff = s.actual - s.estimate; return '<tr><th scope="row">' + D.esc(s.tracking) + '</th><td>' + D.esc(s.carrier) + '</td><td>' + D.yen(s.estimate) + '</td><td>' + D.yen(s.actual) + '</td><td class="' + (diff > 0 ? 'negative' : 'positive') + '">' + (diff > 0 ? '超過 +' : diff < 0 ? '節約 ' : '差額 ') + D.yen(diff) + '</td></tr>'; }).join('') + (rows.length ? '' : '<tr><td colspan="5">この運送会社の記録はありません。</td></tr>') + '</tbody></table></div><div class="row section"><a class="button primary" href="#/summary" data-guide-final>体験のまとめへ →</a><a class="button" href="#/profit-report">収益管理に戻る</a></div>';
    },
    change: function (event) { if (event.target.id === 'shipping-filter') { D.state.shippingFilter = event.target.value; D.save(); D.render(); } }
  });
}());
