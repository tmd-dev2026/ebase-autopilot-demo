(function () {
  'use strict';
  var D = window.Demo;
  D.market = {
    init: function () {
      var field = document.getElementById('page-url'), button = document.getElementById('copy-url');
      if (!field || !button) return;
      field.value = location.href;
      button.addEventListener('click', async function () {
        var status = document.getElementById('copy-status');
        try {
          if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(field.value); status.textContent = 'URL をコピーしました。体験版に貼り付けて「取得」を押してください。';
        } catch (error) {
          field.focus(); field.select(); field.setSelectionRange(0, field.value.length);
          status.textContent = '長押しでコピーしてください。パソコンでは Ctrl+C / ⌘C でコピーできます。';
        }
      });
    }
  };
  document.addEventListener('DOMContentLoaded', D.market.init);
}());
