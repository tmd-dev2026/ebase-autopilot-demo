(function () {
  'use strict';
  var D = window.Demo, storageKey = 'ebase-autopilot-demo-v3', screens = {}, activeScreen;
  var modalReturn = null, modalResolve = null, toastTimer, drawerReturn;
  D.state = D.initialState();
  try {
    var saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && saved.version === 3 && ['products', 'listings', 'orders', 'messages', 'templates', 'offers', 'report', 'shipping'].every(function (k) { return Array.isArray(saved[k]); }) && saved.events && saved.profitInputs) {
      D.state = Object.assign(D.initialState(), saved);
    }
  } catch (error) { /* The in-memory state remains fully usable. */ }
  D.state.jobs.forEach(function (job) { if (job.status === 'running') { job.status = 'cancelled'; job.detail = ''; } });
  D.save = function () { try { localStorage.setItem(storageKey, JSON.stringify(D.state)); } catch (error) { /* Memory fallback. */ } };
  D.esc = function (value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  D.yen = function (value) { var rounded = Math.round(value); return (rounded < 0 ? '-¥' : '¥') + Math.abs(rounded).toLocaleString('ja-JP'); };
  D.usd = function (value) { return '$' + Number(value).toFixed(2); };
  D.id = function (prefix) { return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7); };
  D.screens = screens;
  D.register = function (route, screen) { screens[route] = screen; };
  D.go = function (route) { if (location.hash === '#/' + route) D.render(); else location.hash = '#/' + route; };
  D.event = function (name) { D.state.events[name] = true; D.save(); };
  D.heading = function (title, subtitle, eyebrow) { return '<header class="page-heading"><div><div class="eyebrow">' + D.esc(eyebrow || 'DEMO WORKSPACE') + '</div><h1>' + D.esc(title) + '</h1><p>' + D.esc(subtitle || '') + '</p></div><span class="badge">体験版</span></header>'; };
  D.note = function (text) { return '<aside class="real-note"><div><strong>本物ではここが自動でこうなります</strong><p>' + D.esc(text) + '</p></div></aside>'; };
  D.empty = function (text, link, label) { return '<div class="card empty"><h3>' + D.esc(text) + '</h3><p>左のメニューからも自由に体験できます。</p>' + (link ? '<a class="button" href="#/' + link + '">' + D.esc(label) + '</a>' : '') + '</div>'; };
  D.image = function (p, small) { return '<img class="' + (small ? 'product-thumb' : 'product-image') + '" src="assets/img/' + p.image + '" alt="' + D.esc(p.name) + 'のデモ画像">'; };
  D.marketLink = function (attrs) { return '<a href="' + D.esc(window.DemoConfig.marketUrl) + '" target="_blank" rel="noopener" data-market ' + (attrs || '') + '>架空フリマ『eBaseマーケット(デモ)』を別タブで開く</a>'; };
  D.productUrl = function (p) { return window.DemoConfig.marketUrl.replace(/\/?$/, '/') + 'items/' + p.slug + '.html'; };
  D.live = function () { return D.state.listings.filter(function (l) { return l.status === 'live'; }); };
  D.selected = function () { return D.product(D.state.selected) || D.data.products[0]; };
  D.profitValues = function (id) {
    var p = D.product(id) || D.selected();
    return Object.assign({ sale: p.sale, cost: p.cost, weight: p.weightKg, rate: 155, buyerShipping: 0, carrier: 'SpeedPAK' }, D.state.profitInputs[p.id]);
  };
  D.listingProfit = function (listing, sale) {
    var quotes = window.DemoCalc.shippingRates(listing.weight), quote = quotes.find(function (q) { return q.carrier === listing.carrier; }) || quotes[0];
    return window.DemoCalc.calcProfit({ sale: sale === undefined ? listing.sale : sale, buyerShipping: listing.buyerShipping || 0, cost: listing.cost, rate: listing.rate, shipping: quote.price });
  };
  D.formula = function (input) {
    var r = window.DemoCalc.calcProfit(input);
    return '<dl class="formula"><div><dt>売値 ' + D.usd(input.sale) + ' + 買い手送料 ' + D.usd(input.buyerShipping || 0) + '<br>× 為替 ' + input.rate + ' 円/USD（例）</dt><dd>' + D.yen(r.revenueYen) + '</dd></div><div><dt>− 手数料<br><small>粗額 × (13.25% + 1.35%) + $0.40</small></dt><dd>' + D.yen(r.feeYen) + '</dd></div><div><dt>− 国際送料</dt><dd>' + D.yen(r.shipping) + '</dd></div><div><dt>− 仕入れ</dt><dd>' + D.yen(r.cost) + '</dd></div>' + (r.domestic || r.ads ? '<div><dt>− 国内送料 / 広告費</dt><dd>' + D.yen(r.domestic) + ' / ' + D.yen(r.ads) + '</dd></div>' : '') + '<div class="total"><dt>手残り（例）</dt><dd class="' + (r.net < 0 ? 'negative' : 'positive') + '">' + (r.net < 0 ? '赤字 ' : '黒字 ') + D.yen(r.net) + '</dd></div></dl><small>円表示は四捨五入。手残りは丸め前の手数料から計算します。</small>';
  };
  D.toast = function (text) {
    clearTimeout(toastTimer); document.getElementById('toast').textContent = text;
    toastTimer = setTimeout(function () { document.getElementById('toast').textContent = ''; }, 4500);
  };
  D.closeModal = function () {
    document.getElementById('modal-root').innerHTML = ''; document.body.classList.remove('modal-open');
    if (modalReturn && modalReturn.isConnected) modalReturn.focus(); else document.getElementById('main').focus({ preventScroll: true });
    modalReturn = null;
    if (modalResolve) { var finish = modalResolve; modalResolve = null; finish(false); }
  };
  D.modal = function (title, content) {
    if (document.querySelector('.modal')) D.closeModal();
    modalReturn = document.activeElement;
    document.getElementById('modal-root').innerHTML = '<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><div class="modal-head"><h2 id="modal-title">' + D.esc(title) + '</h2><button data-modal-close aria-label="ダイアログを閉じる">×</button></div>' + content + '</section></div>';
    document.body.classList.add('modal-open'); document.querySelector('.modal').focus();
  };
  D.confirm = function (title, content, labels) {
    return new Promise(function (resolve) {
      D.modal(title, content + (labels || []).map(function (label) { return '<label class="check-row"><input type="checkbox" data-confirm-check>' + D.esc(label) + '</label>'; }).join('') + '<div class="row section"><button data-modal-confirm class="primary">確認して進む</button><button data-modal-close>キャンセル</button></div><p id="confirm-error" role="status"></p>');
      modalResolve = resolve;
    });
  };
  D.busy = false;
  D.loading = async function (title, steps, duration) {
    if (D.busy) return false;
    D.busy = true;
    D.modal(title, '<p><span class="spinner" aria-hidden="true"></span><span id="loading-status" role="status" aria-live="polite">準備中…</span></p><ol class="loading-steps check-list">' + steps.map(function (s, i) { return '<li id="loading-' + i + '">○ ' + D.esc(s) + '</li>'; }).join('') + '</ol><small>処理はすべてデモです。閉じるとキャンセルできます。</small>');
    var dialog = document.querySelector('.modal');
    for (var i = 0; i < steps.length; i += 1) {
      if (!dialog.isConnected) { D.busy = false; return false; }
      document.getElementById('loading-status').textContent = steps[i];
      document.getElementById('loading-' + i).className = 'current';
      await new Promise(function (resolve) { setTimeout(resolve, duration || 650); });
      if (!dialog.isConnected) { D.busy = false; return false; }
      document.getElementById('loading-' + i).className = 'done';
      document.getElementById('loading-' + i).textContent = '✓ ' + steps[i];
    }
    D.closeModal(); D.busy = false; return true;
  };
  var menu = [
    ['仕入れ・出品', [['products', 'AI出品'], ['listings', '出品管理'], ['manual-list', 'その他出品']]],
    ['販売・利益', [['orders', '販売・収益'], ['profit', '利益計算']]],
    ['成長', [['watchers', 'マーケティング']]],
    ['サポート', [['messages', 'メッセージ']]]
  ];
  function parentRoute(route) {
    return { 'ai-process': 'products', monitor: 'listings', 'auto-list': 'manual-list', 'profit-report': 'orders', shipping: 'orders', offers: 'watchers' }[route] || route;
  }
  D.tabs = function (group, current) {
    var groups = { other: [['manual-list', '手動出品'], ['auto-list', '自動出品設定']], sales: [['orders', '注文'], ['profit-report', '収益']], marketing: [['watchers', 'ウォッチャー分析'], ['offers', 'オファー']] };
    return '<nav class="page-tabs" aria-label="ページ切替">' + groups[group].map(function (tab) {
      return '<a href="#/' + tab[0] + '"' + (tab[0] === current ? ' aria-current="page"' : '') + '>' + tab[1] + '</a>';
    }).join('') + '</nav>';
  };
  D.listingError = function (listing) { return listing && (listing.status === 'error' || !!listing.error); };
  D.productMatches = function (item, filter) {
    var listing = D.state.listings.find(function (l) { return l.own && l.productId === item.id; });
    var listed = !!listing;
    var error = D.listingError(listing) || item.error || item.aiError || (item.processed && window.DemoCalc.validateListing(item).length > 0);
    if (filter === 'errors') return !!error;
    if (filter === 'ai-pending') return !item.processed && !error;
    if (filter === 'price-pending') return item.processed && !error && !listed && !item.priceSet && !D.state.profitInputs[item.id];
    if (filter === 'ready') return item.processed && !error && !listed;
    return true;
  };
  D.filterNotice = function (route) {
    var labels = { errors: '出品エラー', 'ai-pending': 'AI処理待ち', 'price-pending': '価格設定待ち', ready: '出品待ち', pending: '発送待ちの注文', unavailable: '仕入れ元が売り切れ・削除', markdown: '値下げ候補' };
    return D.filter ? '<p class="filter-notice">絞り込み: ' + D.esc(labels[D.filter] || D.filter) + ' <a href="#/' + route + '">すべて表示</a></p>' : '';
  };
  var navOpen = {};
  function navLink(route, label) {
    var unread = D.state.messages.filter(function (m) { return !m.read; }).length;
    return '<a class="nav-link' + (parentRoute(D.route) === route ? ' active' : '') + '" ' + (parentRoute(D.route) === route ? 'aria-current="page" ' : '') + 'href="#/' + route + '">' + label + (route === 'messages' && unread ? '<span class="badge">' + unread + '</span>' : '') + '</a>';
  }
  D.navigation = function () {
    document.getElementById('navigation').innerHTML = navLink('dashboard', 'ダッシュボード') + menu.map(function (group, i) {
      var current = group[1].some(function (m) { return m[0] === parentRoute(D.route); });
      return '<details data-nav-group="' + i + '"' + (current || navOpen[i] !== false ? ' open' : '') + '><summary>' + group[0] + '</summary>' + group[1].map(function (m) { return navLink(m[0], m[1]); }).join('') + '</details>';
    }).join('');
    document.querySelectorAll('[data-nav-group]').forEach(function (el) { el.addEventListener('toggle', function () { navOpen[el.dataset.navGroup] = el.open; }); });
  };
  D.render = function () {
    var route = location.hash.replace(/^#\//, '') || 'welcome';
    var query = route.split('?');
    route = query[0]; D.filter = ((query[1] || '').match(/(?:^|&)filter=([a-z-]+)/) || [])[1] || '';
    var parts = route.split('/');
    if (parts[0] === 'ai-process' && D.product(parts[1])) { D.state.selected = parts[1]; route = 'ai-process'; }
    if (!screens[route]) route = 'welcome';
    D.route = route; activeScreen = screens[route];
    if (route === 'profit') D.event('profitSeen');
    if (route === 'dashboard' && D.state.events.listed) D.event('dashboardSeen');
    if (route === 'watchers') D.event('watchersSeen');
    if (route === 'profit-report' || route === 'shipping') D.event('reportSeen');
    if (route === 'shipping') D.event('shippingSeen');
    D.navigation();
    document.getElementById('main').innerHTML = activeScreen.render();
    if (activeScreen.afterRender) activeScreen.afterRender();
    D.guide.render();
  };
  D.refreshGuide = function () { D.save(); D.navigation(); D.guide.render(); };
  function closeDrawer() {
    document.getElementById('sidebar').classList.remove('open'); document.getElementById('drawer-backdrop').hidden = true;
    document.getElementById('menu-toggle').setAttribute('aria-expanded', 'false');
    if (drawerReturn) { drawerReturn.focus(); drawerReturn = null; }
  }
  function trap(event, container) {
    var elements = Array.from(container.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex="0"]')).filter(function (el) { return el.getClientRects().length; });
    var first = elements[0], last = elements[elements.length - 1];
    if (!first) return;
    if (event.shiftKey && (document.activeElement === first || document.activeElement === container)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === container)) { event.preventDefault(); first.focus(); }
  }
  document.addEventListener('DOMContentLoaded', function () {
    var systemTheme = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    function themeButton() {
      var dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && systemTheme && systemTheme.matches);
      var button = document.getElementById('theme-toggle');
      button.textContent = dark ? '☀' : '☾'; button.setAttribute('aria-pressed', String(!!dark));
      button.setAttribute('aria-label', dark ? 'ライトモードに切り替える' : 'ダークモードに切り替える');
    }
    themeButton();
    document.getElementById('theme-toggle').addEventListener('click', function () {
      var current = this.getAttribute('aria-pressed') === 'true' ? 'dark' : 'light', storage;
      try { storage = window.localStorage; } catch (error) { storage = null; }
      document.documentElement.dataset.theme = window.DemoTheme.toggle(current, storage); themeButton();
    });
    if (systemTheme && systemTheme.addEventListener) systemTheme.addEventListener('change', themeButton);
    function renderRoute() {
      D.render();
      document.getElementById('main').focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
    renderRoute();
    window.addEventListener('hashchange', function () { if (document.querySelector('.modal')) D.closeModal(); closeDrawer(); renderRoute(); });
    document.getElementById('menu-toggle').addEventListener('click', function () {
      drawerReturn = document.activeElement; document.getElementById('sidebar').classList.add('open');
      document.getElementById('drawer-backdrop').hidden = false; this.setAttribute('aria-expanded', 'true'); document.getElementById('menu-close').focus();
    });
    document.getElementById('menu-close').addEventListener('click', closeDrawer);
    document.getElementById('drawer-backdrop').addEventListener('click', closeDrawer);
    document.getElementById('reset-button').addEventListener('click', async function () {
      closeDrawer();
      if (D.working) { D.toast('処理が終わってから初期化してください'); return; }
      if (await D.confirm('最初からやり直す', '<p>このブラウザに保存した体験の操作を初期化し、初期の見本データに戻します。テーマ設定は保持します。</p>')) {
        D.state = D.initialState(); D.save(); D.go('welcome'); D.toast('体験を初期化しました');
      }
    });
    document.addEventListener('click', function (event) {
      if (event.target.closest('.skip-link')) { event.preventDefault(); document.getElementById('main').focus({ preventScroll: true }); return; }
      var market = event.target.closest('[data-market]');
      if (market) { D.state.marketOpened = true; D.state.started = true; D.refreshGuide(); }
      if (event.target.closest('[data-modal-close]')) D.closeModal();
      if (event.target.closest('[data-modal-confirm]')) {
        var checks = Array.from(document.querySelectorAll('[data-confirm-check]'));
        if (checks.some(function (c) { return !c.checked; })) { document.getElementById('confirm-error').textContent = '3 項目すべてを確認してください。'; return; }
        var finish = modalResolve; modalResolve = null; D.closeModal(); if (finish) finish(true);
      }
    });
    document.getElementById('main').addEventListener('click', function (event) {
      var button = event.target.closest('[data-action]');
      if (button && activeScreen.click && !D.busy && !D.working) Promise.resolve(activeScreen.click(button.dataset.action, button, event)).catch(function () { D.toast('操作を完了できませんでした。入力を確認してください。'); });
    });
    ['input', 'change', 'submit'].forEach(function (type) {
      document.getElementById('main').addEventListener(type, function (event) {
        if (type === 'submit') event.preventDefault();
        if (activeScreen[type] && !D.busy && !D.working) Promise.resolve(activeScreen[type](event)).catch(function () { D.toast('入力を確認してください。0 以上の数字が必要です。'); });
      });
    });
    document.addEventListener('keydown', function (event) {
      var modal = document.querySelector('.modal'), drawer = document.querySelector('.sidebar.open');
      if (event.key === 'Escape') { if (modal) D.closeModal(); else closeDrawer(); }
      if (event.key === 'Tab') { if (modal) trap(event, modal); else if (drawer) trap(event, drawer); }
      var tab = event.target.closest('[role="tab"]');
      if (tab && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        var tabs = Array.from(tab.parentElement.querySelectorAll('[role="tab"]')), index = tabs.indexOf(tab);
        var next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        tabs[next].click();
      }
    });
  });
}());
