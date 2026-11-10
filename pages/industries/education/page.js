/* Education & Training — page interactions.
   Self-contained like the page's stylesheet; the patterns match the other
   product pages. Everything is progressive: without this file the page is
   complete and readable (each scene shows its finished state). With reduced
   motion nothing auto-plays; the journey stages still respond to clicks. */
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

  /* ---------- scripted scenes ----------
     Beat n adds .st-n to the box. Children with data-at / data-until are
     shown while at <= n < until; children with data-lit light from beat n on.
     Plays once, the first time the scene is on screen. */
  function script(box, beats, onBeat) {
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
      if (onBeat) onBeat(n);
    }
    beat(0);
    watch(box, function () {
      if (played) return;
      played = true;
      if (reduce) { beat(beats.length); return; }
      beats.forEach(function (ms, i) { setTimeout(function () { beat(i + 1); }, ms); });
    }, null, 160);
  }

  script($('#hero'), [400, 1300, 2100]);                        /* question → answer → suggested replies */
  script($('#order'), [1000]);                                   /* loose ends settle into one list */
  script($('#ba'), [400, 1000, 1600]);                           /* started → reminder → branch */
  script($('#ai'), [300, 1100, 1900, 2700, 3500, 4300]);         /* course → eligibility → hand-off */
  script($('#wis'), [300, 800, 1300, 1800, 2400]);               /* the visit, event by event */
  script($('#kn'), [300, 800, 1300, 1800, 2300]);                /* information → answer → booking → team */

  /* ---------- auto-stepping choices ----------
     Steps through the items while on screen; hovering an item pauses on it,
     leaving resumes, and the first click or arrow key hands control over. */
  function cycler(box, tabs, show, ms) {
    if (!box || !tabs.length) return;
    var i = 0, timer = null, took = false, seen = false;
    function go(n, focus) {
      i = (n + tabs.length) % tabs.length;
      tabs.forEach(function (t, k) {
        t.setAttribute('aria-selected', k === i ? 'true' : 'false');
        t.tabIndex = k === i ? 0 : -1;
      });
      show(i);
      if (focus) tabs[i].focus();
    }
    function stop() { clearInterval(timer); timer = null; }
    function run() {
      stop();
      if (reduce || took || !seen) return;
      timer = setInterval(function () { go(i + 1); }, ms);
    }
    tabs.forEach(function (t, k) {
      t.addEventListener('mouseenter', function () { if (!took) { stop(); go(k); } });
      t.addEventListener('click', function () { took = true; stop(); go(k); });
      t.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? i + 1
              : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? i - 1
              : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
        if (n === null) return;
        e.preventDefault(); took = true; stop(); go(n, true);
      });
    });
    box.addEventListener('mouseleave', run);
    box.addEventListener('focusin', stop);
    watch(box, function () { seen = true; run(); }, function () { seen = false; stop(); }, 140);
  }

  /* journey: each stage shows its preview */
  var jpanes = $all('#jr .ed-jr__p');
  cycler($('#jr'), $all('#jr .ed-jr__t'), function (n) {
    jpanes.forEach(function (p, k) { p.classList.toggle('is-on', k === n); });
  }, 3600);

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
