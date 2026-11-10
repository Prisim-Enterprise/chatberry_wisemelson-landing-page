/* Voice Calling — page interactions.
   Self-contained like the page's stylesheet; the patterns match the other
   product pages. Everything is progressive: without this file the page is
   complete and readable (each scene shows its finished state). With reduced
   motion nothing plays; every scene jumps to its last beat. */
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

  /* ---------- scripted scenes ----------
     Beat n adds .st-n to the box. Children with data-at / data-until are
     shown while at <= n < until; children with data-lit light from beat n on
     (the box itself can carry data-lit too). Plays once, on first view. */
  function script(box, beats) {
    if (!box) return;
    var played = false;
    function beat(n) {
      if (n) box.classList.add('st-' + n);
      $all('[data-at], [data-until]', box).forEach(function (el) {
        var at = +el.getAttribute('data-at') || 0, until = +el.getAttribute('data-until') || Infinity;
        el.classList.toggle('is-shown', at <= n && n < until);
      });
      $all('[data-lit]', box).forEach(function (el) {
        el.classList.toggle('is-lit', +el.getAttribute('data-lit') <= n);
      });
    }
    beat(0);
    watch(box, function () {
      if (played) return;
      played = true;
      if (reduce) { beat(beats.length); return; }
      beats.forEach(function (ms, i) { setTimeout(function () { beat(i + 1); }, ms); });
    }, null, 160);
  }

  script($('#talk'), [400, 1500, 2600]);              /* customer speaks → AI replies → what it understood */
  script($('#flow'), [200, 500, 800, 1100, 1500]);    /* the workflow builds along its path */
  script($('#three'), [300, 900, 1500]);              /* person → AI → hand-off */

  /* ---------- count-up (keeps thousands separators) ---------- */
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
    setTimeout(function () { el.textContent = target.toLocaleString('en-US'); }, DUR + 300);   /* frames pause in background tabs */
  }
  var an = $('#an');
  if (an) watch(an, function () {
    if (an.dataset.counted) return;
    an.dataset.counted = '1';
    $all('[data-n]', an).forEach(countUp);
  }, null, 160);

  /* ---------- hero: the live call's timer ticks only while it's on screen ---------- */
  var timer = $('#timer'), desk = $('#desk'), secs = 252, tick = null;
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  if (timer && desk && !reduce) watch(desk, function () {
    if (tick) return;
    tick = setInterval(function () { secs += 1; timer.textContent = pad(Math.floor(secs / 60)) + ':' + pad(secs % 60); }, 1000);
  }, function () { clearInterval(tick); tick = null; }, 0);

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
