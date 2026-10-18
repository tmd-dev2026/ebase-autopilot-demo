(function () {
  'use strict';
  var D = window.Demo = window.Demo || {}, C = window.DemoCalc;
  // Compatibility fields for the existing financial screens; product facts stay in DemoProducts.
  D.data = {
    products: window.DemoProducts.products.map(function (p) {
      return Object.assign({}, p, { weight: p.weightKg, image: p.images[0].file, title: p.ai.titleEn });
    }),
    carriers: ['SpeedPAK', 'EMS', 'DHL']
  };
  D.product = function (id) { return D.data.products.find(function (p) { return p.id === id; }); };
  D.initialState = function () {
    var ids = ['holo-card', 'film-camera', 'wrist-watch', 'fd-lens', 'figure-large', 'holo-card', 'film-camera', 'wrist-watch', 'fd-lens'];
    var watchers = [18, 24, 15, 20, 10, 17, 12, 16, 12];
    var listings = ids.map(function (id, i) {
      var p = D.product(id);
      return { id: 'seed-' + (i + 1), productId: id, own: false, status: 'live', source: 'available', sale: p.sale, cost: p.cost, weight: p.weightKg, rate: 155, carrier: 'SpeedPAK', watchers: watchers[i], views: 96 + i * 21, sold: false };
    });
    var orders = ids.slice(0, 5).map(function (id, i) {
      var p = D.product(id);
      return { id: 'example-order-' + i, example: true, productId: id, buyer: 'buyer_demo_01', country: '米国', sale: p.sale, cost: p.cost, weight: p.weightKg, rate: 155, shipping: C.shippingRates(p.weightKg)[0].price, carrier: 'SpeedPAK', status: i < 2 ? 'pending' : 'shipped', tracking: i < 2 ? '' : 'DEMO-PAST-' + i };
    });
    var report = ['holo-card', 'film-camera', 'wrist-watch', 'figure-large'].map(function (id, i) {
      var p = D.product(id);
      return { id: 'past-' + i, productId: id, label: '過去の例 / ' + p.name, sale: p.sale, rate: 155, cost: p.cost, shipping: C.shippingRates(p.weightKg)[0].price, domestic: 0, ads: 0 };
    });
    return { version: 3, guide: true, started: false, marketOpened: false, selected: 'holo-card', products: [], importCount: 0, inputMode: 'single', importMode: 'normal', dateFilter: 'today', selection: [], jobs: [], batchErrors: [],
      samples: ['wrist-watch', 'fd-lens'].map(function (id) { var p = D.product(id); return { id: id, example: true, processed: true, title: p.ai.titleEn, description: p.ai.descriptionEn.join('\n'), template: '自動判定', instruction: '' }; }),
      listings: listings, orders: orders,
      messages: orders.slice(0, 3).map(function (o, i) {
        return { id: 'example-message-' + i, orderId: o.id, productId: o.productId, example: true, read: false, text: 'Hello! When will my item be shipped to the United States?', translation: 'こんにちは！ 商品はいつ米国へ発送されますか？', draft: '', meaning: '', sent: '' };
      }),
      templates: [{ id: 'template-example-1', category: 'トレカ', frequency: '毎日', time: '09:00', count: 3, paused: false }, { id: 'template-example-2', category: 'カメラ', frequency: '毎週', time: '18:00', count: 2, paused: true }],
      offers: [], report: report,
      shipping: Array.from({ length: 8 }, function (_, i) { var carrier = D.data.carriers[i % 3], p = D.product(ids[i]), estimate = C.shippingRates(p.weightKg)[i % 3].price; return { tracking: 'DEMO-PAST-' + i, productId: p.id, carrier: carrier, estimate: estimate, actual: estimate + (i % 2 ? -180 : 240) }; }),
      profitInputs: {}, events: {}, monitorRule: { keyword: '', min: '', max: '' }, monitorResults: false };
  };
}());
