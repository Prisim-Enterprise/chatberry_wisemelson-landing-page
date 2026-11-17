/* Workflow Orchestration — page interactions.
   Self-contained like the page's stylesheet; the patterns match the other
   product pages. Everything is progressive: without this file the page is
   complete and readable (every visual shows its finished state). With
   reduced motion nothing auto-plays; the decision map and the run list
   still respond to clicks. */
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
  $all('.cos .rv, #eco').forEach(function (el) {
    watch(el, function () { el.classList.add('is-in'); }, null, 40);
  });

  /* ---------- scripted screens: plays once, beat n shows [data-at="n"] ---------- */
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
    watch(box, play, null, 160);
  }

  /* describe it: each phrase of the prompt becomes a node */
  var phr = $all('#gen .wo-hl');
  var phraseFor = [0, 1, 2, 3, 4, 4];   /* node → phrase (wait + follow-up share the last) */
  script($('#gen'), [500, 1100, 1700, 2300, 2900, 3500, 4100], {
    onBeat: function (n) {
      phr.forEach(function (p, k) { p.classList.toggle('is-on', n <= 6 && phraseFor[n - 1] === k); });
    }
  });

  /* approval: paused → approve pressed → workflow continues */
  script($('#appr'), [300, 1700, 2300]);

  /* ---------- stepper: lights each item in turn while on screen ---------- */
  function stepper(o) {
    var items = o.items;
    if (!items.length || !o.box) return;
    var i = -1, timer = null, rest = 0;
    function show(n) { i = n; if (o.onShow) o.onShow(n); }
    function stop() { clearInterval(timer); timer = null; }
    if (reduce) { show(o.finalOnReduce ? items.length - 1 : 0); return; }
    watch(o.box, function () {
      if (i < 0) show(0);
      stop();
      timer = setInterval(function () {
        if (i >= items.length - 1) {
          if (rest++ < (o.rest || 0)) return;   /* hold the finished state a moment */
          rest = 0;
          show(0);
          return;
        }
        show(i + 1);
      }, o.every);
    }, stop, 140);
  }

  /* hero: the live run moves along its path */
  var hn = $all('#heroRun .wo-node.is-p'), he = $all('#heroRun .wo-e.is-p');
  var LAB = { done: 'Completed', run: 'Running', wait: 'Waiting' };
  function setSt(node, s) {
    var pill = $('.wo-st', node);
    pill.className = 'wo-st wo-st--' + s;
    pill.textContent = LAB[s];
  }
  stepper({
    box: $('#heroRun'), items: hn, every: 1100, rest: 3, finalOnReduce: true,
    onShow: function (n) {
      hn.forEach(function (node, k) {
        var done = k < n || (reduce && k === n);
        node.classList.toggle('is-done', done);
        node.classList.toggle('is-cur', k === n && !reduce);
        setSt(node, done ? 'done' : k === n ? 'run' : 'wait');
      });
      he.forEach(function (e) {
        var k = +e.getAttribute('data-k');
        e.classList.toggle('is-lit', k <= n);
        e.classList.toggle('is-new', k === n);
      });
    }
  });

  /* three layers: the active layer follows the signal down */
  var layers = $all('#layersFig .wo-layer');
  stepper({ box: $('#layersFig'), items: layers, every: 1200,
            onShow: function (n) { layers.forEach(function (l, k) { l.classList.toggle('is-on', k === n); }); } });

  /* process map: each outcome lights in turn */
  var sats = $all('#sats .wo-sat'), lines = $all('#life .wo-l');
  stepper({ box: $('#life'), items: sats, every: 1500,
            onShow: function (n) {
              sats.forEach(function (s, k) { s.classList.toggle('is-on', k === n); });
              lines.forEach(function (l, k) { l.classList.toggle('is-on', k === n); });
            } });

  /* ---------- picker: auto-steps; hover pauses, click takes over ---------- */
  function picker(o) {
    var items = o.items;
    if (!items.length || !o.box) return;
    var i = -1, timer = null, took = false, seen = false;
    function show(n, focus) {
      i = (n + items.length) % items.length;
      items.forEach(function (el, k) { el.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
      if (focus) items[i].focus();
      o.onShow(i);
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
    watch(o.box, function () { seen = true; run(); }, function () { seen = false; stop(); }, 140);
    show(o.start || 0);
  }

  /* decision map: the selected intent lights its branch */
  var br = $all('#efcbcb .wo-br');
  picker({ box: $('#efcbcb'), items: $all('#efcbcb .wo-br__k'), every: 2600,
           onShow: function (n) { br.forEach(function (b, k) { b.classList.toggle('is-on', k === n); }); } });

  /* live execution: each run shows exactly where it is */
  var inst = $all('#exec .wo-inst'), detail = $('#exec .wo-exec__detail');
  var track = $all('#execTrack li'), acts = $all('#execActs .mini-btn');
  var nameEl = $('#execName'), msgEl = $('#execMsg');
  picker({ box: $('#exec'), items: inst, every: 3000, start: 1,
           onShow: function (n) {
             var b = inst[n], s = b.getAttribute('data-s'), stop = +b.getAttribute('data-at-step'), act = +b.getAttribute('data-act');
             inst.forEach(function (x, k) { x.classList.toggle('is-on', k === n); });
             detail.setAttribute('data-s', s);
             nameEl.textContent = $('b', b).textContent;
             msgEl.innerHTML = b.getAttribute('data-msg');
             track.forEach(function (li, k) {
               li.classList.toggle('is-done', s === 'done' ? true : k < stop);
               li.classList.toggle('is-stop', s !== 'done' && k === stop);
             });
             acts.forEach(function (a, k) { a.classList.toggle('is-on', k === act); });
           } });

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
