/* Campaigns — page interactions.
   Self-contained like the page's stylesheet; the patterns match the other
   product pages. Everything is progressive: without this file the page is
   complete and readable. With reduced motion nothing auto-plays; the
   insight questions still respond to clicks. */
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

  $all('.cos .rv').forEach(function (el) {
    watch(el, function () { el.classList.add('is-in'); }, null, 40);
  });

  /* ---------- count-up (keeps thousands separators) ---------- */
  function countUp(el) {
    var target = +el.getAttribute('data-n');
    if (reduce || !target) return;
    var t0 = null, DUR = 1100;
    function frame(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / DUR);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    setTimeout(function () { el.textContent = target.toLocaleString('en-US'); }, DUR + 300);   /* frames pause in background tabs */
  }

  /* ---------- scripted screens: beat n shows [data-at="n"] ---------- */
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
        if (!el.dataset.counted && host && host.classList.contains('is-shown')) { el.dataset.counted = '1'; countUp(el); }
      });
      if (o.onBeat) o.onBeat(n);
    }
    watch(box, function () {
      if (played) return;
      played = true;
      if (reduce) { beat(beats.length); return; }
      beats.forEach(function (ms, i) { setTimeout(function () { beat(i + 1); }, ms); });
    }, null, 160);
  }

  /* hero: audience → message → schedule → review → sent */
  var steps = $all('#heroSteps li');
  script($('#heroBuild'), [400, 1200, 2000, 2800, 3700], {
    onBeat: function (n) {
      steps.forEach(function (li, k) {
        li.classList.toggle('is-on', k === n - 1 && n < 5);
        li.classList.toggle('is-done', k < n - 1 || n >= 5);
      });
    }
  });

  script($('#cal'), [700, 1600]);                          /* schedule pressed → lands on Saturday */
  script($('#mcpChat'), [300, 1100, 2100, 3300, 4300]);    /* ask → MCP → draft → approve → started */

  /* analytics: counts run once on view */
  var an = $('#an');
  if (an) watch(an, function () {
    if (an.dataset.counted) return;
    an.dataset.counted = '1';
    $all('[data-n]', an).forEach(countUp);
  }, null, 160);

  /* ---------- insights: auto-steps; hover pauses, click takes over ---------- */
  var box = $('#ins'), qs = $all('#ins .cp-q'), panes = $all('#ins .cp-pane');
  if (box && qs.length) {
    var i = -1, timer = null, took = false, seen = false;
    var show = function (n, focus) {
      i = (n + qs.length) % qs.length;
      qs.forEach(function (q, k) { q.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
      panes.forEach(function (p, k) { p.classList.toggle('is-on', k === i); });
      if (focus) qs[i].focus();
    };
    var stop = function () { clearInterval(timer); timer = null; };
    var run = function () {
      stop();
      if (reduce || took || !seen) return;
      timer = setInterval(function () { show(i + 1); }, 3600);
    };
    qs.forEach(function (q, k) {
      q.addEventListener('mouseenter', function () { stop(); show(k); });
      q.addEventListener('click', function () { took = true; stop(); show(k); });
      q.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? i - 1 : null;
        if (n === null) return;
        e.preventDefault(); took = true; stop(); show(n, true);
      });
    });
    box.addEventListener('mouseleave', run);
    watch(box, function () { seen = true; run(); }, function () { seen = false; stop(); }, 140);
    show(0);
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
