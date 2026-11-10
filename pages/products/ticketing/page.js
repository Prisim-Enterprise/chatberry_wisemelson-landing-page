/* Ticketing — page interactions.
   Self-contained like the page's stylesheet; the patterns match the other
   product pages. Everything is progressive: without this file the page is
   complete and readable (each scene shows its finished state). With reduced
   motion nothing auto-plays; the inbox, routing and views still respond. */
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

  script($('#workspaceApp'), [500]);                             /* the selected ticket lands */
  script($('#journey'), [500, 1300, 2300, 3200]);                 /* submit → confirm → ticket → assigned */
  script($('#esc'), [400, 1300, 2200, 3100, 4100]);               /* assigned → update → follow-up → flag → escalate */
  script($('#upd'), [300, 1200, 2100, 3000]);                     /* acknowledgement → status → info → resolution */
  script($('#collab'), [500, 1600, 2700]);                        /* note → transfer → reply */

  /* lifecycle: stages light in turn and the line follows them */
  var life = $('#life'), stages = $all('#life li');
  var P = [0, .02, .27, .52, 1];
  script(life, [300, 1100, 1900, 2700], function (n) {
    if (!n) { life.style.setProperty('--p', reduce ? 1 : 0); return; }
    life.style.setProperty('--p', P[n]);
    stages.forEach(function (li, k) {
      li.classList.toggle('is-past', k < n - 1);
      li.classList.toggle('is-on', k === n - 1);
    });
  });

  /* report numbers run once on view */
  var an = $('#an');
  if (an) watch(an, function () {
    if (an.dataset.counted) return;
    an.dataset.counted = '1';
    $all('[data-n]', an).forEach(countUp);
  }, null, 160);

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

  /* hero inbox: choosing a ticket updates the detail panel */
  var panes = $all('#heroInbox .tk-pane'), rows = $all('#heroInbox .tk-row'), list = $('#heroInbox .tk-list');
  cycler($('#heroInbox'), rows, function (n) {
    panes.forEach(function (p, k) { p.classList.toggle('is-on', k === n); });
    /* on small screens the list scrolls sideways: keep the chosen ticket in view */
    if (list && list.scrollWidth > list.clientWidth + 1) {
      list.scrollTo({ left: rows[n].offsetLeft - 10, behavior: reduce ? 'auto' : 'smooth' });
    }
  }, 3800);

  /* routing: each example lights its rule and destination */
  var route = $('#route');
  cycler(route, $all('#route .tk-try__b'), function (n) {
    route.setAttribute('data-sc', String(n + 1));
  }, 3000);

  /* ---------- views: one at a time on small screens ---------- */
  var vbtns = $all('.tk-vsw__b'), views = $all('.tk-view');
  vbtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var v = +b.getAttribute('data-v');
      vbtns.forEach(function (x, k) { x.setAttribute('aria-pressed', k === v ? 'true' : 'false'); });
      views.forEach(function (x, k) { x.classList.toggle('is-on', k === v); });
    });
  });

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
