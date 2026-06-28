# Mengedoht CNC — Site Overview

A complete reference for how this website is built and how everything connects.

---

## What the Site Does

This is the website for **Mengedoht CNC**, a precision CNC manufacturing shop in North Charleston, SC. It serves three types of customers:

- **Retail buyers** — individuals who want to buy a finished product (e.g. cooler chocks, dashboards)
- **Custom order customers** — anyone who needs a one-off part designed and cut
- **Wholesale buyers** — retailers and distributors who want production runs

The site handles lead generation (contact/quote forms), direct retail checkout (via Stripe), and wholesale inquiries. It is live at `https://mengedohtcnc.com`.

---

## Tech Stack

| Layer | What's Used |
|---|---|
| Frontend | Plain HTML, CSS, JavaScript — no framework, no build step |
| Styling | Single `style.css` shared across all pages |
| JavaScript | Single `main.js` shared across all pages |
| Content | JSON files in `_data/`, fetched at runtime by `main.js` |
| CMS | Decap CMS at `/admin/` — edits files directly on GitHub |
| CMS Auth | Cloudflare Worker at `cms-auth.hankmengedoht.workers.dev` |
| Hosting | Cloudflare Pages, auto-deployed from the `main` branch |
| Repo | `hankmengedoht-hue/MengedohtCNC` on GitHub |
| Payments | Stripe — direct payment links stored per product |
| Review Submissions | Cloudflare Worker at `review.hankmengedoht.workers.dev` |
| Analytics | Google Analytics (gtag `G-NPC4T6X6HY`) |
| Fonts | Barlow Condensed + Barlow (Google Fonts) |

---

## File & Folder Structure

```
/
├── index.html                  Homepage
├── products.html               Full product grid
├── product.html                Single product detail (URL: ?id=slug)
├── custom-parts.html           Custom parts inquiry page
├── wholesale.html              Wholesale info + product grid
├── retail.html                 Retail shop
├── gallery.html                Photo gallery
├── about.html                  Founder / about page
├── contact.html                Contact form
├── success.html                Shown after any form is submitted
├── bulk-import.html            Admin tool for bulk product import
│
├── style.css                   All styles for all pages
├── main.js                     All JavaScript for all pages
├── review-worker.js            Source for the review submission Cloudflare Worker
│
├── _data/
│   ├── products/
│   │   ├── manifest.json       List of all product filenames
│   │   └── *.json              One file per product
│   ├── reviews/
│   │   ├── manifest.json       List of all review filenames
│   │   └── *.json              One file per review
│   ├── gallery/
│   │   ├── manifest.json
│   │   └── *.json
│   ├── shop-photos/
│   │   ├── manifest.json
│   │   └── *.json
│   ├── custom-parts-examples/
│   │   ├── manifest.json
│   │   └── *.json
│   ├── pages/
│   │   ├── home.json           Homepage copy (headline, CTA, hero photo)
│   │   ├── wholesale.json      Wholesale page copy
│   │   ├── retail.json         Retail page copy
│   │   ├── settings.json       Global settings (email, footer tagline, materials list)
│   │   └── category-images.json  Photos for the homepage category grid
│   └── founder.json            Founder photo path
│
├── images/
│   └── uploads/                All uploaded images (CMS, reviews, products)
│
├── admin/
│   ├── index.html              Decap CMS entry point
│   └── config.yml              CMS configuration (all collections, all fields)
│
├── .github/
│   └── workflows/
│       ├── update-manifest.yml   Auto-rebuilds manifests when _data/ changes
│       └── rename-gallery.yml    One-time utility for renaming gallery files
│
├── favicon.ico                 Multi-size favicon (16/32/48/64/128/256px)
├── favicon-32x32.png
├── favicon-192.png
├── favicon-512.png
├── apple-touch-icon.png
├── favicon.svg
└── site.webmanifest            PWA manifest (for Google/browser logo display)
```

---

## How Content Loading Works (The Manifest Pattern)

