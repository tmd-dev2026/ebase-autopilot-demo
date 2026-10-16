(function () {
  'use strict';
  var D = window.Demo;
  D.register('auto-list', {
    render: function () {
      return D.heading('自動出品設定', '出品のペースを、あらかじめ決める。', 'YOUR LISTING ROUTINE') + D.note('カテゴリや頻度、時刻、件数を設定すると、スケジュールに沿って出品を進めます。失敗した項目は理由と次の作業を確認できます。') + '<section class="card"><h2>テンプレートを作成</h2><form id="auto-form"><div class="form-grid"><label>カテゴリ<select name="category"><option>トレカ</option><option>カメラ</option></select></label><label>頻度<select name="frequency"><option>毎日</option><option>毎週</option></select></label><label>時刻（日本時間）<input type="time" name="time" value="09:00" required></label><label>1 回の件数（例）<input type="number" name="count" min="1" max="20" value="3" required></label></div><p class="field-note">毎週は月曜日に実行する例です。体験版では時刻になっても実行されません。</p><button class="primary" type="submit">テンプレートを追加</button></form></section><h2>作成したテンプレート</h2>' + (D.state.templates.length ? D.state.templates.map(function (t) { return '<article class="card schedule"><div><h3>' + D.esc(t.category) + ' / ' + D.esc(t.frequency) + (t.frequency === '毎週' ? ' 月曜日' : '') + '</h3><span class="badge ' + (t.paused ? 'warning' : 'success') + '">' + (t.paused ? '一時停止中' : '稼働中（デモ）') + '</span><p>' + D.esc(t.time) + ' · 1 回 ' + t.count + ' 件（例）</p></div><div class="row"><button data-action="toggle" data-id="' + t.id + '">' + (t.paused ? '再開' : '一時停止') + '</button><button data-action="delete" data-id="' + t.id + '" class="danger-button">削除</button></div></article>'; }).join('') : '<p class="muted">まだテンプレートはありません。</p>') + '<section class="card section"><h2>実行結果（固定の例）</h2><p><span class="badge success">出品 3 件</span> <span class="badge danger">失敗 1 件</span></p><h3>失敗の理由</h3><p>商品状態の必須項目が空欄のため、出品前チェックで停止しました。</p><h3>次にやること</h3><p>商品状態を確認して入力し、出品前チェックをもう一度実行してください。</p><a class="button" href="#/products">AI出品で内容を確認</a></section><a class="button" href="#/profit-report">収益管理へ →</a>';
    },
    submit: function (event) {
      if (event.target.id !== 'auto-form' || !event.target.reportValidity()) return;
      var v = new FormData(event.target);
      D.state.templates.push({ id: D.id('template'), category: v.get('category'), frequency: v.get('frequency'), time: v.get('time'), count: Number(v.get('count')), paused: false }); D.event('templateCreated'); D.save(); D.render(); D.toast('テンプレートを追加しました');
    },
    click: async function (action, button) {
      var t = D.state.templates.find(function (item) { return item.id === button.dataset.id; }); if (!t) return;
      if (action === 'toggle') t.paused = !t.paused;
      if (action === 'delete' && await D.confirm('テンプレートを削除', '<p>このテンプレートを削除します。</p>')) D.state.templates = D.state.templates.filter(function (item) { return item.id !== t.id; });
      D.save(); D.render();
    }
  });
}());
