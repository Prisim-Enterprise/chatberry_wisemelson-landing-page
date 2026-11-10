/* MCP — page interactions.
   Self-contained like the page's stylesheet; the patterns match the other
   product pages. Everything is progressive: without this file the page is
   complete and readable (every chat shows its finished state). With reduced
   motion nothing auto-plays; the capability switches still work. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  doc.classList.add('cos-js');
  if (!reduce) doc.style.scrollBehavior = 'smooth';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function vh() { return window.innerHeight || doc.clientHeight; }

  /* ---------- viewport watcher ---------- */
  var watchers = [];
  function watch(el, enter, leave, inset) {
    if (el) watchers.push({ el: el, enter: enter, leave: leave, inset: inset || 0, on: false });
  }
  function check() {
    var h = vh();
    watchers.forEach(function (w) {
      var r = w.el.getBoundingClientRect();
      var v = r.top < h - w.inset && r.bottom > w.inset;
      if (v === w.on) return;
      w.on = v;
      var fn = v ? w.enter : w.leave;
      if (fn) fn();
    });
  }

  /* ---------- reveals ---------- */
  $all('.cos .rv').forEach(function (el) {
    watch(el, function () { el.classList.add('is-in'); }, null, 40);
  });

  /* ---------- count-up (numbers keep their thousands separator) ---------- */
  function countUp(el) {
    var target = +el.getAttribute('data-n');
    if (reduce || !target) return;
    var t0 = null, DUR = 1000;
    function frame(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / DUR);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    /* frames pause in background tabs; never leave a number half-counted */
    setTimeout(function () { el.textContent = target.toLocaleString('en-US'); }, DUR + 300);
  }

  /* ---------- scripted screens ----------
     Plays once, the first time on screen. Beat n adds .st-n, shows every
     [data-at="n"] child (and retires any whose data-until it reached). */
  function script(box, beats, o) {
    if (!box) return;
    o = o || {};
    var played = false;
    function beat(n) {
      box.classList.add('st-' + n);
      $all('[data-at]', box).forEach(function (el) {
        var at = +el.getAttribute('data-at'), until = +el.getAttribute('data-until') || Infinity;
        el.classList.toggle('is-shown', at <= n && n < until);
      });
      $all('[data-n]', box).forEach(function (el) {
        var host = el.closest('[data-at]');
        if (!el.dataset.counted && host && host.classList.contains('is-shown')) {
          el.dataset.counted = '1';
          countUp(el);
        }
      });
      if (o.onBeat) o.onBeat(n);
    }
    function play() {
      if (played) return;
      played = true;
      if (reduce) { beat(beats.length); return; }
      beats.forEach(function (ms, i) { setTimeout(function () { beat(i + 1); }, ms); });
    }
    watch(o.trigger || box, play, null, 160);
  }

  /* hero: prompt → @Chatberry → MCP → action → result, mirrored on the path */
  var path = $('#heroPath');
  var pts = $all('#heroPath .mc-pt');
  if (path) path.style.setProperty('--p', 0);
  script($('#heroChat'), [400, 1300, 2100, 3300, 4300], {
    onBeat: function (n) {
      pts.forEach(function (li, j) {
        li.classList.toggle('is-on', j === n - 1);
        li.classList.toggle('is-past', j < n - 1);
      });
      if (path) path.style.setProperty('--p', (n - 1) / (pts.length - 1));
    }
  });

  script($('#oneChat'), [300, 1100, 2400]);                       /* request → typing → assigned */
  script($('#build'), [300, 1100, 1800, 2500, 3400]);               /* MCP → name → category → message → draft */
  script($('#anChat'), [300, 1500, 2700, 3700]);                    /* question → insight → follow-up → campaign */
  script($('#vs'), [200, 1500, 2100, 2900]);                        /* steps → fade → request → result */

  /* context: spokes draw, the AI reads its sources, then answers */
  var ctx = $('#ctx');
  script($('#ctxChat'), [300, 1700, 2900, 3800], {
    trigger: ctx,
    onBeat: function (n) {
      if (!ctx) return;
      ctx.classList.add('is-live');
      if (n >= 1) setTimeout(function () { ctx.classList.add('is-used'); }, reduce ? 0 : 600);
    }
  });

  /* ---------- stepper: lights each item in turn while on screen ---------- */
  function stepper(o) {
    var items = o.items;
    if (!items.length || !o.box) return;
    var i = -1, timer = null;
    function show(n) {
      i = n;
      items.forEach(function (el, k) {
        el.classList.toggle('is-on', k === n);
        el.classList.toggle('is-past', k < n);
      });
    }
    function stop() { clearInterval(timer); timer = null; }
    if (reduce) return;
    watch(o.box, function () {
      if (i < 0) show(0);
      stop();
      timer = setInterval(function () { show(i >= items.length - 1 ? 0 : i + 1); }, o.every);
    }, stop, 140);
  }
  stepper({ box: $('#caps'), items: $all('#caps .mc-cap'), every: 1500 });
  stepper({ box: $('#mini'), items: $all('#mini .mc-vf'), every: 1300 });

  /* ---------- control: switches decide what the AI may do ---------- */
  var rows = $all('#permList li');
  var sws = $all('#permList .mc-sw');
  var onA = $('#permOn'), onB = $('#permOn2');
  var req = $('#permReq'), reqQ = $('#reqQ'), reqNeed = $('#reqNeed'), reqRes = $('#reqRes');
  var resText = reqRes ? $('span', reqRes) : null;
  /* [request, index of the capability it needs] */
  var asks = [
    ['Find customers who ordered last week', 0],
    ['Create a campaign for repeat buyers', 3],
    ['Update this customer’s phone number', 1],
    ['Open a ticket for the delayed delivery', 6],
    ['Reply to the latest conversation', 9],
    ['Summarise this month’s performance', 7]
  ];
  var cur = 0, rTimer = null;

  function enabled(k) { return sws[k] && sws[k].getAttribute('aria-checked') === 'true'; }
  function count() {
    var n = sws.filter(function (s) { return s.getAttribute('aria-checked') === 'true'; }).length;
    if (onA) onA.textContent = n;
    if (onB) onB.textContent = n;
    rows.forEach(function (li, k) { li.classList.toggle('is-off', !enabled(k)); });
  }
  function render(flip) {
    if (!req) return;
    var a = asks[cur], ok = enabled(a[1]);
    reqQ.textContent = a[0];
    reqNeed.textContent = rows[a[1]] ? rows[a[1]].children[1].textContent : '';
    reqRes.classList.toggle('is-ok', ok);
    reqRes.classList.toggle('is-no', !ok);
    resText.textContent = ok ? 'Allowed — runs in Chatberry' : 'Not enabled — request declined';
    if (flip && !reduce) { req.classList.remove('is-flip'); void req.offsetWidth; req.classList.add('is-flip'); }
  }
  sws.forEach(function (s) {
    s.addEventListener('click', function () {
      s.setAttribute('aria-checked', s.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
      count();
      render(false);
    });
  });
  function rStop() { clearInterval(rTimer); rTimer = null; }
  count();
  render(false);
  if (!reduce) {
    watch($('#ctl'), function () {
      rStop();
      rTimer = setInterval(function () { cur = (cur + 1) % asks.length; render(true); }, 2800);
    }, rStop, 140);
  }

  /* ---------- wiring ---------- */
  var pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    setTimeout(function () { pending = false; check(); }, 50);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(schedule, { threshold: [0, 0.2, 0.6] });
    watchers.forEach(function (w) { io.observe(w.el); });
  }
  check();
})();
