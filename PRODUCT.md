# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three customer segments, all currently equal priority (no lead segment):
- **Retail buyers** — individual consumers buying stocked/catalog CNC products direct, no business account, no minimum order.
- **Custom/one-off clients** — engineers, boat/car restorers, hobbyists, and prototypers who need a single part or small run made from a sketch, photo, or description (no CAD files required).
- **Mass production clients** — retailers, distributors, hardware stores, and marine shops who need production runs of parts at scale (tiered volume pricing, white-label/custom branding options). This is **not** a wholesale/resale relationship — the business does not sell inventory at wholesale rates for resale, it manufactures parts in production quantities for the client's own use or their own resale under their own brand. Site copy, URLs, and nav previously used "Wholesale" for this segment; that terminology is being corrected to "Mass Production" site-wide, including the URL (`wholesale.html` → `mass-production.html` with a 301 redirect).

## Product Purpose

Mengedoht CNC is a one-man precision CNC fabrication shop. It exists to give people three ways to get CNC-cut parts made — buy a catalog product outright, commission a custom one-off/prototype, or commission a production run — all from the same shop, same machinist, same precision.

## Positioning

Direct access to the machinist, no sales team or middlemen in between. No minimums on custom work. 24-hour quote turnaround. A one-man shop that can still deliver production-run consistency (±0.005" positional accuracy, ±0.003" repeatability) via an automatic-tool-changing CNC router — precision normally associated with larger shops, without the overhead or the runaround.

## Operating Context

- Shop located at High and Dry Boatworks, 2728 Spruill Ave, North Charleston, SC — a marine-industry setting; a meaningful share of the work is marine hardware (cooler chocks, cleats, instrument panels) reflecting that context.
- Machine: CAMaster Cobra CR-510 ATC (automatic tool changer), toolpaths in Vectric Aspire.
- Materials worked: HDPE, hardwoods (oak/walnut/maple), plywood (incl. marine-grade, MDO), cast acrylic, G10/Garolite fiberglass laminate, carbon fiber sheet.
- Founder: Hank Mengedoht.

## Capabilities and Constraints

- **Stack**: plain static HTML/CSS/JS (no framework, no SSG). Content authored via Decap CMS (`admin/config.yml`), GitHub-backed with a custom OAuth worker, deployed on Cloudflare Pages. Product/gallery/review content lives as JSON files in `_data/`, fetched client-side at runtime by `main.js` — there is no server-side data layer or build-time templating for that content.
- A GitHub Action (`.github/workflows/update-manifest.yml`) auto-rebuilds `_data/*/manifest.json` files, regenerates static per-product pages under `/products/`, and regenerates `sitemap.xml` on every push touching product/review/gallery data. It contains an embedded Python script (string-built HTML) — edits here are fragile to naive find/replace across the repo; verify by extracting and running the script, not just eyeballing it.
- Category filtering (products, gallery, custom-parts examples) uses a fixed set of category buttons (Marine, Woodwork, Furniture, Signage, Automotive, Carbon Fiber/G10, Flat-Pack Plywood, Custom/Other) driven by a `categories` array on each content item.
- Cache-busting for `style.css` is a manual `?v=N` query param on every page's `<link>` tag — Cloudflare edge-caches it for 24h, so any CSS change requires bumping the version, and verification requests must wait for propagation or they poison the new cache key with stale content.
- Google Fonts are split into two `<link>` tags: body/heading fonts (Barlow / Barlow Condensed) load with `display=optional` (deliberate, fixes a CLS issue from font-swap reflow); the logo fonts (Big Shoulders Display, Wallpoet) load with `display=swap` (deliberate — `optional` was unreliable for brand-new, not-yet-cached fonts on first visit).
- No backend/server logic exists — contact form posts to Formspree; Stripe payment links are stored per-product for retail checkout.

## Brand Commitments

- Business name: **Mengedoht CNC**. Accent color: gold `#e8a020` on a dark charcoal ground (`#1e1e1c`/`#272724`). Body font: Barlow / Barlow Condensed.
- **Current logo wordmark (confirmed today, do not revert)**: "MENGEDOHT" set in Big Shoulders Display (Black/900), "CNC" set in Wallpoet (the stencil/chamfered face), matching a business-card reference the owner supplied. This replaced an earlier all-gold Barlow Condensed treatment. Any redesign must preserve this exact logo font pairing and color split (white "MENGEDOHT" / gold "CNC") in the header and wherever else the wordmark appears — it is the one settled visual-identity element carried into the redesign.
- Instagram: @mengedohtcnc.

## Evidence on Hand

- **5 published products** (`_data/products/`), each with real photos, categories, materials, and (for retail-available ones) Stripe links and prices.
- **78 gallery photos** (`_data/gallery/`) — verified: all 78 referenced image files exist on disk. Not empty, not broken.
- **7 real customer reviews** (`_data/reviews/`) with real names (Dan W, Greyson Costner, Paul Joseph, Will Tome, and 3 more) — not placeholder content.
- Real machine/tolerance specs, material list, and process steps already written on `capabilities.html`.
- Contact email (`hankmengedoht@gmail.com`) is plain, unobfuscated `mailto:` text on About and Contact pages — no scraper protection exists today (a separate, smaller task from anything implied by "verify it renders").

## Product Principles

1. Direct-to-machinist relationship is the differentiator — design and copy should never make the business feel bigger/more corporate than a one-man shop that answers personally.
2. All three customer paths (retail / custom / mass production) are equally important; none should visually dominate the others.
3. Real content (real products, real photos, real reviews) already exists — redesign work should surface and present it better, not invent placeholder content or assume it needs to be built from scratch.
4. Because there's no server-side rendering, every visual/content change must be verified against what a non-JS crawler and a first-time (uncached) visitor actually see, not just what a warm local browser shows.

## Accessibility & Inclusion

No product-specific accessibility requirement has been established beyond ordinary web standards (semantic HTML, focus states, alt text, sufficient contrast) already loosely followed in the existing code.
