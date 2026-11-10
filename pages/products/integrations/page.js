/* Integrations — page interactions.
   Self-contained like the page's stylesheet; the patterns match the other
   product pages. Everything is progressive: without this file the page is
   complete and readable (the directory shows every card). With reduced
   motion nothing auto-plays and flows show their finished state. */
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

  /* ---------- once-only beats: adds .st-1, .st-2 … ---------- */
  function script(box, beats) {
    if (!box) return;
    var played = false;
    watch(box, function () {
      if (played) return;
      played = true;
      if (reduce) { beats.forEach(function (_, i) { box.classList.add('st-' + (i + 1)); }); return; }
      beats.forEach(function (ms, i) { setTimeout(function () { box.classList.add('st-' + (i + 1)); }, ms); });
    }, null, 160);
  }
  script($('#silo'), [300, 1100]);

  /* ---------- stepper: lights each item in turn while on screen ----------
     `past` keeps earlier items lit; `bar` gets a --p progress value. Loops
     with a short rest at the end. Reduced motion shows the finished state. */
  function stepper(o) {
    var items = o.items;
    if (!items.length || !o.box) return;
    var i = -1, timer = null;
    function show(n) {
      i = n;
      items.forEach(function (el, k) {
        el.classList.toggle('is-on', k === n);
        if (o.past) el.classList.toggle('is-past', k < n);
      });
      if (o.bar) o.bar.style.setProperty('--p', items.length > 1 ? Math.max(0, n) / (items.length - 1) : 1);
    }
    function tick() { show(i + 1 >= items.length + 1 ? 0 : i + 1); }
    function stop() { clearInterval(timer); timer = null; }
    if (reduce) { show(items.length - 1); return; }
    watch(o.box, function () {
      if (i < 0) show(0);
      stop();
      timer = setInterval(function () {
        if (i >= items.length - 1) { show(-1); items.forEach(function (el) { el.classList.remove('is-past'); }); return; }
        tick();
      }, o.every);
    }, stop, 140);
  }

  var live = $('#heroLive');
  stepper({ box: live, bar: live, items: $all('#heroLive .ig-lv'), every: 1100, past: true });
  stepper({ box: $('#wf'), items: $all('#wf .ig-wfs'), every: 1000 });
  stepper({ box: $('#apiFlow'), items: $all('#apiFlow li'), every: 900 });
  var sync = $('#syncRow');
  stepper({ box: sync, bar: sync, items: $all('#syncRow .ig-sn'), every: 1100, past: true });
  stepper({ box: $('#bld'), items: $all('#bld .ig-br'), every: 900 });
  stepper({ box: $('#cosChain'), items: $all('#cosChain li'), every: 900 });

  /* ---------- picker: auto-steps; hover pauses, click takes over ---------- */
  function picker(o) {
    var items = o.items;
    if (!items.length || !o.box) return;
    var i = -1, timer = null, took = false, seen = false;
    function show(n, focus) {
      i = (n + items.length) % items.length;
      items.forEach(function (el, k) {
        el.classList.toggle('is-on', k === i);
        if (o.aria) el.setAttribute('aria-selected', k === i ? 'true' : 'false');
      });
      if (focus) items[i].focus();
      if (o.onShow) o.onShow(i);
    }
    function stop() { clearInterval(timer); timer = null; }
    function run() {
      stop();
      if (reduce || took || !seen) return;
      timer = setInterval(function () { show(i + 1); }, o.every);
    }
    items.forEach(function (el, k) {
      el.addEventListener('mouseenter', function () { stop(); show(k); });
      el.addEventListener('click', function () { took = true; stop(); show(k); });
      el.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? i + 1 :
                e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? i - 1 : null;
        if (n === null) return;
        e.preventDefault(); took = true; stop(); show(n, true);
      });
    });
    o.box.addEventListener('mouseleave', run);
    watch(o.box, function () { seen = true; if (i < 0) show(0); run(); },
                 function () { seen = false; stop(); }, 140);
    if (o.initial !== false) show(0);
  }

  /* categories */
  var cats = $('#cats');
  var panes = $all('#cats .ig-pane');
  if (cats) cats.classList.add('is-live');
  picker({
    box: cats, items: $all('#cats .ig-cat'), every: 2600, aria: true,
    onShow: function (n) { panes.forEach(function (p, k) { p.classList.toggle('is-on', k === n); }); }
  });

  /* connection → action: each example sweeps event → chatberry → actions → result */
  var ex = $('#ex');
  var cols = $all('#exFlow .ig-col');
  var sweep = [];
  function runCols() {
    sweep.forEach(clearTimeout); sweep = [];
    function set(k) { cols.forEach(function (c, j) { c.classList.toggle('is-on', j === k); c.classList.toggle('is-past', j < k); }); }
    if (reduce) { set(cols.length - 1); return; }
    cols.forEach(function (_, k) { sweep.push(setTimeout(function () { set(k); }, 150 + k * 650)); });
  }
  picker({
    box: ex, items: $all('#ex .ig-exb'), every: 4200, aria: true, initial: false,
    onShow: function (n) { if (ex) ex.setAttribute('data-ex', n + 1); runCols(); }
  });

  /* different stacks: each stack runs through the same layer in turn */
  picker({ box: $('#stacksRow'), items: $all('#stacksRow .ig-sk'), every: 2600 });

  /* the loop: the marker always travels forward */
  var loopFig = $('#loopFig');
  var loopNodes = $all('.ig-loop__nodes li');
  var rot = 0, last = 0;
  picker({
    box: loopFig, items: loopNodes, every: 1400,
    onShow: function (n) {
      rot += ((n - last + loopNodes.length) % loopNodes.length) * 60;
      last = n;
      if (loopFig) loopFig.style.setProperty('--rot', rot + 'deg');
    }
  });

  /* ---------- directory: search + category filter ---------- */
  var search = $('#igSearch');
  var cards = $all('#igCards .ig-ic');
  var filters = $all('.ig-f');
  var empty = $('#igEmpty');
  var count = $('#igCount');
  var cat = 'all';
  function filter() {
    var q = (search && search.value || '').trim().toLowerCase();
    var shown = 0;
    cards.forEach(function (c) {
      var ok = (cat === 'all' || c.getAttribute('data-f') === cat) &&
               (!q || c.getAttribute('data-name').indexOf(q) !== -1);
      c.hidden = !ok;
      if (ok) shown++;
    });
    if (empty) empty.hidden = shown !== 0;
    if (count) count.textContent = shown + (shown === 1 ? ' integration' : ' integrations');
  }
  filters.forEach(function (b) {
    b.addEventListener('click', function () {
      cat = b.getAttribute('data-f');
      filters.forEach(function (x) {
        var on = x === b;
        x.classList.toggle('is-on', on);
        x.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      filter();
    });
  });
  if (search) search.addEventListener('input', filter);
  filter();

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
