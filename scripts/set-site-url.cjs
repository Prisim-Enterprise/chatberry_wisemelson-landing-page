#!/usr/bin/env node
// Set the public web address of the site once it is deployed.
//
//   node scripts/set-site-url.cjs https://your-address.example
//
// Adds to every page: the canonical link, og:url, the share image (og:image / twitter:image)
// and structured data for Google (Organization, WebSite, SoftwareApplication, BreadcrumbList,
// FAQPage and BlogPosting). Also writes sitemap.xml and robots.txt.
// Safe to run again with a new address: it replaces what it added before.
// Run it again after `node scripts/site/build.cjs`, because the build rewrites the pages.
const fs = require('fs'), path = require('path');

const arg = (process.argv[2] || '').trim().replace(/\/+$/, '');
if (!/^https?:\/\/[^/]+(\/.*)?$/.test(arg)) {
  console.error('Usage: node scripts/set-site-url.cjs https://your-address.example');
  process.exit(1);
}
const SITE = arg;
const root = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['archive', 'node_modules', '.git', '.vercel', 'scripts', 'public', 'assets']);
const NOT_LISTED = ['coming-soon/'];
const WA = 'https://wa.me/918147715267';

const pages = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) { if (!SKIP_DIRS.has(name)) walk(p); }
    else if (name.endsWith('.html')) pages.push(path.relative(root, p).split(path.sep).join('/'));
  }
})(root);

const text = s => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&rsquo;|&#39;/g, '’').replace(/&quot;/g, '"').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
const ld = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const ORG = { '@type': 'Organization', '@id': SITE + '/#org', name: 'Prisim', url: 'https://www.prisim.co.in/', logo: SITE + '/assets/icon-512.png', contactPoint: { '@type': 'ContactPoint', contactType: 'sales', telephone: '+91-81477-15267', url: WA, availableLanguage: ['en', 'hi'] } };

const today = new Date().toISOString().slice(0, 10);
const listed = [];
for (const rel of pages) {
  if (rel === '404.html') continue;
  const file = path.join(root, rel);
  let s = fs.readFileSync(file, 'utf8');
  const route = rel === 'index.html' ? '/' : '/' + rel.replace(/index\.html$/, '');
  const url = SITE + route;
  const img = SITE + '/public/assets/img/' + (rel.startsWith('blog/') ? 'og-blog.png' : 'og-site.png');

  // remove what an earlier run added
  s = s.replace(/\n?<!-- site-url -->[\s\S]*?<!-- \/site-url -->/g, '');

  const title = text((s.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
  const desc = (s.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const name = title.replace(/\s*[|–]\s*Chatberry$/, '').replace(/^Chatberry\s*–\s*/, '');
  const data = [];

  if (route === '/') {
    data.push({ '@context': 'https://schema.org', '@graph': [
      ORG,
      { '@type': 'WebSite', '@id': SITE + '/#site', name: 'Chatberry', url: SITE + '/', publisher: { '@id': SITE + '/#org' }, inLanguage: 'en-IN' },
      { '@type': 'SoftwareApplication', name: 'Chatberry', url: SITE + '/', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', description: desc, image: img, provider: { '@id': SITE + '/#org' } },
    ] });
  } else {
    const parts = route.split('/').filter(Boolean);
    const crumbs = [{ name: 'Home', url: SITE + '/' }];
    const label = { products: 'Products', solutions: 'Solutions', industries: 'Industries', blog: 'Blog', topic: 'Topics' };
    let acc = '';
    parts.forEach((p, i) => {
      acc += '/' + p;
      const last = i === parts.length - 1;
      // group folders (products, solutions, industries, topic) have no page of their own
      if (!last && !['blog'].includes(p)) return;
      crumbs.push({ name: last ? name : (label[p] || p), url: SITE + acc + '/' });
    });
    data.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })) });
  }

  const faqs = [...s.matchAll(/<details><summary>([\s\S]*?)<i><\/i><\/summary><p>([\s\S]*?)<\/p><\/details>/g)];
  if (faqs.length) data.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(m => ({ '@type': 'Question', name: text(m[1]), acceptedAnswer: { '@type': 'Answer', text: text(m[2]) } })) });

  const pub = (s.match(/<time datetime="([^"]+)"/) || [])[1];
  if (rel.startsWith('blog/') && pub && !rel.startsWith('blog/topic/')) {
    const h1 = text((s.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || name);
    data.push({ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: h1, description: desc, image: img, datePublished: pub, dateModified: pub, mainEntityOfPage: url, author: { '@type': 'Organization', name: 'Chatberry Team', url: SITE + '/' }, publisher: ORG, inLanguage: 'en-IN' });
  }

  const tags = [
    '<!-- site-url -->',
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${img}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta name="twitter:image" content="${img}">`,
    ...data.map(ld),
    '<!-- /site-url -->',
  ].join('\n');
  s = s.replace('</head>', tags + '\n</head>');
  fs.writeFileSync(file, s);

  const noindex = /<meta name="robots" content="[^"]*noindex/.test(s);
  if (!noindex && !NOT_LISTED.some(d => rel.startsWith(d))) listed.push(url);
}

// feed links need full addresses too
const feedFile = path.join(root, 'blog', 'feed.xml');
if (fs.existsSync(feedFile)) {
  fs.writeFileSync(feedFile, fs.readFileSync(feedFile, 'utf8').replace(/<(link|guid)>(?:https?:\/\/[^/<]+)?(\/[^<]*)<\/\1>/g, (m, t, p) => `<${t}>${SITE}${p}</${t}>`));
}

listed.sort((a, b) => a.length - b.length || a.localeCompare(b));
fs.writeFileSync(path.join(root, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  listed.map(u => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') + '\n</urlset>\n');
fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`Updated ${pages.length} pages for ${SITE}; sitemap lists ${listed.length} pages.`);
