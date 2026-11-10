/* Team Management — page interactions.
   Self-contained like the page's stylesheet; the patterns match the
   Customer OS and Second Brain pages. Everything is progressive: without
   this file the page is complete and readable, only static. With reduced
   motion every scripted screen jumps straight to its finished state. */
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

  /* ---------- count-up (zeroed only once a frame runs) ---------- */
  function countUp(el) {
    var target = +el.getAttribute('data-n');
    if (reduce || !target) return;
    var t0 = null, DUR = 1000;
    function frame(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / DUR);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- scripted screens ----------
     Plays once, the first time on screen. Beat n adds .st-n, shows every
     [data-at="n"] child (and retires any whose data-until it reached). */
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
      $all('.os-num', box).forEach(function (el) {
        var host = el.closest('[data-at]');
        if (!el.dataset.counted && host && host.classList.contains('is-shown')) {
          el.dataset.counted = '1';
          countUp(el);
        }
      });
      if (o.onBeat) o.onBeat(n);
    }
    function play() {
      if (played) return;
      played = true;
      if (reduce) { beat(beats.length); return; }
      beats.forEach(function (ms, i) { setTimeout(function () { beat(i + 1); }, ms); });
    }
    watch(o.trigger || box, play, null, 160);
  }

  /* hero: new request → routing → right person → assigned */
  var story = $all('#heroStory li');
  script($('#heroApp'), [300, 1300, 2500, 3400], {
    onBeat: function (n) {
      story.forEach(function (li, j) {
        li.classList.toggle('is-on', j === n - 1);
        li.classList.toggle('is-past', j < n - 1);
      });
    }
  });

  script($('#chain'), [200, 1100]);                                 /* people → … → performance → core */
  script($('#rrApp'), [300, 900, 1500, 2100, 2900, 3700, 4400]);     /* 1–4 in turn, Rahul away, 5 skips, 6 */
  script($('#chatApp'), [300, 1200, 2100, 3000, 3900]);              /* customer → internal → reply */
  script($('#myApp'), [1200]);                                        /* first focus item ticked */
  script($('#wlApp'), [200, 1300, 2200]);                             /* bars → warning → reroute */
  script($('#actApp'), [200, 600, 1000, 1400, 1800]);                 /* activity entries arrive */
  script($('#auditApp'), [1400]);                                     /* a new audit entry appears */
  script($('#nbApp'), [700]);                                         /* the Second Brain notification */

  /* 2FA: login → password → code → workspace */
  var tfaSteps = $all('#tfa .tm-2fa__steps li');
  script($('#tfa'), [300, 1000, 1700, 3000], {
    onBeat: function (n) {
      tfaSteps.forEach(function (li, j) {
        li.classList.toggle('is-on', j === n - 1);
        li.classList.toggle('is-past', j < n - 1);
      });
    }
  });

  /* analytics: columns grow and counts run once */
  var an = $('#anApp');
  if (an) watch(an, function () {
    if (an.classList.contains('is-live')) return;
    an.classList.add('is-live');
    $all('.os-num', an).forEach(countUp);
  }, null, 160);

  /* ---------- picker: auto-steps while on screen ----------
     Pointing at an item pauses on it, leaving resumes; a click hands
     control over for good. Arrow keys move between items. */
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

  /* roles: selecting a role highlights its column and permissions */
  var rolesApp = $('#rolesApp');
  picker({
    box: rolesApp, items: $all('#rolesApp .tm-role'), every: 3200, aria: true,
    onShow: function (n) { rolesApp.setAttribute('data-role', n + 1); }
  });

  /* departments: selecting a card shows that department */
  var detail = $('.tm-depdetail');
  var dds = $all('.tm-dd');
  if (detail) detail.classList.add('is-live');
  picker({
    box: $('.tm-org'), items: $all('#deps .tm-dep'), every: 2800,
    onShow: function (n) { dds.forEach(function (d, k) { d.classList.toggle('is-on', k === n); }); }
  });

  /* routing: each scenario runs through the same engine */
  var route = $('#route');
  var rail = $('#rail');
  var rs = $all('#rail .tm-rs');
  var sweep = [];
  function runRail() {
    sweep.forEach(clearTimeout);
    sweep = [];
    if (reduce) { setStep(rs.length - 1); return; }
    rs.forEach(function (_, k) { sweep.push(setTimeout(function () { setStep(k); }, 150 + k * 420)); });
  }
  function setStep(k) {
    rs.forEach(function (el, j) {
      el.classList.toggle('is-on', j === k);
      el.classList.toggle('is-past', j < k);
    });
    if (rail) rail.style.setProperty('--p', k / (rs.length - 1));
  }
  picker({
    box: route, items: $all('#route .tm-scen__b'), every: 4400, aria: true, initial: false,
    onShow: function (n) { if (route) route.setAttribute('data-sc', n + 1); runRail(); }
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
