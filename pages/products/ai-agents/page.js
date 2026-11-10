/* AI Agents — page interactions.
   Self-contained like the page's stylesheet; the patterns match the other
   product pages. Everything is progressive: without this file the page is
   complete and readable (every screen shows its finished state). With
   reduced motion nothing auto-plays and screens jump to their end state. */
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
    var t0 = null, DUR = 1200;
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

  /* lights one item, marks the ones before it */
  function mark(items, n) {
    items.forEach(function (el, k) {
      el.classList.toggle('is-on', k === n);
      el.classList.toggle('is-past', k < n);
    });
  }

  script($('#heroApp'), [400, 1300, 2300, 3100, 3700, 4300]);        /* ask → typing → done → 3 actions */
  script($('#talkChat'), [300, 1100, 2200, 3300, 4100, 5000]);       /* question → 7 things → handle → done */
  script($('#voiceApp'), [300, 2700, 3900]);                         /* listening → processing → reminders */
  script($('#flowApp'), [400, 850, 1300, 1750, 1950, 2400, 2850, 3300, 3750, 4300]);   /* nodes one by one */
  script($('#ctlApp'), [500, 1200, 1900, 2700]);                     /* the activity log fills */
  script($('#hand'), [300, 1300, 2100, 2500, 2900, 3300, 3700, 4500]);   /* chat → package → person */

  /* context: sources and checks light in turn, then the finding and the action */
  var srcs = $all('#invApp .ag-src li'), chks = $all('#invApp .ag-checks li'), stI = $all('#invApp .ag-stage li');
  chks.forEach(function (li) { li.classList.add('is-pend'); });
  mark(stI, 0);
  script($('#invApp'), [400, 900, 1400, 1900, 2400, 3300, 4300], {
    onBeat: function (n) {
      chks.forEach(function (li, k) { li.classList.toggle('is-pend', k >= n); });
      srcs.forEach(function (li, k) { li.classList.toggle('is-on', n <= 5 ? k === n - 1 : true); });
      mark(stI, n <= 5 ? 1 : n === 6 ? 2 : 3);
    }
  });

  /* analyst: question → checks → finding → recommendation */
  var aChk = $all('#anaApp .ag-inv-list li'), aSt = $all('#anaApp .ag-stage li');
  aChk.forEach(function (li) { li.classList.add('is-pend'); });
  mark(aSt, 0);
  script($('#anaApp'), [500, 1100, 1700, 2300, 3100, 4100], {
    onBeat: function (n) {
      aChk.forEach(function (li, k) { li.classList.toggle('is-pend', k >= n); });
      mark(aSt, n <= 4 ? 1 : n === 5 ? 2 : 3);
    }
  });

  /* briefing: the clock reaches 9:00, the items arrive */
  script($('#brief'), [300, 1500, 2000, 2500, 3000, 3800]);

  /* time saved: the manual blocks of the day are handed to AI one by one */
  var segs = $all('#timeBox .ag-seg'), bef = $all('#timeBox .ag-before li');
  var hrs = $('#timeBox [data-n]');
  if (!reduce) {
    segs.forEach(function (s) { s.classList.add('is-man'); });
    bef.forEach(function (b) { b.classList.add('is-man'); });
  }
  script($('#timeBox'), [500, 1100, 1700, 2300, 2900, 3500], {
    onBeat: function (n) {
      if (n === 1 && hrs) countUp(hrs);
      if (segs[n - 1]) segs[n - 1].classList.remove('is-man');
      if (bef[n - 1]) bef[n - 1].classList.remove('is-man');
    }
  });

  /* ---------- stepper: lights each item in turn while on screen ---------- */
  function stepper(o) {
    var items = o.items;
    if (!items.length || !o.box) return;
    var i = -1, timer = null, rest = 0;
    function show(n) {
      i = n;
      if (o.past) mark(items, n);
      else items.forEach(function (el, k) { el.classList.toggle('is-on', k === n); });
      if (o.bar) o.bar.style.setProperty('--p', items.length > 1 ? Math.max(0, n) / (items.length - 1) : 1);
      if (o.onShow) o.onShow(n);
    }
    function stop() { clearInterval(timer); timer = null; }
    if (reduce) { if (o.past) show(items.length - 1); return; }
    watch(o.box, function () {
      if (i < 0) show(0);
      stop();
      timer = setInterval(function () {
        if (i >= items.length - 1) {
          if (o.past && rest++ < 2) return;      /* hold the finished state a moment */
          rest = 0;
          show(0);
          return;
        }
        show(i + 1);
      }, o.every);
    }, stop, 140);
  }

  var stream = $('#stream'), secs = $('#secs');
  stepper({ box: stream, bar: stream, items: $all('#stream li'), every: 1000, past: true,
            onShow: function (n) { if (secs) secs.textContent = n + 1; } });

  stepper({ box: $('#make'), items: $all('#make .ag-mk'), every: 2800 });

  var team = $('#team'), journey = $('#journey');
  stepper({ box: team, bar: journey, items: $all('#journey li'), every: 1600, past: true,
            onShow: function (n) { if (team) team.setAttribute('data-step', n); } });

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
