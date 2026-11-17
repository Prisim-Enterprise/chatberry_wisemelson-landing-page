#!/usr/bin/env node
// Builds every inner page of the Chatberry site from scripts/site/content.cjs.
//   node scripts/site/build.cjs
// Writes pages/**/page.html, the blog, legal, coming-soon and 404 pages, and pages/blog/feed.xml.
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..', '..');
const P = require('./content.cjs');
const W = (rel, html) => { const f = path.join(root, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const url = slug => '/pages/' + slug + '/page.html';
const WA = 'https://wa.me/918147715267';
const DEMO = WA + '?text=Hi%20Chatberry%2C%20I%27d%20like%20to%20book%20a%20demo.';
const APP = 'https://app.prisim.co.in/';
const ARROW = '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 11 11 3M4.5 3H11v6.5"/></svg>';
const ICON = (fill = '#FF2E2E', dot = '#140303') => `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 7.5C9.6 7.5 4.5 12 4.5 17.6c0 2.9 1.4 5.5 3.6 7.3L7 29.5l5.2-2.4c1.2.4 2.5.6 3.8.6 6.4 0 11.5-4.5 11.5-10.1S22.4 7.5 16 7.5z" fill="${fill}"/><path d="M16.5 8c.2-3 2-5 5.5-5.5-.4 3.2-2.4 5.2-5.5 5.5z" fill="#4CAF6E"/><circle cx="11.5" cy="17.6" r="1.6" fill="${dot}"/><circle cx="16" cy="17.6" r="1.6" fill="${dot}"/><circle cx="20.5" cy="17.6" r="1.6" fill="${dot}"/></svg>`;

const GROUPS = { products: 'Products', solutions: 'Solutions', industries: 'Industries' };
const list = g => Object.keys(P).filter(k => k.startsWith(g + '/'));

/* ---------------- shared chrome ---------------- */
function head(title, desc, extra = '') {
  return `<!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} | Chatberry</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#070707">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Chatberry">
<meta property="og:locale" content="en_IN">
<meta property="og:title" content="${esc(title)} | Chatberry">
<meta property="og:description" content="${esc(desc)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)} | Chatberry">
<meta name="twitter:description" content="${esc(desc)}">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/assets/chatberry-icon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css?v=3">
${extra}</head>
<body>
<a class="sr" href="#main">Skip to content</a>
<div class="grain" aria-hidden="true"></div>
<div class="cursor" aria-hidden="true"></div>
${header()}
`;
}
function brand() {
  return `<a class="brand" href="/" aria-label="Chatberry home">${ICON()}<span><b>Chatberry</b><small>Product by <img src="/assets/prisim-logo-white.png" alt="Prisim"></small></span></a>`;
}
function header() {
  const li = g => list(g).map(k => `<li><a href="${url(k)}">${esc(P[k].name)}</a></li>`).join('');
  return `<header class="top" id="top">
  ${brand()}
  <div class="top__r">
    <a class="pill hide-s" href="${APP}">Sign in</a>
    <button class="pill" id="menuBtn" aria-expanded="false" aria-controls="menu">Menu <span class="burger" aria-hidden="true"><i></i><i></i></span></button>
  </div>
</header>
<nav class="menu menu--wide" id="menu" aria-label="Main menu">
  <ul class="menu__big">
    <li><a href="/"><small>01</small>Home</a></li>
    <li><a href="/#features"><small>02</small>Platform</a></li>
    <li><a href="/#industries"><small>03</small>Industries</a></li>
    <li><a href="${url('partners')}"><small>04</small>Partners</a></li>
    <li><a href="/pages/blog/page.html"><small>05</small>Blog</a></li>
    <li><a href="${DEMO}"><small>06</small>Book a demo</a></li>
  </ul>
  <div class="menu__side">
    <div><h3>Products</h3><ul>${li('products')}</ul></div>
    <div><h3>Solutions</h3><ul>${li('solutions')}</ul></div>
    <div><h3>Industries</h3><ul class="one">${li('industries')}</ul></div>
    <a class="pill pill--red" href="${APP}" style="justify-self:start">Start for free</a>
  </div>
</nav>
`;
}
function footer() {
  const li = (g, n) => list(g).slice(0, n).map(k => `<li><a href="${url(k)}">${esc(P[k].name)}</a></li>`).join('');
  return `<footer class="foot">
  <div class="foot__grid">
    <div class="foot__about">${brand()}<p>Every customer conversation, handled. Offered and supported by Prisim.</p></div>
    <div><h4>Product</h4><ul>${li('products', 6)}</ul></div>
    <div><h4>Solutions</h4><ul>${li('solutions', 6)}</ul></div>
    <div><h4>Company</h4><ul>
      <li><a href="${url('partners')}">Partners</a></li>
      <li><a href="/pages/blog/page.html">Blog</a></li>
      <li><a href="${WA}">Contact us</a></li>
      <li><a href="${APP}">Sign in</a></li>
    </ul></div>
  </div>
  <div class="foot__legal">
    <span>© 2026 Prisim. All rights reserved.</span>
    <div><a href="/pages/legal/privacy-policy/page.html">Privacy Policy</a><a href="/pages/legal/terms-of-service/page.html">Terms of Service</a></div>
  </div>
  <div class="foot__word" aria-hidden="true">Chatberry<span>.</span></div>
</footer>
<a class="wa" href="${WA}" aria-label="Chat with us on WhatsApp"><i><svg viewBox="0 0 24 24"><path d="M12 2.2A9.7 9.7 0 0 0 3.7 16.9L2.3 21.8l5-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.1 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1c0 1.2.9 2.4 1 2.6.1.2 1.8 2.7 4.3 3.8 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.5-.3z"/></svg></i><span>WhatsApp us</span></a>
<script src="/assets/site.js?v=3" defer></script>
</body>
</html>
`;
}

/* ---------------- code-built visuals ---------------- */
const VIS = {
  chat: v => `<div class="vchat">${(v || [['in', 'Hi! Can I book a demo?'], ['out', 'Of course. Does tomorrow at 11 am work?'], ['in', 'Perfect'], ['out', 'Booked ✓ See you then!']]).map(([d, t]) => `<div class="msg msg--${d} show">${esc(t)}</div>`).join('')}</div>`,
  stream: v => `<div class="stream stream--dark">${(v || [['W', 'Rahul', 'Is the 2BHK still available?', 'WhatsApp'], ['I', 'Ananya', 'Do you deliver to Pune?', 'Instagram'], ['@', 'Vikram', 'Need an invoice copy', 'Website'], ['W', 'Meera', 'Reschedule to Friday?', 'WhatsApp']]).map(([i, n, t, c]) => `<div class="stream__row"><i>${esc(i)}</i><span><b>${esc(n)}</b> · ${esc(t)}</span><em>${esc(c)}</em></div>`).join('')}</div>`,
  eq: () => `<div class="veq"><span class="tile__big">Send</span><div class="eq"><i></i><i></i><i></i><i></i><i></i><i></i></div><ul class="vstats"><li><b>Delivered</b><span style="--w:94%"></span></li><li><b>Read</b><span style="--w:78%"></span></li><li><b>Replied</b><span style="--w:41%"></span></li></ul></div>`,
  tix: () => `<div class="tix"><div><i></i><span>Refund for order #4821</span><em>Due today</em></div><div><i></i><span>AC not cooling, room 204</span><em>Arjun</em></div><div><i></i><span>Invoice correction</span><em>In progress</em></div><div><i></i><span>Address change request</span><em>Resolved</em></div></div>`,
  spark: () => `<div class="vspark"><div class="vspark__n"><b>Replies this week</b><span>+18% vs last week</span></div><svg class="spark" viewBox="0 0 400 150" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="sf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF2E2E" stop-opacity=".45"/><stop offset="1" stop-color="#FF2E2E" stop-opacity="0"/></linearGradient></defs><path class="f" style="fill:url(#sf)" d="M0 130 C40 120 60 125 90 104 S150 110 180 82 240 92 270 60 330 64 360 34 400 22 400 22 V150 H0Z"/><path class="l" d="M0 130 C40 120 60 125 90 104 S150 110 180 82 240 92 270 60 330 64 360 34 400 22 400 22"/></svg></div>`,
  tags: () => `<div class="tags tags--hero">${['Google Sheets', 'Razorpay', 'Shopify', 'WooCommerce', 'Zoho CRM', 'Calendly', 'Webhooks', 'REST API', 'Google Workspace'].map(t => `<span>${t}</span>`).join('')}<span class="tags__core">${ICON()}</span></div>`,
  flow: v => { const n = v || ['Trigger', 'Condition', 'AI step', 'Action']; return `<div class="vflow">${n.map((t, i) => `<div class="vflow__n${i === 2 ? ' is-ai' : ''}"><small>${['WHEN', 'IF', 'THEN', 'DO'][i] || 'STEP'}</small>${esc(t)}</div>`).join('<i class="vflow__l"></i>')}</div>`; },
  kanban: v => `<div class="vkan">${(v || [['New', 'Rahul S.', 'Ananya K.'], ['Qualified', 'Vikram P.'], ['Visit', 'Meera J.'], ['Won', 'Kavya R.']]).map(([h, ...c]) => `<div class="vkan__col"><b>${esc(h)}</b>${c.map(x => `<span>${esc(x)}</span>`).join('')}</div>`).join('')}</div>`,
  voice: () => `<div class="vvoice"><div class="vvoice__top"><span class="vvoice__mic"></span><div><b>Incoming call</b><small>+91 98••• ••210 · AI voice agent</small></div></div><div class="vvoice__wave">${Array.from({ length: 34 }, (_, i) => `<i style="--d:${(i * 0.07).toFixed(2)}s;--h:${20 + ((i * 37) % 70)}%"></i>`).join('')}</div><p>“I’d like to book a service visit for Saturday.”</p></div>`,
  page: () => `<div class="vphone"><div class="vphone__bar"></div><b>Book a visit</b><label>Name<span>Rahul Sharma</span></label><label>Date<span>Sat, 11:00 am</span></label><label>Location<span>Whitefield</span></label><em>Confirm booking</em></div>`,
  team: () => `<div class="vteam">${[['PS', 'Priya', 'Sales lead', 'On'], ['AT', 'Arjun', 'Support', 'On'], ['MJ', 'Meera', 'Operations', 'Away'], ['RK', 'Rahul', 'Sales', 'On']].map(([i, n, r, s]) => `<div><i>${i}</i><span><b>${n}</b>${r}</span><em class="${s === 'On' ? 'on' : ''}">${s === 'On' ? 'Available' : 'Away'}</em></div>`).join('')}</div>`,
  meet: () => `<div class="vmeet">${['PS', 'AT', 'MJ', 'RK', 'KV', '+12'].map((x, i) => `<div style="--g:${i}"><span>${x}</span></div>`).join('')}<em>● Live · Weekly review</em></div>`,
  doc: () => `<div class="vdoc">${[['PDF', 'Price list 2026'], ['WEB', 'Return policy'], ['FAQ', 'Delivery questions'], ['CSV', 'Product catalogue']].map(([t, n], i) => `<div style="--i:${i}"><i>${t}</i><span>${n}</span><em>${i === 3 ? 'Syncing' : 'Ready'}</em></div>`).join('')}</div>`,
  funnel: () => `<div class="vfun">${[['Visited', 100], ['Viewed product', 72], ['Added to cart', 38], ['Paid', 21]].map(([n, p]) => `<div><span>${n}</span><i style="--w:${p}%"></i><b>${p}%</b></div>`).join('')}</div>`,
  leads: () => `<div class="vleads">${[['Rahul S.', '3BHK · ₹1.2Cr · 3 months', 'Hot'], ['Ananya K.', '2BHK · ₹80L · 6 months', 'Warm'], ['Vikram P.', 'Plot · just browsing', 'Cold'], ['Meera J.', 'Villa · ₹2Cr · this month', 'Hot']].map(([n, d, t]) => `<div><span><b>${n}</b>${d}</span><em class="t-${t.toLowerCase()}">${t}</em></div>`).join('')}</div>`,
  media: () => `<div class="vmedia">${Array.from({ length: 6 }, (_, i) => `<div style="--i:${i}">${i === 4 ? '<em>AI</em>' : ''}</div>`).join('')}</div>`,
  profile: () => `<div class="vprof"><div class="vprof__top"><i>RS</i><div><b>Rahul Sharma</b><small>Customer since 2024 · Bengaluru</small></div></div><div class="vprof__grid"><span><small>Orders</small>12</span><span><small>Open ticket</small>1</span><span><small>Last chat</small>2h ago</span></div><ul><li>Asked about AMC renewal</li><li>Paid invoice #2291</li><li>Rated support 5★</li></ul></div>`,
};
const vis = (k, v) => (VIS[k] || VIS.chat)(v);

/* ---------------- page template ---------------- */
function page(slug) {
  const d = P[slug], grp = slug.split('/')[0], gname = GROUPS[grp] || d.label || 'Chatberry';
  const words = d.h1.map(l => `<span class="ln"><span>${esc(l)}</span></span>`).join('');
  const cta = d.cta || ['Book a demo', DEMO];
  const pains = d.pains ? `
  <section class="pains wrap" aria-labelledby="pain-h">
    <span class="lbl rv">The problem</span>
    <h2 class="h-m rv" id="pain-h" style="margin-top:22px">Sound familiar?</h2>
    <ol class="pains__list">${d.pains.map(([t, x], i) => `<li class="rv d${i % 4}"><span>${String(i + 1).padStart(2, '0')}</span><b>${esc(t)}</b><p>${esc(x)}</p></li>`).join('')}</ol>
  </section>` : '';
  const uses = d.uses ? `<div class="uses rv">${d.uses.map(u => `<span>${esc(u)}</span>`).join('')}</div>` : '';
  const rel = (d.rel || []).filter(r => P[r]).map((r, i) => `<a class="relc rv d${i}" href="${url(r)}"><small>${esc(GROUPS[r.split('/')[0]] || 'Chatberry')}</small><b>${esc(P[r].name)}</b><p>${esc(P[r].lede)}</p><span>${ARROW}</span></a>`).join('');
  return head(d.title, d.desc) + `<main id="main">
  <section class="phero">
    <div class="hero__glow" aria-hidden="true"></div>
    <div class="phero__copy">
      <span class="lbl rv">${esc(gname)} <em>${esc(d.name)}</em></span>
      <h1 class="h-xl h-xl--p">${words}</h1>
      <p class="rv d2">${esc(d.lede)}</p>
      <div class="hero__ctas rv d3">
        <a class="arw" href="${APP}">Start for free ${ARROW}</a>
        <a class="arw" href="${cta[1]}">${esc(cta[0])} ${ARROW}</a>
      </div>
    </div>
    <div class="phero__art rv d2" aria-hidden="true"><div class="panel" data-tilt>${vis(d.vis, d.v)}</div></div>
  </section>

  <section class="stmt stmt--p" aria-label="Overview">
    <div class="stmt__orb" aria-hidden="true"></div>
    <span class="lbl rv">01 / Overview <em>${esc(d.name)}</em></span>
    <p class="stmt__txt" id="stmtTxt">${esc(d.stmt)}</p>
  </section>
${pains}
  <section class="bento-sec" aria-labelledby="f-h">
    <div class="sec-head">
      <div><span class="lbl rv">02 / What you get <em>Features</em></span>
      <h2 class="h-l" id="f-h"><span class="ln"><span>Built to</span></span><span class="ln"><span>make it easy.</span></span></h2></div>
      ${uses}
    </div>
    <div class="bento bento--p">${d.feats.map(([t, x], i) => `
      <article class="tile ftile f${i + 1} rv d${i % 2}"><span class="ftile__n">${String(i + 1).padStart(2, '0')}</span><div><h3 class="ftile__t">${esc(t)}</h3><p>${esc(x)}</p></div></article>`).join('')}
    </div>
  </section>

  <section class="steps" aria-labelledby="s-h">
    <div class="swoosh" aria-hidden="true"><i></i><i></i></div>
    <div class="steps__veil" aria-hidden="true"></div>
    <div class="sec-head"><div><span class="lbl rv">03 / How it works <em>${d.steps.length} steps</em></span>
      <h2 class="h-l" id="s-h"><span class="ln"><span>Simple from</span></span><span class="ln"><span>day one.</span></span></h2></div></div>
    <ol class="rows">${d.steps.map(([t, x], i) => `<li class="row rv"><div><span class="row__n">(${String(i + 1).padStart(2, '0')})</span><span class="row__t">${esc(t)}</span><p class="row__d">${esc(x)}</p></div></li>`).join('')}</ol>
  </section>

  <section class="faq" aria-labelledby="q-h">
    <div><span class="lbl rv">04 / Questions <em>FAQ</em></span>
    <h2 class="h-l" id="q-h"><span class="ln"><span>Good</span></span><span class="ln"><span>questions.</span></span></h2></div>
    <div class="faq__list rv">${d.faq.map(([q, a]) => `<details><summary>${esc(q)}<i></i></summary><p>${esc(a)}</p></details>`).join('')}</div>
  </section>

  ${rel ? `<section class="related wrap" aria-labelledby="r-h"><span class="lbl rv">05 / Keep exploring <em>Related</em></span><h2 class="h-m rv" id="r-h" style="margin:22px 0 34px">Works well with</h2><div class="related__grid">${rel}</div></section>` : ''}

  <section class="end end--p" aria-labelledby="e-h">
    <div class="end__glow" aria-hidden="true"></div>
    <span class="lbl rv">Get started <em>Today</em></span>
    <h2 id="e-h"><span class="ln"><span>Let&rsquo;s talk.</span></span></h2>
    <p class="rv">See ${esc(d.name)} working on your own business. It takes one message to start.</p>
    <div class="end__btns rv d1">
      <a class="mag" data-mag href="${cta[1]}">${esc(cta[0]).replace(' ', '<br>')}</a>
      <a class="mag mag--ghost" data-mag href="${APP}">Start<br>for free</a>
    </div>
  </section>
</main>
` + footer();
}

/* ---------------- blog ---------------- */
const POST = {
  slug: 'getting-started-with-whatsapp-automation', date: '2026-10-19', dateH: '19 Oct 2026', read: '5 min read',
  title: 'WhatsApp automation for beginners: what to automate first',
  desc: 'A practical starting plan for WhatsApp automation: which conversations to automate first, how templates and sessions work, and how to tell if it is working.',
  body: `
<p class="lead">Most businesses don’t need a huge automation project. They need the five or six conversations they have every day to happen faster and more reliably. This guide shows where to start.</p>
<h2 id="start-small">Start with the questions you answer every day</h2>
<p>Open your WhatsApp chats from last week and count. You’ll find the same handful of messages again and again: prices, timings, location, order status, booking changes. These are your first automation candidates, because the answer rarely changes and customers want it immediately.</p>
<p>A good first automation has three qualities:</p>
<ul>
<li>It happens often, at least a few times a day.</li>
<li>The answer comes from information you already have, like a price list, a schedule or an order system.</li>
<li>A slow reply costs you something: a missed booking, a cold lead or an annoyed customer.</li>
</ul>
<h2 id="first-journeys">Five journeys worth automating first</h2>
<ol>
<li><b>Instant first reply.</b> Greet every new enquiry within seconds, ask one useful question, and route it to the right person.</li>
<li><b>Appointment booking and reminders.</b> Let people pick a slot, then remind them the day before. No-shows drop noticeably when reminders arrive on WhatsApp.</li>
<li><b>Order and delivery updates.</b> Confirm the order, share dispatch details and tell customers when it’s arriving.</li>
<li><b>Payment reminders.</b> A polite nudge with a payment link works better than a phone call for most small dues.</li>
<li><b>Feedback after service.</b> Ask for a rating while the experience is fresh, and send unhappy customers straight to a person.</li>
</ol>
<h2 id="templates">Templates, sessions and what they cost</h2>
<p>On the official WhatsApp Business Platform, there are two kinds of conversations. When a customer messages you, a 24-hour customer service window opens and you can reply freely. When you start the conversation, for example with a reminder or an offer, you must use a template that WhatsApp has approved.</p>
<div class="tbl"><table>
<thead><tr><th>Category</th><th>Typical use</th><th>Template needed?</th></tr></thead>
<tbody>
<tr><td>Marketing</td><td>Offers, launches, re-engagement</td><td>Yes</td></tr>
<tr><td>Utility</td><td>Order updates, reminders, confirmations</td><td>Yes</td></tr>
<tr><td>Authentication</td><td>One-time passwords</td><td>Yes</td></tr>
<tr><td>Service</td><td>Replies inside the 24-hour window</td><td>No</td></tr>
</tbody></table></div>
<p>Meta charges differently for each category and updates its rates from time to time, so check the current <a href="https://developers.facebook.com/docs/whatsapp/pricing" target="_blank" rel="noopener">WhatsApp pricing page</a> before you plan a large campaign.</p>
<h2 id="human">Keep a person one tap away</h2>
<p>Automation should make your team faster, not hide them. Every journey needs a clear way out: a “talk to someone” button, or a rule that hands the chat to a person when the customer is upset or the question is unusual. Customers forgive a bot that can’t help. They don’t forgive one that won’t let them reach a human.</p>
<h2 id="measure">Measure outcomes, not messages</h2>
<p>Sending more messages isn’t the goal. Pick one number per journey and watch it for a month:</p>
<ul>
<li>First reply time for new enquiries.</li>
<li>No-show rate for appointments.</li>
<li>Days to collect payments.</li>
<li>Share of chats resolved without a person.</li>
</ul>
<p>If the number improves, add the next journey. If it doesn’t, look at where people drop off and fix that step first.</p>
<h2 id="next">Your next step</h2>
<p>Pick one journey from the list above and set it up this week. When you’re ready to try it on your own number, <a href="${APP}">get started with Chatberry</a> or <a href="${DEMO}">book a demo on WhatsApp</a> and we’ll help you build it.</p>`,
};
function blogIndex(topic) {
  const card = `<a class="bcard rv" href="/pages/blog/${POST.slug}/page.html"><div class="bcard__img" aria-hidden="true"><span>WhatsApp</span>${ICON('#fff', '#FF2E2E')}</div><div class="bcard__body"><span class="lbl">WhatsApp automation <em>Latest</em></span><h2>${esc(POST.title)}</h2><p>${esc(POST.desc)}</p><small>Chatberry Team · ${POST.dateH} · ${POST.read}</small><span class="arw">Read article ${ARROW}</span></div></a>`;
  const t = topic ? 'WhatsApp automation articles' : 'Blog';
  return head(topic ? 'WhatsApp automation articles' : 'Blog', 'Practical guides on WhatsApp, AI and automation for growing businesses, from the Chatberry team.', `<link rel="alternate" type="application/rss+xml" title="Chatberry Blog" href="/pages/blog/feed.xml">\n`) + `<main id="main">
  <section class="phero phero--short">
    <div class="hero__glow" aria-hidden="true"></div>
    <div class="phero__copy">
      <span class="lbl rv">${topic ? 'Blog / Topic' : 'Blog'} <em>${topic ? 'WhatsApp automation' : 'Guides'}</em></span>
      <h1 class="h-xl h-xl--p"><span class="ln"><span>${topic ? 'WhatsApp' : 'Ideas you can'}</span></span><span class="ln"><span>${topic ? 'automation.' : 'use today.'}</span></span></h1>
      <p class="rv d2">Practical, step-by-step writing on WhatsApp, AI and automation for growing businesses.</p>
    </div>
  </section>
  <section class="blist wrap" aria-label="${esc(t)}">
    <div class="chipsnav rv"><a href="/pages/blog/page.html"${topic ? '' : ' aria-current="page"'}>All <span>1</span></a><a href="/pages/blog/topic/whatsapp-api/page.html"${topic ? ' aria-current="page"' : ''}>WhatsApp automation <span>1</span></a></div>
    ${card}
    <p class="blist__more rv">More articles coming soon.</p>
  </section>
</main>
` + footer();
}
function blogPost() {
  const toc = [...POST.body.matchAll(/<h2 id="([^"]+)">([^<]+)<\/h2>/g)].map(m => `<li><a href="#${m[1]}">${m[2]}</a></li>`).join('');
  return head(POST.title, POST.desc) + `<main id="main">
  <section class="phero phero--short phero--post">
    <div class="hero__glow" aria-hidden="true"></div>
    <div class="phero__copy">
      <span class="lbl rv"><a href="/pages/blog/page.html">Blog</a> <em>WhatsApp automation</em></span>
      <h1 class="h-l rv">${esc(POST.title)}</h1>
      <p class="rv d1 meta">Chatberry Team · <time datetime="${POST.date}">${POST.dateH}</time> · ${POST.read}</p>
    </div>
  </section>
  <div class="doc wrap">
    <aside class="doc__toc"><b>On this page</b><ol>${toc}</ol></aside>
    <article class="prose rv">${POST.body}</article>
  </div>
  <section class="end end--p" aria-labelledby="e-h">
    <div class="end__glow" aria-hidden="true"></div>
    <h2 id="e-h"><span class="ln"><span>Let&rsquo;s build it.</span></span></h2>
    <div class="end__btns rv d1"><a class="mag" data-mag href="${DEMO}">Book a demo<br>on WhatsApp</a><a class="mag mag--ghost" data-mag href="${APP}">Start<br>for free</a></div>
  </section>
</main>
` + footer();
}
function feed() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Chatberry Blog</title>
    <link>/pages/blog/page.html</link>
    <description>Practical guides on WhatsApp, AI and automation for growing businesses.</description>
    <language>en-in</language>
    <item>
      <title>${esc(POST.title)}</title>
      <link>/pages/blog/${POST.slug}/page.html</link>
      <guid>/pages/blog/${POST.slug}/page.html</guid>
      <pubDate>${new Date(POST.date + 'T09:00:00+05:30').toUTCString()}</pubDate>
      <description>${esc(POST.desc)}</description>
      <content:encoded xmlns:content="http://purl.org/rss/1.0/modules/content/"><![CDATA[${POST.body}]]></content:encoded>
    </item>
  </channel>
</rss>
`;
}

/* ---------------- legal ---------------- */
function legal(file) {
  const src = fs.readFileSync(path.join(root, file), 'utf8');
  const title = ((src.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, '').trim();
  const updated = (src.match(/Last updated: ([^<]+)</) || [])[1];
  const desc = (src.match(/name="description" content="([^"]*)"/) || [])[1];
  let doc;
  if (src.includes('class="legal__doc"')) {
    const a = src.indexOf('<div class="legal__doc">') + '<div class="legal__doc">'.length;
    const b = src.indexOf('\n      </div>\n    </div>\n  </main>');
    doc = src.slice(a, b);
  } else {
    doc = src.slice(src.indexOf('<article class="prose') ).replace(/^<article class="prose[^>]*>/, '');
    doc = doc.slice(0, doc.indexOf('</article>'));
  }
  const toc = [...doc.matchAll(/<h2 class="legal__group" id="([^"]+)">([^<]+)<\/h2>/g)].map(m => `<li><a href="#${m[1]}">${m[2]}</a></li>`).join('');
  const other = file.includes('privacy') ? ['Terms of Service', '/pages/legal/terms-of-service/page.html'] : ['Privacy Policy', '/pages/legal/privacy-policy/page.html'];
  return head(title, desc) + `<main id="main">
  <section class="phero phero--short">
    <div class="hero__glow" aria-hidden="true"></div>
    <div class="phero__copy">
      <span class="lbl rv">Legal <em>Last updated: ${esc(updated)}</em></span>
      <h1 class="h-xl h-xl--p"><span class="ln"><span>${esc(title)}</span></span></h1>
    </div>
  </section>
  <div class="doc wrap">
    <aside class="doc__toc"><b>Policies</b><ol><li><a href="${file.includes('privacy') ? '#main' : other[1]}">Privacy Policy</a></li><li><a href="${file.includes('terms') ? '#main' : other[1]}">Terms of Service</a></li></ol>${toc ? `<b>On this page</b><ol>${toc}</ol>` : ''}</aside>
    <article class="prose prose--legal">${doc}</article>
  </div>
</main>
` + footer();
}

/* ---------------- simple pages ---------------- */
function simple(kind) {
  const nf = kind === '404';
  return head(nf ? 'Page not found' : 'Coming soon', nf ? 'This page doesn’t exist.' : 'We’re still building this page.', '<meta name="robots" content="noindex, nofollow">\n') + `<main id="main">
  <section class="phero phero--short phero--center">
    <div class="hero__glow" aria-hidden="true"></div>
    <div class="phero__copy">
      <span class="lbl rv">${nf ? '404' : 'Coming soon'} <em>Chatberry</em></span>
      <h1 class="h-xl h-xl--p"><span class="ln"><span>${nf ? 'This page' : 'We’re still'}</span></span><span class="ln"><span id="soonWhat">${nf ? 'doesn’t exist.' : 'building this.'}</span></span></h1>
      <p class="rv d2">${nf ? 'The link may be old or mistyped. Head back home, or message us and we’ll point you to what you need.' : 'It’s on the way. In the meantime, see what Chatberry already does, or book a demo.'}</p>
      <div class="hero__ctas rv d3"><a class="arw" href="/">Back to home ${ARROW}</a><a class="arw" href="${DEMO}">Book a demo ${ARROW}</a></div>
    </div>
  </section>
</main>
` + footer();
}

/* ---------------- write everything ---------------- */
let n = 0;
for (const slug of Object.keys(P)) { W(`pages/${slug}/page.html`, page(slug)); n++; }
W('pages/blog/page.html', blogIndex(false)); W('pages/blog/topic/whatsapp-api/page.html', blogIndex(true));
W(`pages/blog/${POST.slug}/page.html`, blogPost()); W('pages/blog/feed.xml', feed());
for (const f of ['pages/legal/privacy-policy/page.html', 'pages/legal/terms-of-service/page.html']) W(f, legal(f));
W('pages/coming-soon/page.html', simple('soon')); W('404.html', simple('404'));
console.log(`built ${n} pages + blog (3) + legal (2) + coming-soon + 404`);
