/* =========================================================
   Chatberry — blog (the listing and every post)

   Listing and topic pages: pagination. Every post is already in
   the HTML, so the page is complete and crawlable without this
   script; it only decides which nine are shown. The topic links
   are plain links to the generated topic pages. The page number
   lives in the URL (?page=2) so it can be linked to and the back
   button behaves.

   Post: marks the current section in the "In this article" lists
   (the side rail and the collapsible copy on phones), drives the
   reading-progress line and shows the back-to-top button once the
   reader is well into the article. Without JS the post reads the
   same; only these aids stay still.
   ========================================================= */
(function () {
  "use strict";

  var ARROW_L = '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><path d="M13.4 8H3M7 4 3 8l4 4"/></svg>';
  var ARROW_R = '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.6 8h10.4M9 4l4 4-4 4"/></svg>';

  /* ---------------- listing ---------------- */
  function listing(grid) {
    var PER = +grid.getAttribute("data-per-page") || 9;
    var cards = [].slice.call(grid.querySelectorAll(".bl-card"));
    var pager = document.getElementById("blPages");
    var count = document.getElementById("blCount");
    var list = document.getElementById("articles");
    var noun = grid.getAttribute("data-noun") || "more articles";

    /* links from before the topic pages (?topic=healthcare) go to that topic's page */
    var old = new URLSearchParams(location.search).get("topic");
    if (old && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(old)) {
      var to = "/pages/blog/topic/" + old + "/page.html";
      if (document.querySelector('.bl-chip[href="' + to + '"]')) { location.replace(to); return; }
    }

    function read() {
      var q = new URLSearchParams(location.search);
      return { page: Math.max(1, parseInt(q.get("page"), 10) || 1) };
    }

    function write(state, push) {
      var q = new URLSearchParams();
      if (state.page > 1) q.set("page", state.page);
      var u = location.pathname + (q.toString() ? "?" + q : "") + location.hash;
      try { history[push ? "pushState" : "replaceState"](state, "", u); } catch (e) {}
    }

    /* page numbers to show: the ends, the current page and its neighbours,
       with a gap marker where numbers are skipped */
    function numbers(cur, total) {
      var keep = [], out = [];
      for (var i = 1; i <= total; i++) if (i === 1 || i === total || Math.abs(i - cur) <= 1) keep.push(i);
      keep.forEach(function (n, k) {
        var prev = keep[k - 1];
        if (k && n - prev === 2) out.push(prev + 1);      /* a gap of one page is just that page */
        else if (k && n - prev > 2) out.push("…");
        out.push(n);
      });
      return out;
    }

    function render(state) {
      /* on the listing the latest post is already featured above, so the grid skips it */
      var pool = cards.filter(function (c) { return !c.classList.contains("is-featured"); });
      var total = Math.max(1, Math.ceil(pool.length / PER));
      state.page = Math.min(state.page, total);
      var from = (state.page - 1) * PER, to = from + PER;

      cards.forEach(function (c) { c.hidden = true; });
      pool.slice(from, to).forEach(function (c) { c.hidden = false; });

      count.textContent = pool.length
        ? "Showing " + (from + 1) + "–" + Math.min(to, pool.length) + " of " + pool.length + " " + noun
        : (cards.length ? "More articles coming soon." : "No articles yet.");

      if (total < 2) { pager.hidden = true; pager.innerHTML = ""; return; }
      var html = '<button type="button" class="edge" data-go="' + (state.page - 1) + '"' + (state.page === 1 ? " disabled" : "") + ' aria-label="Previous page">' + ARROW_L + "<span>Previous</span></button>";
      numbers(state.page, total).forEach(function (n) {
        if (n === "…") { html += '<span class="gap" aria-hidden="true">…</span>'; return; }
        var near = Math.abs(n - state.page) <= 1 ? " near" : "";
        html += '<button type="button" class="num' + near + '" data-go="' + n + '"' + (n === state.page ? ' aria-current="page"' : "") + ' aria-label="Page ' + n + '">' + n + "</button>";
      });
      html += '<button type="button" class="edge" data-go="' + (state.page + 1) + '"' + (state.page === total ? " disabled" : "") + ' aria-label="Next page"><span>Next</span>' + ARROW_R + "</button>";
      pager.innerHTML = html;
      pager.hidden = false;
    }

    var state = read();
    render(state);
    write(state, false);

    function go(next) {
      state = next;
      render(state);
      write(state, true);
      var top = list.getBoundingClientRect().top + window.pageYOffset - 140;
      if (window.pageYOffset > top) window.scrollTo(0, top);
    }

    pager.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-go]");
      if (b && !b.disabled) go({ page: +b.getAttribute("data-go") });
    });
    window.addEventListener("popstate", function () { state = read(); render(state); });
  }

  /* ---------------- post: reading aids ---------------- */
  function post(article) {
    var lists = [].slice.call(document.querySelectorAll(".bl-toc"));
    var first = lists[0] ? [].slice.call(lists[0].querySelectorAll("a[href^='#']")) : [];
    var heads = first.map(function (a) { return document.getElementById(decodeURIComponent(a.hash.slice(1))); });
    var bar = document.querySelector(".bl-progress__bar");
    var top = document.querySelector(".bl-totop");
    var fold = document.querySelector(".bl-toc-m");
    var queued = false;

    function update() {
      queued = false;
      var vh = window.innerHeight;

      /* the current section is the last heading that has passed the upper third */
      var line = vh * 0.33, cur = -1;
      heads.forEach(function (h, i) { if (h && h.getBoundingClientRect().top < line) cur = i; });
      lists.forEach(function (l) {
        [].forEach.call(l.querySelectorAll("a[href^='#']"), function (a, i) {
          a.classList.toggle("is-current", i === cur);
          if (i === cur) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
        });
      });

      /* progress: 0 as the article's top reaches the top of the screen,
         1 as its end comes into view */
      var r = article.getBoundingClientRect();
      var run = r.height - vh;
      var p = run > 0 ? -r.top / run : (r.top < 0 ? 1 : 0);
      p = Math.max(0, Math.min(1, p));
      if (bar) bar.style.transform = "scaleX(" + p.toFixed(4) + ")";

      if (top) top.classList.toggle("is-shown", window.pageYOffset > vh * 1.5 && r.bottom > 0);
    }

    function queue() { if (!queued) { queued = true; requestAnimationFrame(update); } }
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    update();

    /* on a phone the contents block closes once the reader picks a section */
    if (fold) fold.addEventListener("click", function (e) {
      if (e.target.closest("a[href^='#']")) fold.open = false;
    });
  }

  var grid = document.getElementById("blGrid");
  if (grid) listing(grid);
  var article = document.querySelector(".bl-post .bl-prose");
  if (article) post(article);
})();
