/* Homepage: bar height + start-at-top. Written by tools/build-home.py — do not edit. */
/* the export lays itself out under a 58px bar; tell it how tall ours is */
(function () {
  var shell = document.getElementById('navshell');
  function set() { var h = shell ? shell.offsetHeight : 58; window.WM_NAVH = h; document.documentElement.style.setProperty('--navh', h + 'px'); }
  set(); window.addEventListener('resize', set);
  /* every landing and reload starts at the top (or at the #anchor), then the footer may snap */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  function ready() {                  /* as soon as the page has rendered into #app (not waiting for every image) */
    var app = document.getElementById('app');
    if (!app || !app.children.length) { setTimeout(ready, 30); return; }   /* timers also run in background tabs */
    if (!location.hash) window.scrollTo(0, 0);
    setTimeout(function () { document.documentElement.classList.add('wm-ready'); window.dispatchEvent(new Event('scroll')); }, 0);
  }
  document.addEventListener('DOMContentLoaded', ready);
})();
