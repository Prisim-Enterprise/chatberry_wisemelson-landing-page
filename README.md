# Chatberry landing page

Marketing site for **Chatberry**, product by Prisim. Plain HTML, CSS and JavaScript: no build step, no dependencies.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FPrisim-Enterprise%2Fchatberry_wisemelson-landing-page)

## Deploy on Vercel

Click the button above, or in Vercel choose **Add New → Project** and import this repository. Leave every setting as it is; `vercel.json` already tells Vercel what to do:

- no install or build command
- publish the whole repository folder (not just `public/`)
- `404.html` for unknown addresses
- `/pages/<name>/` opens `/pages/<name>/page.html`

Every push to `main` redeploys the site.

## After the first deploy

Set the site's final address so link previews (WhatsApp, LinkedIn) and the Google sitemap work:

```
node scripts/set-site-url.cjs https://your-final-address
git add -A && git commit -m "Set site URL" && git push
```

## Run locally

```
npx serve -l 4321 .
```

Then open http://localhost:4321.

## Where things are

| Path | What it is |
| --- | --- |
| `index.html`, `home/` | Home page |
| `nav/nav.js` | Top menu, shared by every page |
| `pages/` | Product, solution, industry, blog and legal pages |
| `public/assets/`, `assets/` | Images, icons and share images |
| `scripts/set-site-url.cjs` | Adds the site address to every page and writes `sitemap.xml` |

All enquiries (demo, contact, guides, partners) open a WhatsApp chat to +91 81477 15267.
