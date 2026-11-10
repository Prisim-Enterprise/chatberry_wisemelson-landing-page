/* Customer OS — page interactions.
   Everything here is progressive: without it the page is complete and
   readable, only static. With reduced motion every scripted screen jumps
   straight to its finished state and nothing auto-plays. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  doc.classList.add('cos-js');
  if (!reduce) doc.style.scrollBehavior = 'smooth';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function vh() { return window.innerHeight || doc.clientHeight; }

  /* ---------- viewport watcher ----------
     One throttled scroll/resize pass drives the reveals and every demo.
     IntersectionObserver only nudges that pass, so everything still works
     where IO is missing or throttled. */
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

  /* ---------- count-up ----------
     The value is only zeroed once the first frame runs, so a throttled
     requestAnimationFrame can never leave a number stuck on 0. */
  function countUp(el) {
    var target = +el.getAttribute('data-n');
    if (reduce || !target) return;
    var t0 = null, DUR = 1100;
    function frame(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / DUR);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- scripted screens ----------
     A screen plays its beats once, the first time it is on screen. Beat n
     adds .st-n to the screen, shows every [data-at="n"] element and retires
     any element whose data-until it has reached. */
  function script(box, beats, trigger) {
    if (!box) return;
    var played = false;
    function beat(n) {
      box.classList.add('st-' + n);
      $all('[data-at]', box).forEach(function (el) {
        var at = +el.getAttribute('data-at'), until = +el.getAttribute('data-until') || Infinity;
        el.classList.toggle('is-shown', at <= n && n < until);
      });
      $all('.os-num', box).forEach(function (el) {
        if (!el.dataset.counted && el.closest('[data-at]') && el.closest('[data-at]').classList.contains('is-shown')) {
          el.dataset.counted = '1';
          countUp(el);
        }
      });
    }
    function play() {
      if (played) return;
      played = true;
      if (reduce) { beat(beats.length); return; }
      beats.forEach(function (ms, i) { setTimeout(function () { beat(i + 1); }, ms); });
    }
    watch(trigger || box, play, null, 160);
  }

  /* hero: events appear → command entered → workflow created → task moves */
  script($('#heroApp'), [250, 1500, 2700, 3700]);

  /* build with AI: ask → typing → done → rows → ask again → updated → reminder on */
  script($('#aibApp'), [300, 1000, 2000, 2600, 4300, 5100, 5500]);

  /* AI with context: the nodes connect first, then the question is answered */
  script($('.os-ask'), [1300, 1800, 2900], $('#aiCtx'));

  /* operations overview: the four counts run up once */
  var ops = $('#opsApp');
  if (ops) watch(ops, function () {
    if (ops.dataset.counted) return;
    ops.dataset.counted = '1';
    $all('.kpi .os-num', ops).forEach(countUp);
  }, null, 160);

  /* ---------- auto-playing highlighter ----------
     Steps through a set while it is on screen. Pointing at an item pauses on
     it; leaving resumes. A click or keyboard focus hands control over for
     good. Used by the timeline, the action flow and the business models. */
  function highlighter(o) {
    var items = o.items;
    if (!items.length || !o.box) return;
    var i = -1, timer = null, took = false, seen = false;

    function show(n) {
      i = n;
      items.forEach(function (el, k) {
        el.classList.toggle('is-on', k === n);
        if (o.past) el.classList.toggle('is-past', k < n);
        if (o.aria) el.setAttribute('aria-selected', k === n ? 'true' : 'false');
      });
      if (o.onShow) o.onShow(n);
    }
    function stop() { clearInterval(timer); timer = null; }
    function run() {
      stop();
      if (reduce || took || !seen) return;
      timer = setInterval(function () { show((i + 1) % items.length); }, o.every);
    }
    items.forEach(function (el, k) {
      el.addEventListener('mouseenter', function () { stop(); show(k); });
      el.addEventListener('click', function () { took = true; stop(); show(k); });
      el.addEventListener('focus', function () { took = true; stop(); show(k); });
    });
    o.box.addEventListener('mouseleave', run);
    watch(o.box, function () { seen = true; if (i < 0) show(o.start || 0); run(); },
                 function () { seen = false; stop(); }, 140);
    if (reduce) show(o.rest != null ? o.rest : 0);
  }

  /* customer 360 timeline: hover or step through for the detail behind each event */
  highlighter({ box: $('.os-tl__list'), items: $all('.os-ev'), every: 2600, aria: true });

  /* data to action: one event travels the six steps */
  var flow = $('#actFlow');
  var steps = $all('.os-step');
  highlighter({
    box: flow, items: steps, every: 1300, past: true, rest: steps.length - 1,
    onShow: function (n) { if (flow) flow.style.setProperty('--p', steps.length > 1 ? n / (steps.length - 1) : 0); }
  });

  /* different business models: each structure lights in turn */
  highlighter({ box: $('#models-row'), items: $all('.os-model'), every: 2400 });

  /* ---------- team views ----------
     Real tablist: arrow keys move, Home/End jump. Cycles while on screen,
     pauses on hover, hands over for good on the first click or key. */
  (function () {
    var box = $('.os-teams');
    var tabs = $all('.os-teams .team');
    var panels = $all('.os-tv .tp');
    var label = $('[data-team-label]');
    var chips = $all('.os-views .chip');
    if (!box || !tabs.length) return;
    var i = 0, timer = null, took = false, seen = false, held = false;

    function show(n, focus) {
      i = (n + tabs.length) % tabs.length;
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p, k) { p.hidden = k !== i; });
      var v = panels[i] && panels[i].getAttribute('data-v');
      chips.forEach(function (c) { c.classList.toggle('is-on', c.getAttribute('data-v') === v); });
      if (label && panels[i]) label.textContent = panels[i].getAttribute('data-name');
      if (focus) tabs[i].focus();
    }
    function stop() { clearInterval(timer); timer = null; box.classList.remove('is-cycling'); }
    function run() {
      stop();
      if (reduce || took || !seen || held) return;
      box.classList.add('is-cycling');
      timer = setInterval(function () { show(i + 1); }, 4800);
    }
    function takeOver(n, focus) { took = true; stop(); show(n, focus); }

    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { takeOver(k); });
      t.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? i + 1 :
                e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? i - 1 :
                e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
        if (n === null) return;
        e.preventDefault();
        takeOver(n, true);
      });
    });
    box.addEventListener('mouseenter', function () { held = true; stop(); });
    box.addEventListener('mouseleave', function () { held = false; run(); });
    watch(box, function () { seen = true; run(); }, function () { seen = false; stop(); }, 140);
    show(0);
  }());

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
