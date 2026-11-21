# Chatberry landing page

Marketing site for **Chatberry**, product by Prisim. Plain HTML, CSS and JavaScript: no build step, no dependencies.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FPrisim-Enterprise%2Fchatberry_wisemelson-landing-page)

## Deploy on Vercel

Click the button above, or in Vercel choose **Add New → Project** and import this repository. Leave every setting as it is; `vercel.json` already tells Vercel what to do:

- no install or build command
- publish the whole repository folder (not just `public/`)
- `404.html` for unknown addresses
- clean addresses ending in `/`, such as `/products/customer-os/`
- old `/pages/...` addresses redirect to the new ones

Every push to `main` redeploys the site.

## After the first deploy

Set the site's final address. This adds canonical links, link previews (WhatsApp, LinkedIn), structured data for Google, `sitemap.xml` and the Sitemap line in `robots.txt`:

```
node scripts/set-site-url.cjs https://your-final-address
git add -A && git commit -m "Set site URL" && git push
```

Then add the site to [Google Search Console](https://search.google.com/search-console) and submit `https://your-final-address/sitemap.xml`.

## Run locally

```
npx serve -l 4321 .
```

Then open http://localhost:4321.

## Where things are

| Path | What it is |
| --- | --- |
| `index.html` | Home page (written by hand) |
| `assets/site.css`, `assets/site.js` | Shared design and interactions for every page |
| `scripts/site/content.cjs` | Text for every product, solution, industry and partner page |
| `scripts/site/seo.cjs` | Google titles, descriptions and heading keywords for those pages |
| `scripts/site/build.cjs` | Builds the pages below from the content files |
| `products/`, `solutions/`, `industries/`, `partners/`, `blog/`, `coming-soon/` | Generated pages; don't edit these by hand |
| `privacy-policy/`, `terms-of-service/` | Legal pages. Edit the text inside `<article>` directly; the build keeps it |
| `assets/` | Logo, icons and favicons |
| `public/assets/img/` | Share images for link previews |
| `scripts/set-site-url.cjs` | Adds the site address, share tags and structured data to every page, and writes `sitemap.xml` |

## Changing page text

1. Edit `scripts/site/content.cjs` for page text, `scripts/site/seo.cjs` for Google titles and descriptions, `build.cjs` for the blog post, or the legal pages directly.
2. Run `node scripts/site/build.cjs`.
3. Commit and push. Vercel redeploys automatically.

If you've already run `set-site-url.cjs`, run it again after building, because the build rewrites the pages.

All enquiries (demo, contact, guides, partners) open a WhatsApp chat to +91 81477 15267.
