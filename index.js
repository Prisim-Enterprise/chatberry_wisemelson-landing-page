/* Chatberry homepage — nav interactions */
(function () {
  'use strict';

  var shell    = document.getElementById('navshell');
  if (!shell) return;              // pages now use the export nav (/nav/nav.js)
  var burger   = document.getElementById('burger');
  var links    = Array.prototype.slice.call(document.querySelectorAll('.navlink'));
  var triggers = links.filter(function (l) { return l.dataset.menu; });

  function isDesktop() { return window.matchMedia('(min-width: 1180px)').matches; }

  /* ---------- mega menu ----------
     Opens on hover. Stays open while the pointer is anywhere inside the nav
     shell — including the panel itself — and closes only when the pointer
     leaves the shell, moves onto a different nav item, or Escape is pressed. */
  var openKey = null;
  var closeTimer = null;

  function panelFor(key) { return document.getElementById('mega-' + key); }

  function open(key) {
    if (key === openKey) return;
    close();
    var panel = panelFor(key);
    if (!panel) return;
    panel.hidden = false;
    shell.classList.add('is-open');
    triggers.forEach(function (t) {
      t.setAttribute('aria-expanded', String(t.dataset.menu === key));
    });
    openKey = key;
  }

  function close() {
    if (!openKey) return;
    var panel = panelFor(openKey);
    if (panel) panel.hidden = true;
    shell.classList.remove('is-open');
    triggers.forEach(function (t) { t.setAttribute('aria-expanded', 'false'); });
    openKey = null;
  }

  function cancelClose() { clearTimeout(closeTimer); }
  function scheduleClose() { cancelClose(); closeTimer = setTimeout(close, 120); }

  links.forEach(function (l) {
    l.addEventListener('mouseenter', function () {
      cancelClose();
      if (!isDesktop()) return;
      if (l.dataset.menu) { open(l.dataset.menu); } else { close(); }
    });
    if (l.dataset.menu) {
      l.addEventListener('click', function () {
        if (!isDesktop()) return;      // the panel is hidden in the mobile layout
        if (openKey === l.dataset.menu) { close(); } else { open(l.dataset.menu); }
      });
    }
  });

  /* the wordmark and the CTA buttons dismiss an open menu on hover */
  ['.brand', '.navactions'].forEach(function (sel) {
    var el = document.querySelector(sel);
    if (!el) return;
    el.addEventListener('mouseenter', function () {
      cancelClose();
      if (isDesktop()) close();
    });
  });

  shell.addEventListener('mouseenter', cancelClose);
  shell.addEventListener('mouseleave', scheduleClose);

  document.addEventListener('click', function (e) {
    if (!shell.contains(e.target)) close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { close(); closeNav(); }
  });

  /* ---------- mobile nav ---------- */
  /* ---------- mobile drawer ----------
     Below 1180px the burger opens a full-screen menu. Tapping a section
     opens its own view, built from that section's mega menu, so the two
     menus can't drift apart: column titles become accordions (all open
     to start), items become links. */
  var card = shell.querySelector('.navcard');
  var sub = document.createElement('div');
  sub.className = 'mnav';
  card.appendChild(sub);

  var ARR  = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8h11M9.5 4l4 4-4 4"/></svg>';
  var CHEV = '<svg viewBox="0 0 12 7" aria-hidden="true"><path d="M1 1l5 5 5-5"/></svg>';
  var BACK = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4 6.5 10l6 6"/></svg>';

  function esc(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function itemsOf(col) {
    return Array.prototype.map.call(col.querySelectorAll('.mega__item'), function (a) {
      var name = a.querySelector('.mega__name') || a.querySelector('span');
      return '<li><a href="' + a.getAttribute('href') + '">' + esc(name.textContent.trim()) + ARR + '</a></li>';
    }).join('');
  }

  function showSub(key, trigger) {
    var panel = panelFor(key);
    if (!panel) return;
    var label = trigger.textContent.trim();
    var html = '<button class="mnav__back" type="button">' + BACK + esc(label) + '</button>';
    Array.prototype.forEach.call(panel.querySelectorAll('.mega__col'), function (col, i) {
      var title = col.querySelector('.mega__title');
      var id = 'mnav-' + key + '-' + i;
      if (title) {                                      /* every group starts open; the visitor closes what they don't need */
        html += '<button class="mnav__g" type="button" aria-expanded="true" aria-controls="' + id + '">' +
                esc(title.textContent.trim()) + CHEV + '</button>' +
                '<ul class="mnav__l" id="' + id + '">' + itemsOf(col) + '</ul>';
      } else {
        html += '<ul class="mnav__l mnav__l--flat" id="' + id + '">' + itemsOf(col) + '</ul>';
      }
    });
    sub.innerHTML = html;
    sub.scrollTop = 0;
    shell.classList.add('is-sub');
    sub.querySelector('.mnav__back').focus();
  }

  function hideSub() {
    shell.classList.remove('is-sub');
    sub.innerHTML = '';
  }

  sub.addEventListener('click', function (e) {
    var back = e.target.closest('.mnav__back');
    if (back) { hideSub(); return; }
    var g = e.target.closest('.mnav__g');
    if (g) {
      var list = document.getElementById(g.getAttribute('aria-controls'));
      var openNow = g.getAttribute('aria-expanded') !== 'true';
      g.setAttribute('aria-expanded', String(openNow));
      list.hidden = !openNow;
    }
  });

  triggers.forEach(function (t) {
    t.addEventListener('click', function () {
      if (isDesktop()) return;
      showSub(t.dataset.menu, t);
    });
  });

  function closeNav() {
    shell.classList.remove('is-nav-open');
    document.documentElement.classList.remove('is-nav-locked');
    hideSub();
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
  }

  burger.addEventListener('click', function () {
    if (shell.classList.contains('is-nav-open')) { closeNav(); return; }
    shell.classList.add('is-nav-open');
    document.documentElement.classList.add('is-nav-locked');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
  });

  window.addEventListener('resize', function () {
    if (isDesktop() && shell.classList.contains('is-nav-open')) closeNav();
  });

  /* ---------- sticky bar ----------
     The shell is position: sticky; once the page moves the bar turns into
     a floating card (CSS .is-stuck) and stays put while the page scrolls. */
  var stuck = false;
  function onScroll() {
    var s = window.scrollY > 8;
    if (s === stuck) return;
    stuck = s;
    shell.classList.toggle('is-stuck', s);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* classic homepage features (insights rail, analytics, video, testimonials) */
(function () {
  'use strict';
  /* ---------- insights rail ----------
     While the pointer is over the rail a vertical wheel scrolls it sideways.
     The wheel feeds a target which the rail eases towards, so a single notch
     glides instead of jumping. Once either end is reached the event is
     released and the page scrolls on as normal. */
  var rail = document.querySelector('.insights__rail');
  if (rail) {
    var SPEED = 0.9;    // wheel delta -> pixels
    var EASE  = 0.12;   // fraction of the remaining distance per frame
    var EDGE  = 2;      // scrollWidth is rounded, so the ends need a tolerance
    var target = null;
    var frame  = null;

    function railMax() { return rail.scrollWidth - rail.clientWidth; }

    function step() {
      var diff = target - rail.scrollLeft;
      if (Math.abs(diff) < 0.5) {
        rail.scrollLeft = target;
        frame = null;
        return;
      }
      rail.scrollLeft += diff * EASE;
      frame = requestAnimationFrame(step);
    }

    rail.addEventListener('wheel', function (e) {
      if (!e.deltaY || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      var max = railMax();
      if (max <= 0) return;

      var atStart = rail.scrollLeft <= EDGE;
      var atEnd   = rail.scrollLeft >= max - EDGE;
      if ((e.deltaY > 0 && atEnd) || (e.deltaY < 0 && atStart)) return;

      e.preventDefault();
      if (frame === null) target = rail.scrollLeft;   // resync after any other scroll
      target = Math.max(0, Math.min(max, target + e.deltaY * SPEED));
      if (frame === null) frame = requestAnimationFrame(step);
    }, { passive: false });

    /* drag, touch or keyboard scrolling should not fight the easing */
    rail.addEventListener('scroll', function () {
      if (frame === null) target = rail.scrollLeft;
    }, { passive: true });
  }

  /* ---------- analytics: reveal + count-up ----------
     Staggers are written as CSS custom properties so the motion itself
     stays in the stylesheet; this only decides when it runs. */
  var stats = document.querySelector('.stats');
  if (stats && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    stats.classList.add('stats--anim');

    var each = function (sel, fn) {
      Array.prototype.forEach.call(stats.querySelectorAll(sel), fn);
    };

    /* dot matrix sweeps left to right: delay from the circle's column */
    each('.dm circle', function (c) {
      var col = Math.round((parseFloat(c.getAttribute('cx')) - 5) / 18);
      c.style.setProperty('--d', (col * 0.014).toFixed(3) + 's');
    });

    each('.bars__b', function (b, i) {
      b.style.setProperty('--d', (0.12 + i * 0.1).toFixed(2) + 's');
    });

    /* the lines need their own length before they can be drawn on */
    each('.revenue__chart path[stroke]', function (p) {
      try { p.style.setProperty('--len', p.getTotalLength().toFixed(1)); } catch (e) {}
    });

    each('.revenue__chart g circle', function (c, i) {
      c.style.setProperty('--d', (0.95 + i * 0.055).toFixed(3) + 's');
    });

    var countUp = function (el) {
      var m = el.textContent.trim().match(/^(\D*)(\d+)(\D*)$/);
      if (!m) return;
      var pre = m[1], target = +m[2], post = m[3], t0 = null, DUR = 1500;
      /* the value is only zeroed once the first frame actually runs, so a
         throttled rAF can never leave the number stuck on 0 */
      var frame = function (t) {
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / DUR);
        el.textContent = pre + Math.round(target * (1 - Math.pow(1 - p, 3))) + post;
        if (p < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    };

    var livened = false;
    var observer = null;

    var reached = function () {
      var r = stats.getBoundingClientRect();
      var h = window.innerHeight || document.documentElement.clientHeight;
      return r.top < h - 100 && r.bottom > 0;
    };

    var liven = function () {
      if (livened || !reached()) return;
      livened = true;
      stats.classList.add('is-live');
      each('.growth__value, .retention__value', countUp);
      window.removeEventListener('scroll', liven);
      window.removeEventListener('resize', liven);
      if (observer) observer.disconnect();
    };

    window.addEventListener('scroll', liven, { passive: true });
    window.addEventListener('resize', liven);
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(function () { liven(); }, { threshold: 0.15 });
      observer.observe(stats);
    }
    liven();
  }

  /* ---------- interactive video section ----------
     Each animation is a self-contained document that starts playing the
     moment it loads and then loops forever, so each iframe stays empty
     until that particular animation is reached — the second one begins
     its entrance when the reader scrolls down to it, not before. */
  Array.prototype.forEach.call(document.querySelectorAll('.reel__frame[data-src]'), function (fr) {
    var started = false;
    var observer = null;

    var reached = function () {
      var r = fr.getBoundingClientRect();
      var h = window.innerHeight || document.documentElement.clientHeight;
      return r.top < h - 120 && r.bottom > 0;   // a real slice of it is on screen
    };

    var play = function () {
      if (started || !reached()) return;
      started = true;
      fr.src = fr.dataset.src;
      delete fr.dataset.src;
      window.removeEventListener('scroll', play);
      window.removeEventListener('resize', play);
      if (observer) observer.disconnect();
    };

    window.addEventListener('scroll', play, { passive: true });
    window.addEventListener('resize', play);
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(function () { play(); }, { threshold: 0.12 });
      observer.observe(fr);
    }
    play();
  });

  /* ---------- testimonial carousel ---------- */
  var voices = Array.prototype.slice.call(document.querySelectorAll('.voice'));
  if (voices.length > 1) {
    var current = 0;
    var show = function (i) {
      current = (i + voices.length) % voices.length;
      voices.forEach(function (v, n) { v.hidden = n !== current; });
    };
    document.querySelectorAll('[data-voice]').forEach(function (b) {
      b.addEventListener('click', function () {
        show(current + (b.dataset.voice === 'next' ? 1 : -1));
      });
    });
  }

})();

/* ---------- floating WhatsApp button (site-wide) ----------
   Added to every page that loads this file. The open/closed state is kept
   for the session, so it carries over as people move between pages. The
   number is the one the blog's "Chat on WhatsApp" buttons already use. */
(function () {
  'use strict';
  var WA = 'https://wa.me/917382716780?text=' + encodeURIComponent('Hi Chatberry, I would like to know more.');
  var KEY = 'wm-wafab-open';
  if (document.querySelector('.wafab')) return;

  /* the WhatsApp logo and the cross, both taken from the owner's button SVG */
  var GLYPH = '<svg class="wafab__glyph" viewBox="23.2 27.2 35.6 35.6" aria-hidden="true"><path d="M44.2896 27.8433C52.8696 29.4933 58.6996 36.9256 58.4063 45.7605C58.1368 53.9078 51.546 61.0101 43.2446 62.0276C39.9108 62.4486 36.5262 61.9012 33.495 60.451C33.0103 60.24 32.4713 60.1874 31.955 60.3006C29.469 60.8965 27.0032 61.573 24.53 62.2165C24.2587 62.2861 23.98 62.3338 23.584 62.4163C24.3265 59.6993 25.0195 57.0923 25.7602 54.4963C25.949 53.84 25.8958 53.3156 25.5933 52.6721C22.7058 46.5396 22.957 40.5226 26.8913 34.9621C30.8348 29.3851 36.4008 27.0055 43.2446 27.7021C43.5673 27.7333 43.8881 27.7791 44.2896 27.8433ZM55.132 48.0173C55.6233 46.008 55.682 43.9711 55.2017 41.971C53.757 35.943 50.006 32.0361 43.9083 30.8005C37.9262 29.5905 32.9028 31.6071 29.359 36.5535C25.8097 41.5071 25.7327 46.8201 28.6623 52.1423C29.0382 52.8261 29.139 53.389 28.9098 54.1186C28.4918 55.4533 28.1673 56.8173 27.7585 58.3316C29.4543 57.8916 30.9412 57.47 32.4482 57.14C32.8753 57.0465 33.4345 57.096 33.8085 57.3013C42.4178 62.0405 52.6515 57.668 55.132 48.0173Z" fill="currentColor"/><path d="M36.865 37.9565C37.1931 38.7394 37.415 39.4965 37.8 40.162C38.35 41.1117 38.1831 41.9092 37.4241 42.5784C36.6083 43.297 36.7293 43.9075 37.3141 44.7325C38.6616 46.6319 40.3538 48.0564 42.4896 48.9895C43.0763 49.2462 43.5218 49.2902 43.9013 48.7017C44.059 48.4597 44.279 48.2617 44.4623 48.0344C45.5311 46.7034 45.1956 46.7144 46.8896 47.4495C47.4231 47.6824 47.9566 47.9299 48.4498 48.2342C48.9448 48.5367 49.6965 48.8484 49.7918 49.2792C50.0081 50.2325 49.7038 51.2005 48.9081 51.9082C47.4415 53.2135 45.7548 53.4299 43.9123 52.9202C39.9266 51.8202 36.8613 49.4295 34.5128 46.1185C33.6841 44.9507 32.9435 43.6545 32.4778 42.3089C31.9131 40.6699 32.3128 39.0895 33.4788 37.7017C34.1663 36.8859 35.0005 36.7025 35.908 36.9207C36.2728 37.0087 36.5276 37.5514 36.865 37.9565Z" fill="currentColor"/></svg>';
  var X = '<svg class="wafab__x" viewBox="0 0 91 91" aria-hidden="true"><path d="M36.5 54.5 45.5 45.5m0 0 9-9m-9 9-9-9m9 9 9 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  var box = document.createElement('div');
  box.className = 'wafab';
  box.innerHTML =
    '<a class="wafab__pill" href="' + WA + '" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">' +
      '<span class="wafab__logo">' + GLYPH.replace('wafab__glyph', 'wafab__pglyph') + '</span>' +
      '<span class="wafab__txt"><span class="wafab__word">Click</span> <span class="wafab__word">To</span> <span class="wafab__word">Chat</span> <span class="wafab__word">On</span> <span class="wafab__word">Whatsapp</span></span></a>' +
    '<button class="wafab__btn" type="button" aria-expanded="false" aria-label="Chat with us on WhatsApp">' + GLYPH + X + '</button>';
  document.body.appendChild(box);
  document.body.classList.add('has-wafab');

  var pill = box.querySelector('.wafab__pill');
  var btn = box.querySelector('.wafab__btn');
  var read = function () { try { return sessionStorage.getItem(KEY) === '1'; } catch (e) { return false; } };
  var save = function (v) { try { sessionStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {} };

  /* left open without a click, it tucks itself away after 5s — but never
     while the pointer is on it or it has keyboard focus */
  var WAIT = 5000, timer = null, hover = false;
  var arm = function () {
    clearTimeout(timer);
    var kb = box.querySelector(':focus-visible');   /* keyboard focus only: a mouse click leaves focus on the button */
    if (!box.classList.contains('is-open') || hover || kb) return;
    timer = setTimeout(function () { set(false); }, WAIT);
  };

  var set = function (open, animate) {
    box.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close WhatsApp chat' : 'Chat with us on WhatsApp');
    pill.tabIndex = open ? 0 : -1;
    pill.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (animate && open) {
      box.classList.remove('is-opening');
      void box.offsetWidth;
      box.classList.add('is-opening');
      setTimeout(function () { box.classList.remove('is-opening'); }, 500);
    }
    save(open);
    if (open) arm(); else clearTimeout(timer);
  };

  set(read(), false);
  btn.addEventListener('click', function () {
    hover = false;                                  /* the pointer is still on it after the click; count from now */
    set(!box.classList.contains('is-open'), true);
  });
  pill.addEventListener('click', function () { clearTimeout(timer); });
  box.addEventListener('mouseenter', function () { hover = true; clearTimeout(timer); });
  box.addEventListener('mouseleave', function () { hover = false; arm(); });
  box.addEventListener('focusout', function () { setTimeout(arm, 0); });
  box.addEventListener('focusin', function () { if (box.querySelector(':focus-visible')) clearTimeout(timer); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && box.classList.contains('is-open')) { set(false); btn.focus(); }
  });
})();
