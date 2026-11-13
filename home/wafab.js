/* Floating WhatsApp button: copy of the site-wide one in /index.js (the homepage shares no files with other pages) */
/* ---------- floating WhatsApp button (site-wide) ----------
   Added to every page that loads this file. The open/closed state is kept
   for the session, so it carries over as people move between pages. The
   number is the one the blog's "Chat on WhatsApp" buttons already use. */
(function () {
  'use strict';
  var WA = 'https://wa.me/918147715267?text=' + encodeURIComponent('Hi Chatberry, I would like to know more.');
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
