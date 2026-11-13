/*
 * main.js — Chatberry homepage logic (vanilla JS, no framework).
 * Requires wm-runtime.js (loaded first). Each section class reads/writes
 * state and returns template values from renderVals(); see index.html templates.
 */
(function () {
'use strict';

// ===== Story section (10 scroll scenes) — template: #tpl-story =====
class HomepageStory extends WM.Component {
  state = { cur: 0, k: 1, lt: 0, ft: 0, tx: 0, ty: 0, blink: false, narrow: false, deck: false };
  wrapRef = WM.createRef(); visRef = WM.createRef();
  // Laptops: the story is a tall sticky block and scrolling swaps the scenes.
  // Tablets and phones ("deck"): one screen tall, scenes change only on Previous / Next, the rail or a swipe.
  isDeck() { return window.innerWidth < 1024 || window.matchMedia('(hover: none) and (pointer: coarse)').matches; }
  componentDidMount() {
    // the deck's height is fixed when it mounts and only re-read when the width changes (rotation),
    // so the phone browser's toolbar sliding in and out doesn't resize or re-render the story
    this.vw0 = window.innerWidth; this.vh0 = window.innerHeight;
    this.onScroll = () => { if (!this.state.deck) this.measure(); };
    this.onResize = () => { if (window.innerWidth !== this.vw0) { this.vw0 = window.innerWidth; this.vh0 = window.innerHeight; } else if (this.state.deck) return; this.measure(); };
    window.addEventListener('scroll', this.onScroll, { passive: true }); window.addEventListener('resize', this.onResize);
    if (document.fonts) document.fonts.ready.then(() => this.measure());
    // timers only run while the story is on screen (they re-render the whole story)
    this.live = true; const w = this.wrapRef.current;
    if (w && 'IntersectionObserver' in window) { this.io = new IntersectionObserver(es => { this.live = es[0].isIntersecting; }, { rootMargin: '100px 0px' }); this.io.observe(w); }
    const on = () => this.live && !document.hidden;
    this.fv = setInterval(() => { if (!on()) return; const st = this.state; if (((st.cur === 6 || st.cur === 7) && st.ft < 20000) || (st.cur === 9 && st.ft < 1600) || st.cur === 5) this.setState({ ft: st.ft + 50 }); }, 50);
    this.measure(); this.iv = setInterval(() => { if (on()) this.setState(s => ({ lt: s.lt + 1 })); }, 950);
    const bl = () => { this.bt = setTimeout(() => { if (!on()) return bl(); this.setState({ blink: true }); this.bt3 = setTimeout(() => { this.setState({ blink: false }); bl(); }, 130); }, 2400 + Math.random() * 3000); }; bl();
    this.ts = e => { const t = e.touches[0]; this.sx = t.clientX; this.sy = t.clientY; };
    this.te = e => { if (!this.state.deck || this.sx == null) return; const t = e.changedTouches[0], dx = t.clientX - this.sx, dy = t.clientY - this.sy; this.sx = null; if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return; this.goTo(this.state.cur + (dx < 0 ? 1 : -1)); };
    if (w) { w.addEventListener('touchstart', this.ts, { passive: true }); w.addEventListener('touchend', this.te, { passive: true }); }
  }
  goTo(i) {
    i = Math.max(0, Math.min(9, i));
    if (this.state.deck) { if (i !== this.state.cur) this.setState({ cur: i, lt: 0, ft: 0 }); return; }
    const w = this.wrapRef.current; if (!w) return; const top = w.getBoundingClientRect().top + window.scrollY - (window.WM_NAVH || 58); window.scrollTo({ top: top + i * (window.innerHeight - (window.WM_NAVH || 58)), behavior: 'smooth' });
  }
  componentDidUpdate() { this.measure(); }
  componentWillUnmount() { const w = this.wrapRef.current; if (w) { w.removeEventListener('touchstart', this.ts); w.removeEventListener('touchend', this.te); } this.io && this.io.disconnect(); window.removeEventListener('scroll', this.onScroll); window.removeEventListener('resize', this.onResize); clearInterval(this.iv); clearInterval(this.fv); clearTimeout(this.bt); clearTimeout(this.bt3); }
  // deck mode: the scene gets whatever height the copy, the controls and the paddings leave (fonts and text size vary by phone)
  deckFit(v) {
    const g = v.parentElement, cs = getComputedStyle(g), kids = [...g.children];
    let used = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + (parseFloat(cs.rowGap) || 0) * (kids.length - 1);
    kids.forEach(c => { if (c === v) return; let h = c.offsetHeight; c.querySelectorAll('[style*="position:absolute"]').forEach(a => { h = Math.max(h, a.offsetTop + a.offsetHeight); }); used += h; });
    return (g.clientHeight - used - 60) / 560;
  }
  measure() {
    const w = this.wrapRef.current, v = this.visRef.current; if (!w) return;
    const deck = this.isDeck(); if (deck !== this.state.deck || deck !== this.state.narrow) return this.setState({ deck, narrow: deck });
    const vh = deck ? this.vh0 : window.innerHeight;
    let k = this.state.k; if (v && v.clientWidth > 50) k = Math.max(.35, Math.min(1.5, v.clientWidth / 760, deck ? this.deckFit(v) : v.clientHeight / 560));
    if (deck) { if (Math.abs(k - this.state.k) > .005) this.setState({ k }); return; }
    const r = w.getBoundingClientRect(), sh = vh - (window.WM_NAVH || 58), cur = Math.max(0, Math.min(9, Math.floor(((window.WM_NAVH || 58) - r.top + sh * .45) / sh)));
    if (cur !== this.state.cur) this.setState({ cur, lt: 0, ft: 0 }); else if (Math.abs(k - this.state.k) > .005) this.setState({ k });
  }
  MZ = (() => { const U = '/public/assets/media/'; return {
    hello: { w: 297, h: 231, a: 'mzSway 3.8s ease-in-out infinite', body: U + '6ad08a6924a6ccb062b6d281/hello_body.png', eyes: U + '6ad08a6a8d869a3e4df524eb/hello_eyes.png', eo: [144.9, 123.4] },
    smile: { w: 297, h: 231, a: 'mzHop 1.9s ease-in-out infinite', body: U + '6acdd182f8754f36ec750b80/smile_body2.png', eyes: U + '6acdd1835858084f1d39d00b/smile_eyes.png', eo: [149.5, 118.1] },
    think: { w: 320, h: 282, a: 'mzPonder 3.6s ease-in-out infinite', body: U + '6acdd1881bde8f5e18be24be/think_body2.png', eyes: U + '6acdd189b6a3e1f950fda77d/think_eyes.png', eo: [156.6, 161.4], acc: [U + '6acdced2b6a3e1f950fd96e7/think_acc0.png', 260.5, 44.3, 'mzQm'] },
    celebrate: { w: 360, h: 270, a: 'mzJig 1.3s ease-in-out infinite', body: U + '6ad0907b7a72f885753f1499/celebrate_body.png', acc: [U + '6ad0907a6254c1e5ba8597f3/celebrate_acc.png', 237.1, 100.3, 'mzFx'] },
    love: { w: 292, h: 236, a: 'mzBeat 1.7s ease-in-out infinite', body: U + '6acdcec9b6a3e1f950fd950a/love_body.png', acc: [U + '6acdcecfb6a3e1f950fd96e0/love_acc0.png', 45.8, 49.9, 'mzHeart'] }
  }; })();
  melo(size, face) {
    // Chatberry logo in place of the old mascot
    const h = WM.h, d = (this.MZ && this.MZ[face]) || {}, H = Math.round(size * 231 / 297), S = Math.round(Math.min(size, H * 1.15));
    return h("span", { style: { position: "relative", display: "inline-block", flex: "none", width: size, height: H, filter: "drop-shadow(0 " + Math.max(2, size / 24) + "px " + Math.max(4, size / 10) + "px rgba(80,100,20,.28))" } },
      h("span", { key: face, style: { position: "absolute", left: "50%", bottom: 0, width: S, height: S, marginLeft: -S / 2, transformOrigin: "50% 92%", animation: "mzIn .45s cubic-bezier(.22,1,.36,1) both" } },
        h("span", { style: { position: "absolute", inset: 0, transformOrigin: "50% 92%", animation: d.a || "none" } },
          h("img", { src: "/assets/chatberry-icon.svg", alt: "", draggable: false, style: { position: "absolute", inset: 0, width: "100%", height: "100%", userSelect: "none" } }))));
  }
  renderVals() {
    const { cur, lt, k } = this.state, N = 10;
    const go = i => () => this.goTo(i);
    const ACT = ['ACT 1 · WINNING CUSTOMERS', 'ACT 2 · RUNNING YOUR TEAM', 'THE ENDING YOU WANT'];
    const C = [
      [0, '01 · Ads', 'You pay for ads and hope the leads come.', 'Instagram, Google, Facebook. The money goes out every day, whether anyone gets a reply or not.'],
      [0, '02 · Every source', 'Chatberry catches every lead, wherever it lands.', 'Instagram, Google search, your website, Facebook lead forms and WhatsApp all flow into one place.'],
      [0, '03 · AI agent', 'The conversation starts on its own.', 'If a lead doesn’t message first, Chatberry does. It answers prices, timings and questions, then books the slot.'],
      [0, '04 · Your CRM', 'A CRM that works the way you already work.', 'Build your own views with role-based access, or pick a ready one from the app store. Your team doesn’t have to learn a new way of working.'],
      [0, '05 · Follow-up', 'Not everyone buys the first time. Chatberry follows up.', 'Every lead gets a personal message, at scale. Group them into segments and see what is working.'],
      [0, '06 · Webfronts', 'Let customers book, order and pay on their own.', 'Appointments, table bookings, shopping and stays, on beautiful pages that open right inside WhatsApp.'],
      [1, '07 · Build with your AI', 'Ask your AI. Get a full business app.', 'Connect Claude, ChatGPT or any AI you use. Ask it to research your business and build one app for your customers and your team. Ready in about an hour.'],
      [1, '08 · Second brain', 'Chatberry never sits idle.', 'It studies your leads, team, stock and payments, and lists what needs fixing. Click any insight and Chatberry’s agent does the work.'],
      [1, '09 · Everywhere', 'Connects to everything. Goes everywhere with you.', 'Automations and integrations work with the tools you already use. On the web, on Android and on iPhone.'],
      [2, 'That’s why', 'Thousands of businesses are getting there faster.', 'Join them and run your whole business from one place.']
    ];
    const dark = cur === 9;
    const copy = C.map((c, i) => ({ act: ACT[c[0]], k: c[1], h: c[2], p: c[3], last: i === 9, fg: i === 9 ? '#fff' : '#EDEDED', mute: i === 9 ? 'rgba(255,255,255,.72)' : '#949490', dot: ['#AA5C0D', '#0042AA', '#B7DC3D'][c[0]], o: i === cur ? 1 : 0, pe: i === cur ? 'auto' : 'none', hid: String(i !== cur), tab: i === cur ? '0' : '-1', t: i === cur ? 'none' : i < cur ? 'translateY(-30px)' : 'translateY(30px)' }));
    const BG = [['#351803', '#280619'], ['#0B0227', '#02162B'], ['#252C0F', '#171C0B'], ['#020927', '#0A0E18'], ['#332003', '#2E0C02'], ['#270616', '#0B022A'], ['#02192D', '#20250E'], ['#0C0228', '#02102A'], ['#22270F', '#020B25']];
    const bgs = BG.map((b, i) => ({ bg: `radial-gradient(60% 70% at 15% 20%,${b[0]},transparent 70%),radial-gradient(60% 70% at 85% 80%,${b[1]},transparent 70%),#11110C`, o: i === cur ? 1 : 0 }));
    bgs.push({ bg: 'radial-gradient(50% 60% at 20% 30%,rgba(75,63,176,.75),transparent 70%),radial-gradient(45% 55% at 75% 70%,rgba(210,112,78,.7),transparent 70%),radial-gradient(40% 50% at 60% 20%,rgba(169,79,138,.6),transparent 70%),#0B0B0C', o: dark ? 1 : 0 });
    const DIR = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 0], [0, 1], [1, 0], [0, 1], [-1, 0], [0, 1]];
    const S = {}; for (let i = 0; i < N; i++) { const d = DIR[i], on = i === cur, past = i < cur; S['s' + i] = { m: Math.abs(i - cur) <= 1, v: on ? 'visible' : 'hidden', vd: on ? '0s' : '1.1s', cv: Math.abs(i - cur) <= 1 ? 'visible' : 'hidden', o: on ? 1 : 0, pe: on ? 'auto' : 'none', t: on ? 'none' : past ? `translate(${-d[0] * 160}px,${-d[1] * 160}px) scale(.92)` : `translate(${d[0] * 180}px,${d[1] * 180}px) scale(.96)` }; }
    const ar = { prevGo: go(Math.max(0, cur - 1)), nextGo: go(Math.min(C.length - 1, cur + 1)), prevO: cur === 0 ? .35 : 1, nextO: cur === C.length - 1 ? .35 : 1, prevPE: cur === 0 ? 'none' : 'auto', nextPE: cur === C.length - 1 ? 'none' : 'auto', prevPEA: String(cur === 0), nextPEA: String(cur === C.length - 1), arS: this.state.narrow ? '36px' : '40px', arMt: this.state.narrow ? '4px' : '8px', arBg: dark ? 'rgba(255,255,255,.1)' : '#090909', arFg: dark ? '#fff' : '#EDEDED', arSh: dark ? 'inset 0 0 0 1px rgba(255,255,255,.22)' : '0 0 0 1px rgba(0,0,0,.1),0 8px 20px -12px rgba(0,0,0,.3)' };
    const rail = C.map((c, i) => ({ go: go(i), label: c[1], w: i === cur ? 28 : 8, bg: i === cur ? (dark ? '#fff' : '#EDEDED') : (dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.18)'), ml: i === 6 || i === 9 ? 14 : 0 }));
    const L = n => '/home/assets/logos/' + n + '.svg', RU = 'https://randomuser.me/api/portraits/';
    const SRC = [['Instagram', 'Ad replies and DMs', 'instagram', '#21050E'], ['Google', 'Search to landing page', 'google', '#041025'], ['Website', 'Contact forms', 'web', '#1F2311'], ['Facebook', 'Lead forms', 'facebook', '#021026'], ['WhatsApp', 'Click-to-chat', 'whatsapp', '#20260D']];
    const ys = [60, 150, 240, 330, 420];
    const sources = SRC.map((s, i) => ({ n: s[0], d: s[1], logo: L(s[2]), tile: s[3], y: ys[i], o: cur === 1 && lt >= i * 1.4 ? 1 : 0, t: cur === 1 && lt >= i * 1.4 ? 'none' : 'translateX(-40px) scale(.94)' }));
    const srcPaths = ys.map((y, i) => ({ d: `M200 ${y + 29} C260 ${y + 29} 260 280 300 280`, c: ['#E4405F', '#4285F4', '#34A853', '#0866FF', '#25D366'][i], o: cur === 1 && lt >= i * 1.4 + .7 ? .85 : 0 }));
    const IB = [['Priya Verma', 'Asked about acne treatment', 'women/44', 'instagram'], ['Rahul Sharma', 'Searched “skin clinic near me”', 'men/32', 'google'], ['Neha Kapoor', 'Filled the website form', 'women/65', 'web'], ['Arjun Rao', 'Facebook lead form', 'men/52', 'facebook'], ['+91 98201 4••••', 'Hi, is this the clinic?', '', 'whatsapp']];
    const nIb = cur === 1 ? Math.min(5, Math.max(0, Math.floor((lt - 1) / 1.4) + 1)) : 0;
    const inbox = IB.map((b, i) => ({ n: b[0], m: b[1], av: b[2] ? RU + b[2] + '.jpg' : '', logo: L(b[3]), o: i < nIb ? 1 : 0, t: i < nIb ? 'none' : 'translateX(30px) scale(.95)' }));
    const CH = [{ isAd: 1 }, { isTyping: 1 }, { isBot: 1, t: 'Hi Priya! The acne treatment starts at ₹1,800 per session. Most people choose the 3-session pack at ₹4,900, with a free skin analysis.', time: '10:41' }, { hasBtns: 1, btns: [{ t: 'Book a consultation' }, { t: 'See before & after' }] }, { isMe: 1, t: 'Book a consultation', time: '10:42' }, { isList: 1 }, { isMe: 1, t: 'Sat 26 Oct · 11:00 AM', time: '10:43' }, { isTyping: 1 }, { isCard: 1 }];
    const seq = [0, 1, 2, 2, 3, 4, 5, 6, 7, 8];
    const st3 = cur === 2 ? Math.min(seq.length - 1, lt) : -1;
    const shown = new Set(); if (st3 >= 0) for (let i = 0; i <= st3; i++) shown.add(seq[i]);
    const lastTyping = st3 >= 0 ? seq[st3] : -1;
    const chat = CH.map((m, i) => ({ isAd: !!m.isAd, isBot: !!m.isBot, hasBtns: !!m.hasBtns, btns: m.btns || [], isMe: !!m.isMe, isTyping: !!m.isTyping, isCard: !!m.isCard, isList: !!m.isList, t: m.t || '', time: m.time || '', al: m.isMe || m.isAd ? 'flex-end' : 'flex-start', d: shown.has(i) && (!m.isTyping || i === lastTyping) ? 'flex' : 'none' }));
    const AL = [['instagram', '#21050E', 'Lead captured from your Instagram ad', 'Priya Verma · interested in acne treatment', 0], ['web', '#1F2311', 'Added to your CRM', 'Stage: New lead · Owner: Front desk', 2], ['googlecalendar', '#041025', 'Slot held in Dr. Mehra’s calendar', 'Sat 26 Oct · 11:00 AM', 6], ['whatsapp', '#20260D', 'Reminder scheduled', 'Fri 7:00 PM on WhatsApp', 8], ['razorpay', '#080B1D', 'Payment link ready', '₹4,900 · 3-session pack', 9]];
    const agentLog = AL.map(x => ({ logo: L(x[0]), bg: x[1], t1: x[2], t2: x[3], o: cur === 2 && lt >= x[4] ? 1 : 0, t: cur === 2 && lt >= x[4] ? 'none' : 'translateX(24px)' }));
    const moved = cur === 3 && lt >= 2;
    const kan = [['New', [['Rahul Sharma', 'Google · Acne'], ...(moved ? [] : [['Priya Verma', 'Instagram · Acne']]), ['Neha Kapoor', 'Website']]], ['Contacted', [['Arjun Rao', 'Facebook · Laser']]], ['Booked', moved ? [['Priya Verma', 'Sat 11:00 · Dr. Mehra', 1]] : []], ['Won', [['Meera Shah', '₹4,900 pack']]]].map(c => ({ n: c[0], c: c[1].length, cards: c[1].map(x => ({ n: x[0], d: x[1], sh: x[2] ? '0 0 0 1.5px #25D366,0 6px 14px -6px rgba(37,211,102,.6)' : '0 0 0 .5px rgba(0,0,0,.08)' })) }));
    const inst = cur === 3 && lt >= 4;
    const rl = cur === 3 && lt >= 1, c4 = { av: rl ? 'RK' : 'AS', avBg: rl ? '#020920' : '#2D1A02', avFg: rl ? '#3949AB' : '#B5651D', who: rl ? 'Ravi Kumar' : 'Dr. Anjali Shah', first: rl ? 'Ravi' : 'Anjali', role: rl ? 'Front desk' : 'Owner', vaRing: rl ? '0 0 0 1.5px #00147D,0 0 0 4px rgba(79,110,247,.12)' : '0 0 0 1px #242420', billO: rl ? .35 : 1, lockO: rl ? 1 : 0, tgBg: rl ? '#2D2D28' : '#25D366', tgX: rl ? '2px' : '14px' };
    const apps = [['C', 'Clinic CRM', 'Leads, appointments, doctors', '#3949AB', inst], ['R', 'Real estate', 'Site visits and follow-ups', '#E0784F', false], ['S', 'Retail', 'Orders, loyalty, inbox', '#CAE07F', false]].map(a => ({ i: a[0], n: a[1], d: a[2], c: a[3], b: a[4] ? 'Installed ✓' : 'Install', bb: a[4] ? '#20260D' : '#EDEDED', bf: a[4] ? '#CAE07F' : '#090909' }));
    const rt = cur === 4;
    const bars = [30, 42, 38, 50, 46, 88, 96].map((v, i) => ({ h: rt ? v : 6, c: i >= 5 ? '#AA5C0D' : '#5B360A' }));
    const TP = [
      { biz: 'Stride Shoes', ini: 'S', av: '#D32F2F', isImg: 1, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&auto=format&fit=crop', m: 'Hi Neha 👟 The Runner X is back in your size 8. Enjoy 15% off till Sunday.', btns: ['Shop now', 'Remind me later'], r: 'Ordering now!', time: '11:02', tab: 'Retail · Image', d: 'MONDAY', ht: '7:18 PM', h1: 'Do you have the Runner X in size 8?', h2: 'Sold out right now, Neha. We’ll message you the moment it’s back.', f: 'Done! Order #2318 is confirmed. It arrives by Thursday.' },
      { biz: 'Lux Skin Clinic', ini: 'L', av: '#855C37', isVid: 1, img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80&auto=format&fit=crop', m: 'Hi Priya, here is how the 3-session acne treatment works, in 40 seconds.', btns: ['Book a consultation'], r: 'Booking for Saturday', time: '4:15', tab: 'Clinic · Video', d: 'YESTERDAY', ht: '9:04 PM', h1: 'Hi, how many sessions does acne treatment take?', h2: 'Usually 3, Priya. I’ll send you a short video on how it works.', f: 'Booked for Sat 26 Oct, 11:00 AM with Dr Mehra. See you then!' },
      { biz: 'Green Meadows Realty', ini: 'G', av: '#7ECF82', isPdf: 1, img: '', m: 'Hi Rahul, here is the brochure and price sheet for the 2 BHK you liked.', btns: ['Book a site visit', 'Talk to an agent'], r: 'Saturday works', time: '6:40', tab: 'Real estate · PDF', d: 'SUNDAY', ht: '12:30 PM', h1: 'Is the 2 BHK at Green Meadows still available?', h2: 'Yes, Rahul! I’ll share the brochure and prices with you.', f: 'Site visit booked for Saturday, 11 AM. Kavya, your agent, will call you.' }
    ];
    const ti = cur === 4 ? Math.floor(lt / 5) % 3 : 0, tstep = cur === 4 ? lt % 5 : 0;
    const T0 = TP[ti]; const tpl = Object.assign({ isImg: false, isVid: false, isPdf: false }, T0, { isImg: !!T0.isImg, isVid: !!T0.isVid, isPdf: !!T0.isPdf, m: T0.m.replace(' 👟', ''), key: 'tp' + ti });
    const tplPhones = TP.map((T, i) => { const d = ((i - ti) % 3 + 3) % 3; return Object.assign({}, T, { isImg: !!T.isImg, isVid: !!T.isVid, isPdf: !!T.isPdf, m: T.m.replace(' 👟', ''), key: 'tp' + i, tf: (() => { const tc = cur === 4 ? Math.floor(lt / 5) : 0, a = (tc - i) * 120, tl = d === 0 ? -8 : d === 2 ? 34 : -34; return 'translate3d(0,' + (d === 0 ? 0 : 48) + 'px,-160px) rotateY(' + a + 'deg) translateZ(160px) rotateY(' + (tl - a) + 'deg) rotateX(4deg) scale(' + (d === 0 ? .56 : .5) + ')'; })(), shx: d === 0 ? '62%' : d === 2 ? '10%' : '95%', dim: d === 0 ? 0 : .1, o: 1, z: d === 0 ? 3 : 1, fl: d === 0 ? 'none' : 'brightness(.94) saturate(.9)', fo: i === ti && tstep >= 3 ? 1 : 0, foY: i === ti && tstep >= 3 ? 0 : 10, rep: i === ti && tstep >= 2 ? 1 : 0, repY: i === ti && tstep >= 2 ? 0 : 10 }); });
    const tplTabs = TP.map((x, i) => ({ t: x.tab, bg: i === ti ? '#EDEDED' : '#090909', fg: i === ti ? '#090909' : '#EDEDED' }));
    const sent = rt ? Math.min(312, lt * 52) : 0;
    const PROMPT = 'Build a stock dashboard for my 3 outlets';
    const pl = cur === 6 ? Math.min(PROMPT.length, lt * 12) : 0;
    const gen = cur === 6 ? lt : 0;
    const f = cur === 6 ? this.state.ft : 0, ph = f < 3400 ? 0 : f < 10400 ? 1 : 2;
    const PV = [['Claude', 'claude', '#251208', ''], ['ChatGPT', '', '#EDEDED', 'GPT', '#090909'], ['Gemini', 'googlegemini', '#0C071E', ''], ['Grok', '', '#EDEDED', 'Grok', '#090909'], ['DeepSeek', '', '#4D6BFE', 'DS', '#090909'], ['Mistral', 'mistralai', '#271202', ''], ['Perplexity', 'perplexity', '#0D2123', '']];
    const PP = [[56, 150], [222, 150], [388, 150], [554, 150], [139, 300], [305, 300], [471, 300]], pk = f >= 2200;
    const tiles = PV.map((p, i) => { const on = f >= 200 + i * 160, cl = i === 0; return { n: p[0], logo: p[1] ? L(p[1]) : '', hasLogo: !!p[1], mono: p[3], bg: p[2], fg: p[4] || '#EDEDED', x: PP[i][0], y: PP[i][1], o: on ? (pk && !cl ? .4 : 1) : 0, t: on ? (pk && cl ? 'scale(1.08)' : 'none') : 'scale(.85) translateY(12px)', sh: pk && cl ? '0 0 0 2px #D97757,0 24px 40px -20px rgba(217,119,87,.6)' : '0 0 0 1px #21201A,0 14px 30px -22px rgba(0,0,0,.35)', tag: pk && cl ? 'Selected' : 'Connects via MCP', tagC: pk && cl ? '#C2562F' : '#7B7B76' }; });
    const P2 = 'Do deep research on skin clinics, then build me one app that runs my customers and my internal work: leads, bookings, follow-ups, staff tasks and billing.';
    const tl = f < 3800 ? 0 : Math.min(P2.length, Math.floor((f - 3800) / 22)), sB = f >= 7400, typed = sB ? '' : P2.slice(0, tl);
    const RS = [['Researching skin clinics like yours', '32 sources'], ['Reading your chats and leads', 'via Chatberry MCP'], ['Planning the app', 'CRM, bookings, follow-ups, tasks, billing'], ['Building it in Chatberry', 'about an hour']];
    const steps = RS.map((r, i) => { const t0 = 7800 + i * 600, v = f >= t0, d = f >= t0 + 600 && i < 3; return { t: r[0], sub: r[1], o: v ? 1 : 0, ty: v ? 'none' : 'translateY(6px)', doneO: d ? 1 : 0, spinO: v && !d ? 1 : 0 }; });
    const mins = f < 10600 ? 0 : Math.min(58, Math.round((f - 10600) / 8200 * 58));
    const LGS = [['Research: 32 clinics and your chats', 3], ['Customer CRM', 9], ['Booking page', 18], ['WhatsApp conversation flow', 28], ['Automations', 38], ['Staff tasks and roster', 47], ['Billing and invoices', 55]];
    const blog = LGS.map((l, i) => { const d = mins >= l[1], pd = i === 0 ? f >= 10800 : mins >= LGS[i - 1][1]; return { t: l[0], at: d ? l[1] + ' min' : '', o: d || pd ? 1 : .4, doneO: d ? 1 : 0, spinO: !d && pd ? 1 : 0, waitO: !d && !pd ? 1 : 0 }; });
    const cd = m => ({ o: mins >= m ? 1 : 0, t: mins >= m ? 'none' : 'scale(.94) translateY(10px)' }), rdy = f >= 18900;
    const a7 = { tiles, pAo: ph === 0 ? 1 : 0, pAt: ph === 0 ? 'none' : 'scale(.94)', pBo: ph === 1 ? 1 : 0, pBt: ph === 1 ? 'none' : ph === 0 ? 'scale(.92) translateY(24px)' : 'scale(1.04)', pCo: ph === 2 ? 1 : 0, pCt: ph === 2 ? 'none' : 'translateY(30px) scale(.96)',
      full: P2, typed, showPh: typed === '', sendBg: tl > 0 && !sB ? '#D97757' : '#2E2B21', greetO: sB ? 0 : 1, userO: sB ? 1 : 0, userT: sB ? 'none' : 'translateY(10px)', steps,
      time: mins + ' min', log: blog, c0: cd(9), c1: cd(18), c2: cd(28), c3: cd(38), readyO: rdy ? 1 : 0, readyT: rdy ? 'none' : 'translateY(10px)',
      strip: ['Pick your AI', 'Ask for deep research', 'Built and ready in an hour'].map((t, i) => ({ n: i + 1, t, bg: i === ph ? '#EDEDED' : '#090909', fg: i === ph ? '#090909' : '#EDEDED', nb: i === ph ? '#090909' : '#1E1C16', nf: '#EDEDED' })) };
    { const sc = f < 12700 ? 0 : f < 14800 ? 1 : f < 16900 ? 2 : 3, pop = t0 => ({ o: f >= t0 ? 1 : 0, t: f >= t0 ? 'none' : 'scale(.9) translateY(10px)' });
      for (let i = 0; i < 4; i++) { a7['sc' + i] = { o: ph === 2 && sc === i ? 1 : 0, t: sc === i ? 'none' : sc > i ? 'translateX(-30px)' : 'translateX(30px)' }; a7['rl' + i] = { bg: sc === i ? '#EDEDED' : '#090909', fg: sc === i ? '#090909' : '#979692' }; }
      const KB = [['Customers', 214, 18, 'VIEWS 4', '#1D210E', '#CAE07F'], ['Appointments', 96, 12, 'VIEWS 3', '#041025', '#1A56C9'], ['Treatments', 24, 9, 'VIEWS 2', '#0C071E', '#6A4BD8'], ['Invoices', 61, 14, 'VIEWS 3', '#200505', '#C62828'], ['Employees', 9, 11, 'VIEWS 2', '#281802', '#FFAC49'], ['Attendance', 52, 7, 'VIEWS 2', '#0D2123', '#68F2FF']];
      a7.kb = KB.map((k, i) => Object.assign({ n: k[0], r: k[1], cl: k[2], v: k[3], bg: k[4], fg: k[5] }, pop(10900 + i * 260))); { const tp = pop(11700); a7.tblO = tp.o; a7.tblT = tp.t; }
      a7.kbRows = [['Priya Sharma', '+91 98201 44120', 'Instagram ad', 'Booked', '#1D210E', '#CAE07F'], ['Rahul Mehta', '+91 99300 21877', 'Google', 'New lead', '#041025', '#1A56C9'], ['Neha Kapoor', '+91 97690 33012', 'Website', 'Follow-up', '#281802', '#FFBC6D'], ['Arjun Rao', '+91 88790 11734', 'Walk-in', 'Paid', '#1D210E', '#CAE07F'], ['Meera Shah', '+91 90040 55219', 'WhatsApp', 'Loyal', '#0C071E', '#6A4BD8']].map((r, i) => Object.assign({ n: r[0], ph: r[1], src: r[2], st: r[3], sb: r[4], sf: r[5] }, pop(11900 + i * 200)));
      const VW = [['Home', 'Today’s bookings · cash · to-dos', '#CAE07F', 'linear-gradient(135deg,#21260F,#131709)'], ['Customers', 'Segments · WhatsApp · loyalty', '#C2185B', 'linear-gradient(135deg,#270614,#1C010A)'], ['Bookings', 'Doctors · slots · reminders', '#1A56C9', 'linear-gradient(135deg,#051129,#01081B)'], ['Money', 'Invoices · GST · payouts', '#7DFFF0', 'linear-gradient(135deg,#252B11,#151909)'], ['Stock', 'Products · reorder alerts', '#FFBC6D', 'linear-gradient(135deg,#342507,#241802)'], ['Team', 'Attendance · roster · tasks', '#6A4BD8', 'linear-gradient(135deg,#0E0625,#06011A)']];
      a7.vw = VW.map((v, i) => Object.assign({ n: v[0], s: v[1], c: v[2], bg: v[3] }, pop(12900 + i * 260)));
      for (let i = 0; i < 6; i++) a7['fn' + i] = pop(15000 + i * 280);
      [1, 2, 3, 4, 5].forEach((n, i) => { a7['fe' + i] = f >= 15000 + n * 280 - 80 ? 1 : 0; });
      a7.saveBg = f >= 16700 ? '#25D366' : '#57554D'; a7.saveT = f >= 16700 ? 'Saved ✓' : 'Save flow';
      const PPL = [['PS', 'Priya Sharma', '+91 98201 44120', 'Instagram ad', 3, '2 days ago', 'Booked', '#280F05', '#C2562F'], ['RM', 'Rahul Mehta', '+91 99300 21877', 'Google', 1, 'Today', 'New lead', '#041025', '#1A56C9'], ['AR', 'Anita Rao', '+91 98450 66310', 'Website', 5, '12 Oct', 'Loyal', '#0C071E', '#6A4BD8'], ['KJ', 'Karan Joshi', '+91 97690 13452', 'WhatsApp', 2, '18 Oct', 'Paid', '#1D210E', '#CAE07F'], ['NV', 'Neha Verma', '+91 98111 70294', 'Referral', 4, '9 Oct', 'Loyal', '#281802', '#FFBC6D'], ['AS', 'Arjun Sen', '+91 90040 58821', 'Instagram ad', 0, 'No visits', 'Follow-up', '#0D2123', '#68F2FF']];
      const SC = { Booked: ['#1D210E', '#CAE07F'], 'New lead': ['#041025', '#1A56C9'], Loyal: ['#0C071E', '#6A4BD8'], Paid: ['#1D210E', '#CAE07F'], 'Follow-up': ['#281802', '#FFBC6D'] };
      a7.pp = PPL.map((p, i) => ({ i: p[0], n: p[1], ph: p[2], src: p[3], vi: p[4], lv: p[5], st: p[6], bg: p[7], fg: p[8], sb: SC[p[6]][0], sf: SC[p[6]][1], o: f >= 17100 + i * 220 ? 1 : 0, t: f >= 17100 + i * 220 ? 'none' : 'translateY(8px)' }));
      const TT = [['Creating data collections', '1 of 4 · Knowledge Base'], ['Designing your views', '2 of 4 · Modules'], ['Building the WhatsApp flow', '3 of 4 · Automations'], ['Adding your customers', '4 of 4 · From your chats']];
      a7.tT = rdy ? 'Built and ready in 58 min' : TT[sc][0]; a7.tS = rdy ? 'Customers and your team, in one app.' : TT[sc][1];
      a7.tBg = rdy ? '#1D210E' : '#090909'; a7.tFg = rdy ? '#D7E99B' : '#EDEDED'; a7.tSpin = rdy ? 0 : 1; a7.tDone = rdy ? 1 : 0; a7.rdy = rdy; }
    const FB = [['Lux Skin Clinic', 'Mumbai', '38 more bookings this week', '#E0784F'], ['Stride Shoes', 'Pune', '₹4.2L sold on WhatsApp', '#3949AB'], ['Green Meadows Realty', 'Bengaluru', '56 site visits booked', '#7ECF82'], ['Spice Route Kitchen', 'Delhi', '212 tables booked', '#C2185B'], ['Rangrez Studio', 'Jaipur', '3× more repeat buyers', '#331099'], ['Hilltop Stays', 'Manali', 'Full every weekend', '#68F2FF'], ['FitNation Gym', 'Hyderabad', '140 trial sign-ups', '#FFAC49'], ['Bright Minds Academy', 'Chennai', 'Fees collected on time', '#1A56C9'], ['Mehta Traders', 'Ahmedabad', 'Stock never runs out', '#BC9A8E']];
    const fcol = k => { const L2 = FB.map((_, j) => FB[(j * 4 + k * 3) % FB.length]).slice(0, 6).map(t => ({ n: t[0], city: t[1], r: t[2], c: t[3], i: t[0].split(' ').map(w => w[0]).slice(0, 2).join('') })); return L2.concat(L2); };
    const tx = this.state.tx, ty = this.state.ty, cr = cur === 9 ? Math.min(2500, Math.round(this.state.ft / 1300 * 2500 / 10) * 10) : 0;
    const fz = { c0: fcol(0), c1: fcol(1), c2: fcol(2), credit: cr.toLocaleString('en-IN'), melo: this.melo(44, 'love'),
      cardT: 'perspective(1000px) rotateX(' + (-ty * 12).toFixed(2) + 'deg) rotateY(' + (tx * 16).toFixed(2) + 'deg) rotate(-2deg)',
      glare: 'radial-gradient(circle at ' + Math.round((tx + .5) * 100) + '% ' + Math.round((ty + .5) * 100) + '%,rgba(9,9,9,.9),transparent 55%)',
      move: e => { const r = e.currentTarget.getBoundingClientRect(); this.setState({ tx: (e.clientX - r.left) / r.width - .5, ty: (e.clientY - r.top) / r.height - .5 }); },
      leave: () => this.setState({ tx: 0, ty: 0 }) };
    const WFD = [['CLINIC · APPOINTMENTS', '#CAE07F', 'Lux Skin Clinic', ['Pick a doctor and slot', 'Add your details', 'Pay with UPI', 'Booking confirmed'], 'New booking', 'Priya Sharma · Tue 13, 11:30 AM', '₹800 paid · PhonePe', ['Added to CRM', 'Reminder set'], 'Clinic · Appointments', 230],
      ['RESTAURANT · PRE-ORDERS', '#C2562F', 'Saffron Table', ['Pick your dishes', 'Review the order', 'Pay with UPI', 'Table booked'], 'New pre-order', 'Table for 2 · Today, 8:00 PM', '₹777 paid · 2 items', ['Sent to kitchen', 'Table held'], 'Restaurant · Pre-orders', 196],
      ['RETAIL · SHOPPING', '#EDEDED', 'Stride Shoes', ['Choose colour and size', 'Check out', 'Pay with UPI', 'Order placed'], 'New order', 'Neha Verma · Runner X, size 8', '₹3,149 paid · Ships today', ['Invoice created', 'Stock updated'], 'Retail · Shopping', 230],
      ['HOTEL · STAYS', '#E2683C', 'The Courtyard, Coorg', ['Pick your dates', 'Choose a room', 'Pay with UPI', 'Stay confirmed'], 'New reservation', '2 guests · Fri 24 to Sun 26 Oct', '₹18,000 paid · Deluxe room', ['Room blocked', 'Welcome message sent'], 'Hotel · Stays', 196]];
    const wfC = 7600, wp = cur === 5 ? this.state.ft % (wfC * 4) : 0, wb = Math.floor(wp / wfC), wt = cur === 5 ? wp - wb * wfC : 0;
    const wst = wt < 2600 ? 0 : wt < 4100 ? 1 : wt < 5300 ? 2 : 3, wD = WFD[wb];
    const wtap = (wt >= 2100 && wt < 2600) || (wt >= 3600 && wt < 4100) || (wt >= 4800 && wt < 5300), wpress = (wt >= 2420 && wt < 2600) || (wt >= 3920 && wt < 4100) || (wt >= 5120 && wt < 5300);
    const wobj = {};
    for (let i = 0; i < 4; i++) { const on = i === wb, sti = on ? wst : 0; wobj['w' + i] = { tf: 'translateY(' + (!on ? 620 : wt < 150 ? 620 : wt < 6900 ? 0 : -660) + 'px) scale(.58)', o: on && wt >= 150 && wt < 7250 ? 1 : 0, tr: on ? 'transform 1s cubic-bezier(.16,1,.3,1),opacity .4s ease' : 'none',
      s0: { t: sti >= 1 ? 'translateX(-30%)' : 'none', o: sti >= 1 ? 0 : 1 }, s1: { t: sti >= 1 ? 'none' : 'translateX(100%)', o: 1 }, s2: { t: sti >= 2 ? 'none' : 'translateY(105%)' }, dim: sti === 2 ? 1 : 0, s3: { t: sti >= 3 ? 'none' : 'scale(.97)', o: sti >= 3 ? 1 : 0 }, ck: sti >= 3 ? 'scale(1)' : 'scale(.3)',
      tx: on && wst === 0 ? WFD[i][9] : 196, ty: 790, to: on && wtap ? 1 : 0, ts: on && wpress ? .82 : 1 }; }
    const wf = Object.assign(wobj, { tag: wD[0], c: wD[1], name: wD[2], nTitle: wD[4], l1: wD[5], l2: wD[6], ch: wD[7], po: wt >= 300 && wt < 6900 ? 1 : 0, pt: wt >= 300 && wt < 6900 ? 'none' : 'translateY(10px)', no: wst >= 3 && wt < 6900 ? 1 : 0, nt: wst >= 3 && wt < 6900 ? 'none' : 'translateY(14px) scale(.97)',
      steps: wD[3].map((t, j) => { const d = j < wst || (j === 3 && wst === 3), ac = j === wst && !d; return { t, n: d ? '✓' : String(j + 1), bg: d ? '#CAE07F' : ac ? '#EDEDED' : '#090909', fg: d || ac ? '#090909' : '#7B7B76', sh: d || ac ? 'none' : 'inset 0 0 0 1.5px #33312B', tc: ac || d ? '#EDEDED' : '#7B7B76', fw: ac ? 600 : 400 }; }),
      tabs: WFD.map((x, j) => ({ t: x[8], bg: j === wb ? '#EDEDED' : '#090909', fg: j === wb ? '#090909' : '#EDEDED' })) });
    const LL = [['Claude', 'claude'], ['ChatGPT', '', 'AI'], ['Gemini', 'googlegemini'], ['Mistral', 'mistralai'], ['Perplexity', 'perplexity']];
    const llms = LL.map((l, i) => ({ n: l[0], logo: l[1] ? L(l[1]) : '', hasLogo: !!l[1], mono: l[2] || '', o: cur === 6 && lt >= i * .5 ? 1 : .2 }));
    const IN = [[30, 40, 'BOTTLENECK', '38% of evening leads wait more than 2 hours for a first reply.', '#D93025'], [480, 30, 'TEAM', 'Priya has 14 open tickets. Arjun has 3.', '#3949AB'], [20, 380, 'STOCK', 'Cartons will run out in 4 days at this rate.', '#FFAC49']];
    const insights = IN.map((n, i) => ({ x: n[0], y: n[1], k: n[2], t2: n[3], c: n[4], o: cur === 7 && lt >= i + 1 ? 1 : 0, t: cur === 7 && lt >= i + 1 ? 'none' : 'scale(.9) translateY(14px)' }));
    const b7 = cur === 7, clicked = b7 && lt >= 6;
    const g = cur === 7 ? this.state.ft : 0, sel = g >= 5200, adone = g >= 10400;
    const INS = [['SLOW REPLIES', '38% of evening leads wait more than 2 hours for a first reply.', '#D93025', 'Fix it'], ['TEAM', 'Priya has 14 open tickets. Arjun has 3.', '#3949AB', 'Rebalance'], ['STOCK', 'Cartons will run out in 4 days at this rate.', '#FFAC49', 'Reorder'], ['PAYMENTS', '₹1.8L in invoices is unpaid for over 15 days.', '#CAE07F', 'Remind'], ['LEADS', '62 people asked for prices and never booked.', '#C2185B', 'Follow up']];
    const ins = INS.map((n, i) => { const v = g >= 300 + i * 550, on = i === 0 && sel; return { k: n[0], t: n[1], c: n[2], aT: on ? (adone ? 'Done ✓' : 'Working…') : n[3], o: v ? (sel && !on ? .55 : 1) : 0, ty: v ? (on ? 'scale(1.02)' : 'none') : 'translateY(12px)', bg: on ? '#08011B' : '#090909', sh: on ? '0 0 0 2px #331099,0 16px 30px -20px rgba(51,16,153,.6)' : '0 0 0 1px #21201A', aBg: on ? '#331099' : '#1A1813', aFg: on ? '#090909' : '#EDEDED' }; });
    const AS = [['Reading 214 evening chats', 'last 30 days'], ['Writing a reply in your tone', ''], ['Setting hours', '7 PM to 9 AM'], ['Testing with 3 sample leads', ''], ['Turning it on', 'all new leads']];
    const asteps = AS.map((r, i) => { const t0 = 5900 + i * 900, v = g >= t0, d = g >= t0 + 900; return { t: r[0], sub: r[1], o: g >= 5600 ? (v ? 1 : .4) : 0, doneO: d ? 1 : 0, spinO: v && !d ? 1 : 0, waitO: v ? 0 : 1 }; });
    const a8 = { ins, steps: asteps, meloI: this.melo(30, 'think'), meloE: this.melo(30, adone ? 'celebrate' : 'smile'), ao: g >= 5400 ? 1 : 0, at: g >= 5400 ? 'none' : 'translateX(24px) scale(.97)', st: adone ? 'Done' : 'Working…', stBg: adone ? '#1D210E' : '#0B0323', stFg: adone ? '#CAE07F' : '#6A4BD8', pvO: g >= 7700 ? 1 : 0, pvT: g >= 7700 ? 'none' : 'translateY(8px)', rO: adone ? 1 : 0, rT: adone ? 'none' : 'translateY(10px)', co: g >= 3600 && g < 7200 ? 1 : 0, ct: g >= 4000 ? 'translate(328px,94px)' : 'translate(640px,500px)', cs: g >= 5000 && g < 5300 ? .8 : 1 };
    const ORB = ['shopify', 'razorpay', 'googlesheets', 'zoho', 'hubspot', 'zapier', 'gmail', 'googlecalendar', 'stripe', 'instagram', 'facebook', 'notion'];
    const orbit = ORB.map((n, i) => { const a = i / ORB.length * Math.PI * 2; return { logo: L(n), x: 200 + Math.cos(a) * 200, y: 200 + Math.sin(a) * 200 }; });
    const CUR = [
      [[150, 330, '#E4405F', 'Priya, your customer', 'She sees your ad on Instagram and taps “Book now”.'], [420, 500, '#0866FF', 'Your ad spend', 'You pay about ₹765 for every lead, but most of them never get a reply.']],
      [[610, 120, '#25D366', 'Chatberry', 'Leads from every source land in one inbox, tagged with where they came from.']],
      [[150, 300, '#E4405F', 'Priya, your customer', 'She taps a reply button. No typing needed.'], [400, 100, '#25D366', 'Chatberry, your AI agent', 'While chatting, it adds her to your CRM, holds the slot and sets a reminder.']],
      [[548, 50, '#3949AB', 'Ravi, your front desk', 'He sees only the screens his role allows. Billing stays hidden.'], [742, 448, '#AA5C0D', 'You, the owner', 'You install a ready-made Clinic CRM in one click.']],
      [[170, 330, '#AA5C0D', 'Chatberry, your AI agent', 'It sends 312 personal follow-ups to leads who didn’t book.']],
      [[650, 470, '#E0784F', 'Your customer', 'They book and pay without leaving WhatsApp.']],
      [[40, 520, '#D97757', 'Claude, connected via MCP', 'It researches your business, then builds the app inside Chatberry.'], [720, 520, '#0042AA', 'You, the owner', 'You ask in plain English. The app is built and ready in about an hour.']],
      [[150, 110, '#331099', 'Chatberry, your second brain', 'It studies your chats, team, stock and invoices, and lists what needs fixing.'], [560, 80, '#CAE07F', 'Chatberry agent', 'Pick any insight and it does the work for you, step by step.']],
      [[300, 431, '#FF4F00', 'Your automations', 'A new order sends a WhatsApp confirmation and creates the invoice on its own.']],
      [] ][cur] || [];
    const cursors = CUR.map((c, i) => { const on = this.state.hc === i, fl = c[0] > 500, fu = c[1] > 360; return { nl: fl ? -238 : 14, ntp: fu ? -96 : 20, dot: on ? 0 : 1, hx: c[0] - 120, hy: c[1] - 80, x: on ? c[0] : c[0] + 40, y: on ? c[1] : c[1] + 30, c: c[2], n: c[3], note: c[4], o: on ? 1 : 0, no: this.state.hc === i ? 1 : 0, nt: this.state.hc === i ? 'none' : 'translateY(6px) scale(.96)', enter: () => this.setState({ hc: i }), leave: () => this.setState({ hc: null }) }; });
    return Object.assign({
      wrapRef: this.wrapRef, visRef: this.visRef, n: N, k, cursors,
      cols: this.state.narrow ? 'minmax(0,1fr)' : 'minmax(0,5fr) minmax(0,7fr)', rows: this.state.narrow ? 'auto auto auto' : 'minmax(0,1fr)', visH: this.state.narrow ? Math.round(560 * k + 60) + 'px' : '100%',
      copyH: this.state.narrow ? '156px' : 'calc(min(340px,54vh) + 84px)', cGap: this.state.narrow ? '6px' : 'clamp(8px,2vh,18px)', monoS: this.state.narrow ? '10px' : '11.5px', keyD: this.state.narrow ? 'none' : 'block', pS: this.state.narrow ? '15px' : 'clamp(17px,min(1.9vw,3.2vh),27px)', cvTop: this.state.narrow ? '0px' : '50%', lastCtaD: this.state.narrow ? 'none' : 'flex', chipD: this.state.narrow ? 'none' : 'flex', mFinD: this.state.narrow ? 'flex' : 'none', mFinO: cur === 9 ? 1 : 0, mFinPE: cur === 9 ? 'auto' : 'none', mFinTop: Math.round(452 * k + 14) + 'px', cvTy: this.state.narrow ? '0px' : '-50%', cvO: this.state.narrow ? 'top center' : 'center', h2s: this.state.narrow ? 'clamp(20px,5.6vw,28px)' : 'clamp(26px,min(3.6vw,6.2vh),52px)', visMin: this.state.narrow ? '0px' : 'min(420px,60vh)', copyColH: this.state.narrow ? 'auto' : '100%',
      snaps: Array.from({ length: N }, (_, i) => ({ top: `calc(${i} * (100vh - var(--navh, 58px)))`, d: this.state.deck && i > 0 ? 'none' : 'block' })),   // the deck keeps one snap point: the page's scroll snapping must still stop on it
      wrapH: this.state.deck ? 'auto' : `calc(${N} * (100vh - var(--navh, 58px)))`, stPos: this.state.deck ? 'relative' : 'sticky', stTop: this.state.deck ? '0px' : 'var(--navh, 58px)',
      stH: this.state.deck ? (this.vh0 || window.innerHeight) - (window.WM_NAVH || 58) + 'px' : 'calc(100vh - var(--navh, 58px))',
      bgs, copy, rail, ...ar, padB: window.innerWidth < 640 ? 'calc(clamp(12px,2.5vh,32px) + 64px)' : 'clamp(12px,2.5vh,32px)', arD: this.state.narrow ? 'none' : 'flex', railD: this.state.narrow ? 'none' : 'flex', mNavD: this.state.narrow ? 'flex' : 'none', capC: dark ? 'rgba(255,255,255,.6)' : '#7B7B76',
      spend: (48200 + (cur === 0 ? lt * 370 : 0)).toLocaleString('en-IN'),
      sources, srcPaths, inbox, leadCount: nIb, meloA: this.melo(110, cur === 1 && nIb >= 5 ? 'celebrate' : 'hello'),
      chat, agentLog, meloB: this.melo(46, cur === 2 && lt >= 8 ? 'celebrate' : 'smile'),
      kan, apps, c4,
      bars, tpl, tplPhones, tplTabs, tplThick: !this.state.deck, tplTs: this.state.deck ? 'flat' : 'preserve-3d', tplReply: tstep >= 2 ? 1 : 0, tplReplyY: tstep >= 2 ? 0 : 10, sent,
      prompt: PROMPT.slice(0, pl), genLabel: gen >= 4 ? 'Ready ✓' : gen >= 2 ? 'Generating…' : '', meloC: this.melo(36, 'smile'),
      w1: gen >= 3 ? 1 : 0, w1s: gen >= 3 ? 1 : .9, w2: gen >= 4 ? 1 : 0, w2s: gen >= 4 ? 1 : .9, w3: gen >= 4 ? 1 : 0, w3s: gen >= 4 ? 1 : .9, w4: gen >= 5 ? 1 : 0, w4s: gen >= 5 ? 1 : .9, llms, a7, a8, fz, wf, w0: wobj.w0, w1: wobj.w1, w2: wobj.w2, w3: wobj.w3, railMt: this.state.narrow ? '10px' : cur === 9 ? '96px' : '28px',
      insights, meloD: this.melo(110, clicked ? 'celebrate' : 'think'), recO: b7 && lt >= 4 ? 1 : 0, recLabel: clicked ? 'Applied ✓' : 'Apply', recBg: clicked ? '#EDEDED' : '#090909', recFg: clicked ? '#090909' : '#EDEDED', recS: b7 && lt === 6 ? .92 : 1, recDoneO: clicked ? 1 : 0,
      curX: b7 && lt >= 5 ? 690 : 560, curY: b7 && lt >= 5 ? 470 : 300, curS: b7 && lt === 6 ? .8 : 1,
      orbit, meloE: this.melo(110, 'smile'), dotC: dark ? 'rgba(255,255,255,.16)' : 'rgba(10,10,12,.16)',
      p0tf: (cur === 0 && (this.state.hc === 0 || this.state.p0t)) ? 'scale(.65) translate(210px,880px) rotate(-8deg) translate(-210px,-880px)' : 'scale(.65) translate(210px,880px) rotate(0deg) translate(-210px,-880px)', p0click: () => this.setState(x => ({ p0t: !x.p0t })),
      meloF: this.melo(110, 'love')
    }, S);
  }
}
HomepageStory.template = 'tpl-story';
WM.registry['Homepage Story'] = HomepageStory;

// ===== Homepage — template: #tpl-home =====
class Homepage extends WM.Component {
  state = { carStep: 0, carHover: false, wide: true, hp: 0, dropN: 0, hover: null, step: 0, guide: null, feature: null, blink: false, k: 1, phone: '', gFocus: false, gErr: false, gErrN: 0, gSent: false };
  measure = el => {
    if (!el || this.mEl === el) return;
    this.ro && this.ro.disconnect(); this.mEl = el;
    const upd = () => { if (!el.isConnected || el.clientWidth < 50) return; const cs = getComputedStyle(el); const w = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); const sec = el.parentElement, ss = getComputedStyle(sec), hd = el.firstElementChild ? el.firstElementChild.offsetHeight : 0; const avail = innerHeight - (window.WM_NAVH || 58) - parseFloat(ss.paddingTop) - parseFloat(ss.paddingBottom) - hd - parseFloat(cs.rowGap || 0) - 8; const k = innerWidth < 640 ? innerWidth / 720 : Math.max(.3, Math.min(1.2, Math.max(w, innerWidth - 120) / 1100)); let fy = 290; if (this.cEl) { const sr = sec.getBoundingClientRect(), cr = this.cEl.getBoundingClientRect(); const visH = Math.min(sr.height, innerHeight - (window.WM_NAVH || 58)); fy = Math.round(Math.min(290, (visH / 2 + 10 - (cr.top - sr.top)) / k)); } if (fy !== this.state.fy) this.setState({ fy }); if (Math.abs(k - this.state.k) > .001) this.setState({ k }); };
    this.ro = new ResizeObserver(upd); this.ro.observe(el); upd();
    [100, 400, 1200].forEach(ms => setTimeout(upd, ms));
    if (!this.onWinResize) { this.onWinResize = () => this.mEl && this.mUpd && this.mUpd(); window.addEventListener('resize', this.onWinResize); }
    this.mUpd = upd;
  };
  tiltRef = el => { this.tiltEl = el; };
  offerRef = el => {
    if (!el || this.offEl === el) return; this.offEl = el;
    const run = () => { if (this.offRan) return; this.offRan = true; const t0 = performance.now(), D = 1600; const tick = t => { const p = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - p, 4); if (this.crEl) this.crEl.textContent = '₹' + (Math.round(2500 * e / 10) * 10).toLocaleString('en-IN'); if (p < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); };
    if (!window.IntersectionObserver) return;
    const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { run(); io.disconnect(); } }, { threshold: .45 }); io.observe(el);
  };
  creditRef = el => { this.crEl = el; };
  offerMove = e => { const r = e.currentTarget.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height, s = e.currentTarget.style; s.setProperty('--ry', ((x - .5) * 22).toFixed(2) + 'deg'); s.setProperty('--rx', ((.5 - y) * 16).toFixed(2) + 'deg'); s.setProperty('--mx', (x * 100).toFixed(1) + '%'); s.setProperty('--my', (y * 100).toFixed(1) + '%'); };
  offerLeave = e => { const s = e.currentTarget.style; ['--rx', '--ry', '--mx', '--my'].forEach(k => s.removeProperty(k)); };
  carRef = el => { this.carEl = el; };
  tiltMove = e => { const el = this.tiltEl; if (!el) return; const r = e.currentTarget.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; el.style.transition = 'transform .25s cubic-bezier(.22,1,.36,1)'; el.style.transform = 'rotateY(' + (x * 12).toFixed(2) + 'deg) rotateX(' + (-y * 9).toFixed(2) + 'deg)'; };
  tiltLeave = () => { const el = this.tiltEl; if (!el) return; el.style.transition = 'transform .9s cubic-bezier(.22,1,.36,1)'; el.style.transform = 'none'; };
  measureNav() {
    const w = this.navWrapEl, t = this.navTabEl, p = this.navPanelEl; if (!w || !t || !p || !this.state.navOpen) return;
    const wr = w.getBoundingClientRect(), tr = t.getBoundingClientRect(), pr = p.getBoundingClientRect();
    const x0 = tr.left - wr.left, y0 = tr.top - wr.top, tw = tr.width, T = pr.top - tr.top, W = pr.width, H = pr.height, r = 16, s = 22;
    const X = v => (x0 + v).toFixed(1), Y = v => (y0 + v).toFixed(1);
    const d = 'M' + X(0) + ' ' + Y(r) + ' Q' + X(0) + ' ' + Y(0) + ' ' + X(r) + ' ' + Y(0) + ' L' + X(tw - r) + ' ' + Y(0) + ' Q' + X(tw) + ' ' + Y(0) + ' ' + X(tw) + ' ' + Y(r) + ' L' + X(tw) + ' ' + Y(T - 14) + ' C' + X(tw) + ' ' + Y(T - 4) + ' ' + X(tw + 6) + ' ' + Y(T) + ' ' + X(tw + s) + ' ' + Y(T) + ' L' + X(W - r) + ' ' + Y(T) + ' Q' + X(W) + ' ' + Y(T) + ' ' + X(W) + ' ' + Y(T + r) + ' L' + X(W) + ' ' + Y(T + H - r) + ' Q' + X(W) + ' ' + Y(T + H) + ' ' + X(W - r) + ' ' + Y(T + H) + ' L' + X(r) + ' ' + Y(T + H) + ' Q' + X(0) + ' ' + Y(T + H) + ' ' + X(0) + ' ' + Y(T + H - r) + ' Z';
    const sh = Math.ceil(y0 + T + H + 2);
    if (d !== this.state.navPath) this.setState({ navPath: d, navSvgH: sh });
  }
  goWin(dir) { clearTimeout(this.ht); clearTimeout(this.it); this.cand = null; this.activeEl = null; this.pinned = true; this.setState(s => ({ hover: ((s.hover ?? 0) + dir + 10) % 10, hp: 2 })); }
  enterWin(i, el) {
    if (this.pinned || innerWidth < 640) return;
    clearTimeout(this.it);
    if (this.state.hover === i) { this.cand = null; return; }
    const first = this.state.hover == null;
    this.it = setTimeout(() => {
      const a = this.activeEl, p = this.pt;
      if (a && p && this.inLock(p)) { this.cand = [i, el]; return; }
      this.activate(i, el);
    }, first ? 90 : 240);
  }
  inLock(p) { const a = this.activeEl; if (!a) return false; const r = a.getBoundingClientRect(), m = 36; return p[0] > r.left - m && p[0] < r.right + m && p[1] > r.top - m && p[1] < r.bottom + m; }
  activate(i, el) { this.cand = null; clearTimeout(this.ht); this.activeEl = el; this.setState({ hover: i, hp: 1 }); this.ht = setTimeout(() => this.setState({ hp: 2 }), 280); }
  chaosRef = el => {
    if (!el || this.cEl === el) return; this.cEl = el;
    const go = () => { if (this.dropIv) return; this.dropIv = setInterval(() => this.setState(s => { if (s.dropN >= 10) { clearInterval(this.dropIv); return null; } return { dropN: s.dropN + 1 }; }), 320); };
    this.dropFallback = setTimeout(go, 2500);
    const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) return go();
    if (!window.IntersectionObserver) return go();
    this.io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { go(); this.io.disconnect(); } }, { threshold: .25 }); this.io.observe(el);
  };
  heroRun() {
    if (!this.heroSeq) { const q = [{ b: 0, ph: 'msg', d: 2800 }, { b: 0, ph: 'gap', d: 500 }]; for (let b = 1; b <= 5; b++) q.push({ b, ph: 'drop', d: 700 }, { b, ph: 'pose', d: 450 }, { b, ph: 'msg', d: 2900 }, { b, ph: 'gap', d: 450 }); q.push({ b: 5, ph: 'done', d: 0 }); this.heroSeq = q; this.hi = 0; }
    const f = this.props.speed === 'slow' ? 1.5 : this.props.speed === 'fast' ? .65 : 1;
    const step = this.heroSeq[Math.min(this.hi, this.heroSeq.length - 1)];
    if (step.ph === 'done') { this.setState({ hs: step, heroDone: true }); this.htm = setTimeout(() => { this.setState({ ctaStage: true }); this.htm = setTimeout(() => { this.hi = 0; this.setState({ heroDone: false, ctaStage: false }); this.heroRun(); }, 7000 * f); }, 3000 * f); return; }
    if (this.props.motion !== false || !this.state.hs) this.setState({ hs: step });
    this.htm = setTimeout(() => { if (this.props.motion !== false) this.hi++; this.heroRun(); }, step.d * f);
  }
  componentDidMount() { this.onNavRs = () => this.measureNav(); addEventListener('resize', this.onNavRs); this.lastY = scrollY; this.onNavScroll = () => { const y = scrollY, d = y - this.lastY; if (Math.abs(d) < 6) return; const hide = d > 0 && y > 120; if (hide !== !!this.state.navHidden) this.setState({ navHidden: hide }); this.lastY = y; }; addEventListener('scroll', this.onNavScroll, { passive: true }); this.onKey = e => { if (e.key === 'Escape' && this.state.webOpen) { this.setState({ webOpen: false }); return; } if (this.state.hover == null || this.state.hp !== 2) return; if (e.key === 'ArrowRight') { e.preventDefault(); this.goWin(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); this.goWin(-1); } else if (e.key === 'Escape') { this.pinned = false; this.setState({ hover: null, hp: 0 }); } }; addEventListener('keydown', this.onKey); this.start(); this.blinkLoop(); this.heroRun(); this.onVp = () => { const wide = innerWidth >= 760, mob = innerWidth < 640; document.documentElement.style.scrollSnapType = mob ? 'none' : ''; if (wide !== this.state.wide || mob !== !!this.state.mob) this.setState({ wide, mob }); const cw = this.carEl ? this.carEl.clientWidth : 0; if (cw > 50 && Math.abs(cw - (this.state.carW || 0)) > 2) this.setState({ carW: cw }); this.mUpd && this.mUpd(); }; addEventListener('resize', this.onVp); this.onVp(); requestAnimationFrame(() => this.onVp()); [100, 400, 1200].forEach(ms => setTimeout(this.onVp, ms)); if (window.ResizeObserver) { this.vpRo = new ResizeObserver(this.onVp); this.vpRo.observe(document.documentElement); } }
  componentDidUpdate(pp) { if (this.state.navOpen !== this._lastNav) { this._lastNav = this.state.navOpen; if (this.state.navOpen) { requestAnimationFrame(() => this.measureNav()); setTimeout(() => this.measureNav(), 120); setTimeout(() => this.measureNav(), 450); } }  if (pp.speed !== this.props.speed) this.start(); if (this.mUpd) this.mUpd(); }
  componentWillUnmount() { removeEventListener('scroll', this.onNavScroll); removeEventListener('keydown', this.onKey); removeEventListener('resize', this.onVp); this.vpRo && this.vpRo.disconnect(); clearInterval(this.iv); clearTimeout(this.bt); clearTimeout(this.bt2); clearTimeout(this.et); clearInterval(this.dropIv); clearTimeout(this.dropFallback); clearTimeout(this.htm); clearTimeout(this.it); clearTimeout(this.ht); this.onWinResize && window.removeEventListener('resize', this.onWinResize); this.io && this.io.disconnect(); this.ro && this.ro.disconnect(); }
  start() {
    clearInterval(this.iv);
    const ms = this.props.speed === 'slow' ? 2100 : this.props.speed === 'fast' ? 900 : 1400;
    this.iv = setInterval(() => { if (this.props.motion !== false) this.setState(s => ({ step: s.step + 1, carStep: s.carHover ? s.carStep : s.carStep + 1 })); }, ms);
  }
  blinkLoop() { this.bt = setTimeout(() => { this.setState({ blink: true }); this.bt2 = setTimeout(() => { this.setState({ blink: false }); this.blinkLoop(); }, 130); }, 2200 + Math.random() * 3200); }
  MZ = (() => { const U = '/public/assets/media/'; return {
    hello: { w: 297, h: 231, a: 'mzSway 3.8s ease-in-out infinite', body: U + '6ad08a6924a6ccb062b6d281/hello_body.png', eyes: [U + '6ad08a6a8d869a3e4df524eb/hello_eyes.png', 144.9, 123.4] },
    smile: { w: 297, h: 231, a: 'mzHop 1.9s ease-in-out infinite', body: U + '6acdd182f8754f36ec750b80/smile_body2.png', eyes: [U + '6acdd1835858084f1d39d00b/smile_eyes.png', 149.5, 118.1] },
    oh: { w: 297, h: 231, a: 'mzHop 2.3s ease-in-out infinite', body: U + '6ad08a6b42b11f9b9b23db8d/oh_body.png', eyes: [U + '6ad08a6cfd4fccefb58014b0/oh_eyes.png', 144.1, 120.0] },
    think: { w: 320, h: 282, a: 'mzPonder 3.6s ease-in-out infinite', body: U + '6acdd1881bde8f5e18be24be/think_body2.png', eyes: [U + '6acdd189b6a3e1f950fda77d/think_eyes.png', 156.6, 161.4], acc: [['mzQm', U + '6acdced2b6a3e1f950fd96e7/think_acc0.png', 260.5, 44.3]] },
    squint: { w: 301, h: 237, a: 'mzCringe 3.4s ease-in-out infinite', body: U + '6acdceceb6a3e1f950fd96d5/squint_body.png' },
    celebrate: { w: 360, h: 270, a: 'mzJig 1.3s ease-in-out infinite', body: U + '6ad0907b7a72f885753f1499/celebrate_body.png', acc: [['mzFx', U + '6ad0907a6254c1e5ba8597f3/celebrate_acc.png', 237.1, 100.3]] },
    love: { w: 292, h: 236, a: 'mzBeat 1.7s ease-in-out infinite', body: U + '6acdcec9b6a3e1f950fd950a/love_body.png', acc: [['mzHeart', U + '6acdcecfb6a3e1f950fd96e0/love_acc0.png', 45.8, 49.9]] }
  }; })();
  melo(size, face, look, dark) {
    // Chatberry logo in place of the old mascot
    const h = WM.h, d = (this.MZ && this.MZ[face]) || {}, H = Math.round(size * 231 / 297), S = Math.round(Math.min(size, H * 1.15));
    return h("span", { style: { position: "relative", display: "inline-block", flex: "none", width: size, height: H, filter: "drop-shadow(0 " + Math.max(2, size / 24) + "px " + Math.max(4, size / 10) + "px rgba(80,100,20,.28))" } },
      h("span", { key: face, style: { position: "absolute", left: "50%", bottom: 0, width: S, height: S, marginLeft: -S / 2, transformOrigin: "50% 92%", animation: "mzIn .45s cubic-bezier(.22,1,.36,1) both" } },
        h("span", { style: { position: "absolute", inset: 0, transformOrigin: "50% 92%", animation: d.a || "none" } },
          h("img", { src: "/assets/chatberry-icon.svg", alt: "", draggable: false, style: { position: "absolute", inset: 0, width: "100%", height: "100%", userSelect: "none" } }))));
  }
  fmt(d) { return d.length > 5 ? d.slice(0, 5) + ' ' + d.slice(5) : d; }
  renderVals() {
    const s = this.state.step, P = this.props, st = this.state, k = st.k;
    // hero
    const HS = st.hs || { b: 0, ph: 'msg' };
    const hp = HS.ph === 'out' || HS.ph === 'done' ? 0 : HS.b;
    const heroCur = HS.ph === 'out' || HS.ph === 'done' ? 0 : HS.ph === 'drop' ? Math.max(0, HS.b - 1) : Math.min(HS.b, 5);
    const TINT = [['#2D1A02', '#492E0E', '#AA5C0D'], ['#20260D', '#384217', '#25D366'], ['#041027', '#081B40', '#4F8EF7'], ['#3A2F03', '#62530F', '#E0B400'], ['#27020B', '#3F0B19', '#9B1031'], ['#0D0225', '#160839', '#331099']];
    const pillsD = [['whatsapp', 'WhatsApp', 'now', '47 unread messages', '#20260D', '#384217', '', ''], ['', 'Phone', '2m ago', '12 missed calls', '#041027', '#081B40', '☎', '#34C759'], ['', 'Excel', '9m ago', 'stock_v7_FINAL.xlsx was edited', '#3A2F03', '#62530F', 'X', '#7CEEB0'], ['googlechat', 'Google Chat', '14m ago', 'Did anyone call Mr. Rao back?', '#27020B', '#3F0B19', '', ''], ['razorpay', 'Razorpay', '1h ago', 'Payment reminder… again', '#0D0225', '#160839', '', '']];
    const cl = v => `max(${v}, calc((100% - 100vw) / 2 + 14px))`;
    const pos = [[cl('-6%'), 'auto', '12%', -30], ['auto', cl('-12%'), '4%', -24], [cl('-10%'), 'auto', '44%', -36], ['auto', cl('-14%'), '30%', -28], [cl('-8%'), 'auto', '72%', -32]];
    const heroPills = pillsD.map((p, i) => ({ logo: p[0] ? '/home/assets/logos/' + p[0] + '.svg' : '', hasLogo: !!p[0], noLogo: !p[0], mono: p[6], tile: p[7], app: p[1], time: p[2], t: p[3], bg: p[4], bd: p[5], dir: pos[i][0] === 'auto' ? 'row-reverse' : 'row', ta: pos[i][0] === 'auto' ? 'right' : 'left', pad: pos[i][0] === 'auto' ? '12px 14px 12px 30%' : '12px 18% 12px 14px', l: pos[i][0], r: pos[i][1], top: pos[i][2], z: pos[i][3], op: i < hp ? 1 : 0, fl: i < hp ? 'blur(0px)' : 'blur(6px)', tf: i < hp ? `translateY(0) rotate(${i % 2 ? 1.5 : -2}deg) scale(1)` : HS.ph === 'done' ? `translate(${pos[i][0] === 'auto' ? 60 : -60}px,-30px) rotate(${i % 2 ? 8 : -8}deg) scale(.85)` : 'translateY(-26px) rotate(0deg) scale(.9)' }));
    // chaos
    const base = [[40, 40], [250, 130], [470, 30], [690, 110], [900, 40], [80, 260], [300, 290], [520, 200], [740, 280], [930, 220]];
    const names = [['CHAT', 'WhatsApp'], ['SHEET', 'Excel'], ['PAPER', 'Notebook'], ['DATES', 'Calendar'], ['VOICE', 'Phone calls'], ['MONEY', 'Billing app'], ['MAIL', 'Email'], ['LEADS', 'Old CRM'], ['WALL', 'Sticky notes'], ['SHEET', 'Google Sheets']];
    const W0 = [
      ['GM', 'Gmail', 'Inbox (1,284) – owner@business.in', 640, 0, 440, 280, 2, 'gmail', 'Enquiries get buried under invoices', 'Leads, vendor mails and payment alerts land in one inbox. Replies take days, and nobody knows who answered what.', 31],
      ['ZO', 'Zoho CRM', 'Zoho CRM – Deals', 20, 10, 380, 260, -3, 'zoho', 'Paid for, rarely opened', 'The CRM was set up once. The team went back to WhatsApp, so deals sit unassigned with no activity.', 0],
      ['CAL', 'Google Calendar', 'Calendar – Week 43', 330, 0, 400, 250, -1, 'googlecalendar', 'Bookings never reach the calendar', 'Appointments agreed on WhatsApp are typed in by hand, if at all. Double bookings follow.', 2],
      ['IG', 'Instagram', 'Instagram – Direct', 870, 230, 230, 300, 4, 'instagram', 'Ad enquiries go unanswered', 'People reply to your ads in DMs. No one is assigned, so most of them never hear back.', 23],
      ['TL', 'Tally', 'Tally – Sales Voucher', 0, 260, 360, 250, 2, '', 'Billing lives on its own island', 'Invoices are made separately from sales. Payment reminders go out late, or not at all.', 0],
      ['KP', 'Google Keep', 'Keep – Notes', 740, 330, 260, 220, -4, 'googlekeep', 'Follow-ups on sticky notes', 'Callback numbers and promises scribbled in notes. Half of them are lost by Friday.', 0],
      ['GS', 'Google Sheets', 'Lead tracker – Oct (copy)', 520, 150, 420, 270, 1.5, 'googlesheets', 'A lead tracker no one updates', 'Leads are copied in by hand when someone remembers. It was last touched 9 days ago.', 0],
      ['XL', 'Microsoft Excel', 'stock_sheet_v7_FINAL(2).xlsx', 120, 130, 460, 300, -2, '', 'Which version is the right one?', 'Stock lives in a file on one laptop. Three copies, broken formulas, and no one is sure which is current.', 0],
      ['WA', 'WhatsApp', 'WhatsApp Business', 380, 230, 420, 320, 1, 'whatsapp', 'Leads leave while you’re busy', 'Customers message, wait, and book elsewhere. No owner, no reminder, and the chat history scrolls away.', 47],
      ['PH', 'Phone', 'Recents', 60, 360, 220, 210, -3, '', 'Missed calls with no context', '12 missed calls today, and no record of who called, why, or whether anyone called back.', 12]
    ];
    if (st.k >= .95) { const UP = { GM: [670, -250], IG: [890, -40], KP: [770, 150], GS: [600, 40] }; W0.forEach(d => { const u = UP[d[0]]; if (u) { d[3] = u[0]; d[4] = u[1]; } }); }
    const dropN = st.dropN, J = [8, 7, 6, 0, 2, 9, 4, 3];
    const auto = dropN >= W0.length && st.hover == null ? J[Math.floor(s / 2) % J.length] : null;
    const act = st.hover != null ? st.hover : auto;
    const wins = W0.map((d, i) => { const on = i === act, dropped = i < dropN;
      return { kind: d[0], title: d[2], x: d[3], y: d[4], w: d[5], h: d[6], logo: d[8] ? '/home/assets/logos/' + d[8] + '.svg' : '', hasLogo: !!d[8], noLogo: !d[8], mono: { TL: 'T', XL: 'X', PH: '☎' }[d[0]] || '', tile: { TL: '#88DEF0', XL: '#090909', PH: '#34C759' }[d[0]] || '#686868',
        cbg: d[0] === 'XL' ? '#7CEEB0' : '#141414', cbd: d[0] === 'XL' ? '#D8F08C' : '#232323', cfg: d[0] === 'XL' ? '#090909' : '#C0C0C0', tileFg: d[0] === 'XL' ? '#7CEEB0' : '#090909',
        hasBadge: d[11] > 0, badge: d[11] > 0 ? d[11] + ((s + i) % 4) : 0,
        z: st.hover === i ? (st.hp === 2 ? 30 : i + 1) : on ? 24 : i + 1, op: dropped ? 1 : 0,
        tf: (() => { const dx = d[3] + d[5] / 2 < 550 ? -1 : 1; if (!dropped) return `translateY(-90px) rotate(${d[7] * 3}deg) scale(.92)`; if (st.hover === i) return st.hp === 2 ? `translate(${(dx < 0 ? 320 : 780) - (d[3] + d[5] / 2)}px,${(st.fy ?? 290) - (d[4] + d[6] / 2)}px) rotate(0deg) scale(1.08)` : `translate(${dx * 70}px,10px) rotate(${d[7] * .4}deg) scale(.97)`; if (on) return 'translateY(-14px) rotate(0deg) scale(1.04)'; return `rotate(${d[7]}deg)`; })(),
        sh: on ? '0 40px 80px -24px rgba(0,0,0,.45),0 0 0 .5px rgba(0,0,0,.18)' : '0 22px 50px -26px rgba(0,0,0,.4),0 0 0 .5px rgba(0,0,0,.16)',
        enter: e => this.enterWin(i, e.currentTarget),
        isWA: d[0] === 'WA', isXL: d[0] === 'XL', isGS: d[0] === 'GS', isGM: d[0] === 'GM', isCAL: d[0] === 'CAL', isZO: d[0] === 'ZO', isTL: d[0] === 'TL', isIG: d[0] === 'IG', isKP: d[0] === 'KP', isPH: d[0] === 'PH' }; });
    const A = act != null ? W0[act] : null;
    const H = st.hover != null ? W0[st.hover] : null;
    const PR = { GM: ['₹137–₹1,380 / user / month', 'Google Workspace. Sheets and Calendar come in the same bill.'], ZO: ['₹800–₹2,600 / user / month', 'Zoho CRM, billed yearly, often for seats nobody uses.'], CAL: ['Included in Workspace', 'You pay for it with Gmail, but bookings still never land here.'], IG: ['Free app, paid ads', 'The real cost is the ad spend behind every unanswered DM.'], TL: ['₹22,500–₹67,500 licence', 'TallyPrime, plus a yearly renewal for updates.'], KP: ['Free', 'Free to use. Expensive when a callback is forgotten.'], GS: ['Included in Workspace', 'Free in theory. Hours a week of copy-paste in practice.'], XL: ['₹145–₹1,830 / user / month', 'Microsoft 365, on top of your Google Workspace bill.'], WA: ['₹2,000–₹8,000 / month', 'WhatsApp Business API through a provider, plus per-conversation fees.'], PH: ['₹300–₹5,000 / month', 'Per line, or a cloud IVR that still drops calls.'] };
    const fo = (() => { const D = 'rgba(226,226,235,'; if (!H) return { op: 0, delay: '0s', bg: 'transparent', key: -1, app: '', title: '', text: '', price: '', priceNote: '', tx: 0, ty: 0, tw: 300, pos: '', pe: 'none' };
      const right = H[3] + H[5] / 2 < 550;
      const tw = 440, tx = right ? 620 : 40, ty = st.fy ?? 290, O = 3000;
      const wc = right ? 320 : 780;
      const hz = right ? `linear-gradient(270deg,${D}.9) 0px,${D}.86) ${O + 1100 - tx}px,${D}.5) ${O + 1100 - wc}px,${D}.38) 100%)` : `linear-gradient(90deg,${D}.9) 0px,${D}.86) ${O + tx + tw}px,${D}.5) ${O + wc}px,${D}.38) 100%)`;
      const bg = hz + `,linear-gradient(0deg,${D}.55) 0px,${D}0) 60%)`;
      return { op: st.hp === 2 ? 1 : 0, delay: '.12s', bg, key: st.hover, app: H[1].toUpperCase(), title: H[9], text: H[10], price: PR[H[0]][0], priceNote: PR[H[0]][1], tx, tw, ty, pos: (st.hover + 1) + ' / 10', pe: st.hp === 2 ? 'auto' : 'none' }; })();
    const avs = ['#386184', '#855C37', '#61784E', '#784C78', '#4C5F78'];
    const RU = 'https://randomuser.me/api/portraits/';
    const waChats = [['men/32', 'Rahul Sharma', 'Need price for 50 units?', '12:20', 3], ['women/44', 'Priya Verma (Lead)', 'Ok, I’ll book somewhere else.', '12:03', 3], ['men/75', 'Mehta Traders', 'Payment pending since 12th', '11:48', 5], ['men/52', 'Dr. Rao', 'Call me back pls', '11:02', 2], ['', '+91 98765 41230', 'Hello? Is this the store?', '10:15', 1], ['women/65', 'Sneha Kumar', 'Sent the photos', '09:40', 4]].map((c, i) => ({ n: c[1], m: c[2], t: c[3], u: c[4], av: c[0] ? '#292929 url(' + RU + c[0] + '.jpg)' : '#283237', bg: i === 1 ? '#111418' : 'transparent' }));
    const XR = [['', 'A', 'B', 'C', 'D', 'E'], ['1', 'Item', 'Qty', 'Rate', 'Amount', 'Updated by'], ['2', 'Cartons 20 kg', '120', '850', '1,02,000', 'Ravi'], ['3', 'Tape rolls', '40', '65', '2,600', 'Ravi?'], ['4', 'Bubble wrap', '15', '420', '6,300', 'Meera'], ['5', 'Labels (old)', '??', '3', '#VALUE!', ''], ['6', 'Stretch film', '8', '1,150', '9,200', 'Ravi'], ['7', 'TOTAL', '', '', '#REF!', ''], ['8', '', '', '', '', ''], ['9', '', '', '', '', '']];
    const xlCells = []; XR.forEach((r, ri) => r.forEach((v, ci) => { const hd = ri === 0 || ci === 0, err = /^#/.test(v); const selH = (ri === 0 && ci === 4) || (ri === 7 && ci === 0); xlCells.push({ v, bg: selH ? '#2E331E' : hd ? '#121212' : ri === 7 && ci === 4 ? '#181B0F' : '#090909', fg: err ? '#C4314B' : selH ? '#D8F08C' : hd ? '#9c9c9c' : '#d5d5d5', fw: ri === 1 || ri === 7 || err || selH ? 600 : 400, j: hd ? 'center' : ci >= 2 && ci <= 4 ? 'flex-end' : 'flex-start', sh: ri === 7 && ci === 4 ? 'inset 0 0 0 2px #7CEEB0' : selH ? (ri === 0 ? 'inset 0 -2px 0 #7CEEB0' : 'inset -2px 0 0 #7CEEB0') : 'none' }); }));
    const GR = [['', 'A', 'B', 'C', 'D', 'E'], ['1', 'Name', 'Phone', 'Source', 'Status', 'Follow-up'], ['2', 'Rahul S.', '98•••• 312', 'WhatsApp', 'New', '—'], ['3', 'Priya V.', '97•••• 604', 'Instagram', 'Called?', '12 Oct'], ['4', 'Arjun R.', '88•••• 117', 'Walk-in', '???', '—'], ['5', 'Kiran', '96•••• 580', 'Website', 'New', '—'], ['6', 'Meera S.', '91•••• 209', 'WhatsApp', 'Lost', '3 Oct'], ['7', '', '', '', '', ''], ['8', '', '', '', '', '']];
    const chipC = { New: '#051837', 'Called?': '#674C00', '???': '#3A0C09', Lost: '#202020' };
    const gsCells = []; GR.forEach((r, ri) => r.forEach((v, ci) => { const hd = ri === 0 || ci === 0, chip = ri > 1 && ci === 4 && chipC[v]; gsCells.push({ v, bg: hd ? '#0C0F11' : '#090909', fg: hd ? '#979797' : '#D9D9D9', fw: ri === 1 ? 600 : 400, j: hd ? 'center' : 'flex-start', chip: chip || 'transparent', pad: chip ? '1px 7px' : '0' }); }));
    const gmRows = [['Razorpay', 'Payment failed', 'INV-2291 could not be processed', '12:41', 1], ['Mehta Traders', 'RE: RE: RE: Revised quote', 'Any update on this?', '12:02', 1], ['Website form', 'New enquiry: bulk order', 'Name: Kiran, Qty: 500', '11:30', 1], ['GST Portal', 'Return filing due', 'GSTR-3B due in 2 days', '10:05', 0], ['Priya Verma', 'Following up again', 'Still waiting to hear back', 'Oct 20', 1], ['IndiaMART', '5 new buyer leads', 'Respond within 24 hrs', 'Oct 20', 0], ['Courier', 'Shipment delayed', 'AWB 7781… on hold', 'Oct 19', 0]].map(r => ({ f: r[0], s: r[1], p: r[2], t: r[3], fw: r[4] ? 700 : 400, bg: r[4] ? '#090909' : '#080C15' }));
    const igRows = [['ananya.k', 'price?', '2h'], ['rohit_bakes', 'Do you deliver to Pune?', '3h'], ['meera.home', 'hello??', '5h'], ['the.kapoors', 'Is this available in blue', '1d'], ['vikram_s', 'Replied to your ad', '1d'], ['neha.styles', 'Can I order on call?', '2d']].map((r, i) => ({ n: r[0], m: r[1], t: r[2], av: '#292929 url(https://randomuser.me/api/portraits/' + ['women/12', 'men/41', 'women/29', 'men/64', 'men/22', 'women/57'][i] + '.jpg)' }));
    const phRows = [['Unknown', '12:34'], ['+91 98201 4••••', '12:10'], ['Mehta Traders (2)', '11:52'], ['Unknown (3)', '11:20'], ['Dr. Rao', '10:48'], ['+91 99001 7••••', '09:31']].map(r => ({ n: r[0], t: r[1] }));
    // one place
    const p3 = s % 11;
    const chipStart = [[30, 60], [200, 20], [820, 30], [960, 100], [60, 210], [990, 250], [140, 340], [900, 380], [300, 130], [720, 160]];
    const gather = p3 >= 1 && p3 < 10, gone = p3 >= 2 && p3 < 10;
    const chips = names.map((n, i) => ({ n: n[1], x: gather ? 500 : chipStart[i][0], y: gather ? 50 : chipStart[i][1], op: gone ? 0 : 1, tf: gather ? `scale(.4) rotate(${(i % 5) * 18 - 36}deg)` : 'none' }));
    const live = p3 >= 2 && p3 < 10, dev = p3 >= 3 && p3 < 10;
    const coreFace = { 2: 'think', 3: 'celebrate', 4: 'oh', 5: 'think', 6: 'smile', 7: 'smile', 8: 'celebrate', 9: 'hello' }[p3] || 'hello';
    const fs = p3 >= 8 && p3 < 10 ? 2 : p3 >= 6 && p3 < 10 ? 1 : p3 >= 4 && p3 < 10 ? 0 : -1;
    // learns
    const p4 = s % 8;
    const sp = [[40, 50, 'You'], [40, 230, 'Your team'], [840, 50, 'Your customers'], [840, 230, 'Your business']];
    const sources = sp.map(([x, y, n], i) => { const act = p4 === i, done = p4 > i; return { n, x, y, bg: act ? '#EDEDED' : '#090909', fg: act ? '#090909' : '#EDEDED', dx: act || done ? 550 : (x < 500 ? 260 : 840), dy: act || done ? 170 : y + 28, dop: act ? 1 : 0 }; });
    // recs
    const recs = [
      { t: '18 enquiries haven’t heard back from you in 2 days.', a: 'Send WhatsApp follow-up', m: '18 follow-ups sent' },
      { t: 'Monday cardiology slots fill up by 10 am.', a: 'Open 6 more slots', m: '6 slots added' },
      { t: 'Priya has 14 open tickets. Arjun has 3.', a: 'Rebalance tickets', m: 'Tickets rebalanced' }
    ];
    const ri = Math.floor(s / 4) % 3, sub = s % 4;
    // industries
    const IMG = '/public/assets/img/';
    const inds = [
      { n: 'Healthcare', img: IMG + 'industries/healthcare.webp', d: 'Reimagining the patient experience, beyond the hospital visit.', m: ['Leads', 'Appointments', 'Doctors', 'Pharma inventory'], grad: 'linear-gradient(160deg,#090909 0%,#1E230E 55%,#313A16 100%)', dot: 'rgba(101,122,30,.28)', acc: '#94B32F', chipFg: '#D7E99B', ring: 'rgba(101,122,30,.12)' },
      { n: 'Education', img: IMG + 'industries/education.webp', d: 'Guide students and parents with instant answers, course information and admission support.', m: ['Admissions', 'Parents', 'Courses'], grad: 'linear-gradient(160deg,#090909 0%,#020B24 55%,#051435 100%)', dot: 'rgba(26,86,201,.26)', acc: '#4F7FE8', chipFg: '#6B91E4', ring: 'rgba(26,86,201,.12)' },
      { n: 'E-commerce', img: IMG + 'industries/ecommerce.webp', d: 'Keep distributors, retailers and sales teams aligned with automated order and catalogue updates.', m: ['Orders', 'Catalogue', 'Campaigns'], grad: 'linear-gradient(160deg,#090909 0%,#210512 55%,#360B1F 100%)', dot: 'rgba(194,24,91,.22)', acc: '#E0588F', chipFg: '#E96FA2', ring: 'rgba(194,24,91,.1)' },
      { n: 'Distributors', img: IMG + 'industries/distribution.webp', d: 'Keep customers engaged with automated product conversations and real-time order updates.', m: ['Orders', 'Retailers', 'Updates'], grad: 'linear-gradient(160deg,#090909 0%,#2F1D02 55%,#523007 100%)', dot: 'rgba(196,110,20,.26)', acc: '#AA5C0D', chipFg: '#F6BC7D', ring: 'rgba(196,110,20,.12)' }
    ];
    const k6 = st.carStep % 5;
    // proof
    const deckD = [
      { n: 'Petfolk', short: 'Petfolk', f: 'petfolk', logo: '/public/assets/img/clients/petfolk.webp', type: 'PET CARE', m: ['WhatsApp inbox', 'AI agents', 'Reminders'], video: '/public/assets/video/petfolk-testimonial.mp4?v=3', poster: '/public/assets/video/petfolk-testimonial.webp?v=3', card: '/public/assets/video/petfolk-card.webp?v=3', tall: true, dur: '0:32', vbg: '#181814', sum: 'Pet parents book grooming, vet visits and boarding on WhatsApp. An AI agent answers questions day and night and sends vaccination and check-up reminders automatically.', out: [['2.5×', 'more bookings on WhatsApp'], ['60%', 'fewer missed vaccination visits'], ['9 hrs', 'saved by the front desk each week'], ['4.9★', 'average pet-parent rating']] },
      { n: 'Julie & Juhi', short: 'Julie & Juhi', f: 'julie-juhi', logo: '/public/assets/img/clients/julie-juhi.webp', type: 'JEWELLERY BRAND', m: ['WhatsApp catalogue', 'Campaigns', 'AI agents'], video: '/public/assets/video/julie-juhi-testimonial.mp4', poster: '/public/assets/video/julie-juhi-testimonial.webp', card: '/public/assets/video/julie-juhi-card.webp', tall: true, dur: '0:58', vbg: '#181814', sum: 'Customers browse new collections, ask about designs and place orders on WhatsApp. Broadcasts announce every launch, and an AI agent answers sizing, pricing and delivery questions instantly.', out: [['3.2×', 'more orders from WhatsApp'], ['48%', 'repeat customers from broadcasts'], ['2 min', 'average first reply time'], ['12 hrs', 'saved by the sales team each week']] },
      { n: 'Pace Hospitals', short: 'Pace', f: 'pace-hospitals', type: 'MULTI-SPECIALTY HOSPITAL', m: ['WhatsApp inbox', 'Appointments', 'Lead pipeline'], video: '', poster: '', dur: '2:14', vbg: 'linear-gradient(160deg,#080B1D,#0D132D)', sum: 'Patient enquiries from 14 WhatsApp numbers now land in one inbox, and an AI agent books appointments while the front desk handles walk-ins.', out: [['3×', 'faster first reply to patients'], ['42%', 'more appointments booked on WhatsApp'], ['11 hrs', 'saved by the front desk each week'], ['0', 'enquiries missed after hours']] },
      { n: 'Lux Hospitals', short: 'Lux', f: 'lux-hospitals', type: 'HOSPITAL CHAIN', m: ['Omnichannel', 'Ticketing', 'Campaigns'], video: '', poster: '', dur: '1:48', vbg: 'linear-gradient(160deg,#1C0814,#2D1022)', sum: 'Calls, WhatsApp and Instagram come into one place. Every patient request becomes a ticket with an owner and a deadline.', out: [['65%', 'fewer patient complaints'], ['2.1×', 'reply rate on campaigns'], ['18 min', 'average time to resolve a request'], ['100%', 'of requests tracked to closure']] },
      { n: 'LivGastro', short: 'LivGastro', f: 'livgastro', type: 'SPECIALTY CLINIC', m: ['AI agents', 'Follow-ups', 'Analytics'], video: '', poster: '', dur: '2:30', vbg: 'linear-gradient(160deg,#1D0509,#0E2426)', sum: 'AI agents answer patients day and night and follow up after every visit, so fewer patients drop off between consultations.', out: [['24/7', 'replies to patients'], ['38%', 'more follow-up visits'], ['₹6.2L', 'monthly revenue recovered'], ['4.8★', 'average patient rating']] }
    ];
    const OBG = [['#1D210E', '#D7E99B'], ['#041025', '#6B91E4'], ['#0C071E', '#4B2FB8'], ['#2D1A02', '#FFBC6D']];
    const mk = (d, i) => Object.assign({}, d, { logo: d.logo || IMG + 'clients/' + d.f + '.svg', hasVideo: !!d.video, noVideo: !d.video, hasOut: d.out.length > 0, hasSum: !!d.sum, hasM: d.m.length > 0, hasCard: !!d.card, noCard: !d.card, cbg: d.card ? 'url(' + d.card + ') center/cover no-repeat,' + d.vbg : d.vbg, tags: d.tags || d.m, cta: d.out.length ? 'See their results' : 'Watch their story', vfit: d.tall ? 'contain' : 'cover', vfill: d.tall ? d.vbg : '#f6f6f6', hv: d.out.length ? d.out[0][0] : '', hl: d.out.length ? d.out[0][1].split(' ').slice(0, 3).join(' ') : '', out: d.out.map((o, j) => ({ v: o[0], l: o[1], bg: OBG[j][0], fg: OBG[j][1] })), vref: el => { if (el && d.video && el.getAttribute('src') !== d.video) { el.src = d.video; if (d.poster) el.poster = d.poster; } }, open: () => this.setState({ caseI: i }) });
    const decks = [0, 1, 2, 3].flatMap(() => deckD.map(mk));
    const cs = st.caseI != null ? mk(deckD[st.caseI], st.caseI) : mk(deckD[0], 0);
    // offer
    const p8 = s % 7;
    const tfs = ['translateY(-40px) rotate(-6deg) scale(.96)', 'rotate(-2deg)', 'rotate(1.5deg)', 'rotate(-1deg)', 'rotate(-1deg) scale(1.03)', 'rotate(-1deg)', 'rotate(-1deg)'];
    // guides
    const FMT = { PDF: ['PDF', '#270805', '#C5221F', 'guide'], VID: ['▶', '#041025', '#1A56C9', 'video'], XLS: ['XLS', '#1F2311', '#85eba7', 'template'] };
    const gD = [
      ['PLAYBOOK', 'The WhatsApp Patient Engagement Playbook', 'clinician', 'PDF', 'PDF · 24 pages', ['Message templates for every stage of care', 'How to reply within minutes, even after hours', 'A 30-day plan to launch on WhatsApp']],
      ['VIDEO', 'How Clinics Book 40% More Appointments on WhatsApp', 'patient-hands', 'VID', 'Video · 12 min', ['A live walkthrough of an AI booking flow', 'What to automate first, and what to keep human', 'Real numbers from a working clinic']],
      ['TEMPLATE', 'The Lead Follow-Up Tracker', 'classroom', 'XLS', 'Google Sheet · ready to copy', ['A pipeline you can copy in one click', 'Follow-up timings that actually convert', 'Formulas that flag leads going cold']],
      ['RESEARCH', 'Building Trust in AI-Led Conversations', 'clinician', 'PDF', 'PDF · 18 pages', ['What customers expect from AI replies', 'When to hand the chat to a person', 'Tone and wording that build trust']],
      ['WEBINAR', 'Automation That Scales With Your Team', 'classroom', 'VID', 'Webinar · 34 min', ['Setting up roles, routing and hand-offs', 'Workflows that remove manual follow-ups', 'Q&A with businesses already live']],
      ['PLAYBOOK', 'From First Touch to Follow-Up', 'patient-hands', 'PDF', 'PDF · 20 pages', ['Map every touchpoint in your customer journey', 'Ready-to-use follow-up sequences', 'Metrics to track every week']]
    ];
    if (st.guideI == null && !st.gHover) this.gStep = s; const gk = (this.gStep ?? 0) % 4;
    const gMk = (d, i) => { const f = FMT[d[3]]; return { type: d[0], t: d[1], img: IMG + 'insights/' + d[2] + '.jpg', fi: f[0], fbg: f[1], ffg: f[2], kind: f[3], meta: d[4], b: d[5], isVid: d[3] === 'VID', isDoc: d[3] === 'PDF', isSheet: d[3] === 'XLS', open: () => this.setState({ guideI: i, guide: d[1], phone: '', gSent: false, gErr: false }) }; };
    const guides = gD.map(gMk), gs = gMk(gD[st.guideI ?? 0], st.guideI ?? 0);
    const CC = [['IN', '+91', 10, 'India'], ['AE', '+971', 9, 'UAE'], ['SA', '+966', 9, 'Saudi Arabia'], ['US', '+1', 10, 'United States'], ['GB', '+44', 10, 'United Kingdom'], ['SG', '+65', 8, 'Singapore'], ['AU', '+61', 9, 'Australia'], ['NP', '+977', 10, 'Nepal'], ['BD', '+880', 10, 'Bangladesh'], ['LK', '+94', 9, 'Sri Lanka']];
    const cc = CC.find(c => c[0] === (st.cc || 'IN')) || CC[0], need = cc[2];
    const len = st.phone.length;
    const sheetFace = st.gSent ? 'celebrate' : st.gErr ? 'squint' : st.gFocus || len ? 'oh' : 'hello';
    const send = () => { if (st.gSent) return this.setState({ guide: null, guideI: null }); if (len === need) { window.open('https://wa.me/918147715267?text=' + encodeURIComponent('Hi Chatberry, please send me the guide: ' + gs.t + '. My WhatsApp number: ' + cc[1] + ' ' + st.phone), '_blank', 'noopener'); this.setState({ gSent: true, gFocus: false }); } else { this.setState(x => ({ gErr: true, gErrN: x.gErrN + 1 })); clearTimeout(this.et); this.et = setTimeout(() => this.setState({ gErr: false }), 1400); } };
    const fmtP = p => cc[0] === 'IN' ? this.fmt(p) : p.replace(/(\d{3})(?=\d)/g, '$1 ');
    const SHAPES = [
      { a: ['6px', '6px', '18px', '18px', '6px', '0deg'], b: ['16px', '14px', '18px', '18px', '50%'], c: ['9px', '9px', '6px'] },
      { a: ['5px', '9px', '28px', '20px', '10px 10px 10px 2px', '0deg'], b: ['20px', '20px', '14px', '14px', '50%'], c: ['10px', '14px', '5px'] },
      { a: ['8px', '4px', '22px', '30px', '11px', '0deg'], b: ['4px', '18px', '30px', '10px', '5px'], c: ['24px', '8px', '6px'] },
      { a: ['5px', '5px', '28px', '28px', '50% 50% 50% 6px', '0deg'], b: ['14px', '14px', '20px', '20px', '6px'], c: ['11px', '11px', '7px'] },
      { a: ['6px', '6px', '26px', '26px', '7px', '45deg'], b: ['3px', '22px', '20px', '12px', '6px'], c: ['16px', '16px', '6px'] },
      { a: ['4px', '12px', '30px', '14px', '7px', '0deg'], b: ['12px', '4px', '14px', '30px', '7px'], c: ['16px', '16px', '6px'] }
    ];
    const NTINT = { g: ['#1E240D', '#596B1E', 'rgba(141,175,31,.28)'], v: ['#0B0521', '#1A0A4E', 'rgba(106,75,216,.28)'], b: ['#041126', '#052761', 'rgba(47,111,228,.26)'], o: ['#2B1602', '#733600', 'rgba(238,123,48,.28)'], p: ['#230511', '#570725', 'rgba(224,72,127,.26)'], t: ['#0E2726', '#23716D', 'rgba(96,235,235,.28)'] };
    const NAVP = {"os":"M3 7l9-4 9 4-9 4-9-4zM3 12l9 4 9-4M3 17l9 4 9-4","brain":"M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 3 5 3 3 0 0 0 5 1V4.5A2.5 2.5 0 0 0 9 4zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-3 5 3 3 0 0 1-5 1","users":"M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-4 3-6 7-6s7 2 7 6M17 3a4 4 0 0 1 0 8M22 21c0-3-1.5-5-4-6","plug":"M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0V8zM12 17v5","mcp":"M8 12h8M12 8v8M4 4h6v6H4zM14 14h6v6h-6z","ai":"M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z","flow":"M5 4h5v5H5zM14 15h5v5h-5zM7.5 9v3.5a2.5 2.5 0 0 0 2.5 2.5h4","chat":"M4 5h16v11H9l-5 4V5z","phone":"M5 3h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z","mega":"M3 10v4h3l7 4V6L6 10H3zM17 9a4 4 0 0 1 0 6","drip":"M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z","web":"M3 5h18v14H3zM3 9h18M7 7h.01","ticket":"M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 1 0-4V4H3v4zM14 4v16","apps":"M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z","book":"M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-7a3 3 0 0 0-3 3","chart":"M4 20V10M10 20V4M16 20v-7M22 20H2","eye":"M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z","target":"M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01","route":"M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 15V9a4 4 0 0 1 4-4h6M18 9v6a4 4 0 0 1-4 4H8","image":"M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15 9h.01","code":"M8 7l-5 5 5 5M16 7l5 5-5 5","heart":"M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z","cap":"M2 9l10-5 10 5-10 5-10-5zM6 11v5c3 2 9 2 12 0v-5","factory":"M3 21V10l6 4V10l6 4V6h6v15H3z","home":"M3 11l9-7 9 7v10H3zM9 21v-6h6v6","bed":"M3 18V7M3 13h18v5M21 18v-5a3 3 0 0 0-3-3h-7v3","star":"M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z","file":"M6 3h8l4 4v14H6zM14 3v4h4","play":"M5 4v16l14-8z","doc":"M4 4h16v16H4zM8 8h8M8 12h8M8 16h5","tool":"M14 6a4 4 0 0 0 5 5l-9 9a2 2 0 0 1-3-3l9-9a4 4 0 0 0-2-2z"}, NAVC = {"g":["linear-gradient(135deg,#CBE37B,#8DAF1F)","rgba(141,175,31,.6)"],"v":["linear-gradient(135deg,#180066,#6A4BD8)","rgba(106,75,216,.6)"],"b":["linear-gradient(135deg,#003B7D,#2F6FE4)","rgba(47,111,228,.6)"],"o":["linear-gradient(135deg,#7F4400,#EE7B30)","rgba(238,123,48,.6)"],"p":["linear-gradient(135deg,#630021,#E0487F)","rgba(224,72,127,.6)"],"t":["linear-gradient(135deg,#1D8683,#60EBEB)","rgba(96,235,235,.6)"]}, NAVM = {"Products":[["CORE","g",[["os","Customer OS","One connected system for your customer operations."],["brain","The Second Brain","Remembers tasks, context, people and next steps."],["users","Team Management","People, roles, access and collaboration."],["plug","Integrations","Connect the tools you already use."],["mcp","MCP","Connect Chatberry with AI and let it act."],["ai","AI Agents","AI that understands, decides and gets work done."],["flow","Workflow Orchestration","Design and automate processes end to end."]]],["ENGAGE","v",[["chat","Omnichannel","Every customer conversation in one place."],["phone","Voice Calling","Call customers right from Chatberry."],["mega","Campaigns","Templates, broadcasts and marketing campaigns."],["drip","Drip Marketing","Sequences that run on their own over time."],["web","Webviews","Interactive pages, forms and experiences."],["ticket","Ticketing","Turn requests into tracked, owned work."]]],["INTELLIGENCE","b",[["book","Knowledge Base","Give your AI and team the knowledge they need."],["chart","Analytics & BI","Turn business data into clear insights."],["eye","Business Score","See the bigger picture of your business."]]]],"Solutions":[["MARKETING","o",[["target","Lead Capture","Bring enquiries into your sales journey."],["mega","Campaign Management","Targeted campaigns for your audience."],["route","Customer Journeys","Guide customers through connected experiences."],["image","Media Management","Organise the media your campaigns use."]]],["SALES","g",[["ai","AI Lead Qualification","Find promising leads and prioritise them."],["chat","Lead Engagement","Timely, relevant conversations."],["phone","Voice Calling","Calls and voice conversations in one place."],["drip","Lead Nurturing","Follow-ups that move people to a decision."]]],["OPERATIONS","b",[["ticket","Ticket Management","Requests with clear owners."],["heart","Customer Support","Resolve issues faster."],["users","Team Collaboration","Shared context, notes and chats."],["chart","Analytics","Activity turned into insights."]]],["DEVELOPERS","v",[["flow","Workflow Development","Workflows built for your needs."],["code","Custom Solutions","Reusable solutions to deploy or sell."]]]],"Industries":[["","t",[["cap","Education","Schools, colleges and coaching."],["factory","Manufacturing & Distribution","Orders, dealers and dispatch."],["home","Real Estate","Site visits and follow-ups."],["bed","Hospitality","Bookings, stays and guest care."]]]],"Resources":[["LEARN","o",[["doc","Blogs","Ideas and how-tos."]]],["BUILD","b",[["plug","Integrations Hub","400+ connected apps."]]]]};
    const nk = st.navOpen;
    const navItems = ['Products', 'Solutions', 'Industries', 'Resources'].map(t => { const lk = t === 'Pricing' || t === 'Partner'; const on = nk === t; return { t, bgM: on ? '#EDEDED' : '#181814', fgM: on ? '#090909' : '#c7c7c7', bg: on ? '#1B1F0D' : 'transparent', fg: on ? '#D8F08C' : '#C4C4C0', chD: lk ? 'none' : 'block', rot: on ? '180deg' : '0deg', click: () => lk ? (location.href = t === 'Pricing' ? '/pages/pricing/page.html' : '/pages/partners/page.html') : this.setState({ navOpen: on ? null : t }) }; });
    const PAL = ['g', 'v', 'b', 'o', 'p', 't'], RAD = ['12px', '50%', '14px', '12px 18px 12px 18px', '10px'], ROT = ['0deg', '0deg', '-6deg', '0deg', '6deg'];
    const navCol = (NAVM[nk] || []).map((c, ci) => ({ h: c[0], hasH: !!c[0], items: c[2].map((it, ii) => { const pk = PAL[(PAL.indexOf(c[1]) + ii) % PAL.length], T = NTINT[pk], v = (ci * 2 + ii) % RAD.length, key = nk + ci + '-' + ii, hv = st.navHov === key; return { t: it[1], d: it[2], u: '/', p: NAVP[it[0]], g: NAVC[pk][0], sh: NAVC[pk][1], rad: RAD[v], rot: hv ? (parseFloat(ROT[v]) - 8) + 'deg' : ROT[v], ty: hv ? '-2px' : '0px', bg: hv ? 'radial-gradient(' + T[2].replace(/[\d.]+\)$/, '.28)') + ' 1px,transparent 1.5px) 0 0/9px 9px,linear-gradient(120deg,' + T[1] + '66,' + T[0] + ')' : 'transparent', ring: hv ? 'inset 0 0 0 1px ' + T[1] : 'none', fw: hv ? 650 : 500, dc: hv ? ({ g: '#D2EB7E', v: '#4B2FB8', b: '#1A4FB8', o: '#B5520F', p: '#B0215A', t: '#88F3F3' })[pk] : '#898984', on: () => this.setState({ navHov: key }), off: () => this.setState({ navHov: null }) }; }) }));
    // features
    const FB = '/pages/';
    const fD = [['Omnichannel', 'Bring customer conversations together across every channel.', 'products/omnichannel'], ['Voice Calling', 'Call customers and handle voice conversations from Chatberry.', 'products/voice-calling'], ['Campaigns', 'Create templates, broadcasts and marketing campaigns.', 'products/campaigns'], ['Ticketing', 'Turn customer requests into tracked, owned work.', 'products/ticketing'], ['Knowledge Base', 'Give your AI and teams the knowledge they need.', 'products/knowledge-base'], ['Analytics & BI', 'Turn business data into actionable insights.', 'products/analytics-bi']];
    const features = fD.map(([n, d, u], i) => ({ no: '0' + (i + 1), n, d, open: () => this.setState({ feature: i }) }));
    const F = st.feature != null ? fD[st.feature] : null;
    const lg = [['LivGastro', 'livgastro'], ['Spine Clinic', 'spine-clinic'], ['Arvachin Hospital', 'arvachin'], ['Lux Hospitals', 'lux-hospitals'], ['Pace Hospitals', 'pace-hospitals'], ['Shri Shyam Hospital', 'shri-shyam'], ['Nightingale Hospital', 'nightingale'], ['AIROC Hospitals', 'airoc']].map(([n, f]) => ({ n, src: IMG + 'clients/' + f + '.svg' }));
    const certs = [['Meta Tech Partner', 'meta'], ['MATH', 'math'], ['DPIIT Startup India', 'dpiit'], ['GDPR friendly', 'gdpr'], ['ISO 9001:2015', 'iso-9001'], ['ISO 27001', 'iso-27001']].map(([n, f]) => ({ n, src: IMG + 'certs/' + f + '.svg' }));
    const L = (t, u) => ({ t, u: u.startsWith('http') ? u : '/pages/' + u });
    const footCols = [
      { h: 'PRODUCT', l: [L('Customer OS', 'products/customer-os/page.html'), L('AI Agents', 'products/ai-agents/page.html'), L('Ticketing', 'products/ticketing/page.html'), L('Business Intelligence', 'products/analytics-bi/page.html')] },
      { h: 'SOLUTIONS', l: [L('Distribution', 'industries/manufacturing-distribution/page.html'), L('Hospitality', 'industries/hospitality/page.html'), L('Education', 'industries/education/page.html'), L('Real Estate', 'industries/real-estate/page.html')] },
      { h: 'RESOURCES', l: [L('Blogs', 'blog/page.html')] },
      { h: 'COMPANY', l: [L('Contact Us', 'https://wa.me/918147715267'), L('Partners', 'partners/page.html'), L('Book a Demo', 'https://wa.me/918147715267?text=Hi%20Chatberry%2C%20I%27d%20like%20to%20book%20a%20demo.')] }
    ];
    return {
      chaosFadeOp: st.hover != null && st.hp === 2 ? 0 : 1, measureRef: this.measure, carRef: this.carRef, carEnter: () => this.setState({ carHover: true }), carLeave: () => this.setState({ carHover: false }), k, heroH: st.wide ? 'max(440px, calc(100dvh - var(--navh, 58px)))' : 'auto', heroCols: st.wide ? 'minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,1fr)', heroVisMin: st.wide ? '0px' : st.mob ? '340px' : 'min(420px, 55vh)', hChaos: Math.round(580 * k), hOne: Math.round(600 * k), hLearn: Math.round(340 * k),
      showHeroOffer: P.showHeroOffer !== false && !st.mob, ctaRing: st.heroDone ? 1 : 0, ctaGlow: st.ctaStage ? '0 0 0 8px rgba(183,220,61,.16),0 18px 50px -8px rgba(37,211,102,.7)' : st.heroDone ? '0 0 0 6px rgba(183,220,61,.12),0 14px 40px -10px rgba(37,211,102,.55)' : '0 0 0 0 rgba(183,220,61,0)', ctaScale2: st.ctaStage ? 1.06 : 1,
      trustOp: st.ctaStage ? 0 : 1, ctaRowH: st.ctaStage ? '0px' : '220px', ctaRowO: st.ctaStage ? 0 : 1, ctaRowPE: st.ctaStage ? 'none' : 'auto', ctaRowM: st.ctaStage ? 'calc(-14px - clamp(14px,3vh,28px)) -14px -14px' : '-6px -14px -14px', ctaAreaH: st.ctaStage ? (st.mob ? '132px' : '170px') : (st.mob ? '40px' : '84px'), ctaPE: st.ctaStage ? 'auto' : 'none', ctaMeloOp: st.ctaStage ? 1 : 0, ctaMeloTf: st.ctaStage ? 'translate(0,0) scale(1)' : 'translate(220px,-40px) scale(.6)', ctaBubOp: st.ctaStage ? 1 : 0, ctaBubTf: st.ctaStage ? 'scale(1)' : 'scale(.85)', meloCta: this.melo(st.mob ? 56 : 72, st.ctaStage ? 'celebrate' : 'smile', [8, -3]),
      ...(() => { const pin = P.heroPose === 'base' ? 0 : P.heroPose && P.heroPose !== 'auto' ? (+P.heroPose.slice(-1) || -1) : -1; const cur = pin >= 0 ? pin : heroCur; const o = {};
        for (let i = 0; i <= 5; i++) { const d = i - cur; o['p' + i] = d === 0 ? { o: 1, t: 'translate(0,0) scale(1)', f: 'blur(0px)', pe: 'auto' } : d < 0 ? { o: 0, t: 'translate(-3%,-2%) scale(1.06)', f: 'blur(10px)', pe: 'none' } : { o: 0, t: 'translate(3%,4%) scale(.93)', f: 'blur(12px)', pe: 'none' }; }
        const AU = ['#7F4000', '#61761E', '#04286C', '#9B7B0A', '#670018', '#19005E'];
        const MF = ['hello', 'oh', 'think', 'squint', 'oh', 'love'];
        const mv = pin >= 0 || HS.ph === 'msg'; o.msgOp = mv ? 1 : 0; o.msgTf = mv ? 'translateY(0) scale(1)' : 'translateY(14px) scale(.97)'; o.msgFl = mv ? 'blur(0px)' : 'blur(4px)'; o.msgBg = TINT[cur][0]; o.msgBd = TINT[cur][1]; o.msgDot = TINT[cur][2];
        o.feelLine = ['Every decision, big or small, waits for you.', 'Customers are waiting. Nobody replied.', 'Every question still comes to you.', 'Tasks, sales, stock. You track it all yourself.', 'Nobody takes responsibility. It lands on you.', 'Step away for one day and things start falling apart.'][cur];
        o.poseKey = 'k' + cur; o.poseGlow = AU[cur]; o.meloAura = AU[cur];
        const done = !!st.heroDone && pin < 0;
        o.meloHero = this.melo(120, done ? 'smile' : MF[cur], done ? [6, 0] : cur === 1 ? [-6, 2] : cur === 4 ? [-8, 0] : null);
        o.meloL = done ? '2%' : 'calc(98% - 124px)'; o.meloLeave = st.ctaStage ? 'translate(-180px,-60px) scale(.6)' : ''; o.meloOp = st.ctaStage ? 0 : 1; o.demoOp = done ? 1 : 0; o.demoTf = done ? 'translateY(0) scale(1)' : 'translateY(16px) scale(.96)'; o.demoPE = done ? 'auto' : 'none';
        if (done) o.meloAura = '#61761E';
        o.personScale = 1 + cur * .006; return o; })(),
      heroPills, unread: [0, 12, 47, 98, 156, 231, 312, 312][hp],
      wins, fo, waChats, xlCells, gsCells, gmRows, igRows, phRows, switches: 12 + Math.floor(s / 2), chaosRef: this.chaosRef, foPrev: () => this.goWin(-1), foNext: () => this.goWin(1), chaosLeave: () => { this.pinned = false; clearTimeout(this.ht); clearTimeout(this.it); this.activeEl = null; this.cand = null; this.setState({ hover: null, hp: 0 }); }, chaosMove: e => { this.pt = [e.clientX, e.clientY]; if (this.cand && !this.inLock(this.pt)) { const c = this.cand; this.activate(c[0], c[1]); } },
      chips, coreOp: live ? 1 : 0, coreScale: live ? 1 : .3, meloCore: this.melo(110, coreFace, null, true),
      devOp: dev ? 1 : 0, devY: dev ? 0 : 40, dash: dev ? 0 : 520,
      msg1: p3 >= 4 && p3 < 10 ? 1 : 0, msg1Y: p3 >= 4 ? 0 : 10, typing: p3 === 5,
      msg2: p3 >= 6 && p3 < 10 ? 1 : 0, msg2Y: p3 >= 6 ? 0 : 10,
      meloChat: this.melo(18, 'think'), meloChat2: this.melo(18, p3 >= 6 ? 'smile' : 'hello'),
      newCard: p3 >= 7 && p3 < 10 ? 1 : 0, newCardY: p3 >= 7 ? 0 : -16, openN: p3 >= 7 && p3 < 10 ? 2 : 1,
      notif: p3 >= 8 && p3 < 10 ? 1 : 0, notifY: p3 >= 8 ? 0 : -12, notifS: p3 >= 8 ? 1 : .96, meloTeam: this.melo(30, p3 === 8 ? 'celebrate' : 'smile'),
      teamRows: [{ id: 'TK-202', t: 'Insurance papers', s: 'Open' }, { id: 'TK-201', t: 'Reschedule Dr. Rao', s: 'Doing' }, { id: 'TK-198', t: 'Billing query', s: 'Done' }],
      flowSteps: ['1 · Customer messages', '2 · Ticket raised', '3 · Team notified'].map((t, i) => ({ t, bg: i === fs ? '#090909' : 'transparent', fg: i === fs ? '#EDEDED' : 'rgba(9,9,9,.75)' })),
      sources, learning: p4 < 5, learned: p4 >= 5, learnPct: Math.min(p4 + 1, 5) * 20,
      meloLearn: this.melo(96, p4 < 5 ? 'think' : p4 === 5 ? 'celebrate' : 'smile'),
      rec: recs[ri], recNum: ri + 1, recDots: recs.map((_, i) => ({ bg: i === ri ? '#EDEDED' : '#30302B', w: i === ri ? 22 : 6 })),
      meloRec: this.melo(40, sub === 1 ? 'oh' : sub === 2 ? 'smile' : sub === 3 ? 'celebrate' : 'hello', sub === 1 ? [5, 3] : null),
      btnLabel: sub >= 2 ? 'Done ✓' : recs[ri].a, btnBg: sub >= 2 ? '#EDEDED' : '#090909', btnFg: sub >= 2 ? '#090909' : '#EDEDED', btnScale: sub === 2 ? .94 : 1, toastOp: sub >= 2 ? 1 : 0,
      curX: sub >= 1 ? 80 : 18, curY: sub >= 1 ? 74 : 18, curScale: sub === 2 ? .8 : 1,
      arcL: Math.round((st.carW || 1100) / 2 - 1600), arcX: k6 * (st.mob ? 252 : 380), industries: [...inds, ...inds].map((x, i) => { x.ctaN = st.mob ? '' : 'for ' + x.n; const d = i - k6 - ((st.carW || 1100) / 2 - (st.mob ? 116 : 180)) / (st.mob ? 252 : 380); const on = st.indHover === i; return Object.assign({}, x, { arc: 'translate3d(0,' + (st.mob ? 0 : Math.round(d * d * 16)) + 'px,0)', lift: on ? 'translate3d(0,-12px,0)' : 'translate3d(0,0,0)', sh: on ? '0 0 0 1px ' + x.ring + ',0 34px 60px -28px rgba(20,30,40,.35)' : '0 0 0 1px ' + x.ring, chipH: on ? '180px' : '0px', chipO: on ? 1 : 0, chipM: on ? '4px' : '-10px', enter: () => this.setState({ indHover: i }), leave: () => this.setState({ indHover: null }) }); }), carX: k6 * -(st.mob ? 252 : 380), carT: k6 === 0 ? 'none' : 'transform 1.2s cubic-bezier(.65,0,.35,1)',
      decks, cs, caseOpen: st.caseI != null, closeCase: () => this.setState({ caseI: null }),
      // the webinar card opens cal.com in a popup (a modified click or no JS still follows the link)
      webOpen: !!st.webOpen, openWebinar: e => { if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button)) return; e && e.preventDefault(); this.setState({ webOpen: true }); }, closeWebinar: () => this.setState({ webOpen: false }), proofPlay: st.proofHover || st.caseI != null ? 'paused' : 'running', proofEnter: () => this.setState({ proofHover: true }), proofLeave: () => this.setState({ proofHover: false }),
      ticketOp: p8 === 0 ? 0 : 1, ticketTf: tfs[p8], credits: ['₹0', '₹600', '₹1,500', '₹2,200', '₹2,500', '₹2,500', '₹2,500'][p8],
      offerRef: this.offerRef, creditRef: this.creditRef, offerMove: this.offerMove, offerLeave: this.offerLeave, meloCard: this.melo(64, 'love'), meloOffer: this.melo(96, p8 >= 1 && p8 <= 3 ? 'think' : p8 >= 4 ? 'love' : 'hello'),
      shineX: p8 >= 4 ? 120 : -30, shineT: p8 >= 4 ? 'left 1.1s ease-in-out' : 'none', ctaScale: s % 2 ? 1.04 : 1,
      gEnter: () => this.setState({ gHover: true }), gLeave: () => this.setState({ gHover: false }), guides, gX: gk * -(st.mob ? 286 : 360), gDots: [0, 1, 2, 3].map(i => ({ bg: i === gk ? '#EDEDED' : '#30302B', w: i === gk ? 22 : 6 })),
      guideOpen: !!st.guide, closeGuide: () => this.setState({ guide: null, guideI: null }), stop: e => e.stopPropagation(), gs, gSentV: !!st.gSent,
      meloSheet: this.melo(st.gSent ? 96 : 64, sheetFace, sheetFace === 'oh' ? [-8 + Math.min(len, 10) * 1.6, 4] : null),
      notSent: !st.gSent,
      sheetSub: st.gSent ? `We’ve sent it to ${cc[1]} ${fmtP(st.phone)}. Check your WhatsApp.` : st.gErr ? `That number looks short. It needs ${need} digits.` : 'Enter your WhatsApp number and we will send it there directly.',
      phoneFmt: fmtP(st.phone), phPh: cc[0] === 'IN' ? '98765 43210' : '0'.repeat(need).replace(/(\d{3})(?=\d)/g, '$1 '), lineC: st.gErr ? '#631C1C' : len === need ? '#25D366' : st.gFocus ? '#EDEDED' : '#272723', ringW: st.gFocus || st.gErr || len === need ? '2px' : '1px', okOp: len === need ? 1 : 0, gErrN: st.gErrN, shakeA: st.gErr ? 'shakeX .5s ease' : 'none',
      ccIso: cc[0], ccDial: cc[1], ccList: CC.map(c => ({ v: c[0], label: c[3] + ' (' + c[1] + ')', sel: c[0] === cc[0] })), onCc: e => this.setState({ cc: e.target.value, phone: '', gErr: false }),
      onPhone: e => this.setState({ phone: e.target.value.replace(/\D/g, '').slice(0, need), gErr: false }),
      onFocus: () => this.setState({ gFocus: true }), onBlur: () => this.setState({ gFocus: false }), onKey: e => { if (e.key === 'Enter') send(); },
      sendGuide: send, sendLabel: 'Send it to my WhatsApp', sendBg: len === need ? '#25D366' : '#EDEDED', sendFg: '#090909', sendSh: len === need ? '0 14px 30px -12px rgba(37,211,102,.7)' : '0 10px 24px -14px rgba(0,0,0,.5)', waFilter: 'brightness(0) invert(1)',
      bentoCols: st.mob ? 'none' : st.wide ? 'repeat(4,minmax(0,1fr))' : 'minmax(0,1fr)', bSpan2: st.wide ? 'span 2' : 'auto', bSpanR2: st.wide ? 'span 2' : 'auto', features, featureOpen: !!F, fName: F ? F[0] : '', fDesc: F ? F[1] : '', fUrl: F ? FB + F[2] + '/page.html' : '#', fNo: F ? '0' + (st.feature + 1) : '',
      closeFeature: () => this.setState({ feature: null }), meloFeature: this.melo(90, 'smile'),
      carPad: st.mob ? '4px 0 20px' : '24px 0 48px', g44: st.mob ? '20px' : '44px', g56: st.mob ? '24px' : '56px', offerMin: st.mob ? '0px' : 'calc(100dvh - var(--navh, 58px))', meloFinal: this.melo(st.mob ? 80 : 110, 'hello'), mob: !!st.mob, chaosH: st.mob ? 'auto' : 'calc(100dvh - var(--navh, 58px))', chaosMin: st.mob ? '0px' : '600px', bFlow: st.mob ? 'column' : 'row', bAutoCol: st.mob ? '76%' : 'auto', hOv: st.mob ? 'auto' : 'visible', hSnap: st.mob ? 'x mandatory' : 'none', hMar: st.mob ? '0 -20px' : '0', hPad: st.mob ? '4px 20px 16px' : '0', bGap: st.mob ? '12px' : '16px', fcCols: st.mob ? 'none' : 'repeat(auto-fit,minmax(min(100%,260px),1fr))', fcPad: st.mob ? '4px 20px 16px' : '20px 0 0', navRightD: st.mob ? 'none' : 'block', h1S: st.mob ? '34px' : 'clamp(40px,min(7vw,10vh),92px)', h1pS: st.mob ? '21px' : 'clamp(24px,min(3.6vw,5vh),46px)', heroGap: st.mob ? '10px' : 'clamp(14px,3vh,28px)', heroPb: st.mob ? '8px' : 'clamp(24px,6vh,88px)', cardGap: st.mob ? '10px' : '16px', cardPad: st.mob ? '12px 14px 12px 8px' : '16px 20px 16px 12px', claimFs: st.mob ? '14px' : '15px', claimPad: st.mob ? '10px 16px' : '12px 20px', navStripD: st.mob ? 'none' : 'flex', navBurger: () => this.setState({ navOpen: st.navOpen ? null : 'Products' }), burgerBg: st.navOpen ? '#1B1F0D' : '#181814', burgerLbl: st.navOpen ? 'Close' : 'Menu', burgerPath: st.navOpen ? 'M4 4 L12 12 M12 4 L4 12' : 'M2 4 H14 M2 8 H14 M2 12 H14', pillW: st.mob ? '62%' : 'min(42%,284px)', pillMin: st.mob ? '0px' : '220px', pillS: st.mob ? .86 : 1, pillO: st.mob ? 'top center' : 'center', demoL: st.mob ? '4%' : 'calc(2% + 128px)', demoW: st.mob ? '78%' : 'min(60%,340px)', msgW: st.mob ? '72%' : 'min(68%,380px)', indCta: 'See how it works', indW: st.mob ? '232px' : '360px', indImgH: st.mob ? '120px' : '210px', arcD: st.mob ? 'none' : 'block', pcW: st.mob ? '260px' : '340px', pcH: st.mob ? '400px' : '480px', csVidH: st.caseI != null && deckD[st.caseI].tall ? (st.mob ? '62vh' : 'min(640px,74vh)') : st.mob ? '200px' : '360px', gW: st.mob ? '270px' : '340px', aiActD: st.mob ? 'none' : 'block', aiPanelH: st.mob ? '230px' : '420px', bAlign: st.mob ? 'start' : 'stretch', footAuto: st.mob ? '46%' : 'auto', navTabFlex: st.mob ? '1 1 auto' : '0 1 auto', fcL: st.wide ? 'translateY(26px) rotate(-2.5deg)' : 'none', fcM: 'none', fcR: st.wide ? 'translateY(26px) rotate(2.5deg)' : 'none', navItems, navCol, navCols: nk === 'Industries' ? 'repeat(auto-fill,minmax(min(100%,260px),1fr))' : 'repeat(auto-fit,minmax(min(100%,230px),1fr))', navO: nk ? 1 : 0, navPY: nk ? '0px' : '-8px', navPE: nk ? 'auto' : 'none', navBdO: nk ? 1 : 0, navBdPE: nk ? 'auto' : 'none', navTabR: nk ? '16px 16px 0 0' : '16px', navTabRi: nk ? '14.5px 14.5px 0 0' : '14.5px', navTabSh: nk ? 'none' : '0 18px 40px -22px rgba(34,40,14,.35)', navTabPad: nk ? '1.5px 1.5px 0' : '1.5px', navTabPb: nk ? '16px' : '0px', navTabMb: nk ? '-3px' : '0px', navTabBg: nk ? 'transparent' : 'rgba(9,9,9,.9)', navBrd: nk ? 'transparent' : 'rgba(10,10,12,.1)', navPath: st.navPath || '', navSvgH: (st.navSvgH || 0) + 'px', navWrapRef: el => { this.navWrapEl = el; }, navTabRef: el => { this.navTabEl = el; }, navPanelRef: el => { this.navPanelEl = el; }, navY: st.navHidden && !nk ? '-120%' : '0', navClose: () => this.setState({ navOpen: null }), logos: [...lg, ...lg], certs, footCols
    };
  }
}
Homepage.template = 'tpl-home';

const start = () => { try { WM.mount(Homepage, document.getElementById('app'), {}); } catch (e) { console.error('[wm] mount failed', e); } };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
