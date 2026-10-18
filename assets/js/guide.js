(function () {
  'use strict';
  var D = window.Demo, previous = '', currentTarget = '';
  var steps = [
    ['welcome', 'ガイド付きで体験を始めましょう。', '[data-action="start-guide"]'],
    ['products', 'フリマの商品ページで URL をコピーしましょう。', '[data-guide-market]'],
    ['products', 'URL を貼って取得。AI 処理まで進みます。', '#import-url'],
    ['ai-process', '出品前チェックを見て、価格設定を開きましょう。', '#price-card>summary'],
    ['profit', '配送方法を切り替えて、手残りを見てみましょう。', '#profit-form [name="carrier"]'],
    ['listings', '「出品する」を押してください。', '[data-action="publish"]'],
    ['dashboard', '優先して対応する作業を確認しましょう。', '#priorities'],
    ['dashboard', '在庫監視を開き、売り切れを再現しましょう。', '[data-guide-monitor]'],
    ['orders', '購入を再現し、発送登録してください。', '[data-action="buy"]'],
    ['messages', 'AI 返信案を作り、確認して送信しましょう。', '[data-action="reply-ai"], [data-reply-form]'],
    ['watchers', 'ウォッチャーを見て、オファーを試しましょう。', '[data-guide-offers]'],
    ['profit-report', '収益の下の『送料管理』を開き、送料の差額を確認しましょう。', '#shipping-section>summary']
  ];
  function index() {
    var s = D.state, e = s.events;
    var complete = [s.started || s.products.length > 0, s.marketOpened || s.products.length > 0, s.products.some(function (p) { return p.processed; }), e.priceSeen || e.profitCompared || e.listed, e.profitCompared || e.listed, e.listed, e.dashboardSeen, e.monitorDone, e.purchased && e.shipped, e.replied, e.watchersSeen && s.offers.length > 0 && e.templateCreated, e.reportSeen && e.shippingSeen];
    var first = complete.findIndex(function (done) { return !done; });
    return first === -1 ? steps.length : first;
  }
  D.guide = {
    index: index,
    render: function () {
      document.querySelectorAll('.guide-target').forEach(function (el) { el.classList.remove('guide-target'); });
      var host = document.getElementById('guide');
      if (!D.state.guide) { previous = ''; host.innerHTML = '<div class="row between"><small>自由に体験中</small><button data-guide="resume">ガイドを再開</button></div>'; return; }
      var n = index(), step = steps[Math.min(n, 11)].slice(), route = step[0];
      if (n === 3) route += '/' + D.state.selected;
      if (n === 4 && D.route === 'ai-process') { route = 'ai-process/' + D.state.selected; step[1] = '利益計算で配送方法と手残りを比べましょう。'; step[2] = '[data-action="to-profit"]'; }
      if (n === 5 && D.route === 'profit') { route = 'profit'; step[1] = '出品管理へ進み、『出品する』を押してください。'; step[2] = '[data-action="to-listings"]'; }
      if (n === 7 && D.route === 'monitor') { route = 'monitor'; step[1] = 'おすすめの初期デモ出品で売り切れを再現しましょう。'; step[2] = '[data-recommended] [data-action="sold-out"], [data-action="sold-out"]'; }
      if (n === 8 && D.state.events.purchased) {
        var order = D.state.orders.find(function (o) { return !o.example && o.status === 'pending'; });
        if (order) { step[1] = '追跡番号の例を入れて、発送登録してください。'; step[2] = '[data-shipping-form][data-id="' + order.id + '"] [name="tracking"]'; }
      }
      if (n === 9) {
        var reply = D.state.messages.find(function (m) { return m.draft && !m.sent; });
        if (reply) { step[1] = '返信案を確認して送信しましょう。'; step[2] = '[data-reply-form][data-id="' + reply.id + '"]'; }
      }
      if (n === 10 && D.state.events.watchersSeen && D.route !== 'watchers') {
        route = D.state.offers.length ? 'auto-list' : 'offers';
        step[1] = D.state.offers.length ? '自動出品のスケジュールを追加しましょう。' : '割引率を選んで、オファーを送信しましょう。';
        step[2] = D.state.offers.length ? '#auto-form' : '[data-action="send"], [data-offer-form]';
      }
      if (n === 11 && D.route === 'shipping') route = 'shipping';
      if (n === 12) { route = 'summary'; step[1] = 'ひと通り体験できました'; step[2] = ''; }
      var same = D.route === route.split('/')[0], finished = n === 12 && same;
      currentTarget = step[2];
      host.innerHTML = '<div class="guide-bar"><div class="guide-copy"><p><span class="step-label">' + (n === 12 ? '完了' : 'STEP ' + (n + 1) + ' / 12') + '</span> <strong>' + step[1] + '</strong></p><div class="guide-progress"><span style="width:' + (Math.min(n + 1, 12) / 12 * 100) + '%"></span></div></div><div class="guide-actions">' + (finished ? '' : n === 1 ? D.marketLink('class="button primary" data-guide-market aria-label="架空フリマ『eBaseマーケット(デモ)』を別タブで開く"').replace('>架空フリマ『eBaseマーケット(デモ)』を別タブで開く</a>', '>フリマを開く ↗</a>') : same ? '<button class="primary" data-guide="target">ここで操作する</button>' : '<a class="button primary" data-guide-next href="#/' + route + '">' + (n === 12 ? 'まとめへ' : '体験する画面へ') + '</a>') + '<button class="text-button" data-guide="close">ガイドを閉じる</button></div>' + '</div>';
      var target = same && step[2] ? document.querySelector(step[2]) : null;
      if (target) target.classList.add('guide-target');
      var key = n + ':' + D.route + ':' + step[2];
      if ((previous && previous !== key) || (!previous && n === 2 && same)) {
        window.requestAnimationFrame(function () {
          if (previous !== key || document.querySelector('.modal')) return;
          D.reveal(target || document.querySelector('[data-guide-next]'));
        });
      }
      previous = key;
    }
  };
  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('guide').addEventListener('click', function (event) {
      var button = event.target.closest('[data-guide]'); if (!button) return;
      if (button.dataset.guide === 'target') { D.reveal(document.querySelector(currentTarget)); return; }
      D.state.guide = button.dataset.guide === 'resume'; D.save(); D.guide.render();
    });
  });
}());
