(function (root) {
  'use strict';
  var config = { marketUrl: 'https://tmd-dev2026.github.io/ebase-market-demo/' };
  if (root) root.DemoConfig = config;
  if (typeof module !== 'undefined' && module.exports) module.exports = config;
}(typeof window !== 'undefined' ? window : null));