This is the core architectural pattern. Because there's no server, `main.js` needs a way to discover what content files exist. Each `_data/` subdirectory has a `manifest.json` that lists all filenames. On page load, `main.js`:

1. Fetches `manifest.json` to get the list of filenames
2. Fetches each file in parallel
3. Filters out unpublished items
4. Renders the results into the page

```
Browser → fetch /_data/products/manifest.json → ["product-a.json", "product-b.json"]
       → fetch /_data/products/product-a.json  → { title, description, ... }
       → fetch /_data/products/product-b.json  → { title, description, ... }
       → render product cards into #products-grid
```

**Important:** The `pages/` subdirectory does NOT use this pattern. Files like `home.json`, `settings.json`, `wholesale.json` are fetched directly by name — they don't need a manifest.

### Automatic Manifest Updates

The GitHub Action at `.github/workflows/update-manifest.yml` fires automatically on every push to `main` that changes anything in `_data/`. It rebuilds all manifests using Python, then commits back with `[skip ci]` to avoid an infinite loop. This means you never need to manually edit a manifest — adding or deleting a product/review/gallery photo through the CMS will trigger the action within ~30 seconds.

---

## How Each Page Works

### `index.html` — Homepage

`data-page="home"` triggers:
- `loadAndRenderProducts('home-featured-grid', p => p.featured)` — shows only products with `featured: true`
- `loadPageReviews('reviews-grid', 'publish_home')` — shows reviews that have both `published: true` AND `publish_home: true`
- `initReviewSystem()` — injects the review submission modal

Page copy (headline, stats, CTA) is mostly hardcoded in HTML. The hero photo, materials bar, and footer tagline are loaded from `_data/pages/settings.json` and `_data/pages/home.json`.

### `products.html` — Full Product Grid

`data-page="products"` triggers:
- `loadAndRenderProducts('products-grid', null)` — loads all published products
- `initFilters()` — wires up the category filter buttons

### `product.html` — Single Product

`data-page="product"` triggers `loadProductDetail()`, which reads the `?id=` URL parameter, fetches `/_data/products/{id}.json`, and populates the entire page: title, description, image carousel, pricing, and CTA buttons. If a `stripe_link` exists on the product, a "Buy Now" button is shown. Otherwise, a "Place Order / Request Pricing" button links to the contact page.

### `wholesale.html`

`data-page="wholesale"` triggers:
- `applyWholesaleContent()` — loads copy from `_data/pages/wholesale.json` into `data-cms="ws-*"` elements
- `loadPageReviews('wholesale-reviews-grid', 'publish_wholesale')`

### `retail.html`

`data-page="retail"` triggers:
- `applyRetailContent()` — loads copy from `_data/pages/retail.json`
- `loadAndRenderProducts('retail-products-grid', p => p.retail_available)` — only products with `retail_available: true`

### `contact.html`

`data-page="contact"` triggers `loadPageReviews('contact-reviews-grid', 'publish_contact')`.

### `success.html`

Shown after any form submission. Static page — no dynamic content. Has a "Leave us a Google review" link.

### `custom-parts.html`

Has its own inline script (not driven by `main.js`) that loads `_data/custom-parts-examples/manifest.json`, renders example project cards, and manages a category filter bar.

---

## Product JSON Structure

Each file in `_data/products/` looks like this:

```json
{
  "title": "Product Name",
  "categories": ["marine", "custom"],
  "material": "HDPE",
  "description": "Short description shown on cards.",
  "story": "Longer detail shown on the product page.",
  "images": [],
  "image": "/images/uploads/photo.jpg",
  "weight": "1.2 lbs",
  "retail_available": true,
  "retail_price": "$34.99",
  "stripe_link": "https://buy.stripe.com/xxxx",
  "wholesale_available": true,
  "fits": "Fits 15-17ft Boston Whaler",
  "featured": false,
  "published": true,
  "order": 10
}
```

