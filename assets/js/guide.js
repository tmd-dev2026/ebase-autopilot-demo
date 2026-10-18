(function () {
  'use strict';
  var D = window.Demo;
  var steps = [
    ['welcome', 'はじめに。ガイド付きで体験を始めましょう。', '[data-action="start-guide"]'],
    ['products', '別タブでフリマを開き、商品ページの URL をコピーしてください。', '[data-guide-market]'],
    ['products', 'URL を貼って取得してください。自動で AI 処理が始まります。', '#import-url'],
    ['ai-process', '結果と出品前チェックの要修正・注意を確認してください。', '[data-action="review-result"]'],
    ['profit', '送料を比較し、手残りの式を確認しましょう。', '#profit-form'],
    ['listings', '「出品する」を押して出品してください。', '[data-action="publish"]'],
    ['dashboard', '優先して対応する作業を確認しましょう。', '#priorities'],
    ['dashboard', 'ダッシュボードから在庫監視を開き、初期デモ出品の売り切れを再現してください。', '[data-guide-monitor]'],
    ['orders', '別の出品で購入を再現し、発送登録してください。', '[data-action="buy"], [data-shipping-form]'],
    ['messages', 'AI 返信案を作り、確認して送信しましょう。', '[data-action="reply-ai"], [data-reply-form]'],
    ['watchers', 'ウォッチャー・オファー・自動出品設定を体験しましょう。', '[data-guide-offers], #auto-form, [data-action="send"]'],
    ['profit-report', '収益と送料を確認し、まとめへ進みましょう。', '[data-guide-final]']
  ];
  function index() {
    var s = D.state, e = s.events;
    var complete = [s.started, s.marketOpened || s.products.length > 0, s.products.some(function (p) { return p.processed; }), e.resultReviewed, e.profitSeen, e.listed, e.dashboardSeen, e.monitorDone, e.purchased && e.shipped, e.replied, e.watchersSeen && s.offers.length > 0 && e.templateCreated, e.reportSeen && e.shippingSeen];
    var first = complete.findIndex(function (done) { return !done; });
    return first === -1 ? steps.length : first;
  }
  D.guide = {
    index: index,
    render: function () {
      document.querySelectorAll('.guide-target').forEach(function (el) { el.classList.remove('guide-target'); });
      var host = document.getElementById('guide');
      if (!D.state.guide) { host.innerHTML = '<div class="row between"><small>自由に体験中 · すべてのメニューを利用できます</small><button data-guide="resume">ガイドを再開</button></div>'; return; }
      var n = index(), step = steps[Math.min(n, 11)], route = step[0];
      if (n === 7 && D.route === 'monitor') { route = 'monitor'; step = ['monitor', step[1], '[data-action="sold-out"]']; }
      if (n === 3) route += '/' + D.state.selected;
      if (n === 10 && D.state.events.watchersSeen) route = D.state.offers.length ? 'auto-list' : 'offers';
      if (n === 11 && D.state.events.reportSeen) route = 'shipping';
      if (n === 12) route = 'summary';
      host.innerHTML = '<div class="guide-bar"><div><div class="step-label">' + (n === 12 ? 'GUIDE COMPLETE' : 'STEP ' + (n + 1) + ' / 12') + '</div><p><strong>' + (n === 12 ? 'まとめで体験を振り返りましょう。' : step[1]) + '</strong></p>' + (n === 1 ? D.marketLink('data-guide-market') : '') + '<div class="guide-progress"><span style="width:' + (Math.min(n + 1, 12) / 12 * 100) + '%"></span></div></div><div class="guide-actions"><a class="button" href="#/' + route + '">' + (n === 12 ? 'まとめへ' : '体験する画面へ') + '</a><button class="text-button" data-guide="close">ガイドを閉じる</button></div></div>';
      if (n < 12 && D.route === route.split('/')[0]) { var target = document.querySelector(step[2]); if (target) target.classList.add('guide-target'); }
    }
  };
  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('guide').addEventListener('click', function (event) { var button = event.target.closest('[data-guide]'); if (!button) return; D.state.guide = button.dataset.guide === 'resume'; D.save(); D.guide.render(); });
  });
}());
