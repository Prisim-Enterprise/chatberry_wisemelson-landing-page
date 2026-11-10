/* Custom Solutions — page interactions.
   Self-contained like the page's stylesheet. Each diagram plays its small
   CSS scene (pieces snapping onto the core, the lifecycle lighting up)
   once it scrolls into view. Without this file every diagram shows its
   finished state; with reduced motion nothing auto-plays. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  doc.classList.add('cos-js');
  if (!reduce) doc.style.scrollBehavior = 'smooth';

  /* ---------- reveal on view ---------- */
  var items = Array.prototype.slice.call(document.querySelectorAll('.cos .rv'));

  function vh() { return window.innerHeight || doc.clientHeight; }
  function check() {
    var h = vh();
    items = items.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < h - 40 && r.bottom > 40) { el.classList.add('is-in'); return false; }
      return true;
    });
  }

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
    items.forEach(function (el) { io.observe(el); });
  }
  check();
})();
