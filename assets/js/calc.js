(function (root) {
  'use strict';
  var products = (typeof module !== 'undefined' && module.exports ? require('./products-data.js') : root.DemoProducts).products;
  function number(value, fallback) {
    var n = value === undefined ? fallback : Number(value);
    if (!Number.isFinite(n) || n < 0) throw new RangeError('0 以上の有限の数を入力してください');
    return n;
  }
  function calcProfit(input) {
    var sale = number(input.sale, 0), buyerShipping = number(input.buyerShipping, 0);
    var rate = number(input.rate, 155), shipping = number(input.shipping, 0);
    var cost = number(input.cost, 0), domestic = number(input.domestic, 0), ads = number(input.ads, 0);
    var gross = sale + buyerShipping;
    var feeUsd = gross * (0.1325 + 0.0135) + 0.40;
    var revenueYen = gross * rate, feeYen = feeUsd * rate;
    return { gross: gross, feeUsd: feeUsd, feeYen: feeYen, revenueYen: revenueYen,
      shipping: shipping, cost: cost, domestic: domestic, ads: ads,
      net: Math.round((gross - feeUsd) * rate - shipping - cost - domestic - ads) };
  }
  function shippingRates(weight) {
    var kg = number(weight, 0);
    return [
      { carrier: 'SpeedPAK', price: Math.round(2900 + 2100 * kg) },
      { carrier: 'EMS', price: Math.round(3300 + 2800 * kg) },
      { carrier: 'DHL', price: Math.round(4200 + 3100 * kg) }
    ];
  }
  function matchDemoUrl(text) {
    if (typeof text !== 'string') return null;
    var source = text.trim();
    if (!source || /^(?:javascript|data|vbscript):/i.test(source)) return null;
    var candidates = source.match(/https?:\/\/[^\s<>「」"']+/gi);
    if (!candidates) candidates = [source];
    for (var i = 0; i < candidates.length; i += 1) {
      var candidate = candidates[i], path;
      if (/^https?:\/\//i.test(candidate) || /^file:\/\//i.test(candidate)) {
        try { path = new URL(candidate).pathname; } catch (error) { continue; }
      } else {
        if (!candidate.startsWith('/') || candidate.startsWith('//')) continue;
        path = candidate.split(/[?#]/)[0];
      }
      var match = path.match(/\/items\/([^/]+?)(?:\.html)?\/?$/);
      var product = match && products.find(function (p) { return p.slug === match[1]; });
      if (product) return product.id;
    }
    return null;
  }
  function checkListable(product) {
    var blocked = !product || product.listable === false || product.id === 'shoulder-bag' || product.productId === 'shoulder-bag' ||
      (product.brandLogo === true && product.authenticityProof !== true);
    return blocked ? { ok: false, reasons: [
      '偽造品や無許可のコピー品の出品は禁止です。出品者が本物と確認できる必要があります。',
      'この商品には保証書や購入証明がなく、真贋を証明できないため出せません。',
      'ブランド名だけ借りた出品は禁止です。'
    ] } : { ok: true, reasons: [] };
  }
  var api = { calcProfit: calcProfit, shippingRates: shippingRates, matchDemoUrl: matchDemoUrl, checkListable: checkListable };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.DemoCalc = api;
}(typeof window !== 'undefined' ? window : null));
