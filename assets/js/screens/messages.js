(function () {
  'use strict';
  var D = window.Demo;
  function find(id) { return D.state.messages.find(function (m) { return m.id === id; }); }
  D.register('messages', {
    render: function () {
      return D.heading('メッセージ', '英語のやり取りを、日本語で確認。', 'BUYER CONVERSATIONS') + D.note('買い手からのメッセージを取り込み、日本語訳と英語の返信案を作成します。内容を確認・編集してから送信できます。') + (D.state.messages.length ? D.state.messages.map(function (m) {
        return '<article class="card"><div class="row between"><h2>buyer_demo_01 <small>架空の買い手</small></h2><span class="badge ' + (m.read ? '' : 'warning') + '">' + (m.read ? '既読' : '未読') + '</span></div>' + D.image(D.product(m.productId), true) + '<p class="muted">' + D.esc(D.product(m.productId).name) + '</p><p class="message-bubble" lang="en">' + D.esc(m.text) + '</p>' + (m.translated ? '<p class="message-bubble">日本語訳: ' + D.esc(m.translation) + '</p>' : '') + '<div class="row"><button data-action="translate" data-id="' + m.id + '">日本語で表示</button><button data-action="reply-ai" data-id="' + m.id + '">AI 返信案を作る</button>' + (!m.read ? '<button data-action="read" data-id="' + m.id + '">既読にする</button>' : '') + '</div>' + (m.draft ? '<form class="section" data-reply-form data-id="' + m.id + '"><label>英語の返信案（編集可）<textarea name="reply" rows="5" required lang="en">' + D.esc(m.draft) + '</textarea></label><p class="field-note">生成時の日本語の意味: ' + D.esc(m.meaning) + '</p><p class="field-note">英文を編集しても、この日本語の意味は自動更新されません。</p><button type="submit">送信（デモ）</button></form>' : '') + (m.sent ? '<div class="section"><span class="badge success">送信済み（デモ）</span><p class="message-bubble sent-bubble" lang="en">' + D.esc(m.sent) + '</p></div>' : '') + '</article>';
      }).join('') : D.empty('注文が入ると、買い手からメッセージが届きます', 'orders', '注文管理で購入を再現'));
    },
    click: async function (action, button) {
      var m = find(button.dataset.id); if (!m) return;
      if (action === 'translate') { m.translated = true; m.read = true; }
      if (action === 'read') m.read = true;
      if (action === 'reply-ai') {
        if (m.draft && !await D.confirm('返信案を作り直す', '<p>編集中の返信案を、デモの定型文に戻します。</p>')) return;
        if (!await D.loading('AI が返信案を作成しています', ['注文の発送状態を確認中…', '英語の返信案と日本語の意味を作成中…'], 800)) return;
        var o = D.state.orders.find(function (order) { return order.id === m.orderId; });
        var shipped = o && o.status === 'shipped';
        m.draft = shipped ? 'Thank you for your message. Your item has been shipped to the United States. The tracking number is ' + o.tracking + '. Please allow some time for tracking updates.' : 'Thank you for your message. We will ship your item to the United States. We are preparing your order and will share the tracking number once it has been shipped.';
        m.meaning = shipped ? 'お問い合わせありがとうございます。商品は米国へ発送済みです。追跡番号は ' + o.tracking + ' です。追跡情報の更新まで少しお待ちください。' : 'お問い合わせありがとうございます。商品は米国へ発送します。現在準備中で、発送後に追跡番号をお知らせします。';
        m.read = true;
      }
      D.save(); D.render();
    },
    input: function (event) { var form = event.target.closest('[data-reply-form]'); if (form) { find(form.dataset.id).draft = event.target.value; D.save(); } },
    submit: async function (event) {
      var form = event.target; if (!form.matches('[data-reply-form]')) return;
      var m = find(form.dataset.id), value = new FormData(form).get('reply').trim();
      if (!value) { D.toast('返信文を入力してください', true); return; }
      if (!await D.loading('返信しています（デモ）', ['返信内容を確認中…', '送信しました（デモ）'], 600)) return;
      m.sent = value; m.sentMeaning = m.meaning; m.draft = ''; m.read = true; D.event('replied'); D.save(); D.render(); D.toast('返信を保存しました（デモ）');
    }
  });
}());
