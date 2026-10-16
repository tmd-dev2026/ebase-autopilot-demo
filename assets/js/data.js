(function () {
  'use strict';
  var D = window.Demo = window.Demo || {};
  D.data = {
    products: [
      { id: 'item-1', name: '人気カードゲームのレアカード(ホロ加工・美品)',
        title: 'Japanese Trading Card Game Rare Holo Card Near Mint Collector Single Japan',
        cost: 14000, sale: 150, weight: 0.36, image: 'card.svg', condition: 'Near Mint / 美品', category: 'Collectibles > Trading Card Singles',
        description: 'A Japanese trading card with a decorative holo finish.\nThe card is in near mint condition with light edge wear.\nIncludes one card and a protective sleeve.\nPacked carefully and sent with tracked international shipping.\nPlease contact the seller about returns if the item differs from its description.',
        specifics: { Brand: 'Unbranded', Type: 'Trading Card', Condition: 'Near Mint', 'Country of Origin': 'Japan', Finish: 'Holo' },
        seller: 'seller_demo_01', detail: 'ホロ加工のあるカード 1 枚。保護スリーブ付き。表面はきれいですが、縁にはわずかな使用感があります。' },
      { id: 'item-2', name: '国産フィルムカメラ 一眼レフ レンズ付き(動作確認済み)',
        title: 'Japanese 35mm SLR Film Camera Body with 50mm Lens Tested Working Vintage Japan',
        cost: 11000, sale: 180, weight: 1.25, image: 'camera.svg', condition: 'Used / 動作確認済み', category: 'Cameras > Film Cameras',
        description: 'A Japanese 35mm SLR film camera with a 50mm lens.\nBasic shutter and winding functions have been tested.\nThe body has minor cosmetic signs of use.\nIncludes the camera body, lens and lens cap; film is not included.\nShipped with protective packaging and international tracking.\nPlease contact the seller to discuss returns for an item that is not as described.',
        specifics: { Brand: 'Unbranded', Type: 'SLR Film Camera', Condition: 'Used', 'Country of Origin': 'Japan', Format: '35mm' },
        seller: 'seller_demo_02', detail: 'シャッターと巻き上げの基本動作を確認したフィルムカメラです。50mm レンズとキャップが付属します。フィルムは含みません。' },
      { id: 'item-3', name: 'ブランドロゴ入り ショルダーバッグ(ブランド名は伏せています)',
        title: 'Luxury Brand Logo Shoulder Bag Leather Black Pre-owned Japan',
        cost: 48000, sale: 420, weight: 0.9, image: 'bag.svg', condition: 'Used / 使用感あり', category: 'Fashion > Shoulder Bags',
        brandLogo: true, authenticityProof: false,
        description: 'A pre-owned black leather shoulder bag.\nThe exterior has signs of wear and the interior is used.\nIncludes the bag and shoulder strap only.\nNo certificate or purchase receipt is available.\nDraft shipping and return details require review before any listing.\nThis demo item cannot be listed because authenticity cannot be verified.',
        specifics: { Brand: 'Unverified — listing blocked', Type: 'Shoulder Bag', Condition: 'Used', 'Country of Origin': 'Unverified' },
        seller: 'seller_demo_03', detail: 'ロゴ入りのショルダーバッグという設定です。保証書や購入証明はありません。イラストにはロゴを描いていません。真贋を確認できない商品の警告を体験できます。' }
    ],
    carriers: ['SpeedPAK', 'EMS', 'DHL'],
    history: [
      { id: 'past-1', label: '過去の例 / カード', sale: 150, rate: 155, cost: 14000, shipping: 3656, domestic: 0, ads: 0 },
      { id: 'past-2', label: '過去の例 / カメラ', sale: 180, rate: 155, cost: 11000, shipping: 5525, domestic: 0, ads: 0 },
      { id: 'past-3', label: '過去の例 / 大型フィギュア', sale: 40, rate: 155, cost: 3700, shipping: 8700, domestic: 0, ads: 0 }
    ],
    shipping: [
      { tracking: 'DEMO-TRACK-001', carrier: 'SpeedPAK', estimate: 3656, actual: 3900 },
      { tracking: 'DEMO-TRACK-002', carrier: 'EMS', estimate: 6800, actual: 6500 },
      { tracking: 'DEMO-TRACK-003', carrier: 'DHL', estimate: 6990, actual: 7200 }
    ]
  };
  D.product = function (id) { return D.data.products.find(function (p) { return p.id === id; }); };
  D.initialState = function () {
    return { version: 1, guide: true, started: false, marketOpened: false, selected: 'item-1', products: [],
      listings: [
        { id: 'seed-1', productId: 'item-1', own: false, status: 'live', source: 'available', sale: 150, cost: 14000, weight: 0.36, rate: 155, carrier: 'SpeedPAK', watchers: 18, views: 240, sold: false },
        { id: 'seed-2', productId: 'item-2', own: false, status: 'live', source: 'available', sale: 180, cost: 11000, weight: 1.25, rate: 155, carrier: 'SpeedPAK', watchers: 7, views: 96, sold: false }
      ], orders: [], messages: [], templates: [], offers: [], report: JSON.parse(JSON.stringify(D.data.history)),
      shipping: JSON.parse(JSON.stringify(D.data.shipping)), profitInputs: {}, events: {}, monitorRule: { keyword: '', min: '', max: '' }, monitorResults: false };
  };
}());
