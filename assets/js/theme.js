(function (root) {
  'use strict';
  var key = 'ebase-autopilot-theme';
  function restore(storage, systemDark) {
    var saved;
    try { saved = storage.getItem(key); } catch (error) { /* System fallback. */ }
    return saved === 'light' || saved === 'dark' ? saved : (systemDark ? 'dark' : 'light');
  }
  function toggle(current, storage) {
    var next = current === 'dark' ? 'light' : 'dark';
    try { storage.setItem(key, next); } catch (error) { /* The caller still applies the theme. */ }
    return next;
  }
  var api = { restore: restore, toggle: toggle };
  if (root) root.DemoTheme = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
}(typeof window !== 'undefined' ? window : null));
