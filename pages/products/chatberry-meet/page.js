/* Chatberry Meet — page interactions.
   Self-contained like the page's stylesheet. Screens play their small
   CSS scenes once they scroll into view; the industry selector is a
   proper tab set. Without this file every panel and screen shows in
   full; with reduced motion nothing auto-plays. */
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

  /* ---------- industries: tabs with arrow keys ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('#wmtInd [role="tab"]'));
  if (!tabs.length) return;

  function select(i, focus) {
    tabs.forEach(function (t, k) {
      var on = k === i, panel = document.getElementById(t.getAttribute('aria-controls'));
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      panel.hidden = !on;
      if (on && !reduce) {
        panel.classList.remove('is-enter');
        void panel.offsetWidth;            /* restart the settle animation */
        panel.classList.add('is-enter');
      }
    });
    if (focus) {
      tabs[i].focus();
      /* in the phone's pill row, bring the chosen pill into view */
      tabs[i].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  tabs.forEach(function (t, k) {
    t.addEventListener('click', function () { select(k); });
    t.addEventListener('keydown', function (e) {
      var n = null, last = tabs.length - 1;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = k === last ? 0 : k + 1;
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = k === 0 ? last : k - 1;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = last;
      if (n === null) return;
      e.preventDefault();
      select(n, true);
    });
  });
  select(0);
})();
