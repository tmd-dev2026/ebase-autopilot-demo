(function () {
  'use strict';
  var D = window.Demo;
  D.register('dashboard', {
    render: function () {
      var s = D.state, live = D.live();
      var priorities = [
        ['orders', '発送待ちの注文', s.orders.filter(function (o) { return o.status === 'pending'; }).length, '追跡番号を登録しましょう'],
        ['listings', '出品待ち', s.products.filter(function (p) { return p.processed && !s.listings.some(function (l) { return l.own && l.productId === p.id && l.status === 'live'; }); }).length, '出品前の確認をしましょう'],
        ['monitor', '仕入れ元が売り切れ', s.listings.filter(function (l) { return l.source === 'soldout'; }).length, '自動取り下げの結果を確認'],
        ['products', 'AI処理待ち', s.products.filter(function (p) { return !p.processed; }).length, '英語の出品文を準備しましょう'],
        ['watchers', '値下げ候補', live.filter(function (l) { return l.watchers >= 10 && !l.sold; }).length, '関心はあるのに売れていない商品'],
        ['messages', 'メッセージ未読', s.messages.filter(function (m) { return !m.read; }).length, 'AI 返信案を使ってみましょう']
      ].filter(function (p) { return p[2] > 0; });
      return D.heading('ダッシュボード', '今の状況と、次にやることをひと目で。', 'OVERVIEW') + D.note('出品・在庫・注文・メッセージの状態から、優先して対応する作業を自動でまとめます。') + '<div class="grid three"><article class="card"><div class="metric-label">出品中</div><div class="metric">' + live.length + ' <small>件（例）</small></div><small>あなたの出品と初期デモ出品</small></article><article class="card"><div class="metric-label">ウォッチャー合計</div><div class="metric">' + live.reduce(function (sum, l) { return sum + l.watchers; }, 0) + ' <small>人（例）</small></div><small>出品中の商品に関心のある人</small></article><article class="card"><div class="metric-label">今回の体験の注文</div><div class="metric">' + s.orders.length + ' <small>件（例）</small></div><small>' + (s.orders.length ? '直近: ' + D.usd(s.orders[s.orders.length - 1].sale) : '注文管理で購入を再現できます') + '</small></article></div><section id="priorities" class="section"><div class="row between"><h2>AI 優先対応</h2><span class="badge">状態に合わせて更新</span></div><div class="grid two">' + priorities.map(function (p) { return '<a class="card priority" href="#/' + p[0] + '"><div><strong>' + p[1] + '</strong><small>' + p[3] + '</small></div><span class="count">' + p[2] + ' <small>件 →</small></span></a>'; }).join('') + (priorities.length ? '' : '<div class="card"><h3>今日やることはありません</h3></div>') + '</div></section><section class="card section"><div class="row between"><h2>閲覧数の推移（例）</h2><small>固定の学習用データ / 過去 7 日</small></div><svg class="chart" viewBox="0 0 700 200" role="img" aria-labelledby="chart-title"><title id="chart-title">閲覧数の例。1 日目から順に 20、35、28、50、42、65、75 回。</title><g stroke="#d9e0e9"><path d="M35 30H680M35 80H680M35 130H680M35 170H680"/></g><g fill="#2d5592">' + [40, 70, 56, 100, 84, 130, 150].map(function (h, i) { return '<rect x="' + (58 + i * 90) + '" y="' + (170 - h) + '" width="44" height="' + h + '" rx="5"/>'; }).join('') + '</g><g fill="#59677b" font-size="12" text-anchor="middle">' + [1, 2, 3, 4, 5, 6, 7].map(function (n, i) { return '<text x="' + (80 + i * 90) + '" y="192">' + n + ' 日目</text>'; }).join('') + '</g></svg></section>';
    }
  });
}());
