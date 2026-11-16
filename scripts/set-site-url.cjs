#!/usr/bin/env node
// Set the public web address of the site once it is deployed.
//
//   node scripts/set-site-url.cjs https://your-address.example
//
// Adds to every page: the canonical link, og:url, and the share image (og:image / twitter:image)
// used by WhatsApp, LinkedIn, X and Google. Also writes sitemap.xml and robots.txt.
// Safe to run again with a new address: it replaces what it added before.
const fs = require('fs'), path = require('path');

const arg = (process.argv[2] || '').trim().replace(/\/+$/, '');
if (!/^https?:\/\/[^/]+(\/.*)?$/.test(arg)) {
  console.error('Usage: node scripts/set-site-url.cjs https://your-address.example');
  process.exit(1);
}
const SITE = arg;
const root = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['archive', 'node_modules', '.git', 'scripts', 'public', 'assets']);
const NOT_LISTED = ['pages/coming-soon/'];

const pages = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) { if (!SKIP_DIRS.has(name)) walk(p); }
    else if (name.endsWith('.html')) pages.push(path.relative(root, p).split(path.sep).join('/'));
  }
})(root);

const today = new Date().toISOString().slice(0, 10);
const listed = [];
for (const rel of pages) {
  if (rel === '404.html') continue;
  const file = path.join(root, rel);
  let s = fs.readFileSync(file, 'utf8');
  const url = SITE + (rel === 'index.html' ? '/' : '/' + rel);
  const img = SITE + '/public/assets/img/' + (rel.startsWith('pages/blog/') ? 'og-blog.png' : 'og-site.png');

  // remove what an earlier run added
  s = s.replace(/\n?<!-- site-url -->[\s\S]*?<!-- \/site-url -->/g, '');
  const tags = [
    '<!-- site-url -->',
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${img}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta name="twitter:image" content="${img}">`,
    '<!-- /site-url -->',
  ].join('\n');
  s = s.replace('</head>', tags + '\n</head>');
  fs.writeFileSync(file, s);

  const noindex = /<meta name="robots" content="[^"]*noindex/.test(s);
  if (!noindex && !NOT_LISTED.some(d => rel.startsWith(d))) listed.push(url);
}

listed.sort((a, b) => a.length - b.length || a.localeCompare(b));
fs.writeFileSync(path.join(root, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  listed.map(u => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') + '\n</urlset>\n');
fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /pages/coming-soon/\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`Updated ${pages.length} pages for ${SITE}; sitemap lists ${listed.length} pages.`);
