'use strict';
var assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
var root = path.resolve(__dirname, '..');
function filesIn(directory) { return fs.readdirSync(directory, { withFileTypes: true }).flatMap(function (entry) { var full = path.join(directory, entry.name); return entry.isDirectory() ? filesIn(full) : [full]; }); }
var files = [path.join(root, 'index.html')].concat(filesIn(path.join(root, 'assets')));
['market', 'assets/css/market.css', 'assets/js/market.js'].forEach(function (file) { assert(!fs.existsSync(path.join(root, file)), file); });
var banned = [/\bfetch\s*\(/i, /XMLHttpRequest|WebSocket|sendBeacon/i, /\b(?:import|export)\s+(?:\{|\*|default|[A-Za-z_$])/, /(?:src|href|srcset|poster|action)\s*=\s*["']\s*(?:https?:)?\/\//i, /url\(\s*["']?\s*(?:https?:)?\/\//i, /@import/i, /Nikon|Canon|Seiko|Pokemon|ポケモン|Sony|Nintendo|Bandai|Gucci|Mercari|メルカリ|ヤフオク/i, /稼げ|必ず売れる|\d+\s*人が使用中/, /\b(?:api[_-]?key|password|secret[_-]?key|access[_-]?token)\s*[:=]/i, /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/];
files.forEach(function (file) {
  var source = fs.readFileSync(file, 'utf8');
  banned.forEach(function (rule) { assert(!rule.test(source), path.relative(root, file) + ': ' + rule); });
  assert(!source.includes('/market/'), file);
  if (!file.endsWith('.svg') && !file.endsWith('config.js')) assert(!/https?:\/\/[A-Za-z0-9]/.test(source), 'Unexpected external URL: ' + file);
  if (file.endsWith('.svg')) assert(!/ebay/i.test(path.basename(file)));
});
var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(html.includes('name="robots" content="noindex,nofollow"'));
assert(html.includes('name="viewport"'));
assert(fs.readFileSync(path.join(root, '_headers'), 'utf8').includes('X-Robots-Tag: noindex, nofollow'));
assert(fs.readFileSync(path.join(root, 'robots.txt'), 'utf8').includes('Disallow: /'));
Array.from(html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)).forEach(function (m) { assert(fs.existsSync(path.resolve(root, m[1])), m[1]); });
Array.from(html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)).forEach(function (m) {
  assert(!/type="module"/.test(m[1]));
  if (/\bsrc=/.test(m[1])) assert(/\bdefer\b/.test(m[1])); else new vm.Script(m[2]);
});
var products = require('../assets/js/products-data.js').products;
products.forEach(function (p) { assert.strictEqual(p.images.length, 4); p.images.forEach(function (img) { assert(fs.existsSync(path.join(root, 'assets/img', img.file))); }); });
var core = fs.readFileSync(path.join(root, 'assets/js/core.js'), 'utf8');
assert(core.includes('target="_blank" rel="noopener"'));
assert(!core.slice(core.indexOf('D.navigation ='), core.indexOf('D.render =')).includes('marketLink'));
var linkCalls = files.filter(function (f) { return f.endsWith('.js'); }).filter(function (f) { return /D\.marketLink\(/.test(fs.readFileSync(f, 'utf8')); }).map(function (f) { return path.relative(root, f); });
assert.deepStrictEqual(linkCalls.sort(), ['assets/js/guide.js', 'assets/js/screens/products.js', 'assets/js/screens/welcome.js']);
console.log('Static checks passed: ' + files.length + ' app files; no network APIs, forbidden names, promises, or embedded market.');
