/*
 * wm-runtime.js — tiny dependency-free renderer used by main.js.
 *
 * Templates live in <template> tags in index.html and use {{ path }} holes,
 * <template data-sc="for" list="{{ items }}" as="item"> loops and
 * <template data-sc="if" value="{{ flag }}"> conditionals.
 * Each section's logic is a class extending WM.Component:
 *   - state / setState(partial | fn) / forceUpdate()
 *   - renderVals() returns the values the template reads
 *   - componentDidMount / componentDidUpdate / componentWillUnmount
 * On every state change the template is re-rendered to a light virtual tree
 * and patched into the DOM (only changed attributes/styles/text are touched).
 */
(function () {
  'use strict';
  const SVG = 'http://www.w3.org/2000/svg';
  const UNITLESS = new Set(['opacity', 'zIndex', 'flex', 'flexGrow', 'flexShrink', 'fontWeight', 'lineHeight', 'order', 'zoom', 'scale', 'gridRow', 'gridColumn', 'aspectRatio', 'animationIterationCount', 'fillOpacity', 'strokeOpacity', 'strokeWidth', 'columnCount']);
  const PSEUDO = { 'style-hover': [':hover', 'data-ps-h'], 'style-active': [':active', 'data-ps-a'], 'style-focus': [':focus', 'data-ps-f'], 'style-before': ['::before', 'data-ps-b'], 'style-after': ['::after', 'data-ps-af'] };
  const kebab = s => s.startsWith('--') ? s : s.replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^(webkit|moz|ms)-/, '-$1-');

  // ---------- pseudo-state stylesheet ----------
  let sheet = null; const psCache = new Map(); let psN = 0;
  function splitDecls(str) {
    const out = []; let depth = 0, q = '', cur = '';
    for (const ch of str) {
      if (q) { if (ch === q) q = ''; cur += ch; continue; }
      if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
      if (ch === '(') depth++; else if (ch === ')') depth--;
      if (ch === ';' && depth === 0) { if (cur.trim()) out.push(cur); cur = ''; continue; }
      cur += ch;
    }
    if (cur.trim()) out.push(cur);
    return out;
  }
  function pseudoId(kind, css) {
    const k = kind + '|' + css; if (psCache.has(k)) return psCache.get(k);
    const id = String(++psN); psCache.set(k, id);
    if (!sheet) { const el = document.createElement('style'); el.id = 'wm-pseudo'; document.head.appendChild(el); sheet = el.sheet; }
    const [sel, attr] = PSEUDO[kind];
    const body = splitDecls(css).map(d => /!important\s*$/.test(d) ? d : d + ' !important').join(';');
    try { sheet.insertRule('[' + attr + '="' + id + '"]' + sel + '{' + body + '}', sheet.cssRules.length); } catch (e) { console.warn('[wm] bad pseudo css', css); }
    return id;
  }

  // ---------- template compile ----------
  const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  function parts(str) {
    const p = []; let last = 0, m; HOLE.lastIndex = 0;
    while ((m = HOLE.exec(str))) { if (m.index > last) p.push(str.slice(last, m.index)); p.push({ p: m[1] }); last = HOLE.lastIndex; }
    if (last < str.length) p.push(str.slice(last));
    return p;
  }
  const isWhole = ps => ps.length === 1 && typeof ps[0] === 'object';
  function compileNodes(nodes) {
    const out = [];
    for (const n of nodes) {
      if (n.nodeType === 3) {
        const v = n.nodeValue; if (!v.trim() && v.includes('\n')) continue;
        out.push(v.includes('{{') ? { k: 't', ps: parts(v) } : { k: 's', v });
      } else if (n.nodeType === 1) {
        const tag = n.localName, sc = n.getAttribute && n.getAttribute('data-sc');
        const kids = compileNodes((n.content || n).childNodes);
        if (tag === 'template' && sc === 'for') out.push({ k: 'for', list: parts(n.getAttribute('list') || ''), as: n.getAttribute('as') || 'item', kids });
        else if (tag === 'template' && sc === 'if') out.push({ k: 'if', val: parts(n.getAttribute('value') || ''), kids });
        else if (tag === 'template' && sc === 'import') {
          const attrs = []; for (const a of n.attributes) if (!/^(name|data-sc|hint-)/.test(a.name)) attrs.push({ n: a.name, ps: parts(a.value) });
          out.push({ k: 'imp', name: n.getAttribute('name'), attrs });
        } else {
          const attrs = []; for (const a of n.attributes) if (!a.name.startsWith('hint-')) attrs.push({ n: a.name, ps: parts(a.value), st: !a.value.includes('{{') });
          out.push({ k: 'el', tag, ns: n.namespaceURI === SVG ? SVG : null, attrs, kids });
        }
      }
    }
    return out;
  }

  // ---------- evaluation ----------
  function look(path, scope) {
    if (path === 'true') return true; if (path === 'false') return false; if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return +path;
    if (/^(['"]).*\1$/.test(path)) return path.slice(1, -1);
    const segs = path.split('.'); let v = segs[0] in scope ? scope[segs[0]] : undefined;
    for (let i = 1; i < segs.length && v != null; i++) v = v[segs[i]];
    return v;
  }
  function evalParts(ps, scope) {
    if (isWhole(ps)) return look(ps[0].p, scope);
    let s = ''; for (const p of ps) { if (typeof p === 'string') s += p; else { const v = look(p.p, scope); if (v != null && v !== false) s += v; } }
    return s;
  }
  function renderNodes(descs, scope, out, ctx) {
    for (const d of descs) {
      if (d.k === 's') out.push({ t: '#', v: d.v });
      else if (d.k === 't') {
        for (const p of d.ps) {
          if (typeof p === 'string') { out.push({ t: '#', v: p }); continue; }
          pushVal(look(p.p, scope), out);
        }
      } else if (d.k === 'for') {
        const list = evalParts(d.list, scope);
        if (list && list.length) for (let i = 0; i < list.length; i++) { const sc = Object.create(scope); sc[d.as] = list[i]; sc.$index = i; renderNodes(d.kids, sc, out, ctx); }
      } else if (d.k === 'if') { if (evalParts(d.val, scope)) renderNodes(d.kids, scope, out, ctx); }
      else if (d.k === 'imp') {
        const C = WM.registry[d.name]; if (!C) { console.warn('[wm] unknown component', d.name); continue; }
        const props = {}; for (const a of d.attrs) props[a.n.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = evalParts(a.ps, scope);
        out.push({ t: C, a: props });
      } else {
        const a = {};
        for (const at of d.attrs) a[at.n] = at.st ? at.ps.join('') : evalParts(at.ps, scope);
        const c = []; renderNodes(d.kids, scope, c, ctx);
        out.push({ t: d.tag, ns: d.ns, a, c });
      }
    }
  }
  function pushVal(v, out) {
    if (v == null || v === false || v === true) return;
    if (Array.isArray(v)) { for (const x of v) pushVal(x, out); return; }
    if (typeof v === 'object' && v.t) { out.push(v); return; }
    out.push({ t: '#', v: String(v) });
  }

  // ---------- h() for logic-built nodes ----------
  function h(tag, props, ...kids) {
    const a = Object.assign({}, props || {}); delete a.key;
    if (a.className) { a.class = a.className; delete a.className; }
    const c = []; for (const k of kids.flat(Infinity)) pushVal(k, c);
    return { t: tag, ns: tag === 'svg' ? SVG : null, a, c, h: true };
  }
  const createRef = () => ({ current: null });

  // ---------- DOM patching ----------
  function styleObjToCss(o) { let s = ''; for (const k in o) { const v = o[k]; if (v == null || v === '') continue; s += kebab(k) + ':' + (typeof v === 'number' && v !== 0 && !UNITLESS.has(k) ? v + 'px' : v) + ';'; } return s; }
  function setRef(r, el) { if (!r) return; if (typeof r === 'function') r(el); else if (typeof r === 'object') r.current = el; }
  function setAttr(el, name, v, old, isNew) {
    if (name === 'ref' || name === 'children') return;
    if (name === 'style') {
      const css = v && typeof v === 'object' ? styleObjToCss(v) : (v || '');
      if (isNew || css !== el.__wmCss) { el.style.cssText = css; el.__wmCss = css; }
      return;
    }
    if (PSEUDO[name]) { const attr = PSEUDO[name][1]; if (v) el.setAttribute(attr, pseudoId(name, v)); else el.removeAttribute(attr); return; }
    if (name.length > 2 && name[0] === 'o' && name[1] === 'n' && (typeof v === 'function' || typeof old === 'function' || v == null)) {
      let ev = name.toLowerCase();
      if (ev === 'onchange' && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) ev = 'oninput';
      if (ev === 'ondoubleclick') ev = 'ondblclick';
      el[ev] = typeof v === 'function' ? v : null; return;
    }
    if (name === 'value' && 'value' in el && el.tagName !== 'BUTTON' && el.tagName !== 'LI') { const s = v == null ? '' : String(v); if (el.value !== s) el.value = s; if (el.tagName !== 'OPTION') return; }
    if ((name === 'selected' || name === 'checked' || name === 'muted') && name in el && typeof v !== 'string') { el[name] = !!v; }
    if (name === 'draggable' && typeof v === 'boolean') { el.setAttribute('draggable', String(v)); return; }
    if (name === 'className') name = 'class'; else if (name === 'htmlFor') name = 'for';
    if (v == null || v === false) el.removeAttribute(name);
    else el.setAttribute(name, v === true ? '' : typeof v === 'function' ? '' : String(v));
  }
  function create(vn, ns) {
    if (vn.t === '#') return (vn.el = document.createTextNode(vn.v));
    if (typeof vn.t === 'function') {
      const host = document.createElement('div'); host.style.display = 'contents'; host.setAttribute('data-wm-component', vn.t.name);
      vn.el = host; vn.inst = new vn.t(vn.a); vn.inst._attach(host); return host;
    }
    const cns = vn.ns || (vn.t === 'svg' ? SVG : ns);
    const el = vn.el = cns ? document.createElementNS(cns, vn.t) : document.createElement(vn.t);
    for (const k in vn.a) setAttr(el, k, vn.a[k], undefined, true);
    for (const c of vn.c) el.appendChild(create(c, vn.t === 'foreignObject' ? null : cns));
    if (vn.a.ref) setRef(vn.a.ref, el);
    return el;
  }
  function destroy(vn) {
    if (!vn) return;
    if (vn.inst) { vn.inst._detach(); return; }
    if (vn.c) for (const c of vn.c) destroy(c);
    if (vn.a && vn.a.ref) setRef(vn.a.ref, null);
  }
  const same = (o, n) => o.t === n.t && (o.t !== '#' || true);
  function update(o, n, ns) {
    const el = n.el = o.el;
    if (n.t === '#') { if (o.v !== n.v) el.nodeValue = n.v; return; }
    if (typeof n.t === 'function') {
      n.inst = o.inst; const pa = o.a, na = n.a; let changed = false;
      for (const k in na) if (na[k] !== pa[k]) changed = true; for (const k in pa) if (!(k in na)) changed = true;
      if (changed) { const prev = n.inst.props; n.inst.props = na; n.inst._render(prev, n.inst.state); }
      return;
    }
    const cns = n.ns || (n.t === 'svg' ? SVG : ns);
    const oa = o.a, na = n.a;
    for (const k in na) if (na[k] !== oa[k] || k === 'value') setAttr(el, k, na[k], oa[k], false);
    for (const k in oa) if (!(k in na)) setAttr(el, k, null, oa[k], false);
    if (na.ref !== oa.ref) { if (oa.ref && typeof oa.ref === 'object') setRef(oa.ref, null); setRef(na.ref, el); }
    patchChildren(el, o.c, n.c, n.t === 'foreignObject' ? null : cns);
  }
  function patchChildren(parent, oc, nc, ns) {
    const len = Math.max(oc.length, nc.length);
    for (let i = 0; i < len; i++) {
      const o = oc[i], n = nc[i];
      if (!n) { parent.removeChild(o.el); destroy(o); }
      else if (!o) parent.appendChild(create(n, ns));
      else if (same(o, n)) update(o, n, ns);
      else { const el = create(n, ns); parent.replaceChild(el, o.el); destroy(o); }
    }
  }

  // ---------- Component ----------
  const tplCache = {}; const mountQ = [];
  function getTpl(id) {
    if (tplCache[id]) return tplCache[id];
    const t = document.getElementById(id); if (!t) throw new Error('[wm] missing <template id="' + id + '">');
    return (tplCache[id] = compileNodes(t.content.childNodes));
  }
  class Component {
    constructor(props) { this.props = props || {}; this.state = {}; this._q = []; this._sched = false; this._vn = []; this._mounted = false; }
    setState(u, cb) { this._q.push([u, cb]); this._schedule(); }
    forceUpdate(cb) { this._q.push([null, cb]); this._schedule(); }
    _schedule() { if (this._sched || !this._host) return; this._sched = true; queueMicrotask(() => this._flush()); }
    _flush() {
      this._sched = false; if (!this._host) return;
      const prevState = this.state, q = this._q; this._q = []; let st = this.state; const cbs = [];
      for (const [u, cb] of q) { if (u) { const p = typeof u === 'function' ? u(st, this.props) : u; if (p) st = Object.assign({}, st, p); } if (cb) cbs.push(cb); }
      this.state = st; this._render(this.props, prevState); cbs.forEach(f => f.call(this));
    }
    _attach(host) { this._host = host; this._render(this.props, this.state); }
    _detach() { if (this.componentWillUnmount) this.componentWillUnmount(); for (const v of this._vn) destroy(v); this._host = null; }
    _render(prevProps, prevState) {
      const now = performance.now(); if (!this._rc || now - this._rt > 1000) { this._rc = 0; this._rt = now; }
      if (++this._rc > 240) { if (!this._warned) { this._warned = true; console.error('[wm] render loop in', this.constructor.name, 'changed state keys:', Object.keys(this.state).filter(k => this.state[k] !== prevState[k])); } return; }
      const vals = this.renderVals ? this.renderVals() || {} : {};
      const scope = Object.assign(Object.create(null), this.props, vals);
      const out = []; renderNodes(getTpl(this.constructor.template), scope, out, this);
      patchChildren(this._host, this._vn, out, null); this._vn = out;
      if (!this._mounted) { this._mounted = true; if (this.componentDidMount) mountQ.push(this); }
      else if (this.componentDidUpdate) this.componentDidUpdate(prevProps, prevState);
      if (!this._host.isConnected) return;
      while (mountQ.length) { const c = mountQ.shift(); if (c._host) c.componentDidMount(); }
    }
  }
  function mount(C, host, props) { const inst = new C(props || {}); inst._attach(host); return inst; }

  window.WM = { Component, h, createRef, mount, registry: {} };
})();
