(function () {
  'use strict';
  var D = window.Demo;
  D.priorities = function () {
    var s = D.state, pending = s.orders.filter(function (o) { return o.status === 'pending'; }).length;
    var definitions = [
      ['errors', '出品エラー', 'listings', 0, 'AI処理や出品内容に修正が必要です。'],
      ['unavailable', '仕入れ元が売り切れ・削除', 'monitor', 0, '仕入れ元の変化と取り下げ結果を確認してください。'],
      ['pending', '発送待ちの注文', 'orders', pending >= 5 ? 0 : 1, '追跡番号の登録を待っている注文があります。'],
      ['ready', '出品待ち', 'listings', 2, 'AI処理を終えた商品を出品できます。'],
      ['markdown', '値下げ候補', 'watchers', 1, 'ウォッチャーが多く未販売の商品を見直せます。'],
      ['price-pending', '価格設定待ち', 'listings', 2, '売値と送料を確認して価格を設定してください。'],
      ['ai-pending', 'AI処理待ち', 'products', 2, '取得した商品から出品文を作成できます。']
    ];
    return definitions.map(function (row) {
      var count = row[0] === 'pending' ? pending : row[0] === 'unavailable' ? s.listings.filter(function (l) { return l.source === 'soldout' || l.source === 'deleted'; }).length : row[0] === 'markdown' ? D.live().filter(function (l) { return l.watchers >= 10 && !l.sold; }).length : s.products.filter(function (p) { return D.productMatches(p, row[0]); }).length;
      if (row[0] === 'errors') count += s.listings.filter(function (l) { return D.listingError(l) && (!l.own || !s.products.some(function (p) { return p.id === l.productId; })); }).length;
      return { filter: row[0], title: row[1], route: row[2], severity: row[3], reason: row[4], count: count };
    }).filter(function (p) { return p.count > 0; }).sort(function (a, b) { return a.severity - b.severity || b.count - a.count; });
  };
  D.register('dashboard', {
    render: function () {
      var s = D.state, live = D.live();
      var priorities = D.priorities();
      var status = [['下書き', s.products.filter(function (p) { return !s.listings.some(function (l) { return l.own && l.productId === p.id; }); }).length], ['予約済', 0], ['出品中', live.length], ['終了', s.listings.filter(function (l) { return l.status !== 'live'; }).length], ['エラー', s.products.filter(function (p) { return D.productMatches(p, 'errors'); }).length]];
      var orders = s.orders.slice(-5).reverse(), watcherCount = live.reduce(function (sum, l) { return sum + l.watchers; }, 0);
      var daily = [0, 0, 0, 0, 0, 0, 0];
      s.orders.forEach(function (o, i) { daily[o.example ? [0, 1, 3, 5, 6][i % 5] : 6] += o.sale * o.rate; });
      var max = Math.max.apply(null, daily.concat([1]));
      var points = daily.map(function (v, i) { return (45 + i * 95) + ',' + (170 - v / max * 130); }).join(' ');
      return D.heading('ダッシュボード', '出品、販売、次の対応をひと目で。') + D.note('商品と注文の状態から優先対応をまとめ、販売状況を自動で集計します。') + '<section id="priorities"><div class="row between"><h2>AI 優先対応</h2><small class="attention">要対応</small></div><div class="priority-grid">' + priorities.map(function (p) { return '<article class="card priority"><small>' + ['要対応', '警告', '情報'][p.severity] + '</small><strong>' + p.title + '</strong><span class="count">' + p.count + '</span> 件<small>' + p.reason + '</small><a href="#/' + p.route + '?filter=' + p.filter + '"' + (p.route === 'monitor' ? ' data-guide-monitor' : '') + '>確認する →</a></article>'; }).join('') + (priorities.length ? '' : '<p>今日やることはありません</p>') + '</div><a class="button" href="#/monitor" data-guide-monitor>在庫監視で売り切れを再現する →</a></section><div class="dashboard-main section"><section class="card"><h2>実売上（直近取得分）</h2><p class="metric">' + D.yen(daily.reduce(function (a, b) { return a + b; }, 0)) + ' <small>例</small></p><svg class="chart sales-chart" viewBox="0 0 660 215" role="img" aria-labelledby="sales-title"><title id="sales-title">10月11日から17日までの売上の例。' + daily.map(D.yen).join('、') + '</title><path class="grid-line" d="M45 40H615M45 85H615M45 130H615M45 170H615" fill="none"/><polygon points="45,170 ' + points + ' 615,170" fill="currentColor" opacity=".12"/><polyline points="' + points + '" stroke="currentColor" stroke-width="2.5" fill="none"/><circle cx="615" cy="' + (170 - daily[6] / max * 130) + '" r="5" fill="currentColor"/>' + daily.map(function (_, i) { return '<text x="' + (45 + i * 95) + '" y="200" text-anchor="middle">10/' + (11 + i) + '</text>'; }).join('') + '</svg><small>初期データと今回の注文を日付の例に割り当てて表示しています。</small></section><section class="card"><h2>出品中</h2><div class="metric">' + live.length + ' <small>件（例）</small></div><hr><h2 class="section">ウォッチャー</h2><div class="metric">' + watcherCount + ' <small>人（例）</small></div><a href="#/watchers">分析を見る →</a></section></div><div class="grid two"><section class="card"><h2>商品ステータス内訳</h2>' + status.map(function (row) { return '<div class="row between"><span>' + row[0] + '</span><strong>' + row[1] + ' 件</strong></div><div class="status-bar"><span style="width:' + row[1] / Math.max(1, s.listings.length + s.products.length) * 100 + '%"></span></div>'; }).join('') + '</section><section class="card"><div class="row between"><h2>最近の注文</h2><a href="#/orders">すべて見る</a></div>' + orders.map(function (o) { return '<div class="stat-row">' + D.image(D.product(o.productId), true) + '<div class="grow"><h3>' + D.esc(D.product(o.productId).name) + '</h3><span class="badge sold">売れた</span> <span class="badge">' + (o.status === 'shipped' ? '発送済み' : '発送待ち') + '</span></div><strong>' + D.usd(o.sale) + '</strong></div>'; }).join('') + '</section></div>';
    }
  });
}());
