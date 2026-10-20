(function (root) {
  'use strict';
  var config = {
    marketUrl: 'https://tmd-dev2026.github.io/ebase-market-demo/',
    ctaUrl: '',
    ctaLabel: '説明会の担当者に相談する',
    ctaNote: 'このあとの流れや料金は、説明会の担当者がご案内します。'
  };
  if (root) root.DemoConfig = config;
  if (typeof module !== 'undefined' && module.exports) module.exports = config;
}(typeof window !== 'undefined' ? window : null));
