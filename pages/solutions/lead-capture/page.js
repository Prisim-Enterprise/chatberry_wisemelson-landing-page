/* Lead Capture — page interactions.
   Self-contained like the page's stylesheet; the patterns match the other
   product pages. Everything is progressive: without this file the page is
   complete and readable (each scene shows its finished state). With reduced
   motion nothing auto-plays and every scene shows its finished state. */
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

  script($('#hero'), [400, 900, 1400, 2300]);                    /* leads arrive, then the new QR lead */
  script($('#ms'), [300, 900, 1300, 1700, 2100]);                /* sources light, leads land one by one */
  script($('#uc1'), [700]);                                      /* the scan becomes an enquiry */
  script($('#uc2'), [300, 1000, 1700]);                          /* website → WhatsApp → one record */
  script($('#aiflow'), [300, 1100, 1900]);                       /* behaviour → insight → next step */

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
