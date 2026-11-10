/* The label travels in ?p= so one page can stand in for every unbuilt link.
   Written with textContent, and filtered to plain label characters, so a
   crafted query string cannot put markup on the page. */
(function () {
  var p = (new URLSearchParams(location.search).get('p') || '')
            .replace(/[^A-Za-z0-9 &'.,+\/-]/g, '').trim().slice(0, 48);
  if (!p) return;
  document.getElementById('soonWhat').textContent = p;
  document.title = p + ' \u2014 Coming Soon | Chatberry';
}());
