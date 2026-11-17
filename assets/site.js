/* Chatberry home page interactions. No dependencies. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var vh = function () { return window.innerHeight; };

  /* ---------- loader ---------- */
  function startLoader(done) {
    var loader = $('.loader');
    if (!loader || doc.classList.contains('no-loader')) { done(); return; }
    var n = $('#ldN'), bar = $('#ldBar'), t0 = performance.now(), dur = 1700;
    (function tick(now) {
      var p = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 3), v = Math.round(e * 100);
      n.textContent = String(v).padStart(3, '0');
      bar.style.transform = 'scaleX(' + e + ')';
      if (p < 1) requestAnimationFrame(tick);
      else {
        loader.classList.add('done');
        try { sessionStorage.setItem('cb-seen', '1'); } catch (err) {}
        setTimeout(done, 350);
        setTimeout(function () { loader.style.display = 'none'; }, 1300);
      }
    })(t0);
  }

  /* ---------- reveal on scroll ---------- */
  function startReveal() {
    var els = $$('.rv, .h-xl, .h-l, .end h2, .tile');
    if (!('IntersectionObserver' in window) || reduce) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- header + menu ---------- */
  var top = $('#top'), lastY = 0;
  function onHeader(y) {
    top.classList.toggle('solid', y > 40);
    if (!doc.classList.contains('menu-open')) top.classList.toggle('hide', y > lastY && y > 400);
    lastY = y;
  }
  var menuBtn = $('#menuBtn');
  function setMenu(open) {
    doc.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.firstChild.nodeValue = open ? 'Close ' : 'Menu ';
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) top.classList.remove('hide');
  }
  menuBtn.addEventListener('click', function () { setMenu(!doc.classList.contains('menu-open')); });
  $$('#menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && doc.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); } });

  /* ---------- 3D bubble ---------- */
  var b3d = $('#b3d'), b3dFloat = $('#b3dFloat');
  var BUBBLE = 'M16 7.5C9.6 7.5 4.5 12 4.5 17.6c0 2.9 1.4 5.5 3.6 7.3L7 29.5l5.2-2.4c1.2.4 2.5.6 3.8.6 6.4 0 11.5-4.5 11.5-10.1S22.4 7.5 16 7.5z';
  var DOTS = [11.5, 16, 20.5].map(function (x) { return 'M' + (x - 1.7) + ' 17.6a1.7 1.7 0 1 0 3.4 0a1.7 1.7 0 1 0 -3.4 0z'; }).join('');
  var LEAF = 'M16.5 8c.2-3 2-5 5.5-5.5-.4 3.2-2.4 5.2-5.5 5.5z';
  function mix(a, b, t) {
    var pa = a.match(/\w\w/g).map(function (h) { return parseInt(h, 16); }), pb = b.match(/\w\w/g).map(function (h) { return parseInt(h, 16); });
    return '#' + pa.map(function (v, i) { return Math.round(lerp(v, pb[i], t)).toString(16).padStart(2, '0'); }).join('');
  }
  function buildBubble() {
    if (!b3d) return;
    var N = 30, depth = b3d.offsetWidth * 0.0034, html = '';
    for (var i = N - 1; i >= 0; i--) {
      var t = i / (N - 1), z = -i * depth;
      var body, leaf;
      if (i === 0) { body = 'url(#b3dFront)'; leaf = '#5BC27D'; }
      else if (i === N - 1) { body = '#040A22'; leaf = '#0F2A18'; }
      else { body = mix('1F3FA8', '050C2E', t); leaf = mix('2E7A48', '10301B', t); }
      var defs = i === 0 ? '<defs><radialGradient id="b3dFront" cx=".32" cy=".3" r=".85"><stop offset="0" stop-color="#8FA8F5"/><stop offset=".32" stop-color="#4169E1"/><stop offset=".78" stop-color="#2A4FC4"/><stop offset="1" stop-color="#13287A"/></radialGradient><linearGradient id="b3dSheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' : '';
      var sheen = i === 0 ? '<path d="' + BUBBLE + '" fill="url(#b3dSheen)" opacity=".5"/>' : '';
      html += '<svg viewBox="0 0 32 32" style="transform:translateZ(' + z.toFixed(2) + 'px)">' + defs +
        '<path d="' + BUBBLE + DOTS + '" fill="' + body + '" fill-rule="evenodd"/>' +
        '<path d="' + LEAF + '" fill="' + leaf + '"/>' + sheen + '</svg>';
    }
    b3dFloat.innerHTML = html;
  }
  buildBubble();
  var tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  if (fine && !reduce) window.addEventListener('mousemove', function (e) {
    tilt.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    tilt.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  /* ---------- statement words ---------- */
  var stmt = $('#stmtTxt'), words = [];
  if (stmt) {
    var RED = { 'single': 1, 'inbox,': 1 };
    stmt.innerHTML = stmt.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w' + (RED[w] ? ' r' : '') + '">' + w + '</span>'; }).join(' ');
    words = $$('.w', stmt);
  }

  /* ---------- marquee ---------- */
  var marq = $('#marq'), marqHalf = 0, marqX = 0;
  if (marq) { marq.innerHTML += marq.innerHTML; marqHalf = marq.scrollWidth / 2; }

  /* ---------- chat demo ---------- */
  var chatBody = $('#chatBody'), chatRunning = false;
  var SCRIPT = [
    ['in', 'Hi! Is the 3BHK at Green Acres still available?'],
    ['typing', 1100],
    ['out', 'Hi Rahul 👋 Yes, there are 3BHK homes open on the 7th and 9th floors. Would you like to visit this weekend?', '<div class="msg__btns"><span>Saturday</span><span>Sunday</span></div>'],
    ['in', 'Saturday morning works'],
    ['typing', 1000],
    ['out', 'Booked ✓ Saturday, 11:00 am. I’ve sent you the location, and Priya from our sales team will meet you there.', '<small>AI agent · just now</small>']
  ];
  function runChat() {
    if (!chatBody || chatRunning) return;
    chatRunning = true;
    chatBody.innerHTML = '';
    if (reduce) {
      SCRIPT.forEach(function (s) { if (s[0] !== 'typing') addMsg(s, true); });
      return;
    }
    var i = 0;
    (function next() {
      if (i >= SCRIPT.length) { setTimeout(function () { chatRunning = false; if (chatVisible) runChat(); }, 5200); return; }
      var s = SCRIPT[i++];
      if (s[0] === 'typing') {
        var t = document.createElement('div');
        t.className = 'msg msg--out msg--typing'; t.innerHTML = '<i></i><i></i><i></i>';
        chatBody.appendChild(t); requestAnimationFrame(function () { t.classList.add('show'); });
        setTimeout(function () { t.remove(); next(); }, s[1]);
      } else { addMsg(s); setTimeout(next, s[0] === 'in' ? 900 : 1500); }
    })();
  }
  function addMsg(s, instant) {
    var m = document.createElement('div');
    m.className = 'msg msg--' + s[0] + (instant ? ' show' : '');
    m.textContent = s[1];
    if (s[2]) m.insertAdjacentHTML('beforeend', s[2]);
    chatBody.appendChild(m);
    if (!instant) requestAnimationFrame(function () { requestAnimationFrame(function () { m.classList.add('show'); }); });
  }
  var chatVisible = false;
  if (chatBody && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { chatVisible = en[0].isIntersecting; if (chatVisible) runChat(); }, { threshold: 0.35 }).observe(chatBody);
  } else runChat();

  /* ---------- industries peek ---------- */
  var peek = $('#peek'), pk = { x: 0, y: 0, tx: 0, ty: 0 };
  if (peek && fine) {
    $$('[data-peek]').forEach(function (row) {
      row.addEventListener('mouseenter', function () {
        var p = row.getAttribute('data-peek').split('|');
        $('#peekK').textContent = p[0]; $('#peekT').textContent = p[1];
        $('#peekL').innerHTML = p[2].split(',').map(function (x) { return '<li>' + x + '</li>'; }).join('');
        peek.classList.add('on');
      });
      row.addEventListener('mouseleave', function () { peek.classList.remove('on'); });
    });
  }

  /* ---------- cursor + magnetic buttons ---------- */
  var cur = $('.cursor'), cc = { x: -100, y: -100, tx: -100, ty: -100 };
  if (fine && !reduce) {
    window.addEventListener('mousemove', function (e) {
      cc.tx = e.clientX; cc.ty = e.clientY; pk.tx = e.clientX; pk.ty = e.clientY;
      cur.classList.add('on');
    }, { passive: true });
    document.addEventListener('mouseleave', function () { cur.classList.remove('on'); });
    document.addEventListener('mouseover', function (e) {
      cur.classList.toggle('big', !!e.target.closest('a, button, summary, [data-peek]'));
    });
    $$('[data-mag]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.3) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.3) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- per-frame updates ---------- */
  var chat = $('#chat'), band = $('.band'), chips = $$('[data-par]'), cards = $$('#stack .card');
  var panel = $('[data-tilt]');
  var lastScroll = -1, t0 = performance.now();
  function frame(now) {
    var y = window.scrollY, H = vh();
    if (y !== lastScroll) { onHeader(y); lastScroll = y; }

    // 3D bubble tilt
    if (b3d && !reduce) {
      tilt.x = lerp(tilt.x, tilt.tx, 0.06); tilt.y = lerp(tilt.y, tilt.ty, 0.06);
      var spin = Math.sin((now - t0) / 2600) * 10;
      b3d.style.transform = 'rotateY(' + (-26 + tilt.x * 22 + spin) + 'deg) rotateX(' + (14 - tilt.y * 16) + 'deg) translateY(' + (y * 0.18) + 'px)';
    }
    // inner-page hero panel tilt
    if (panel && !reduce && fine && window.innerWidth > 900) {
      tilt.x = lerp(tilt.x, tilt.tx, 0.06); tilt.y = lerp(tilt.y, tilt.ty, 0.06);
      panel.style.transform = 'rotateY(' + (-10 + tilt.x * 10) + 'deg) rotateX(' + (6 - tilt.y * 8) + 'deg) translateY(' + (-y * 0.06) + 'px)';
    }

    // statement word highlight
    if (words.length) {
      var r = stmt.getBoundingClientRect();
      var p = clamp((H * 0.82 - r.top) / (r.height + H * 0.35), 0, 1), on = Math.round(p * words.length * 1.1);
      for (var i = 0; i < words.length; i++) words[i].classList.toggle('on', i < on);
    }

    // marquee + band parallax
    if (band && !reduce) {
      var br = band.getBoundingClientRect();
      if (br.bottom > 0 && br.top < H) {
        marqX = ((now - t0) * 0.03 + y * 0.45) % marqHalf;
        marq.style.transform = 'translate3d(' + (-marqX) + 'px,0,0)';
        var bp = clamp((H - br.top) / (br.height + H), 0, 1);
        chat.style.transform = 'rotate(' + lerp(-5, 3, bp) + 'deg) translateY(' + lerp(40, -40, bp) + 'px)';
        chips.forEach(function (c) { c.style.transform = 'translateY(' + ((bp - 0.5) * 600 * parseFloat(c.getAttribute('data-par'))) + 'px)'; });
      }
    }

    // stacked cards
    for (var k = 0; k < cards.length - 1; k++) {
      var a = cards[k].getBoundingClientRect(), b = cards[k + 1].getBoundingClientRect();
      var q = clamp(1 - (b.top - a.top) / (H * 0.75), 0, 1);
      cards[k].style.transform = 'scale(' + (1 - q * 0.07) + ')';
      cards[k].style.filter = 'brightness(' + (1 - q * 0.45) + ')';
    }

    // cursor + peek follow
    if (fine && !reduce) {
      cc.x = lerp(cc.x, cc.tx, 0.22); cc.y = lerp(cc.y, cc.ty, 0.22);
      cur.style.transform = 'translate(' + cc.x + 'px,' + cc.y + 'px)';
      pk.x = lerp(pk.x, pk.tx, 0.12); pk.y = lerp(pk.y, pk.ty, 0.12);
      if (peek) { peek.style.left = pk.x + 'px'; peek.style.top = pk.y + 'px'; }
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', function () {
    buildBubble();
    if (marq) marqHalf = marq.scrollWidth / 2;
  });

  startLoader(startReveal);
  requestAnimationFrame(frame);
})();
