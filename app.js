/* Ninikolah storefront demo: hash-routed vanilla JS */
(function () {
  'use strict';
  var D = window.NINIKOLAH, T = window.I18N;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- storage (never required) ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } }
  };
  var prefs = store.get('ninikolah-prefs', {});
  var lang = document.documentElement.lang === 'en' ? 'en' : 'fa';
  var S = {
    cart: store.get('ninikolah-cart', []), wish: store.get('ninikolah-wish', []), wrap: store.get('ninikolah-wrap', false),
    filters: { cat: [], age: [], season: [], fam: [] }, sort: 'rec',
    hero: { pid: 'pompom', ci: 0 }, cardColor: {}, finderCm: 47, giftSize: '1-2y',
    pdp: { ci: 0, size: null, qty: 1 }, order: null, route: 'home', param: ''
  };
  try { S.order = JSON.parse(sessionStorage.getItem('ninikolah-order') || 'null'); } catch (e) { S.order = null; }
  function save() { store.set('ninikolah-cart', S.cart); store.set('ninikolah-wish', S.wish); store.set('ninikolah-wrap', S.wrap); }

  /* ---------- text & numbers ---------- */
  function t(k, vars) {
    var s = (T[lang] && T[lang][k] != null) ? T[lang][k] : (T.fa[k] != null ? T.fa[k] : k);
    if (vars) Object.keys(vars).forEach(function (v) { s = s.split('{' + v + '}').join(vars[v]); });
    return s;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(n) { return new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US').format(n); }
  function digits(s) { return lang === 'fa' ? String(s).replace(/\d/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; }) : String(s); }
  function money(n) { return num(n) + ' ' + t('toman'); }
  function toLatin(s) { return String(s).replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); }); }
  function P(id) { for (var i = 0; i < D.products.length; i++) if (D.products[i].id === id) return D.products[i]; return null; }
  function L(p) { return p[lang]; }
  function sizeOf(id) { for (var i = 0; i < D.sizes.length; i++) if (D.sizes[i].id === id) return D.sizes[i]; return null; }
  function sizeName(id) { var s = sizeOf(id); return s ? s[lang] : id; }
  function cmText(s) { return t('age.cm', { a: num(s.cm[0]), b: num(s.cm[1]) }); }
  function img(p, cid, back) { return p.id + '-' + cid + (back ? '-b' : '') + '.webp'; }
  function colorIndex(p, cid) { for (var i = 0; i < p.colors.length; i++) if (p.colors[i].id === cid) return i; return 0; }
  function swatchStyle(p, c) {
    if (p.model === 'striped') return 'style="--a:' + c.main + ';--b:' + c.second + '"';
    if (p.model === 'sunhat') return 'style="background:' + c.second + '"';
    return 'style="background:' + c.main + '"';
  }
  var FAM = { blush: 'pink', rose: 'pink', oat: 'beige', honey: 'beige', cocoa: 'beige', cream: 'beige', sky: 'blue', sage: 'green', forest: 'green', mustard: 'yellow', lemon: 'yellow', tomato: 'red', red: 'red', coral: 'red', navy: 'navy' };
  var FAM_COLOR = { pink: '#EFA9B0', beige: '#D8C3A5', blue: '#9DBCE3', green: '#9DB89F', yellow: '#EBC34F', red: '#DF5F49', navy: '#2F3E6B' };
  function famOf(p, c) { if (p.model === 'sunhat') return FAM[c.id] === 'green' ? 'green' : FAM[c.id] === 'pink' ? 'pink' : FAM[c.id]; return FAM[c.id]; }
  var FREE = 1500000, COURIER = 85000, POST = 65000;

  /* ---------- icons ---------- */
  var ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    bag: '<path d="M5 8h14l-1.1 11.2a2 2 0 0 1-2 1.8H8.1a2 2 0 0 1-2-1.8L5 8Z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h11"/>', close: '<path d="M6 6l12 12M18 6 6 18"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', chev: '<path d="m9.5 6 6 6-6 6"/>', down: '<path d="m6 9 6 6 6-6"/>', plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    zin: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6M8 11h6M11 8v6"/>', zout: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6M8 11h6"/>',
    reset: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v3.7h3.7"/>',
    spin: '<path d="M20.5 11.5c0 2.3-3.8 4-8.5 4s-8.5-1.7-8.5-4 3.8-4 8.5-4"/><path d="m10 5.5 2 2-2 2"/><path d="M12 3v1.5M12 18v2.5"/>',
    hand: '<path d="M8 12.5V6.8a1.4 1.4 0 0 1 2.8 0V11M10.8 10.5V5.6a1.4 1.4 0 0 1 2.8 0V11M13.6 10.8V7.4a1.4 1.4 0 0 1 2.8 0v6.1c0 4-2.4 6.5-5.8 6.5-2.3 0-3.8-.9-5.2-2.8l-2-3a1.5 1.5 0 0 1 2.3-1.9L8 14"/>',
    leaf: '<path d="M5.5 19c0-8.5 5.8-14 14.5-14 0 8.6-5.4 14.5-14 14.5"/><path d="M5.5 19.5 13 12"/>',
    tape: '<rect x="2.5" y="8" width="19" height="8" rx="2"/><path d="M6.5 8v3M10 8v4.5M13.5 8v3M17 8v4.5"/>',
    swap: '<path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/>',
    gift: '<rect x="3.5" y="9" width="17" height="11.5" rx="2"/><path d="M3.5 13h17M12 9v11.5M12 9C10.5 5 8.2 4 7 4.6a1.9 1.9 0 0 0 .5 3.6C9 8.6 12 9 12 9Zm0 0c1.5-4 3.8-5 5-4.4a1.9 1.9 0 0 1-.5 3.6C15 8.6 12 9 12 9Z"/>',
    truck: '<path d="M3 6.5h11v9.5H3zM14 9.5h4l3 3.2V16h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.4"/>',
    yarn: '<circle cx="12" cy="12" r="8.5"/><path d="M5.8 7.6c4.2-.4 9.6 2.6 12.4 8M4.2 13.4c3.2-1.4 8.3-.3 11.3 5.6M9.4 3.9c3 2.3 5.9 7.6 5.6 15.8"/>',
    pom: '<circle cx="12" cy="7" r="3.5"/><path d="M5 20c0-6 3-9.5 7-9.5s7 3.5 7 9.5z"/><path d="M8.5 11.5 12 14l3.5-2.5"/>',
    cuff: '<path d="M4 15.5h16V20H4zM6 15.5V12a6 6 0 0 1 12 0v3.5"/><path d="M8 15.5V20M12 15.5V20M16 15.5V20"/>',
    drop: '<path d="M12 3.5s5.5 6.4 5.5 10.5a5.5 5.5 0 0 1-11 0C6.5 9.9 12 3.5 12 3.5Z"/>', flat: '<path d="M3 16h18M6 12h12"/>',
    noiron: '<path d="M4 17h16l-2.2-7.5H9.5C6.3 9.5 4 12.6 4 17Z"/><path d="M3.5 4.5l17 16"/>', filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',
    shield: '<path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6L12 3Z"/><path d="m8.8 12 2.3 2.3 4.2-4.3"/>',
    star: '<path d="m12 4 2.3 4.8 5.2.7-3.8 3.6.9 5.2L12 15.8l-4.6 2.5.9-5.2-3.8-3.6 5.2-.7L12 4Z"/>'
  };
  function ic(n, cls) { return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || '') + '</svg>'; }
  var LOGO = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="8.5" r="5.2" fill="var(--accent)"/><path d="M6.5 27.5C6.5 19 12.6 13 20 13s13.5 6 13.5 14.5z" fill="var(--accent)"/><rect x="4.5" y="26" width="31" height="9" rx="4.5" fill="var(--ink)"/><path d="M11 27.5v6M16 27.5v6M21 27.5v6M26 27.5v6M31 27.5v4.5" stroke="var(--paper)" stroke-width="1.6" stroke-linecap="round" opacity=".55"/></svg>';

  /* ---------- 3D viewers ---------- */
  var viewers = [];
  function killViewers() { viewers.forEach(function (v) { try { v.destroy(); } catch (e) { /* ignore */ } }); viewers = []; }
  function mount3D(canvas, opts, fallbackSrc) {
    if (!canvas) return null;
    var ok = window.Hat3D && window.Hat3D.supported();
    if (ok) {
      try { var v = window.Hat3D.create(canvas, opts); viewers.push(v); return v; }
      catch (e) { ok = false; }
    }
    var im = document.createElement('img'); im.className = 'stage-img'; im.src = fallbackSrc; im.alt = canvas.getAttribute('aria-label') || '';
    canvas.replaceWith(im); return null;
  }

  /* ---------- header, footer ---------- */
  function headerHTML() {
    var cur = S.route === 'shop' ? 'shop' : S.route;
    function nl(h, k) { var on = ('#' + S.route + (S.param ? '-' + S.param : '')) === h || (h === '#shop' && cur === 'shop' && !S.param); return '<a href="' + h + '"' + (on ? ' aria-current="page"' : '') + '>' + t(k) + '</a>'; }
    var dark = isDark();
    return '<div class="wrap hdr">' +
      '<button class="icon-btn menu-btn" data-action="menu" aria-label="' + t('a.menu') + '">' + ic('menu') + '</button>' +
      '<a class="logo" href="#home" aria-label="' + t('brand') + ' · ' + t('a.home') + '">' + LOGO + '<span>' + t('brand') + '</span></a>' +
      '<nav class="nav" aria-label="Main">' + nl('#shop', 'nav.shop') + nl('#shop-knit', 'nav.knit') + nl('#shop-summer', 'nav.summer') + nl('#size', 'nav.size') + nl('#about', 'nav.about') + '</nav>' +
      '<div class="hdr-actions">' +
      '<button class="icon-btn" data-action="search" aria-label="' + t('a.search') + '">' + ic('search') + '</button>' +
      '<button class="icon-btn lang-btn hide-sm" data-action="lang" lang="' + (lang === 'fa' ? 'en' : 'fa') + '">' + (lang === 'fa' ? 'EN' : 'فا') + '</button>' +
      '<button class="icon-btn hide-md" data-action="theme" aria-label="' + t('a.theme') + '">' + ic(dark ? 'sun' : 'moon') + '</button>' +
      '<a class="icon-btn hide-sm" href="#wish" aria-label="' + t('a.wish') + '">' + ic('heart') + '<span class="count num" id="wishCount"></span></a>' +
      '<button class="icon-btn" data-action="cart" aria-label="' + t('a.cart') + '">' + ic('bag') + '<span class="count num" id="cartCount"></span></button>' +
      '</div></div>';
  }
  function footerHTML() {
    return '<div class="wrap"><div class="foot">' +
      '<div class="foot-brand"><a class="logo" href="#home">' + LOGO + '<span>' + t('brand') + '</span></a><p>' + t('tagline') + '. ' + t('foot.made') + '.</p><p><span class="demo-pill">' + ic('info') + t('demo') + '</span> ' + t('foot.demo') + '</p></div>' +
      '<div><h4>' + t('foot.shop') + '</h4><ul><li><a href="#shop">' + t('shop.title') + '</a></li><li><a href="#shop-knit">' + t('nav.knit') + '</a></li><li><a href="#shop-summer">' + t('nav.summer') + '</a></li><li><a href="#shop-cap">' + t('col.daily') + '</a></li><li><a href="#wish">' + t('foot.wish') + '</a></li></ul></div>' +
      '<div><h4>' + t('foot.help') + '</h4><ul><li><a href="#size">' + t('nav.size') + '</a></li><li><a href="#help-ship">' + t('foot.ship') + '</a></li><li><a href="#help-faq">' + t('foot.faq') + '</a></li><li><a href="#help-contact">' + t('foot.contact') + '</a></li></ul></div>' +
      '<div><h4>' + t('foot.brand') + '</h4><ul><li><a href="#about">' + t('nav.about') + '</a></li><li><button class="flink" data-action="lang">' + t('a.lang') + '</button></li><li><button class="flink" data-action="theme">' + (isDark() ? t('foot.light') : t('foot.dark')) + '</button></li></ul></div>' +
      '</div><div class="foot-bottom"><span>© ' + (lang === 'fa' ? '۱۴۰۵' : '2026') + ' ' + t('brand') + '</span><span>' + t('foot.made') + '</span></div></div>';
  }
  function isDark() { var a = document.documentElement.getAttribute('data-theme'); if (a) return a === 'dark'; return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; }
  function updateCounts() {
    var n = S.cart.reduce(function (s, l) { return s + l.qty; }, 0);
    var c = $('#cartCount'); if (c) { c.textContent = n ? num(n) : ''; c.setAttribute('data-n', n); }
    var w = $('#wishCount'); if (w) { w.textContent = S.wish.length ? num(S.wish.length) : ''; w.setAttribute('data-n', S.wish.length); }
  }

  /* ---------- product card ---------- */
  function card(p, pickFam) {
    var ci = S.cardColor[p.id] != null ? S.cardColor[p.id] : 0;
    if (pickFam && pickFam.length) { for (var i = 0; i < p.colors.length; i++) if (pickFam.indexOf(famOf(p, p.colors[i])) >= 0) { ci = i; break; } }
    var c = p.colors[ci], l = L(p), wished = S.wish.indexOf(p.id) >= 0;
    return '<article class="card" data-pid="' + p.id + '">' +
      '<div class="media-wrap" style="position:relative">' +
      '<a class="card-media" href="#p-' + p.id + '" style="--sw:' + c.env + '" data-cmedia>' +
      (p.badge ? '<span class="badge ' + p.badge + '">' + t('badge.' + p.badge) + '</span>' : '') +
      '<img class="alt' + (ci === 0 ? ' has' : '') + '" src="' + img(p, p.colors[0].id, true) + '" alt="" loading="lazy" width="720" height="720">' +
      '<img class="main" src="' + img(p, c.id) + '" alt="' + esc(l.name + ' · ' + c[lang]) + '" loading="lazy" width="720" height="720"></a>' +
      '<button class="heart" data-action="wish" data-id="' + p.id + '" aria-pressed="' + wished + '" aria-label="' + (wished ? t('p.wished') : t('p.wish')) + '">' + ic('heart') + '</button>' +
      '<div class="quick"><button class="btn" data-action="quick" data-id="' + p.id + '">' + ic('plus') + t('card.quick') + '</button></div>' +
      '</div>' +
      '<div class="card-info"><div class="t"><h3><a href="#p-' + p.id + '">' + esc(l.name) + '</a></h3><span class="pr num">' + money(p.price) + '</span></div>' +
      '<p class="s">' + esc(l.short) + '</p>' +
      '<div class="card-dots">' + p.colors.map(function (cc, i) { return '<button class="sw sw-sm' + (p.model === 'striped' ? ' split' : '') + '" ' + swatchStyle(p, cc) + ' data-action="card-color" data-id="' + p.id + '" data-i="' + i + '" aria-pressed="' + (i === ci) + '" aria-label="' + esc(cc[lang]) + '" title="' + esc(cc[lang]) + '"></button>'; }).join('') + '</div>' +
      '</div></article>';
  }

  /* ---------- views ---------- */
  var HERO_IDS = ['pompom', 'teddy', 'sailor', 'dotty', 'sunny', 'minicap'];
  function viewHome() {
    var hp = P(S.hero.pid), hc = hp.colors[S.hero.ci] || hp.colors[0];
    var best = ['pompom', 'dotty', 'teddy', 'sunny'].map(P);
    var ages = D.sizes.map(function (s) {
      var n = D.products.filter(function (p) { return p.sizes.indexOf(s.id) >= 0; }).length, d = Math.round((s.cm[0] + s.cm[1]) / 2 - 31) * 2.6;
      return '<a class="age" href="#shop-age-' + s.id + '"><span class="ring"><i style="width:' + d + 'px;height:' + d + 'px"></i></span><b>' + esc(s[lang]) + '</b><small class="num">' + cmText(s) + '</small><em>' + t('age.n', { n: num(n) }) + '</em></a>';
    }).join('');
    return '<section class="hero"><div class="wrap hero-grid">' +
      '<div class="hero-copy">' +
      '<span class="eyebrow">' + t('hero.eyebrow') + '</span>' +
      '<h1>' + t('hero.t1') + ' <span class="squig">' + t('hero.t2') + '<svg viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true"><path d="M3 12 C 23 2, 37 2, 53 11 S 87 20, 103 11 S 137 2, 153 11 S 185 18, 197 9"/></svg></span></h1>' +
      '<p class="hero-sub">' + t('hero.sub') + '</p>' +
      '<div class="hero-ctas"><a class="btn btn-primary" href="#shop">' + t('hero.cta') + ic('arrow', 'flip') + '</a><button class="btn btn-ghost" data-action="scroll-to" data-to="finder">' + ic('tape') + t('hero.cta2') + '</button></div>' +
      '<div class="hero-pickers">' +
      '<div class="picker-row"><span class="picker-label">' + t('hero.pick') + '</span><div class="model-pick" role="group" aria-label="' + t('hero.pick') + '">' + HERO_IDS.map(function (id) { var p = P(id); return '<button class="mp" data-action="hero-model" data-id="' + id + '" aria-pressed="' + (id === S.hero.pid) + '" aria-label="' + esc(L(p).name) + '" title="' + esc(L(p).name) + '"><img src="' + img(p, p.colors[0].id) + '" alt="" width="54" height="54"></button>'; }).join('') + '</div></div>' +
      '<div class="picker-row"><span class="picker-label">' + t('hero.color') + '</span><div class="swatches" id="heroSw">' + heroSwatches() + '</div></div>' +
      '</div></div>' +
      '<div class="hero-visual"><div class="sticker" aria-hidden="true">' + t('hero.sticker') + '</div><div class="stage" id="heroStage" style="--sw:' + hc.env + '">' +
      '<canvas id="heroCanvas" tabindex="0" aria-label="' + esc(L(hp).name + ' · ' + t('hero.drag')) + '"></canvas>' +
      '<div class="stage-ui"><span class="drag-hint">' + ic('hand') + '<span>' + t('hero.drag') + '</span></span><span class="price-tag"><span class="num" id="heroPrice">' + money(hp.price) + '</span><a class="btn btn-ink" id="heroLink" href="#p-' + hp.id + '" data-action="open-product" data-id="' + hp.id + '">' + t('hero.view') + '</a></span></div>' +
      '</div></div></div></section>' +
      '<div class="wrap"><div class="usps">' +
      [['leaf', 'usp1'], ['tape', 'usp2'], ['swap', 'usp3'], ['gift', 'usp4']].map(function (u) { return '<div class="usp">' + ic(u[0]) + '<div><b>' + t(u[1]) + '</b><span>' + t(u[1] + 's') + '</span></div></div>'; }).join('') + '</div></div>' +
      '<section class="section"><div class="wrap"><div class="sec-head"><div><h2>' + t('age.title') + '</h2><p>' + t('age.sub') + '</p></div></div><div class="ages">' + ages + '</div></div></section>' +
      '<section class="section" style="padding-top:8px"><div class="wrap"><div class="sec-head"><h2>' + t('col.title') + '</h2></div><div class="cols">' +
      coll('#shop-winter', '#F4E9DA', img(P('teddy'), 'honey'), 'col.winter') + coll('#shop-summer', '#FCE7EB', img(P('sunny'), 'rose'), 'col.summer') + coll('#shop-daily', '#FFF3C6', img(P('dotty'), 'lemon'), 'col.daily') +
      '</div></div></section>' +
      '<section class="section"><div class="wrap"><div class="sec-head"><h2>' + t('best.title') + '</h2><a class="link" href="#shop">' + t('best.all') + ic('arrow', 'flip') + '</a></div><div class="grid">' + best.map(function (p) { return card(p); }).join('') + '</div></div></section>' +
      '<section class="section"><div class="wrap closeup"><div class="macro"><img src="macro-knit.webp" alt="' + esc(L(P('pompom')).name) + '" loading="lazy" width="900" height="900"><div class="lens"><img src="macro-teddy.webp" alt="' + esc(L(P('teddy')).name) + '" loading="lazy" width="900" height="900"></div></div>' +
      '<div><span class="eyebrow">' + t('nav.knit') + '</span><h2 style="font-size:clamp(28px,3.6vw,42px);margin-top:8px">' + t('close.title') + '</h2><p style="color:var(--ink-2);margin-top:8px">' + t('close.sub') + '</p><div class="points">' +
      [['yarn', 'close.p1'], ['pom', 'close.p2'], ['cuff', 'close.p3']].map(function (x) { return '<div class="point"><span class="pi">' + ic(x[0]) + '</span><div><b>' + t(x[1]) + '</b><p>' + t(x[1] + 's') + '</p></div></div>'; }).join('') +
      '</div><a class="btn btn-ink" href="#p-pompom" style="margin-top:24px">' + esc(L(P('pompom')).name) + ic('arrow', 'flip') + '</a></div></div></section>' +
      '<section class="section" id="finder"><div class="wrap">' + finderHTML() + '</div></section>' +
      '<section class="section"><div class="wrap">' + giftHTML() + '</div></section>' +
      '<section class="section" style="padding-top:0"><div class="wrap"><div class="news"><div><h2>' + t('news.title') + '</h2><p>' + t('news.sub') + '</p></div>' +
      '<form data-form="news" novalidate><label class="sr" for="newsEmail">' + t('news.ph') + '</label><input class="field-in" id="newsEmail" type="email" inputmode="email" autocomplete="email" placeholder="' + t('news.ph') + '" dir="ltr"><button class="btn btn-ink" type="submit">' + t('news.btn') + '</button></form></div></div></section>';
  }
  function coll(href, bg, src, k) {
    return '<a class="coll" href="' + href + '" style="--sw:' + bg + '"><div><h3>' + t(k) + '</h3><p>' + t(k + 'S') + '</p></div><img src="' + src + '" alt="" loading="lazy" width="720" height="720"><span class="go">' + t('col.go') + ic('arrow', 'flip') + '</span></a>';
  }
  function heroSwatches() {
    var p = P(S.hero.pid);
    return p.colors.map(function (c, i) { return '<button class="sw' + (p.model === 'striped' ? ' split' : '') + '" ' + swatchStyle(p, c) + ' data-action="hero-color" data-i="' + i + '" aria-pressed="' + (i === S.hero.ci) + '" aria-label="' + esc(c[lang]) + '" title="' + esc(c[lang]) + '"></button>'; }).join('');
  }

  function finderSize(cm) {
    if (cm < 36) return { size: sizeOf('0-6m'), out: false };
    if (cm > 54) return { size: null, out: true };
    for (var i = 0; i < D.sizes.length; i++) { var s = D.sizes[i]; if (cm >= s.cm[0] && (cm < s.cm[1] || (i === D.sizes.length - 1 && cm <= s.cm[1]))) return { size: s, out: false }; }
    return { size: null, out: true };
  }
  function finderHTML() {
    return '<div class="finder"><div class="finder-l"><span class="eyebrow">' + t('nav.size') + '</span><h2>' + t('finder.title') + '</h2><p>' + t('finder.sub') + '</p>' +
      '<div class="tape"><div class="tape-top"><label for="cmRange" style="font-weight:700">' + t('finder.label') + '</label><span class="tape-val num" id="cmVal"></span></div>' +
      '<input class="range" id="cmRange" type="range" min="34" max="56" step="0.5" value="' + S.finderCm + '" data-input="finder" dir="ltr" aria-describedby="finderRes">' +
      '<div class="tape-scale num" dir="ltr"><span>' + num(34) + '</span><span>' + num(40) + '</span><span>' + num(45) + '</span><span>' + num(50) + '</span><span>' + num(56) + '</span></div></div>' +
      '<p style="font-size:13.5px">' + t('finder.tip') + '</p></div>' +
      '<div class="finder-r" id="finderRes" aria-live="polite"></div></div>';
  }
  function updateFinder() {
    var r = $('#finderRes'), v = $('#cmVal'); if (!r) return;
    var cm = S.finderCm, f = finderSize(cm);
    v.innerHTML = num(cm) + '<small>' + t('finder.unit') + '</small>';
    if (f.out || !f.size) { r.style.setProperty('--sw', '#EFEDF6'); r.innerHTML = '<span class="lbl">' + t('finder.result') + '</span><div class="res">—</div><p class="tip">' + t('finder.out') + '</p><a class="btn btn-ink" href="#help-contact">' + t('foot.contact') + '</a>'; return; }
    var fits = D.products.filter(function (p) { return p.sizes.indexOf(f.size.id) >= 0; });
    r.style.setProperty('--sw', fits[0] ? fits[0].colors[0].env : '#FFF3C6');
    r.innerHTML = '<span class="lbl">' + t('finder.result') + '</span><div class="res">' + esc(f.size[lang]) + '</div><div class="num">' + cmText(f.size) + '</div>' +
      '<div class="fits">' + t('finder.fits', { n: num(fits.length) }) + '</div><div class="thumbs">' + fits.map(function (p) { return '<a href="#p-' + p.id + '" data-action="open-product" data-id="' + p.id + '" data-size="' + f.size.id + '" title="' + esc(L(p).name) + '" aria-label="' + esc(L(p).name) + '"><img src="' + img(p, p.colors[0].id) + '" alt="" width="58" height="58"></a>'; }).join('') + '</div>' +
      '<a class="btn btn-ink" href="#shop-age-' + f.size.id + '">' + t('finder.shop') + ic('arrow', 'flip') + '</a>';
  }

  var GIFT_SIZES = ['6-12m', '1-2y', '2-4y'];
  function giftHTML() {
    var a = P('pompom'), b = P('teddy'), full = a.price + b.price, set = Math.round(full * 0.9 / 1000) * 1000;
    return '<div class="gift"><div class="gift-copy"><span class="eyebrow" style="color:inherit;opacity:.8">' + t('gift.save') + '</span><h2>' + t('gift.title') + '</h2><p>' + t('gift.sub') + '</p>' +
      '<div class="gift-price"><b class="num">' + money(set) + '</b><s class="num">' + money(full) + '</s><span class="tag">' + t('gift.save') + '</span></div>' +
      '<div class="sizes" role="group" aria-label="' + t('gift.size') + '"><span style="font-size:13px;font-weight:700;opacity:.8">' + t('gift.size') + ':</span>' + GIFT_SIZES.map(function (s) { return '<button class="chip" data-action="gift-size" data-s="' + s + '" aria-pressed="' + (s === S.giftSize) + '">' + esc(sizeName(s)) + '</button>'; }).join('') + '</div>' +
      '<div><button class="btn btn-primary" data-action="gift-add">' + ic('gift') + t('gift.cta') + '</button></div></div>' +
      '<div class="gift-art" aria-hidden="true"><div class="box"></div><img class="g1" src="' + img(a, 'blush') + '" alt="" loading="lazy"><img class="g2" src="' + img(b, 'honey') + '" alt="" loading="lazy"></div></div>';
  }

  /* shop */
  function filtered() {
    var f = S.filters;
    var list = D.products.filter(function (p) {
      if (f.cat.length && f.cat.indexOf(p.cat) < 0) return false;
      if (f.age.length && !p.sizes.some(function (s) { return f.age.indexOf(s) >= 0; })) return false;
      if (f.season.length && f.season.indexOf(p.season) < 0) return false;
      if (f.fam.length && !p.colors.some(function (c) { return f.fam.indexOf(famOf(p, c)) >= 0; })) return false;
      return true;
    });
    var idx = function (p) { return D.products.indexOf(p); };
    if (S.sort === 'low') list.sort(function (a, b) { return a.price - b.price; });
    else if (S.sort === 'high') list.sort(function (a, b) { return b.price - a.price; });
    else if (S.sort === 'new') list.sort(function (a, b) { return (b.badge === 'new') - (a.badge === 'new') || idx(a) - idx(b); });
    else list.sort(function (a, b) { return (b.badge === 'best') - (a.badge === 'best') || idx(a) - idx(b); });
    return list;
  }
  function filterGroups() {
    var f = S.filters;
    function chip(k, v, label) { return '<button class="chip" data-action="f-toggle" data-k="' + k + '" data-v="' + v + '" aria-pressed="' + (f[k].indexOf(v) >= 0) + '">' + esc(label) + '</button>'; }
    return '<div class="fgroup"><h3>' + t('f.cat') + '</h3><div class="opts">' + D.categories.map(function (c) { return chip('cat', c.id, c[lang]); }).join('') + '</div></div>' +
      '<div class="fgroup"><h3>' + t('f.age') + '</h3><div class="opts">' + D.sizes.map(function (s) { return chip('age', s.id, s[lang]); }).join('') + '</div></div>' +
      '<div class="fgroup"><h3>' + t('f.season') + '</h3><div class="opts">' + ['winter', 'summer', 'all'].map(function (s) { return chip('season', s, t('season.' + s)); }).join('') + '</div></div>' +
      '<div class="fgroup"><h3>' + t('f.color') + '</h3><div class="opts">' + Object.keys(FAM_COLOR).map(function (k) { return '<button class="cdot" style="background:' + FAM_COLOR[k] + '" data-action="f-toggle" data-k="fam" data-v="' + k + '" aria-pressed="' + (f.fam.indexOf(k) >= 0) + '" aria-label="' + t('fam.' + k) + '" title="' + t('fam.' + k) + '"></button>'; }).join('') + '</div></div>';
  }
  function activeChips() {
    var f = S.filters, out = [];
    f.cat.forEach(function (v) { var c = D.categories.filter(function (x) { return x.id === v; })[0]; out.push(['cat', v, c ? c[lang] : v]); });
    f.age.forEach(function (v) { out.push(['age', v, sizeName(v)]); });
    f.season.forEach(function (v) { out.push(['season', v, t('season.' + v)]); });
    f.fam.forEach(function (v) { out.push(['fam', v, t('fam.' + v)]); });
    if (!out.length) return '';
    return '<div class="active-filters">' + out.map(function (o) { return '<button class="chip" data-action="f-toggle" data-k="' + o[0] + '" data-v="' + o[1] + '">' + esc(o[2]) + ic('close') + '</button>'; }).join('') + '<button class="chip" data-action="f-clear">' + t('shop.reset') + '</button></div>';
  }
  function shopTitle() {
    var f = S.filters;
    if (f.cat.length === 1 && !f.age.length && !f.season.length && !f.fam.length) { var c = D.categories.filter(function (x) { return x.id === f.cat[0]; })[0]; if (c) return c[lang]; }
    if (f.season.length === 1 && !f.cat.length && !f.age.length && !f.fam.length) return f.season[0] === 'winter' ? t('col.winter') : f.season[0] === 'summer' ? t('col.summer') : t('season.all');
    if (f.cat.length === 2 && f.cat.indexOf('bucket') >= 0 && f.cat.indexOf('cap') >= 0 && !f.age.length && !f.season.length) return t('col.daily');
    if (f.age.length === 1 && !f.cat.length && !f.season.length && !f.fam.length) return t('f.age') + ': ' + sizeName(f.age[0]);
    return t('shop.title');
  }
  function viewShop() {
    var list = filtered();
    return '<div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="#home">' + t('crumb.home') + '</a>' + ic('chev', 'flip') + '<span>' + t('nav.shop') + '</span></nav>' +
      '<div class="page-head"><h1 id="shopTitle">' + esc(shopTitle()) + '</h1></div>' +
      '<div class="shop"><aside class="filters" aria-label="' + t('shop.filters') + '" id="filtersSide">' + filterGroups() + '</aside>' +
      '<div><div class="toolbar"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="btn btn-ghost filter-open" data-action="filters" style="min-height:42px">' + ic('filter') + t('shop.filters') + '</button><span class="cnt num" id="shopCount">' + t('shop.count', { n: num(list.length) }) + '</span></div>' +
      '<label style="display:flex;gap:8px;align-items:center;font-size:14px;font-weight:600"><span>' + t('sort.label') + '</span><select class="sel" id="sortSel" data-change="sort">' + ['rec', 'low', 'high', 'new'].map(function (s) { return '<option value="' + s + '"' + (S.sort === s ? ' selected' : '') + '>' + t('sort.' + s) + '</option>'; }).join('') + '</select></label></div>' +
      '<div id="activeF" style="margin-bottom:16px">' + activeChips() + '</div>' +
      '<div id="shopGrid">' + gridHTML(list) + '</div></div></div></div>';
  }
  function gridHTML(list) {
    if (!list.length) return '<div class="empty"><svg viewBox="0 0 24 24" class="ic" aria-hidden="true">' + ICONS.pom + '</svg><p>' + t('shop.empty') + '</p><button class="btn btn-ink" data-action="f-clear">' + t('shop.reset') + '</button></div>';
    return '<div class="grid">' + list.map(function (p) { return card(p, S.filters.fam); }).join('') + '</div>';
  }
  function refreshShop() {
    var list = filtered();
    var g = $('#shopGrid'); if (g) g.innerHTML = gridHTML(list);
    var c = $('#shopCount'); if (c) c.textContent = t('shop.count', { n: num(list.length) });
    var a = $('#activeF'); if (a) a.innerHTML = activeChips();
    var fs = $('#filtersSide'); if (fs) fs.innerHTML = filterGroups();
    var ft = $('#shopTitle'); if (ft) ft.textContent = shopTitle();
    var fd = $('#filterDrawerBody'); if (fd) fd.innerHTML = filterGroups();
    var fb = $('#filterShow'); if (fb) fb.textContent = t('shop.show', { n: num(list.length) });
  }

  /* product */
  function viewProduct(id) {
    var p = P(id);
    if (!p) return viewNotFound();
    var l = L(p), c = p.colors[S.pdp.ci] || p.colors[0], cat = D.categories.filter(function (x) { return x.id === p.cat; })[0];
    var wished = S.wish.indexOf(p.id) >= 0;
    var related = D.products.filter(function (x) { return x.id !== p.id && (x.season === p.season || x.season === 'all'); }).slice(0, 4);
    if (related.length < 4) related = related.concat(D.products.filter(function (x) { return x.id !== p.id && related.indexOf(x) < 0; })).slice(0, 4);
    var careRows = p.model === 'sunhat' ? [['drop', 'care.straw'], ['flat', 'care2'], ['noiron', 'care3']] : [['drop', 'care1'], ['flat', 'care2'], ['noiron', 'care3']];
    return '<div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="#home">' + t('crumb.home') + '</a>' + ic('chev', 'flip') + '<a href="#shop">' + t('nav.shop') + '</a>' + ic('chev', 'flip') + '<a href="#shop-' + p.cat + '">' + esc(cat[lang]) + '</a>' + ic('chev', 'flip') + '<span>' + esc(l.name) + '</span></nav>' +
      '<div class="pdp"><div class="pdp-media"><div class="stage" id="pdpStage" style="--sw:' + c.env + '">' +
      '<canvas id="pdpCanvas" tabindex="0" aria-label="' + esc(l.name + ' · ' + t('p.drag')) + '"></canvas>' +
      '<span class="badge-360">' + t('p.360') + '</span>' +
      '<div class="viewer-tools"><button data-action="v-zin" aria-label="' + t('p.zin') + '" title="' + t('p.zin') + '">' + ic('zin') + '</button><button data-action="v-zout" aria-label="' + t('p.zout') + '" title="' + t('p.zout') + '">' + ic('zout') + '</button><button data-action="v-reset" aria-label="' + t('p.reset') + '" title="' + t('p.reset') + '">' + ic('reset') + '</button><button data-action="v-auto" aria-pressed="true" aria-label="' + t('p.auto') + '" title="' + t('p.auto') + '">' + ic('spin') + '</button></div>' +
      '<div class="stage-ui"><span class="drag-hint">' + ic('hand') + '<span>' + t('p.drag') + '</span></span></div></div>' +
      '<div class="views" role="group" aria-label="' + t('p.360') + '"><button class="chip" data-action="v-view" data-v="front">' + t('p.front') + '</button><button class="chip" data-action="v-view" data-v="side">' + t('p.side') + '</button><button class="chip" data-action="v-view" data-v="top">' + t('p.top') + '</button></div></div>' +
      '<div class="pdp-info">' +
      '<div style="display:grid;gap:10px">' + (p.badge ? '<span class="eyebrow">' + t('badge.' + p.badge) + '</span>' : '') + '<h1>' + esc(l.name) + '</h1><p class="lead">' + esc(l.short) + '</p><div class="pdp-price num">' + money(p.price) + '</div></div>' +
      '<div class="opt"><div class="opt-h"><b>' + t('p.color') + ': <span id="colorName">' + esc(c[lang]) + '</span></b></div><div class="swatches">' + p.colors.map(function (cc, i) { return '<button class="sw' + (p.model === 'striped' ? ' split' : '') + '" ' + swatchStyle(p, cc) + ' data-action="p-color" data-i="' + i + '" aria-pressed="' + (cc === c) + '" aria-label="' + esc(cc[lang]) + '" title="' + esc(cc[lang]) + '"></button>'; }).join('') + '</div></div>' +
      '<div class="opt"><div class="opt-h"><b>' + t('p.size') + '</b><button class="link" data-action="size-modal">' + ic('tape') + t('p.guide') + '</button></div>' +
      '<div class="sizes" id="sizeGrid">' + D.sizes.map(function (s) { var has = p.sizes.indexOf(s.id) >= 0; return '<button class="size" data-action="p-size" data-s="' + s.id + '" aria-pressed="' + (S.pdp.size === s.id) + '"' + (has ? '' : ' disabled aria-disabled="true"') + '><b>' + esc(s[lang]) + '</b><small class="num">' + cmText(s) + '</small></button>'; }).join('') + '</div><span class="err-msg" id="sizeErr" hidden>' + t('p.pick') + '</span></div>' +
      '<div class="buy"><div class="qty" role="group" aria-label="' + t('p.qty') + '"><button data-action="p-qty" data-d="-1" aria-label="−" id="qtyMinus"' + (S.pdp.qty <= 1 ? ' disabled' : '') + '>' + ic('minus') + '</button><span class="num" id="pdpQty">' + num(S.pdp.qty) + '</span><button data-action="p-qty" data-d="1" aria-label="+">' + ic('plus') + '</button></div>' +
      '<button class="btn btn-primary" data-action="p-add" id="addBtn">' + ic('bag') + t('p.add') + '</button>' +
      '<button class="btn btn-ghost wish-btn" data-action="wish" data-id="' + p.id + '" aria-pressed="' + wished + '" aria-label="' + (wished ? t('p.wished') : t('p.wish')) + '" title="' + (wished ? t('p.wished') : t('p.wish')) + '">' + ic('heart') + '</button></div>' +
      '<div class="perks"><div>' + ic('truck') + t('p.d1') + '</div><div>' + ic('gift') + t('p.d2') + '</div><div>' + ic('swap') + t('p.d3') + '</div></div>' +
      '<div class="acc"><details open><summary>' + t('acc.desc') + ic('down') + '</summary><div class="body"><p>' + esc(l.desc) + '</p></div></details>' +
      '<details><summary>' + t('acc.mat') + ic('down') + '</summary><div class="body"><p><b style="color:var(--ink)">' + t('p.material') + ':</b> ' + esc(l.material) + '</p><div class="care">' + careRows.map(function (r) { return '<div>' + ic(r[0]) + t(r[1]) + '</div>'; }).join('') + '</div></div></details>' +
      '<details><summary>' + t('acc.size') + ic('down') + '</summary><div class="body"><table class="mini-table"><thead><tr><th>' + t('size.age') + '</th><th>' + t('size.cm') + '</th></tr></thead><tbody>' + p.sizes.map(function (sid) { var s = sizeOf(sid); return '<tr><td>' + esc(s[lang]) + '</td><td class="num">' + cmText(s) + '</td></tr>'; }).join('') + '</tbody></table></div></details>' +
      '<details><summary>' + t('acc.ship') + ic('down') + '</summary><div class="body"><p>' + t('p.ship') + '</p></div></details></div>' +
      '</div></div>' +
      '<section class="section"><div class="sec-head"><h2>' + t('p.related') + '</h2><a class="link" href="#shop">' + t('best.all') + ic('arrow', 'flip') + '</a></div><div class="grid">' + related.map(function (x) { return card(x); }).join('') + '</div></section></div>' +
      '<div class="sticky-buy" id="stickyBuy"><div class="t"><b>' + esc(l.name) + '</b><span class="num">' + money(p.price) + '</span></div><button class="btn btn-primary" data-action="p-add">' + ic('bag') + t('p.add') + '</button></div>';
  }
  function pdpSetColor(i) {
    var p = P(S.param); if (!p) return;
    S.pdp.ci = i; var c = p.colors[i];
    var st = $('#pdpStage'); if (st) st.style.setProperty('--sw', c.env);
    var cn = $('#colorName'); if (cn) cn.textContent = c[lang];
    $$('[data-action="p-color"]').forEach(function (b, j) { b.setAttribute('aria-pressed', j === i); });
    if (viewers[0]) viewers[0].setColors(c, c.pattern || 0);
    var fb = $('#pdpStage .stage-img'); if (fb) fb.src = img(p, c.id);
  }

  /* cart */
  function cartLines() { return S.cart.map(function (l) { var p = P(l.id); if (!p) return null; var ci = colorIndex(p, l.color); return { l: l, p: p, c: p.colors[ci] }; }).filter(Boolean); }
  function totals(shipKind) {
    var sub = 0, setSub = 0;
    cartLines().forEach(function (x) { sub += x.p.price * x.l.qty; if (x.l.set) setSub += x.p.price * x.l.qty; });
    var disc = Math.round(setSub * 0.1 / 1000) * 1000;
    var after = sub - disc, ship = null;
    if (shipKind) ship = after >= FREE ? 0 : (shipKind === 'courier' ? COURIER : POST);
    return { sub: sub, disc: disc, after: after, ship: ship, total: after + (ship || 0), count: S.cart.reduce(function (s, l) { return s + l.qty; }, 0) };
  }
  function addToCart(id, color, size, qty, set) {
    var key = [id, color, size, set ? 'set' : ''].join('|');
    var ex = S.cart.filter(function (l) { return l.key === key; })[0];
    if (ex) ex.qty = Math.min(9, ex.qty + qty); else S.cart.push({ key: key, id: id, color: color, size: size, qty: qty, set: !!set });
    save(); updateCounts(); refreshCart();
  }
  function shipBar(tt) {
    if (tt.after >= FREE) return '<div class="ship-bar ok">' + ic('check') + ' ' + t('cart.free') + '<div class="bar"><i style="width:100%"></i></div></div>';
    var pct = Math.min(100, Math.round(tt.after / FREE * 100));
    return '<div class="ship-bar"><span class="num">' + t('cart.left', { x: money(FREE - tt.after) }) + '</span><div class="bar"><i style="width:' + pct + '%"></i></div></div>';
  }
  function lineHTML(x, editable) {
    var l = x.l, p = x.p, c = x.c;
    return '<div class="line"><a class="th" href="#p-' + p.id + '" data-action="open-product" data-id="' + p.id + '" data-color="' + c.id + '" style="--sw:' + c.env + '" aria-label="' + esc(L(p).name) + '"><img src="' + img(p, c.id) + '" alt="" width="78" height="78"></a>' +
      '<div class="nm"><b><a href="#p-' + p.id + '" data-action="open-product" data-id="' + p.id + '" data-color="' + c.id + '">' + esc(L(p).name) + '</a>' + (l.set ? '<span class="set-tag">' + t('cart.set') + '</span>' : '') + '</b><small>' + esc(c[lang]) + ' · ' + t('cart.size') + ' ' + esc(sizeName(l.size)) + '</small><small class="num">' + money(p.price) + '</small></div>' +
      '<div class="rt">' + (editable ? '<div class="qty"><button data-action="c-qty" data-k="' + esc(l.key) + '" data-d="-1" aria-label="−">' + ic('minus') + '</button><span class="num">' + num(l.qty) + '</span><button data-action="c-qty" data-k="' + esc(l.key) + '" data-d="1" aria-label="+">' + ic('plus') + '</button></div><button class="rm" data-action="c-rm" data-k="' + esc(l.key) + '">' + t('cart.remove') + '</button>' : '<span class="num">× ' + num(l.qty) + '</span>') + '</div></div>';
  }
  function cartBody() {
    var lines = cartLines();
    if (!lines.length) return '<div class="empty-cart"><img src="' + img(P('teddy'), 'cream') + '" alt="" width="140" height="140"><p>' + t('cart.empty') + '</p><a class="btn btn-ink" href="#shop" data-action="close-layer-go" data-to="shop">' + t('cart.emptyCta') + '</a></div>';
    var tt = totals();
    return shipBar(tt) + lines.map(function (x) { return lineHTML(x, true); }).join('');
  }
  function cartFoot() {
    if (!S.cart.length) return '';
    var tt = totals();
    return '<label class="switch"><span>' + ic('gift') + ' ' + t('cart.wrap') + '</span><input type="checkbox" id="wrapToggle" data-change="wrap"' + (S.wrap ? ' checked' : '') + '></label>' +
      '<div class="sum"><div><span>' + t('cart.sub') + '</span><span class="num">' + money(tt.sub) + '</span></div>' + (tt.disc ? '<div class="disc"><span>' + t('cart.disc') + '</span><span class="num">− ' + money(tt.disc) + '</span></div>' : '') +
      '<div><span>' + t('cart.ship') + '</span><span>' + (tt.after >= FREE ? t('co.freeShip') : t('cart.shipNext')) + '</span></div><div class="tot"><span>' + t('cart.total') + '</span><span class="num">' + money(tt.after) + '</span></div></div>' +
      '<a class="btn btn-primary btn-block" href="#checkout" data-action="close-layer-go" data-to="checkout">' + t('cart.checkout') + ic('arrow', 'flip') + '</a><button class="btn btn-ghost btn-block" data-action="close-layer">' + t('cart.keep') + '</button>';
  }
  function refreshCart() {
    var b = $('#cartBody'), f = $('#cartFoot'), h = $('#cartHead');
    if (b) b.innerHTML = cartBody(); if (f) { f.innerHTML = cartFoot(); f.hidden = !S.cart.length; }
    if (h) h.textContent = t('cart.title') + (S.cart.length ? ' · ' + t('cart.items', { n: num(totals().count) }) : '');
    if (S.route === 'checkout') { var cs = $('#coSum'); if (cs) cs.innerHTML = coSummary(); }
  }

  /* checkout */
  var PROV = [['تهران', 'Tehran'], ['البرز', 'Alborz'], ['اصفهان', 'Isfahan'], ['فارس', 'Fars'], ['خراسان رضوی', 'Razavi Khorasan'], ['آذربایجان شرقی', 'East Azerbaijan'], ['آذربایجان غربی', 'West Azerbaijan'], ['اردبیل', 'Ardabil'], ['ایلام', 'Ilam'], ['بوشهر', 'Bushehr'], ['چهارمحال و بختیاری', 'Chaharmahal and Bakhtiari'], ['خراسان جنوبی', 'South Khorasan'], ['خراسان شمالی', 'North Khorasan'], ['خوزستان', 'Khuzestan'], ['زنجان', 'Zanjan'], ['سمنان', 'Semnan'], ['سیستان و بلوچستان', 'Sistan and Baluchestan'], ['قزوین', 'Qazvin'], ['قم', 'Qom'], ['کردستان', 'Kurdistan'], ['کرمان', 'Kerman'], ['کرمانشاه', 'Kermanshah'], ['کهگیلویه و بویراحمد', 'Kohgiluyeh and Boyer-Ahmad'], ['گلستان', 'Golestan'], ['گیلان', 'Gilan'], ['لرستان', 'Lorestan'], ['مازندران', 'Mazandaran'], ['مرکزی', 'Markazi'], ['هرمزگان', 'Hormozgan'], ['همدان', 'Hamadan'], ['یزد', 'Yazd']];
  var CO = { name: '', phone: '', prov: '0', city: '', street: '', postal: '', note: '', ship: 'courier' };
  function coSummary() {
    var tt = totals(CO.prov === '0' ? CO.ship : 'post');
    return '<div class="panel"><h2>' + t('co.sum') + '</h2>' + cartLines().map(function (x) { return lineHTML(x, false); }).join('') +
      '<div class="sum"><div><span>' + t('cart.sub') + '</span><span class="num">' + money(tt.sub) + '</span></div>' + (tt.disc ? '<div class="disc"><span>' + t('cart.disc') + '</span><span class="num">− ' + money(tt.disc) + '</span></div>' : '') +
      '<div><span>' + t('cart.ship') + '</span><span class="num">' + (tt.ship === 0 ? t('co.freeShip') : money(tt.ship)) + '</span></div>' + (S.wrap ? '<div><span>' + t('cart.wrap') + '</span><span>' + t('co.freeShip') + '</span></div>' : '') +
      '<div class="tot"><span>' + t('cart.total') + '</span><span class="num">' + money(tt.total) + '</span></div></div></div>';
  }
  function viewCheckout() {
    if (!S.cart.length) return '<div class="wrap"><div class="page-head"><h1>' + t('co.title') + '</h1></div><div class="empty"><p>' + t('cart.empty') + '</p><a class="btn btn-ink" href="#shop">' + t('cart.emptyCta') + '</a></div></div>';
    function fld(id, k, type, extra, full) { return '<div class="fld' + (full ? ' full' : '') + '" data-f="' + id + '"><label for="co_' + id + '">' + t(k) + '</label><input id="co_' + id + '" name="' + id + '" type="' + type + '" value="' + esc(CO[id]) + '" ' + (extra || '') + '><span class="msg" aria-live="polite"></span></div>'; }
    var tehran = CO.prov === '0', tt = totals();
    return '<div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="#home">' + t('crumb.home') + '</a>' + ic('chev', 'flip') + '<button class="link" style="color:inherit;font-weight:500" data-action="cart">' + t('cart.title') + '</button>' + ic('chev', 'flip') + '<span>' + t('co.title') + '</span></nav>' +
      '<div class="page-head"><h1>' + t('co.title') + '</h1></div><div class="co"><form data-form="checkout" novalidate>' +
      '<div class="panel"><h2><span class="n num">' + num(1) + '</span>' + t('co.contact') + '</h2><div class="fields">' + fld('name', 'co.name', 'text', 'autocomplete="name"') + fld('phone', 'co.phone', 'tel', 'autocomplete="tel" inputmode="tel" dir="ltr" placeholder="09xx xxx xxxx"') + '</div></div>' +
      '<div class="panel"><h2><span class="n num">' + num(2) + '</span>' + t('co.addr') + '</h2><div class="fields">' +
      '<div class="fld" data-f="prov"><label for="co_prov">' + t('co.prov') + '</label><select id="co_prov" name="prov" data-change="prov">' + PROV.map(function (p, i) { return '<option value="' + i + '"' + (String(i) === CO.prov ? ' selected' : '') + '>' + esc(lang === 'fa' ? p[0] : p[1]) + '</option>'; }).join('') + '</select><span class="msg"></span></div>' +
      fld('city', 'co.city', 'text', 'autocomplete="address-level2"') + fld('street', 'co.street', 'text', 'autocomplete="street-address"', true) + fld('postal', 'co.postal', 'text', 'inputmode="numeric" autocomplete="postal-code" dir="ltr" maxlength="12"') +
      '<div class="fld full"><label for="co_note">' + t('co.note') + '</label><textarea id="co_note" name="note">' + esc(CO.note) + '</textarea></div></div></div>' +
      '<div class="panel"><h2><span class="n num">' + num(3) + '</span>' + t('co.shipT') + '</h2><div style="display:grid;gap:10px" id="shipOpts">' + shipOpts(tehran, tt) + '</div></div>' +
      '<div class="panel"><h2><span class="n num">' + num(4) + '</span>' + t('co.pay') + '</h2><div class="pay-note">' + ic('shield') + '<span>' + t('co.payNote') + '</span></div><button class="btn btn-primary btn-block" type="submit">' + t('co.place') + '</button><span class="err-msg" id="coErr" hidden>' + t('co.fix') + '</span></div>' +
      '</form><aside class="co-sum" id="coSum">' + coSummary() + '</aside></div></div>';
  }
  function shipOpts(tehran, tt) {
    if (!tehran && CO.ship === 'courier') CO.ship = 'post';
    var free = tt.after >= FREE;
    function r(v, k, price, off) { return '<label class="radio' + (off ? ' off' : '') + '"><input type="radio" name="ship" value="' + v + '" data-change="ship"' + (CO.ship === v ? ' checked' : '') + (off ? ' disabled' : '') + '><span class="rt"><b>' + t(k) + '</b>' + (off ? '<small>' + t('co.tehranOnly') + '</small>' : '') + '</span><span class="num">' + (free ? t('co.freeShip') : money(price)) + '</span></label>'; }
    return r('courier', 'co.s1', COURIER, !tehran) + r('post', 'co.s2', POST, false);
  }
  function validate(form) {
    var ok = true;
    function set(id, msg) { var f = $('[data-f="' + id + '"]', form); if (!f) return; f.classList.toggle('bad', !!msg); f.querySelector('.msg').textContent = msg || ''; if (msg) ok = false; }
    var name = CO.name.trim(), phone = toLatin(CO.phone).replace(/[\s-]/g, ''), postal = toLatin(CO.postal).replace(/[\s-]/g, '');
    set('name', name.length < 3 ? t('co.req') : '');
    set('phone', !phone ? t('co.req') : (/^09\d{9}$/.test(phone) ? '' : t('co.badPhone')));
    set('city', CO.city.trim() ? '' : t('co.req'));
    set('street', CO.street.trim().length < 6 ? t('co.req') : '');
    set('postal', !postal ? t('co.req') : (/^\d{10}$/.test(postal) ? '' : t('co.badPostal')));
    return ok;
  }
  function viewDone() {
    var o = S.order;
    if (!o) return '<div class="wrap"><div class="done"><h1>' + t('nf.title') + '</h1><a class="btn btn-ink" href="#shop">' + t('done.cta') + '</a></div></div>';
    var colors = ['#FF6A3D', '#9DBCE3', '#F1D06A', '#9DB89F', '#E7A6A1', '#2F3E6B'], conf = '';
    for (var i = 0; i < 36; i++) conf += '<i style="left:' + (i * 2.8 % 100) + '%;background:' + colors[i % 6] + ';animation-delay:' + (i % 9) * 0.12 + 's"></i>';
    var prov = PROV[+o.prov] || PROV[0];
    return '<div class="wrap"><div class="done"><div class="confetti" aria-hidden="true">' + conf + '</div><span class="tick">' + ic('check') + '</span><h1>' + t('done.title') + '</h1><span style="color:var(--ink-2);font-weight:700">' + t('done.no') + '</span><span class="no num" dir="ltr">' + digits(o.no) + '</span>' +
      '<p>' + t('done.to') + ': ' + esc(o.name) + ' · ' + esc(lang === 'fa' ? prov[0] : prov[1]) + '، ' + esc(o.city) + '</p><p><b class="num" style="color:var(--ink)">' + money(o.total) + '</b></p><p>' + t('done.sub') + '</p><a class="btn btn-primary" href="#shop">' + t('done.cta') + '</a></div></div>';
  }

  /* content pages */
  function viewSize() {
    var rows = D.sizes.map(function (s) { var mods = D.products.filter(function (p) { return p.sizes.indexOf(s.id) >= 0; }); return '<tr><td><b>' + esc(s[lang]) + '</b></td><td class="num">' + cmText(s) + '</td><td><div class="mods">' + mods.map(function (p) { return '<a href="#p-' + p.id + '" data-action="open-product" data-id="' + p.id + '" data-size="' + s.id + '" title="' + esc(L(p).name) + '" aria-label="' + esc(L(p).name) + '"><img src="' + img(p, p.colors[0].id) + '" alt="" width="34" height="34" loading="lazy"></a>'; }).join('') + '</div></td></tr>'; }).join('');
    return '<div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="#home">' + t('crumb.home') + '</a>' + ic('chev', 'flip') + '<span>' + t('size.title') + '</span></nav>' +
      '<div class="page-head"><h1>' + t('size.title') + '</h1><p>' + t('size.sub') + '</p></div>' +
      '<div class="size-layout"><div class="how"><h2 style="font-size:24px">' + t('size.how') + '</h2><ol><li>' + t('size.h1') + '</li><li>' + t('size.h2') + '</li><li>' + t('size.h3') + '</li></ol><div class="tipbox">' + ic('info') + '<span>' + t('size.tip') + '</span></div></div>' +
      '<div class="head-art">' + headSVG() + '</div></div>' +
      '<div class="table-wrap"><table class="size-table"><thead><tr><th>' + t('size.age') + '</th><th>' + t('size.cm') + '</th><th>' + t('size.models') + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<section class="section" id="finder">' + finderHTML() + '</section></div>';
  }
  function headSVG() {
    return '<svg viewBox="0 0 320 220" role="img" aria-label="' + t('size.how') + '"><ellipse cx="160" cy="122" rx="78" ry="86" fill="#FDE2C8"/><ellipse cx="160" cy="70" rx="82" ry="46" fill="#5B4636"/><ellipse cx="83" cy="128" rx="12" ry="18" fill="#F7CFAE"/><ellipse cx="237" cy="128" rx="12" ry="18" fill="#F7CFAE"/>' +
      '<circle cx="132" cy="134" r="6" fill="#221D3A"/><circle cx="188" cy="134" r="6" fill="#221D3A"/><path d="M146 168q14 12 28 0" stroke="#221D3A" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="118" cy="154" r="9" fill="#F7A7A0" opacity=".6"/><circle cx="202" cy="154" r="9" fill="#F7A7A0" opacity=".6"/>' +
      '<path d="M72 106 Q160 132 248 106" stroke="#FF6A3D" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M72 106 Q160 132 248 106" stroke="#fff" stroke-width="2" fill="none" stroke-dasharray="2 12"/>' +
      '<rect x="226" y="92" width="62" height="30" rx="8" fill="#221D3A"/><text x="257" y="113" text-anchor="middle" font-size="15" font-weight="700" fill="#fff" font-family="Vazirmatn, sans-serif">' + digits('48 cm').replace('cm', lang === 'fa' ? 'سانت' : 'cm') + '</text></svg>';
  }
  function viewAbout() {
    return '<div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="#home">' + t('crumb.home') + '</a>' + ic('chev', 'flip') + '<span>' + t('nav.about') + '</span></nav>' +
      '<div class="about-grid"><div class="prose"><h1 style="font-size:clamp(32px,4.6vw,52px);color:var(--ink)">' + t('about.title') + '</h1><p class="lead">' + t('about.lead') + '</p><p>' + t('about.p1') + '</p><p>' + t('about.p2') + '</p><div><a class="btn btn-primary" href="#shop">' + t('hero.cta') + ic('arrow', 'flip') + '</a></div></div>' +
      '<div class="about-art" aria-hidden="true"><img src="' + img(P('fisher'), 'mustard') + '" alt=""><img src="' + img(P('minicap'), 'coral') + '" alt=""><img src="' + img(P('sailor'), 'navy') + '" alt=""></div></div>' +
      '<div class="values">' + [['leaf', 'about.v1'], ['tape', 'about.v2'], ['star', 'about.v3']].map(function (v) { return '<div class="value">' + ic(v[0]) + '<b>' + t(v[1]) + '</b><span>' + t(v[1] + 's') + '</span></div>'; }).join('') + '</div></div>';
  }
  function viewHelp() {
    var faq = [1, 2, 3, 4].map(function (i) { return '<details><summary>' + t('q' + i) + ic('down') + '</summary><div class="body"><p>' + t('a' + i) + '</p></div></details>'; }).join('');
    return '<div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="#home">' + t('crumb.home') + '</a>' + ic('chev', 'flip') + '<span>' + t('help.title') + '</span></nav>' +
      '<div class="page-head"><h1>' + t('help.title') + '</h1></div><div class="help-grid"><nav class="help-nav" aria-label="' + t('help.title') + '">' +
      [['ship', 'help.ship'], ['ret', 'help.ret'], ['faq', 'help.faq'], ['contact', 'help.contact']].map(function (x) { return '<button data-action="scroll-to" data-to="h-' + x[0] + '">' + t(x[1]) + '</button>'; }).join('') + '</nav><div>' +
      '<section class="help-sec" id="h-ship"><h2>' + t('help.ship') + '</h2><p>' + t('help.shipT') + '</p></section>' +
      '<section class="help-sec" id="h-ret"><h2>' + t('help.ret') + '</h2><p>' + t('help.retT') + '</p></section>' +
      '<section class="help-sec" id="h-faq"><h2>' + t('help.faq') + '</h2><div class="acc">' + faq + '</div></section>' +
      '<section class="help-sec" id="h-contact"><h2>' + t('help.contact') + '</h2><p>' + t('help.contactT') + '</p><div class="copy-row"><span style="font-weight:700">' + t('help.email') + ':</span><code id="mailText">hello@ninikolah.example</code><button class="btn btn-ghost" data-action="copy" data-target="mailText">' + ic('copy') + t('help.copy') + '</button></div></section>' +
      '</div></div></div>';
  }
  function viewWish() {
    var list = S.wish.map(P).filter(Boolean);
    return '<div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="#home">' + t('crumb.home') + '</a>' + ic('chev', 'flip') + '<span>' + t('wish.title') + '</span></nav><div class="page-head"><h1>' + t('wish.title') + '</h1></div>' +
      '<div id="wishGrid" style="padding-bottom:30px">' + (list.length ? '<div class="grid">' + list.map(function (p) { return card(p); }).join('') + '</div>' : '<div class="empty"><svg viewBox="0 0 24 24" class="ic" aria-hidden="true">' + ICONS.heart + '</svg><p>' + t('wish.empty') + '</p><a class="btn btn-ink" href="#shop">' + t('cart.emptyCta') + '</a></div>') + '</div></div>';
  }
  function viewNotFound() { return '<div class="wrap"><div class="done"><h1>' + t('nf.title') + '</h1><a class="btn btn-ink" href="#home">' + t('nf.cta') + '</a></div></div>'; }

  /* ---------- layers: drawers, modals ---------- */
  var layerReturn = null, layerKind = null;
  function openLayer(kind, html, cls) {
    closeLayer(true);
    layerReturn = document.activeElement; layerKind = kind;
    var root = $('#layer');
    root.innerHTML = '<div class="scrim" data-action="close-layer"></div>' + html;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { $$('.scrim, .drawer, .modal', root).forEach(function (e) { e.classList.add('on'); }); var f = $('[data-autofocus]', root) || $('.drawer, .modal .box', root); if (f) { if (!f.hasAttribute('tabindex') && !/INPUT|BUTTON|A/.test(f.tagName)) f.setAttribute('tabindex', '-1'); f.focus({ preventScroll: true }); } });
    void cls;
  }
  function closeLayer(quick) {
    var root = $('#layer'); if (!root || !root.innerHTML) return;
    layerKind = null; document.body.style.overflow = '';
    if (quick) { root.innerHTML = ''; return; }
    $$('.on', root).forEach(function (e) { e.classList.remove('on'); });
    setTimeout(function () { if (!layerKind) root.innerHTML = ''; }, 280);
    if (layerReturn && layerReturn.focus && document.contains(layerReturn)) try { layerReturn.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  }
  function openCart() {
    openLayer('cart', '<aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="cartHead"><div class="drawer-h"><h2 id="cartHead"></h2><button class="icon-btn" data-action="close-layer" aria-label="' + t('a.close') + '" data-autofocus>' + ic('close') + '</button></div><div class="drawer-b" id="cartBody"></div><div class="drawer-f" id="cartFoot"></div></aside>');
    refreshCart();
  }
  function openMenu() {
    openLayer('menu', '<aside class="drawer left" role="dialog" aria-modal="true" aria-label="' + t('a.menu') + '"><div class="drawer-h"><a class="logo" href="#home" data-action="close-layer-go" data-to="home">' + LOGO + '<span>' + t('brand') + '</span></a><button class="icon-btn" data-action="close-layer" aria-label="' + t('a.close') + '" data-autofocus>' + ic('close') + '</button></div><div class="drawer-b"><nav class="mnav">' +
      [['shop', 'nav.shop'], ['shop-knit', 'nav.knit'], ['shop-summer', 'nav.summer'], ['shop-cap', 'col.daily'], ['size', 'nav.size'], ['about', 'nav.about'], ['help', 'nav.help'], ['wish', 'foot.wish']].map(function (x) { return '<a href="#' + x[0] + '" data-action="close-layer-go" data-to="' + x[0] + '">' + t(x[1]) + ic('arrow', 'flip') + '</a>'; }).join('') +
      '<button data-action="lang">' + t('a.lang') + '</button><button data-action="theme">' + (isDark() ? t('foot.light') : t('foot.dark')) + ic(isDark() ? 'sun' : 'moon') + '</button></nav></div></aside>');
  }
  function openFilters() {
    openLayer('filters', '<aside class="drawer left" role="dialog" aria-modal="true" aria-labelledby="fHead"><div class="drawer-h"><h2 id="fHead">' + t('shop.filters') + '</h2><button class="icon-btn" data-action="close-layer" aria-label="' + t('a.close') + '" data-autofocus>' + ic('close') + '</button></div><div class="drawer-b filters" style="position:static;display:grid" id="filterDrawerBody">' + filterGroups() + '</div><div class="drawer-f"><button class="btn btn-primary btn-block" data-action="close-layer" id="filterShow">' + t('shop.show', { n: num(filtered().length) }) + '</button><button class="btn btn-ghost btn-block" data-action="f-clear">' + t('shop.reset') + '</button></div></aside>');
  }
  function openSizeModal() {
    var p = P(S.param);
    var rows = D.sizes.map(function (s) { var has = p && p.sizes.indexOf(s.id) >= 0; return '<tr' + (has ? '' : ' style="opacity:.45"') + '><td><b>' + esc(s[lang]) + '</b></td><td class="num">' + cmText(s) + '</td></tr>'; }).join('');
    openLayer('size', '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="szHead"><div class="box"><div class="mh"><h2 id="szHead">' + t('size.title') + '</h2><button class="icon-btn" data-action="close-layer" aria-label="' + t('a.close') + '" data-autofocus>' + ic('close') + '</button></div><div class="mb"><p style="color:var(--ink-2)">' + t('size.sub') + '</p><div class="head-art" style="max-width:360px;justify-self:center;width:100%">' + headSVG() + '</div><ol style="margin:0;padding-inline-start:20px;color:var(--ink-2);display:grid;gap:6px"><li>' + t('size.h1') + '</li><li>' + t('size.h2') + '</li><li>' + t('size.h3') + '</li></ol><table class="mini-table"><thead><tr><th>' + t('size.age') + '</th><th>' + t('size.cm') + '</th></tr></thead><tbody>' + rows + '</tbody></table><a class="link" href="#size" data-action="close-layer-go" data-to="size">' + t('size.title') + ic('arrow', 'flip') + '</a></div></div></div>');
  }
  function openSearch() {
    openLayer('search', '<div class="modal" role="dialog" aria-modal="true" aria-label="' + t('a.search') + '" style="align-items:start"><div class="box search-box"><div class="search-in">' + ic('search') + '<label class="sr" for="searchIn">' + t('a.search') + '</label><input id="searchIn" type="search" placeholder="' + t('search.ph') + '" autocomplete="off" data-input="search" data-autofocus><button class="icon-btn" data-action="close-layer" aria-label="' + t('a.close') + '">' + ic('close') + '</button></div><div class="mb" id="searchRes"></div></div></div>');
    renderSearch('');
  }
  function norm(s) { return String(s).toLowerCase().replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[‌‏ً-ٟ]/g, '').replace(/\s+/g, ' ').trim(); }
  function renderSearch(q) {
    var box = $('#searchRes'); if (!box) return;
    var nq = norm(q);
    var sugg = '<div style="display:grid;gap:10px"><b style="font-size:13px;color:var(--ink-3)">' + t('search.sugg') + '</b><div style="display:flex;gap:8px;flex-wrap:wrap">' + ['search.s1', 'search.s2', 'search.s3', 'search.s4'].map(function (k) { return '<button class="chip" data-action="search-sugg" data-q="' + esc(t(k)) + '">' + esc(t(k)) + '</button>'; }).join('') + '</div></div>';
    if (!nq) { box.innerHTML = sugg + '<div class="results">' + D.products.slice(0, 4).map(resHTML).join('') + '</div>'; return; }
    var hits = D.products.filter(function (p) {
      var cat = D.categories.filter(function (c) { return c.id === p.cat; })[0];
      var hay = norm([p.fa.name, p.en.name, p.fa.short, p.en.short, p.fa.material, p.en.material, cat.fa, cat.en, t('season.' + p.season), p.colors.map(function (c) { return c.fa + ' ' + c.en; }).join(' '), p.model === 'bear' ? 'teddy خرس bear' : ''].join(' '));
      return nq.split(' ').every(function (w) { return hay.indexOf(w) >= 0; });
    });
    box.innerHTML = hits.length ? '<div class="results">' + hits.map(function (p) { return resHTML(p, q); }).join('') + '</div>' : '<p style="color:var(--ink-2)">' + t('search.none') + '</p>' + sugg;
  }
  function resHTML(p, q) {
    var name = esc(L(p).name);
    if (q) { var i = norm(L(p).name).indexOf(norm(q)); if (i >= 0 && L(p).name.indexOf('‌') < 0) name = esc(L(p).name.slice(0, i)) + '<mark>' + esc(L(p).name.slice(i, i + q.trim().length)) + '</mark>' + esc(L(p).name.slice(i + q.trim().length)); }
    return '<a class="res" href="#p-' + p.id + '" data-action="close-layer-go" data-to="p-' + p.id + '"><span class="th" style="--sw:' + p.colors[0].env + '"><img src="' + img(p, p.colors[0].id) + '" alt="" width="140" height="140"></span><b>' + name + '</b><span class="num">' + money(p.price) + '</span></a>';
  }
  function quickSizes(btn, id) {
    $$('.qsizes').forEach(function (e) { e.remove(); });
    var p = P(id), wrap = btn.closest('.media-wrap'); if (!p || !wrap) return;
    var el = document.createElement('div'); el.className = 'qsizes'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', t('card.pick'));
    el.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center"><b>' + t('card.pick') + '</b><button class="icon-btn" style="width:30px;height:30px;color:#221D3A" data-action="q-close" aria-label="' + t('a.close') + '">' + ic('close') + '</button></div><div class="row">' + p.sizes.map(function (s) { return '<button class="chip" data-action="q-size" data-id="' + id + '" data-s="' + s + '">' + esc(sizeName(s)) + '</button>'; }).join('') + '</div>';
    wrap.appendChild(el); var f = el.querySelector('[data-action="q-size"]'); if (f) f.focus();
  }

  /* ---------- toast ---------- */
  function toast(msg, o) {
    o = o || {};
    var host = $('#toasts'), el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status');
    el.innerHTML = (o.img ? '<img src="' + o.img + '" alt="">' : '') + '<span>' + esc(msg) + '</span>' + (o.label ? '<button>' + esc(o.label) + '</button>' : '');
    if (o.label) el.querySelector('button').addEventListener('click', function () { el.remove(); if (o.fn) o.fn(); });
    host.appendChild(el); while (host.children.length > 3) host.firstChild.remove();
    setTimeout(function () { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(function () { el.remove(); }, 320); }, o.ms || 3400);
  }

  /* ---------- router ---------- */
  function parse() {
    var h = decodeURIComponent(location.hash.slice(1)) || 'home';
    if (h === 'main') h = S.route || 'home';
    if (h.indexOf('p-') === 0) return { r: 'p', a: h.slice(2) };
    if (h.indexOf('shop') === 0) return { r: 'shop', a: h.slice(5) };
    if (h.indexOf('help') === 0) return { r: 'help', a: h.slice(5) };
    return { r: h, a: '' };
  }
  function applyShopParam(a) {
    S.filters = { cat: [], age: [], season: [], fam: [] };
    if (!a) return;
    if (a.indexOf('age-') === 0) S.filters.age = [a.slice(4)];
    else if (a === 'winter' || a === 'summer') S.filters.season = [a];
    else if (a === 'daily') S.filters.cat = ['bucket', 'cap'];
    else if (['knit', 'bucket', 'sun', 'cap'].indexOf(a) >= 0) S.filters.cat = [a];
  }
  var VIEWS = { home: viewHome, shop: viewShop, p: function () { return viewProduct(S.param); }, checkout: viewCheckout, done: viewDone, size: viewSize, about: viewAbout, help: viewHelp, wish: viewWish };
  var TITLES = { home: null, shop: 'nav.shop', checkout: 'co.title', done: 'done.title', size: 'size.title', about: 'nav.about', help: 'help.title', wish: 'wish.title' };
  function render(keepScroll) {
    var r = parse(), prevRoute = S.route, prevParam = S.param;
    killViewers(); closeLayer(true);
    if (!VIEWS[r.r]) r = { r: 'nf', a: '' };
    if (r.r === 'p' && (r.a !== prevParam || prevRoute !== 'p')) { var pp = P(r.a); S.pdp = { ci: S.pdpColor && pp ? colorIndex(pp, S.pdpColor) : 0, size: S.pdpSize && pp && pp.sizes.indexOf(S.pdpSize) >= 0 ? S.pdpSize : null, qty: 1 }; }
    S.pdpColor = null; S.pdpSize = null;
    if (r.r === 'shop' && (!keepScroll || prevRoute !== 'shop')) applyShopParam(r.a);
    S.route = r.r; S.param = r.a;
    $('#announce').innerHTML = t('announce').split(' · ').map(function (x, i) { return '<span' + (i ? ' class="ann-2"' : '') + '>' + esc(x) + '</span>'; }).join('<span class="ann-2"> · </span>');
    $('#siteHeader').innerHTML = headerHTML();
    $('#siteFooter').innerHTML = footerHTML();
    $('#main').innerHTML = r.r === 'nf' ? viewNotFound() : VIEWS[r.r]();
    document.body.classList.toggle('has-sticky', r.r === 'p' && !!P(r.a));
    var title = r.r === 'p' && P(r.a) ? L(P(r.a)).name : (TITLES[r.r] ? t(TITLES[r.r]) : null);
    document.title = (title ? title + ' · ' : '') + t('brand') + (title ? '' : ' · ' + t('tagline'));
    updateCounts(); after(r);
    if (!keepScroll) {
      if (r.r === 'help' && r.a) { var tg = document.getElementById('h-' + r.a); if (tg) { setTimeout(function () { tg.scrollIntoView({ block: 'start' }); }, 30); return; } }
      window.scrollTo(0, 0);
    }
  }
  function after(r) {
    if (r.r === 'home') {
      var hp = P(S.hero.pid), hc = hp.colors[S.hero.ci] || hp.colors[0];
      mount3D($('#heroCanvas'), { model: hp.model, colors: hc, pattern: hc.pattern || 0, yaw: hp.yaw, pitch: hp.pitch != null ? hp.pitch : 0.3, interactive: true, zoom: false }, img(hp, hc.id));
      updateFinder();
    }
    if (r.r === 'size') updateFinder();
    if (r.r === 'p') {
      var p = P(r.a); if (!p) return;
      var c = p.colors[S.pdp.ci] || p.colors[0];
      var v = mount3D($('#pdpCanvas'), { model: p.model, colors: c, pattern: c.pattern || 0, yaw: p.yaw, pitch: p.pitch != null ? p.pitch : 0.3, interactive: true, zoom: true, frame: 1.2, onZoom: function () { /* noop */ } }, img(p, c.id));
      if (!v) $$('.viewer-tools, .views').forEach(function (e) { e.hidden = true; });
      var sb = $('#stickyBuy'); if (sb) sb.classList.add('ready');
    }
  }

  /* ---------- actions ---------- */
  function setLang(l) { lang = l; prefs.lang = l; store.set('ninikolah-prefs', prefs); document.documentElement.lang = l; document.documentElement.dir = l === 'fa' ? 'rtl' : 'ltr'; render(true); }
  function toggleWish(id) {
    var i = S.wish.indexOf(id), on = i < 0, p = P(id);
    if (on) S.wish.push(id); else S.wish.splice(i, 1);
    save(); updateCounts();
    $$('[data-action="wish"][data-id="' + id + '"]').forEach(function (b) { b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', on ? t('p.wished') : t('p.wish')); b.title = on ? t('p.wished') : t('p.wish'); });
    toast(on ? t('wish.added') : t('wish.removed'), { img: p ? img(p, p.colors[0].id) : null });
    if (S.route === 'wish' && !on) { var g = $('#wishGrid'); if (g) { render(true); } }
  }
  var ACTIONS = {
    skip: function () { var m = $('#main'); m.focus(); m.scrollIntoView(); },
    menu: openMenu, cart: openCart, search: openSearch, filters: openFilters,
    'close-layer': function () { closeLayer(); },
    'close-layer-go': function (el) { closeLayer(true); var to = '#' + el.getAttribute('data-to'); if (location.hash === to) render(); else location.hash = to; },
    lang: function () { setLang(lang === 'fa' ? 'en' : 'fa'); },
    theme: function () { var d = !isDark(); document.documentElement.setAttribute('data-theme', d ? 'dark' : 'light'); prefs.theme = d ? 'dark' : 'light'; store.set('ninikolah-prefs', prefs); var wasMenu = layerKind === 'menu'; $('#siteHeader').innerHTML = headerHTML(); $('#siteFooter').innerHTML = footerHTML(); updateCounts(); if (wasMenu) openMenu(); },
    'scroll-to': function (el) { var tg = document.getElementById(el.getAttribute('data-to')); if (tg) tg.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
    'hero-model': function (el) {
      var id = el.getAttribute('data-id'), p = P(id); if (!p) return;
      S.hero = { pid: id, ci: 0 }; var c = p.colors[0];
      $$('[data-action="hero-model"]').forEach(function (b) { b.setAttribute('aria-pressed', b === el); });
      $('#heroSw').innerHTML = heroSwatches();
      var st = $('#heroStage'); st.style.setProperty('--sw', c.env);
      $('#heroPrice').textContent = money(p.price);
      var hl = $('#heroLink'); hl.href = '#p-' + id; hl.setAttribute('data-id', id);
      var cv = $('#heroCanvas'); if (cv) cv.setAttribute('aria-label', L(p).name + ' · ' + t('hero.drag'));
      if (viewers[0]) { viewers[0].setModel(p.model); viewers[0].setColors(c, c.pattern || 0); viewers[0].setView(p.yaw, p.pitch != null ? p.pitch : 0.3, 1); viewers[0].nudge(-0.004); }
      else { var fi = $('#heroStage .stage-img'); if (fi) fi.src = img(p, c.id); }
    },
    'hero-color': function (el) {
      var i = +el.getAttribute('data-i'), p = P(S.hero.pid), c = p.colors[i]; S.hero.ci = i;
      $$('[data-action="hero-color"]').forEach(function (b) { b.setAttribute('aria-pressed', b === el); });
      $('#heroStage').style.setProperty('--sw', c.env);
      if (viewers[0]) viewers[0].setColors(c, c.pattern || 0); else { var fi = $('#heroStage .stage-img'); if (fi) fi.src = img(p, c.id); }
    },
    'open-product': function (el) { S.pdpColor = el.getAttribute('data-color') || (el.id === 'heroLink' ? P(S.hero.pid).colors[S.hero.ci].id : null); S.pdpSize = el.getAttribute('data-size'); closeLayer(true); var to = '#p-' + el.getAttribute('data-id'); if (location.hash === to) render(); else location.hash = to; },
    'card-color': function (el) {
      var id = el.getAttribute('data-id'), i = +el.getAttribute('data-i'), p = P(id), c = p.colors[i]; S.cardColor[id] = i;
      var cardEl = el.closest('.card'); var m = $('[data-cmedia]', cardEl);
      m.style.setProperty('--sw', c.env); var im = $('img.main', m); im.src = img(p, c.id); im.alt = L(p).name + ' · ' + c[lang];
      $('img.alt', m).classList.toggle('has', i === 0);
      $$('[data-action="card-color"]', cardEl).forEach(function (b) { b.setAttribute('aria-pressed', b === el); });
    },
    wish: function (el) { toggleWish(el.getAttribute('data-id')); },
    quick: function (el) { quickSizes(el, el.getAttribute('data-id')); },
    'q-close': function (el) { var q = el.closest('.qsizes'); if (q) q.remove(); },
    'q-size': function (el) {
      var id = el.getAttribute('data-id'), p = P(id), ci = S.cardColor[id] || 0;
      var cardEl = el.closest('.card'); if (cardEl) { var pr = $('[data-action="card-color"][aria-pressed="true"]', cardEl); if (pr) ci = +pr.getAttribute('data-i'); }
      addToCart(id, p.colors[ci].id, el.getAttribute('data-s'), 1);
      var q = el.closest('.qsizes'); if (q) q.remove();
      toast(t('p.added') + ' · ' + L(p).name, { img: img(p, p.colors[ci].id), label: t('a.cart'), fn: openCart });
    },
    'f-toggle': function (el) { var k = el.getAttribute('data-k'), v = el.getAttribute('data-v'), a = S.filters[k], i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); refreshShop(); },
    'f-clear': function () { S.filters = { cat: [], age: [], season: [], fam: [] }; refreshShop(); },
    'p-color': function (el) { pdpSetColor(+el.getAttribute('data-i')); },
    'p-size': function (el) { S.pdp.size = el.getAttribute('data-s'); $$('[data-action="p-size"]').forEach(function (b) { b.setAttribute('aria-pressed', b === el); }); $('#sizeGrid').classList.remove('err'); $('#sizeErr').hidden = true; },
    'p-qty': function (el) { S.pdp.qty = Math.max(1, Math.min(9, S.pdp.qty + (+el.getAttribute('data-d')))); $('#pdpQty').textContent = num(S.pdp.qty); $('#qtyMinus').disabled = S.pdp.qty <= 1; $$('[data-action="p-qty"][data-d="1"]').forEach(function (b) { b.disabled = S.pdp.qty >= 9; }); },
    'p-add': function () {
      var p = P(S.param); if (!p) return;
      if (!S.pdp.size) { $('#sizeGrid').classList.add('err'); $('#sizeErr').hidden = false; $('#sizeGrid').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      var c = p.colors[S.pdp.ci]; addToCart(p.id, c.id, S.pdp.size, S.pdp.qty);
      toast(t('p.added') + ' · ' + L(p).name, { img: img(p, c.id), label: t('a.cart'), fn: openCart });
    },
    'size-modal': openSizeModal,
    'v-zin': function () { if (viewers[0]) viewers[0].zoomBy(1.2); },
    'v-zout': function () { if (viewers[0]) viewers[0].zoomBy(1 / 1.2); },
    'v-reset': function () { if (viewers[0]) viewers[0].resetView(); },
    'v-auto': function (el) { if (!viewers[0]) return; var on = el.getAttribute('aria-pressed') !== 'true'; viewers[0].setAuto(on); el.setAttribute('aria-pressed', on); },
    'v-view': function (el) { var v = viewers[0]; if (!v) return; var k = el.getAttribute('data-v'); if (k === 'front') v.setView(0, 0.18); else if (k === 'side') v.setView(-Math.PI / 2, 0.2); else v.setView(-0.4, 0.98); $$('[data-action="v-view"]').forEach(function (b) { b.setAttribute('aria-pressed', b === el); }); },
    'c-qty': function (el) { var k = el.getAttribute('data-k'), l = S.cart.filter(function (x) { return x.key === k; })[0]; if (!l) return; l.qty += +el.getAttribute('data-d'); if (l.qty < 1) { ACTIONS['c-rm'](el); return; } l.qty = Math.min(9, l.qty); save(); updateCounts(); refreshCart(); },
    'c-rm': function (el) {
      var k = el.getAttribute('data-k'), i = -1; S.cart.forEach(function (x, j) { if (x.key === k) i = j; }); if (i < 0) return;
      var removed = S.cart.splice(i, 1)[0]; save(); updateCounts(); refreshCart();
      toast(t('cart.removed'), { label: t('cart.undo'), fn: function () { S.cart.splice(Math.min(i, S.cart.length), 0, removed); save(); updateCounts(); refreshCart(); } });
      if (S.route === 'checkout' && !S.cart.length) render(true);
    },
    'gift-size': function (el) { S.giftSize = el.getAttribute('data-s'); $$('[data-action="gift-size"]').forEach(function (b) { b.setAttribute('aria-pressed', b === el); }); },
    'gift-add': function () { addToCart('pompom', 'blush', S.giftSize, 1, true); addToCart('teddy', 'honey', S.giftSize, 1, true); toast(t('gift.added'), { img: img(P('pompom'), 'blush'), label: t('a.cart'), fn: openCart }); },
    'search-sugg': function (el) { var i = $('#searchIn'); if (i) { i.value = el.getAttribute('data-q'); renderSearch(i.value); i.focus(); } },
    copy: function (el) {
      var tg = document.getElementById(el.getAttribute('data-target')); if (!tg) return; var txt = tg.textContent;
      function sel() { var r = document.createRange(); r.selectNodeContents(tg); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
      try { navigator.clipboard.writeText(txt).then(function () { toast(t('help.copied')); }, sel); } catch (e) { sel(); }
    }
  };
  var FORMS = {
    news: function (f) { var i = $('#newsEmail', f), v = i.value.trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { toast(t('news.bad')); i.focus(); return; } i.value = ''; toast(t('news.ok')); },
    checkout: function (f) {
      ['name', 'phone', 'city', 'street', 'postal', 'note'].forEach(function (k) { var el = f.elements[k]; if (el) CO[k] = el.value; });
      if (!validate(f)) { $('#coErr').hidden = false; var b = $('.fld.bad input', f); if (b) b.focus(); return; }
      var tt = totals(CO.prov === '0' ? CO.ship : 'post');
      S.order = { no: 'NK-' + String(Math.floor(100000 + Math.random() * 900000)), total: tt.total, name: CO.name.trim(), city: CO.city.trim(), prov: CO.prov };
      try { sessionStorage.setItem('ninikolah-order', JSON.stringify(S.order)); } catch (e) { /* ignore */ }
      S.cart = []; S.wrap = false; save(); location.hash = '#done';
    }
  };

  document.addEventListener('click', function (e) {
    var q = $('.qsizes'); if (q && !e.target.closest('.qsizes') && !e.target.closest('[data-action="quick"]')) q.remove();
    var el = e.target.closest('[data-action]');
    if (!el) { var a0 = e.target.closest('a[href^="#"]'); if (a0 && a0.getAttribute('href') === location.hash && !e.defaultPrevented) { e.preventDefault(); closeLayer(true); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); } return; }
    var a = el.getAttribute('data-action'); if (!ACTIONS[a]) return;
    if (el.tagName === 'A' || el.tagName === 'BUTTON') e.preventDefault();
    ACTIONS[a](el, e);
  });
  document.addEventListener('submit', function (e) { var f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault(); FORMS[f.getAttribute('data-form')](f); });
  document.addEventListener('input', function (e) {
    var k = e.target.getAttribute('data-input');
    if (k === 'finder') { S.finderCm = +e.target.value; updateFinder(); }
    if (k === 'search') renderSearch(e.target.value);
    var f = e.target.closest && e.target.closest('[data-f]'); if (f && f.classList.contains('bad')) { f.classList.remove('bad'); f.querySelector('.msg').textContent = ''; }
    if (e.target.form && e.target.form.getAttribute('data-form') === 'checkout' && e.target.name && CO.hasOwnProperty(e.target.name)) CO[e.target.name] = e.target.value;
  });
  document.addEventListener('change', function (e) {
    var k = e.target.getAttribute('data-change');
    if (k === 'sort') { S.sort = e.target.value; refreshShop(); }
    if (k === 'wrap') { S.wrap = e.target.checked; save(); refreshCart(); }
    if (k === 'prov') { CO.prov = e.target.value; var tt = totals(); $('#shipOpts').innerHTML = shipOpts(CO.prov === '0', tt); $('#coSum').innerHTML = coSummary(); }
    if (k === 'ship') { CO.ship = e.target.value; $('#coSum').innerHTML = coSummary(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { var q = $('.qsizes'); if (q) { q.remove(); return; } if (layerKind) closeLayer(); }
    if (e.key === 'Tab' && layerKind) { // keep focus inside the open layer
      var box = $('#layer .drawer, #layer .modal .box'); if (!box) return;
      var f = $$('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])', box).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return; var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener('hashchange', function () { render(); });
  window.addEventListener('scroll', function () { var h = $('#siteHeader'); if (h) h.classList.toggle('scrolled', window.scrollY > 8); }, { passive: true });
  if (window.matchMedia) { var mq = window.matchMedia('(prefers-color-scheme: dark)'); var onMq = function () { if (!document.documentElement.getAttribute('data-theme')) { $('#siteHeader').innerHTML = headerHTML(); $('#siteFooter').innerHTML = footerHTML(); updateCounts(); } }; if (mq.addEventListener) mq.addEventListener('change', onMq); }

  window.__ninikolah = { S: S, render: render, viewers: function () { return viewers; } };
  render();
})();
