/* The Second Brain — page interactions.
   Self-contained like the page's stylesheet; the patterns match the
   Customer OS page. Everything is progressive: without this file the
   page is complete and readable, only static. With reduced motion every
   scripted screen jumps straight to its finished state. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  doc.classList.add('cos-js');
  if (!reduce) doc.style.scrollBehavior = 'smooth';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function vh() { return window.innerHeight || doc.clientHeight; }

  /* ---------- viewport watcher ----------
     One throttled scroll/resize pass; IntersectionObserver only nudges it. */
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
    var t0 = null, DUR = 900;
    function frame(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / DUR);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- scripted screens ----------
     Plays its beats once, the first time it is on screen. Beat n adds .st-n,
     shows every [data-at="n"] child and retires any whose data-until it has
     reached. `listen` lists the beats during which the waveform moves. */
  function script(box, beats, o) {
    if (!box) return;
    o = o || {};
    var played = false;
    function beat(n) {
      box.classList.add('st-' + n);
      if (o.listen) box.classList.toggle('is-listening', o.listen.indexOf(n) >= 0);
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

  /* hero: talk → transcribed → understood → remembered → reminded → done */
  var story = $all('#heroStory li');
  var storyAt = [null, 0, 0, 1, 1, 2, 3];
  script($('#heroApp'), [300, 1500, 2700, 3700, 5000, 6300], {
    listen: [1, 2],
    onBeat: function (n) {
      var k = storyAt[n];
      story.forEach(function (li, j) {
        li.classList.toggle('is-on', j === k);
        li.classList.toggle('is-past', j < k);
      });
    }
  });

  /* the problem: clutter gathers, moves into memory, Chatberry remembers */
  script($('#thoughts'), [200, 2600, 3400]);

  /* talk: three requests, no context repeated */
  script($('#talkApp'), [300, 1000, 2000, 3400, 4200, 5600, 6400]);

  /* voice: listen → reminder; listen → what needs attention */
  script($('#voiceApp'), [400, 1800, 3300, 4500], { listen: [1, 3] });

  /* ask your business: three questions, answers from memory */
  var qs = $all('.sb-q');
  var qAt = [null, 0, 0, 1, 1, 2, 2];
  script($('#askApp'), [300, 1000, 2400, 3100, 4500, 5200], {
    onBeat: function (n) { qs.forEach(function (q, j) { q.classList.toggle('is-on', j === qAt[n]); }); }
  });

  /* team memory: person → team → business */
  script($('#tiers'), [300, 1300, 2300]);

  /* ---------- the week: memory fills in day by day ---------- */
  (function () {
    var days = $all('#weekTl .sb-day');
    var box = $('#weekApp');
    if (!days.length || !box || reduce) return;
    var played = false;
    function show(n) {
      days.forEach(function (d, k) {
        d.classList.toggle('is-on', k === n);
        d.classList.toggle('is-past', k < n);
      });
    }
    watch(box, function () {
      if (played) return;
      played = true;
      show(-1);
      days.forEach(function (d, k) { setTimeout(function () { show(k); }, 300 + k * 650); });
    }, null, 160);
  }());

  /* ---------- auto-playing highlighter ----------
     Steps through a set while on screen; pointing at an item pauses on it,
     leaving resumes, a click hands control over for good. */
  function highlighter(o) {
    var items = o.items;
    if (!items.length || !o.box) return;
    var i = -1, timer = null, took = false, seen = false;

    function show(n) {
      i = n;
      items.forEach(function (el, k) {
        el.classList.toggle('is-on', k === n);
        if (o.past) el.classList.toggle('is-past', k < n);
      });
      if (o.onShow) o.onShow(n);
    }
    function stop() { clearInterval(timer); timer = null; }
    function run() {
      stop();
      if (reduce || took || !seen) return;
      timer = setInterval(function () { show((i + 1) % items.length); }, o.every);
    }
    items.forEach(function (el, k) {
      el.addEventListener('mouseenter', function () { stop(); show(k); });
      el.addEventListener('click', function () { took = true; stop(); show(k); });
    });
    o.box.addEventListener('mouseleave', run);
    watch(o.box, function () { seen = true; if (i < 0) show(0); run(); },
                 function () { seen = false; stop(); }, 140);
    if (reduce) show(o.rest != null ? o.rest : 0);
  }

  /* lifecycle: one task moves from created to completed */
  var life = $('#life');
  var stages = $all('#life .sb-stage');
  highlighter({
    box: life, items: stages, every: 1100, past: true, rest: stages.length - 1,
    onShow: function (n) { if (life) life.style.setProperty('--p', n / (stages.length - 1)); }
  });

  /* the loop: the marker always travels forward around the ring */
  var loopFig = $('#loopFig');
  var loopNodes = $all('.sb-loop__nodes li');
  var rot = 0, last = 0;
  highlighter({
    box: loopFig, items: loopNodes, every: 1400,
    onShow: function (n) {
      rot += ((n - last + loopNodes.length) % loopNodes.length) * 60;
      last = n;
      if (loopFig) loopFig.style.setProperty('--rot', rot + 'deg');
    }
  });

  /* everyone: each person's request lights in turn */
  highlighter({ box: $('#people'), items: $all('.sb-person'), every: 2400 });

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
