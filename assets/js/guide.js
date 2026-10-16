(function () {
  'use strict';
  var D = window.Demo;
  var steps = [
    ['welcome', 'はじめに。ガイド付きで体験を始めましょう。', '[data-action="start-guide"]'],
    ['products', '仕入れ先ページを開き、商品ページの URL をコピーしてください。', '[data-guide-market]'],
    ['products', '商品の URL を貼って「取得」を押してください。', '#import-url'],
    ['products', '取得した商品の「AI処理」を開き、実行してください。', '[data-action="ai-open"], [data-action="ai-run"]'],
    ['products', '英語タイトル・説明文・出品前チェックを確認してください。', '[data-action="review-result"], [data-action="ai-open"]'],
    ['profit', '送料を比較し、手残りの式を確認しましょう。', '#profit-form'],
    ['listings', 'チェックリストを確認して、出品してみましょう。', '[data-action="publish"]'],
    ['dashboard', 'ダッシュボードで今日やることを確認しましょう。', '#priorities'],
    ['monitor', '初期デモ出品の「売り切れ」を再現してください。', '[data-action="sold-out"]'],
    ['orders', '別の出品で購入を再現し、発送登録をしてください。', '[data-action="buy"], [data-shipping-form]'],
    ['messages', '買い手に AI 返信案を作って、送信しましょう。', '[data-action="reply-ai"], [data-reply-form]'],
    ['watchers', 'ウォッチャー分析を見て、割引オファーを送信しましょう。', '[data-guide-offers]'],
    ['auto-list', '自動出品のテンプレートを作成してください。', '#auto-form'],
    ['profit-report', '収益管理と送料管理で結果を確認し、まとめへ進みましょう。', '[data-guide-final]']
  ];
  function index() {
    var s = D.state, e = s.events;
    var complete = [s.started, s.marketOpened, s.products.length > 0,
      s.products.some(function (p) { return p.processed; }), e.resultReviewed, e.profitSeen,
      e.listed, e.dashboardSeen, e.monitorDone, s.orders.some(function (o) { return o.status === 'shipped'; }),
      s.messages.some(function (m) { return m.sent; }), e.watchersSeen && s.offers.length > 0,
      e.templateCreated, e.reportSeen && e.shippingSeen];
    var first = complete.findIndex(function (done) { return !done; });
    return first === -1 ? 14 : first;
  }
  D.guide = {
    index: index,
    render: function () {
      document.querySelectorAll('.guide-target').forEach(function (el) { el.classList.remove('guide-target'); });
      var host = document.getElementById('guide');
      if (!D.state.guide) { host.innerHTML = '<div class="row between"><small>自由に体験中 · すべてのメニューを利用できます</small><button data-guide="resume">ガイドを再開</button></div>'; return; }
      var n = index(), step = steps[Math.min(n, 13)], route = step[0];
      if (n === 11 && D.state.events.watchersSeen) route = 'offers';
      if (n === 13 && D.state.events.reportSeen) route = 'shipping';
      if (n === 14) route = 'summary';
      host.innerHTML = '<div class="guide-bar"><div><div class="step-label">' + (n === 14 ? 'GUIDE COMPLETE' : 'STEP ' + (n + 1) + ' / 14') + '</div><p><strong>' + (n === 14 ? 'ひと通り体験できました。まとめで振り返りましょう。' : step[1]) + '</strong></p><div class="guide-progress"><span style="width:' + (Math.min(n + 1, 14) / 14 * 100) + '%"></span></div></div><div class="guide-actions"><a class="button" href="#/' + route + '">' + (n === 14 ? 'まとめへ' : '体験する画面へ') + '</a><button class="text-button" data-guide="close">ガイドを閉じる</button></div></div>';
      if (n < 14 && D.route === route) {
        var target = document.querySelector(step[2]);
        if (target) target.classList.add('guide-target');
      }
    }
  };
  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('guide').addEventListener('click', function (event) {
      var button = event.target.closest('[data-guide]');
      if (!button) return;
      D.state.guide = button.dataset.guide === 'resume'; D.save(); D.guide.render();
    });
  });
}());