Key fields that control visibility:
- `published: false` — hides the product everywhere
- `featured: true` — shows on the homepage grid, sorted first
- `retail_available: true` — shows on the retail page
- `wholesale_available: true` — shows on the wholesale page
- `order` — lower numbers sort first; default is 99

---

## Review JSON Structure

```json
{
  "name": "Dan W.",
  "title": "Hardware Store Owner, Ohio",
  "rating": 5,
  "body": "Review text here.",
  "date": "2026-04-01",
  "image": "/images/uploads/reviews/photo.jpg",
  "published": true,
  "publish_home": true,
  "publish_contact": false,
  "publish_wholesale": false
}
```

A review requires **two flags** to appear on a page:
1. `published: true` — admin approval
2. The page-specific flag (`publish_home`, `publish_contact`, or `publish_wholesale`) must also be `true`

This prevents a review from appearing on a page you didn't explicitly choose.

---

## The CMS (Admin Panel)

Accessed at `https://mengedohtcnc.com/admin/`. Login uses your GitHub account via OAuth.

**What you can edit from the CMS:**

| Collection | What It Controls |
|---|---|
| Products | Add/edit/delete products, all fields including images and Stripe links |
| Page Content → Homepage | Hero headline, subtext, CTA text, hero photo |
| Page Content → Wholesale | All copy on the wholesale page |
| Page Content → Retail | All copy on the retail page |
| Page Content → Site Settings | Contact email, footer tagline, materials bar list |
| Gallery | Photos shown on gallery.html |
| Custom Parts Examples | Photos and project cards on the custom-parts page |
| Shop Photos | Shop interior photos |
| Reviews | Approve/edit/delete submitted reviews, toggle which pages they show on |
| Founder Photo | The photo on the about page |
| Category Images | Photos for the four category cards on the homepage |

When you save anything in the CMS, it commits a file directly to the GitHub repo. The GitHub Action then rebuilds the relevant manifest within ~30 seconds, and Cloudflare Pages deploys the changes within ~1 minute.

---

## Review Submission Flow

1. Visitor clicks "Leave a Review" on the homepage or wholesale page
2. A modal form opens (injected by `main.js` via `injectReviewModal()`)
3. On submit, `main.js` POSTs form data to the Cloudflare Worker at `review.hankmengedoht.workers.dev`
4. The Worker validates the data, optionally uploads a photo to `images/uploads/reviews/`, and writes a new JSON file to `_data/reviews/` on GitHub via the GitHub API
5. The new review has `published: false` and all page flags false by default
6. You go to `/admin/`, find the review under "Reviews", approve it by toggling `Published` on, and choose which pages to show it on
7. The GitHub Action rebuilds `_data/reviews/manifest.json`
8. The review appears on the site

**Worker env vars** (set in Cloudflare dashboard, not in the repo):
- `GITHUB_TOKEN` — PAT with read/write on the repo
- `GITHUB_REPO` — `hankmengedoht-hue/MengedohtCNC`
- `ALLOWED_ORIGIN` — `https://mengedohtcnc.com`

---

## Payments (Stripe)

There is no server-side checkout. Each product JSON has a `stripe_link` field. When set, the product detail page shows a "Buy Now" button that links directly to that Stripe-hosted payment page. To add a payment link: create a Payment Link in your Stripe dashboard and paste the URL into the product via the CMS.

---

## Deployment

Every push to the `main` branch on GitHub triggers a Cloudflare Pages deployment automatically. There is no build step — the files are served as-is. Deploy time is typically under 60 seconds.

When working locally, always run `git pull --no-rebase` before pushing, because the CMS and GitHub Actions both commit to `main` concurrently. Using `--rebase` causes failures.

---

## Google Review Link

The business's Google review link is `https://g.page/r/CU2PkE3NW9bvEBM/review`. It appears in two places:
- `success.html` — below the action buttons after any form submission
- `index.html` — next to the "Leave a Review" button in the testimonials section
