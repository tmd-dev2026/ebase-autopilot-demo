(function () {
  'use strict';
  var D = window.Demo, C = window.DemoCalc;
  function net(row) { var r = C.calcProfit(row); return '<span class="' + (r.net < 0 ? 'negative' : 'positive') + '">' + (r.net < 0 ? '赤字 ' : '黒字 ') + D.yen(r.net) + '</span>'; }
  function total() { return D.yen(D.state.report.reduce(function (sum, row) { return sum + C.calcProfit(row).net; }, 0)); }
  D.register('profit-report', {
    render: function () {
      return D.heading('収益管理', '売上だけでなく、費用まで見渡す。', 'PROFIT REPORT') + D.note('注文ごとの売上と手数料を集計し、仕入れ・送料・広告費を反映した純利益を確認できます。追加費用を修正すると自動で再計算します。') + '<div class="card row between"><div><div class="metric-label">表示中の純利益の合計（例）</div><div class="metric" id="report-total">' + total() + '</div></div><button data-action="csv">CSV ダウンロード</button></div><p>過去の例 4 件と今回の注文を表示しています。送料管理の実際送料は別に確認し、必要に応じてこの表へ入力します。</p><p class="scroll-hint report-scroll-hint"><span class="report-scroll-text">表は横にスクロールできます。</span>費用は円単位（例）です。</p><div class="table-wrap profit-report"><table><thead><tr><th>注文</th><th>売上 / 手数料</th><th>仕入れ</th><th>国内送料</th><th>国際送料</th><th>広告費</th><th>純利益</th></tr></thead><tbody>' + D.state.report.map(function (row) {
        var r = C.calcProfit(row);
        return '<tr data-report-row="' + row.id + '"><td>' + (row.productId ? D.image(D.product(row.productId), true) : '') + D.esc(row.label) + '<small>為替 ' + row.rate + ' 円/USD（例）</small><button data-action="detail" data-id="' + row.id + '">式を見る</button></td><td><span class="report-sale" data-label="売上">' + D.usd(row.sale + (row.buyerShipping || 0)) + '</span><small class="report-fee"><span>手数料</span> ' + D.yen(r.feeYen) + '</small></td>' + [['cost', '仕入れ'], ['domestic', '国内送料'], ['shipping', '国際送料'], ['ads', '広告費']].map(function (f) { return '<td data-label="' + (f[0] === 'shipping' ? '送料' : f[1]) + '"><label class="sr-only" for="' + row.id + '-' + f[0] + '">' + D.esc(row.label + ' ' + f[1]) + '</label><input id="' + row.id + '-' + f[0] + '" type="number" min="0" max="100000000" step="1" data-cost="' + f[0] + '" value="' + row[f[0]] + '" required></td>'; }).join('') + '<td data-net data-label="純利益">' + net(row) + '</td></tr>';
      }).join('') + '</tbody></table></div><p id="report-error" role="status"></p><div class="row section"><a class="button primary" href="#/shipping" data-guide-final>送料管理で差額を見る →</a><a class="button" href="#/summary">体験のまとめ</a></div>';
    },
    input: function (event) {
      if (!event.target.dataset.cost) return;
      if (!event.target.validity.valid || !event.target.value) { document.getElementById('report-error').textContent = '費用は 0 以上の整数で入力してください。計算結果は直前の有効な入力です。'; return; }
      var tr = event.target.closest('[data-report-row]'), row = D.state.report.find(function (r) { return r.id === tr.dataset.reportRow; });
      row[event.target.dataset.cost] = Number(event.target.value); D.save(); tr.querySelector('[data-net]').innerHTML = net(row); document.getElementById('report-total').textContent = total(); document.getElementById('report-error').textContent = '';
    },
    click: function (action, button) {
      if (action === 'csv') D.toast('体験版ではダウンロードしません');
      if (action === 'detail') { var row = D.state.report.find(function (r) { return r.id === button.dataset.id; }); if (row) D.modal('純利益の計算式（例）', '<p>' + D.esc(row.label) + '</p>' + D.formula(row)); }
    }
  });
}());
