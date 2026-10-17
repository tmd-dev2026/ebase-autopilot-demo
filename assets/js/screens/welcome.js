(function () {
  'use strict';
  var D = window.Demo;
  D.register('welcome', {
    render: function () {
      return D.heading('出品の流れを、あなたの手で。', 'eBase Autopilot 体験版へようこそ', 'WELCOME TO AUTOPILOT') + D.note('商品情報の取得から英語の出品文づくり、在庫確認までを自動化します。あなたは内容と利益を確認して、出品を判断します。') +
        '<section class="card hero"><span class="badge">はじめての出品を、ここで練習</span><h1 class="section">ひとつの URL から、<br>出品後の管理まで。</h1><div class="hero-copy"><p>架空のフリマから商品を選び、AI出品の流れを体験できます。<br>出品・注文・メッセージはすべてデモ。実際の取引は発生しません。<br>ログインも個人情報も不要です。気になる画面から自由に触れます。</p><div class="row"><button class="primary" data-action="start-guide">ガイド付きで始める →</button><button data-action="free">自由に触る</button></div></div><p class="section">' + D.marketLink() + '</p></section><div class="grid three section"><article class="card"><h3>01 商品を取り込む</h3><p class="muted">URL を貼るだけで、価格・画像・説明をまとめて取得する流れを体験。</p></article><article class="card"><h3>02 利益を確認して出品</h3><p class="muted">英文と注意点を確認。送料や為替を変え、手残りを比べてみましょう。</p></article><article class="card"><h3>03 売れた後も見渡せる</h3><p class="muted">在庫、注文、メッセージ、収益まで、ひとつの画面で管理します。</p></article></div>';
    },
    click: function (action) {
      if (action === 'start-guide' || action === 'free') { D.state.started = true; D.state.guide = action === 'start-guide'; D.save(); D.go(action === 'free' ? 'dashboard' : 'products'); }
    }
  });
  D.register('summary', {
    render: function () {
      var s = D.state, e = s.events;
      var items = [
        [s.products.length, 'URL から商品情報を取得'], [s.products.some(function (p) { return p.processed; }), '英語タイトル・説明文・商品詳細の作成'],
        [e.resultReviewed, '出品前の注意点をチェック'], [e.profitSeen, '送料と手残りを自動計算'], [e.listed, '確認した商品を出品'],
        [e.monitorDone, '仕入れ元の売り切れを検知して取り下げ'], [e.shipped, '注文の取り込みと発送登録'],
        [s.messages.some(function (m) { return m.sent; }), '買い手への返信案を作成して送信'], [s.offers.length, '割引オファーの手残りを計算'],
        [e.templateCreated, '自動出品のスケジュールを設定'], [e.reportSeen && e.shippingSeen, '収益と送料の差額を集計']
      ];
      return D.heading('体験のまとめ', '自動になる作業と、あなたが判断すること。', 'YOUR EXPERIENCE') + D.note('繰り返しの作業を自動で進め、状況をまとめてお知らせします。出品内容や真贋、利益の最終確認は出品者が行います。') + '<section class="card"><h2>今回体験したこと</h2><ul class="check-list">' + items.map(function (item) { return '<li><span class="' + (item[0] ? 'scheduled' : 'muted') + '">' + (item[0] ? '✓ 体験済み' : '○ 未体験') + '</span>　' + item[1] + '</li>'; }).join('') + '</ul></section><section class="card"><h2>本物との違い</h2><p>この体験版は、商品取得・AI処理・出品・取引を固定のダミーデータで再現しています。<br>本物では外部サービスとの接続と設定が必要になり、結果は商品や条件によって変わります。<br>体験版の価格・手数料・送料・為替・手残りはすべて例で、実際の結果を保証しません。</p></section><!-- CTA_PLACEHOLDER -->';
    }
  });
}());
