# Mengedoht CNC — Project Context

## What this project is

A static website for **Mengedoht CNC**, a precision CNC manufacturing business. It serves both wholesale buyers (retailers, distributors) and retail customers (individual purchases). The site is built with plain HTML, CSS, and JavaScript — no build tool or framework.

## Tech stack

- **Frontend**: Vanilla HTML/CSS/JS — single `style.css`, single `main.js`
- **CMS**: [Decap CMS](https://decapcms.org/) (`admin/`) — GitHub-backed, custom OAuth worker at `cms-auth.hankmengedoht.workers.dev`
- **Content storage**: JSON files in `_data/` — loaded at runtime by `main.js`
- **Fonts**: Barlow Condensed + Barlow (Google Fonts)
- **Repo**: `hankmengedoht-hue/MengedohtCNC` on GitHub, `main` branch
- **Media uploads**: `images/uploads/`

## Site pages

| File | Purpose |
|------|---------|
| `index.html` | Homepage — hero, stats, featured products, CTA |
| `products.html` | Product grid — all published products |
| `product.html` | Single product detail page (URL param: `?id=...`) |
| `custom-parts.html` | Custom manufacturing inquiry page |
| `wholesale.html` | Wholesale info + product grid |
| `retail.html` | Retail shop — products available for individual sale |
| `gallery.html` | Photo gallery |
| `about.html` | About / founder page |
| `contact.html` | Contact form |
| `success.html` | Post-form-submission confirmation |
| `bulk-import.html` | Admin tool for bulk importing products |

## Content data structure (`_data/`)

- `products/` — one JSON file per product (fields: title, category, material, description, story, images, image, weight, retail_available, retail_price, stripe_link, wholesale_available, fits, featured, published, order)
- `gallery/` — one JSON per gallery photo (`image`, `published`)
- `shop-photos/` — one JSON per shop photo (`image`, `published`)
- `pages/home.json` — hero headline/sub/cta, stats, bottom CTA
- `pages/wholesale.json` — wholesale page copy (headline, sub, moq_details, lead_time, payment_terms, shipping)
- `pages/retail.json` — retail page copy (headline, sub, shipping, returns)
- `pages/settings.json` — global settings (business_name, email, footer_tagline, materials list)
- `founder.json` — founder photo path

## CMS collections (Decap CMS)

Managed via `admin/config.yml`. Collections: Products, Page Content (Homepage, Wholesale, Retail, Site Settings), Gallery, Shop Photos, Founder Photo.

## Key conventions

- Products can be toggled retail vs. wholesale via boolean fields; `published: false` hides without deleting
- `featured: true` highlights a product card and sorts it first
- `order` field (number) controls sort order — lower = first
- Stripe payment links stored directly on each product (`stripe_link`)
- Page copy (headlines, CTAs, policies) is CMS-managed via `_data/pages/*.json`, not hardcoded in HTML
