/* Omnichannel — page interactions.
   Self-contained like the page's stylesheet; the patterns match the other
   product pages. Everything is progressive: without this file the page is
   complete and readable. With reduced motion nothing auto-plays. */
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

  /* ---------- context: the conversation lands, then the key detail pulses ---------- */
  var ctx = $('#ctxApp');
  if (ctx) {
    var played = false;
    watch(ctx, function () {
      if (played) return;
      played = true;
      var items = $all('[data-at]', ctx);
      function beat(n) {
        ctx.classList.add('st-' + n);
        items.forEach(function (el) { el.classList.toggle('is-shown', +el.getAttribute('data-at') <= n); });
      }
      if (reduce) { beat(3); return; }
      [300, 1200, 2100].forEach(function (ms, i) { setTimeout(function () { beat(i + 1); }, ms); });
    }, null, 160);
  }

  /* ---------- a message becomes an action: alternates AI and team ---------- */
  var flow = $('#flow'), steps = $all('#flowSteps .oc-step'), track = $('#flowSteps');
  if (flow && steps.length) {
    var i = -1, rest = 0, timer = null;
    var show = function (n) {
      i = n;
      steps.forEach(function (s, k) {
        s.classList.toggle('is-on', k === n);
        s.classList.toggle('is-past', k < n);
      });
      track.style.setProperty('--p', Math.max(0, n) / (steps.length - 1));
    };
    var stop = function () { clearInterval(timer); timer = null; };
    if (!reduce) {
      watch(flow, function () {
        if (i < 0) show(0);
        stop();
        timer = setInterval(function () {
          if (i >= steps.length - 1) {
            if (rest++ < 2) return;               /* hold the finished route a moment */
            rest = 0;
            flow.setAttribute('data-route', flow.getAttribute('data-route') === 'ai' ? 'team' : 'ai');
            show(0);
            return;
          }
          show(i + 1);
        }, 1200);
      }, stop, 140);
    }
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
