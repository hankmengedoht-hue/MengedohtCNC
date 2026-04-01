/* =====================================================
   MENGEDOHT CNC — main.js
   Loads content from _data JSON files and renders
   products/pages dynamically so the CMS drives the site.
   ===================================================== */

// ── STICKY HEADER ──
const header = document.getElementById('site-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

// ── HAMBURGER MENU ──
const hamburger = document.getElementById('hamburger');
const mainNav   = document.getElementById('main-nav');
const navCta    = document.querySelector('.nav-cta');

if (hamburger && mainNav) {
  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    mainNav.classList.toggle('open', isOpen);
    if (navCta) navCta.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mainNav.classList.remove('open');
      if (navCta) navCta.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !mainNav.contains(e.target)) {
      hamburger.classList.remove('open');
      mainNav.classList.remove('open');
      if (navCta) navCta.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

// ── HELPERS ──
async function fetchJSON(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

async function fetchProductList() {
  const manifest = await fetchJSON('/_data/products/manifest.json');
  if (manifest && Array.isArray(manifest)) return manifest;
  return [];
}

function categoryLabel(cat) {
  const map = { tools: 'Tool Organizers', marine: 'Marine', pegboard: 'Shelving / Storage', custom: 'Custom / Other', automotive: 'Automotive Dashboards' };
  return map[cat] || cat;
}

// ── SITE SETTINGS ──
async function applySettings() {
  const settings = await fetchJSON('/_data/pages/settings.json');
  if (!settings) return;
  document.querySelectorAll('[data-cms="email"]').forEach(el => {
    if (el.tagName === 'A') el.href = `mailto:${settings.email}`;
    el.textContent = settings.email;
  });
  document.querySelectorAll('[data-cms="footer-tagline"]').forEach(el => {
    el.textContent = settings.footer_tagline;
  });
  const matBar = document.getElementById('materials-bar');
  if (matBar && settings.materials) {
    matBar.innerHTML = `<span class="mat-label">Materials:</span>` +
      settings.materials.map(m => `<span class="mat-chip">${m}</span>`).join('');
  }
}

// ── HOME PAGE ──
async function applyHomeContent() {
  const home = await fetchJSON('/_data/pages/home.json');
  if (!home) return;
  const set = (sel, val) => document.querySelectorAll(sel).forEach(el => { el.textContent = val; });
  set('[data-cms="hero-headline"]', home.hero_headline);
  set('[data-cms="hero-sub"]', home.hero_sub);
  set('[data-cms="hero-cta"]', home.hero_cta);
  set('[data-cms="stat1-num"]', home.stat1_num);
  set('[data-cms="stat1-label"]', home.stat1_label);
  set('[data-cms="stat2-num"]', home.stat2_num);
  set('[data-cms="stat2-label"]', home.stat2_label);
  set('[data-cms="stat3-num"]', home.stat3_num);
  set('[data-cms="stat3-label"]', home.stat3_label);
  set('[data-cms="cta-headline"]', home.cta_headline);
  set('[data-cms="cta-sub"]', home.cta_sub);
}

// ── WHOLESALE PAGE ──
async function applyWholesaleContent() {
  const ws = await fetchJSON('/_data/pages/wholesale.json');
  if (!ws) return;
  const set = (sel, val) => document.querySelectorAll(sel).forEach(el => { el.textContent = val; });
  set('[data-cms="ws-headline"]', ws.headline);
  set('[data-cms="ws-sub"]', ws.sub);
  set('[data-cms="ws-moq"]', ws.moq_details);
  set('[data-cms="ws-lead-time"]', ws.lead_time);
  set('[data-cms="ws-payment"]', ws.payment_terms);
  set('[data-cms="ws-shipping"]', ws.shipping);
}

// ── RETAIL PAGE ──
async function applyRetailContent() {
  const retail = await fetchJSON('/_data/pages/retail.json');
  if (!retail) return;
  const set = (sel, val) => document.querySelectorAll(sel).forEach(el => { el.textContent = val; });
  set('[data-cms="retail-headline"]', retail.headline);
  set('[data-cms="retail-sub"]', retail.sub);
  set('[data-cms="retail-shipping"]', retail.shipping);
  set('[data-cms="retail-returns"]', retail.returns);
}

// ── PRODUCT CARD BUILDER ──
function buildProductCard(p) {
  const categories = [p.category];
  if (p.retail_available) categories.push('retail');

  // Use first image from images array, fall back to legacy image field
  const primaryImg = p.image || (p.images && p.images.length > 0 ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0].image) : null);

  const imgHtml = primaryImg
    ? `<img src="${primaryImg}" alt="${p.title}" loading="lazy" style="width:100%;height:100%;object-fit:cover;" />`
    : `<div class="product-img-placeholder">
        <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="20" width="80" height="60" rx="4" fill="currentColor" opacity=".15" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="60" cy="50" r="18" fill="currentColor" opacity=".2"/>
          <circle cx="60" cy="50" r="8" fill="currentColor" opacity=".4"/>
        </svg>
      </div>`;

  const retailBadge = p.retail_available ? `<div class="product-badge-retail">Retail Available</div>` : '';

  const slug = p._filename ? p._filename.replace('.json','') : p.title.toLowerCase().replace(/[^a-z0-9]+/g,'-');

  let pricingHtml = '';
  if (p.retail_available && p.wholesale_available) {
    const priceLabel = p.retail_price ? p.retail_price : 'Contact for price';
    pricingHtml = `
      <div class="dual-pricing">
        <div class="price-option price-option--retail">
          <div class="price-label">Individual / Retail</div>
          <div class="price-desc">${priceLabel} — No minimum. Ships direct.</div>
        </div>
        <div class="price-option price-option--wholesale">
          <div class="price-label">Wholesale / Bulk</div>
          <div class="price-desc">MOQ ${p.moq} units. Tiered pricing available.</div>
        </div>
      </div>`;
  } else if (p.retail_available) {
    const priceLabel = p.retail_price ? `<div class="retail-price-display">${p.retail_price}</div>` : '';
    pricingHtml = priceLabel;
  }

  return `
    <div class="product-card${p.featured ? ' product-card--featured' : ''}" data-category="${categories.join(' ')}" onclick="window.location='product.html?id=${slug}'" style="cursor:pointer;">
      <div class="product-img">
        ${imgHtml}
        <div class="product-badge">${p.material}</div>
        ${retailBadge}
       ${(() => { const total = (p.image ? 1 : 0) + (p.images ? p.images.length : 0); return total > 1 ? `<div class="product-img-count">+${total - 1} photos</div>` : ''; })()}
      </div>
      <div class="product-info">
        <div class="product-cat">${categoryLabel(p.category)}</div>
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <div class="product-meta">
          <span class="meta-item">${p.material}</span>
          ${p.fits ? `<span class="meta-item">${p.fits}</span>` : ''}
        </div>
        ${pricingHtml}
        <div class="view-details-btn">View Details →</div>
      </div>
    </div>`;
}

// ── LOAD & RENDER PRODUCTS ──
async function loadAndRenderProducts(gridId, filterFn) {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  grid.innerHTML = `<div class="products-loading">Loading products…</div>`;

  const manifest = await fetchProductList();
  if (!manifest.length) {
    grid.innerHTML = `<p class="no-results-inline">No products found.</p>`;
    return;
  }

  const all = (await Promise.all(
    manifest.map(f => fetchJSON(`/_data/products/${f}`))
  )).filter(p => p && p.published !== false);

  const products = filterFn ? all.filter(filterFn) : all;
  products.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return (a.order || 99) - (b.order || 99);
  });

  if (!products.length) {
    grid.innerHTML = `<p class="no-results-inline">No products in this category yet. <a href="contact.html">Contact us</a> to inquire.</p>`;
    return;
  }

  grid.innerHTML = products.map(buildProductCard).join('');
  initScrollReveal();
  if (gridId === 'products-grid') initFilters();
}

// ── FILTER BUTTONS ──
function initFilters() {
  const filterBtns   = document.querySelectorAll('.filter-btn');
  const noResults    = document.getElementById('no-results');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      const cards  = document.querySelectorAll('#products-grid .product-card');
      let visible  = 0;
      cards.forEach(card => {
        const cats  = (card.dataset.category || '').split(' ');
        const match = filter === 'all' || cats.includes(filter);
        card.classList.toggle('hidden', !match);
        if (match) visible++;
      });
      if (noResults) noResults.style.display = visible === 0 ? 'block' : 'none';
    });
  });
}

// ── SCROLL REVEAL ──
function initScrollReveal() {
  const els = document.querySelectorAll(
    '.cat-card, .benefit-item, .process-step, .testi-card, .product-card, .who-card, .tier-card'
  );
  if (!('IntersectionObserver' in window) || !els.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  els.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.5s ease ${(i % 6) * 0.07}s, transform 0.5s ease ${(i % 6) * 0.07}s`;
    observer.observe(el);
  });
}

// ── BOOT ──
document.addEventListener('DOMContentLoaded', async () => {
  await applySettings();
  initScrollReveal();

  const page = document.body.dataset.page;

  if (page === 'home') {
    await applyHomeContent();
    await loadAndRenderProducts('home-featured-grid', p => p.featured);
  }
  if (page === 'products') {
    await loadAndRenderProducts('products-grid', null);
  }
  if (page === 'retail') {
    await applyRetailContent();
    await loadAndRenderProducts('retail-products-grid', p => p.retail_available);
  }
  if (page === 'wholesale') {
    await applyWholesaleContent();
  }
  if (page === 'product') {
    await loadProductDetail();
  }
});

// ── PRODUCT DETAIL PAGE ──
async function loadProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { window.location = 'products.html'; return; }

  const p = await fetchJSON(`/_data/products/${id}.json`);
  if (!p) { window.location = 'products.html'; return; }

  // Set page title
  document.title = `${p.title} — Mengedoht CNC`;

  // Build image list — support both new images[] array and legacy image field
 // Build image list — combine thumbnail + images array
  let images = [];
  // Add thumbnail first if it exists
  if (p.image) images.push(p.image);
  // Add additional images, supporting both string and object formats
  if (p.images && p.images.length > 0) {
    p.images.forEach(i => {
      const src = typeof i === 'string' ? i : i.image;
      if (src && !images.includes(src)) images.push(src);
    });
  }

  // ── CAROUSEL ──
  const carouselEl = document.getElementById('product-carousel');
  if (carouselEl) {
    if (images.length === 0) {
      carouselEl.innerHTML = `
        <div class="carousel-main">
          <div class="carousel-placeholder">
            <svg viewBox="0 0 120 100" fill="none"><rect x="20" y="20" width="80" height="60" rx="4" fill="currentColor" opacity=".15" stroke="currentColor" stroke-width="1.5"/><circle cx="60" cy="50" r="18" fill="currentColor" opacity=".2"/><circle cx="60" cy="50" r="8" fill="currentColor" opacity=".4"/></svg>
          </div>
        </div>`;
    } else if (images.length === 1) {
      carouselEl.innerHTML = `
        <div class="carousel-main">
          <img src="${images[0]}" alt="${p.title}" class="carousel-main-img" onclick="openLightbox(this.src)" style="cursor:zoom-in;" />
        </div>`;
    } else {
      let current = 0;
      const update = () => {
        document.getElementById('carousel-main-img').src = images[current];
        document.querySelectorAll('.carousel-thumb').forEach((t, i) => {
          t.classList.toggle('active', i === current);
        });
        document.getElementById('carousel-counter').textContent = `${current + 1} / ${images.length}`;
      };
      carouselEl.innerHTML = `
        <div class="carousel-main">
          <button class="carousel-btn carousel-prev" id="carousel-prev">&#8249;</button>
          <img src="${images[0]}" alt="${p.title}" class="carousel-main-img" id="carousel-main-img" onclick="openLightbox(this.src)" style="cursor:zoom-in;" />
          <button class="carousel-btn carousel-next" id="carousel-next">&#8250;</button>
          <div class="carousel-counter" id="carousel-counter">1 / ${images.length}</div>
        </div>
        <div class="carousel-thumbs">
          ${images.map((img, i) => `<img src="${img}" class="carousel-thumb${i === 0 ? ' active' : ''}" data-index="${i}" alt="Photo ${i+1}" />`).join('')}
        </div>`;
      document.getElementById('carousel-prev').addEventListener('click', () => {
        current = (current - 1 + images.length) % images.length;
        update();
      });
      document.getElementById('carousel-next').addEventListener('click', () => {
        current = (current + 1) % images.length;
        update();
      });
      document.querySelectorAll('.carousel-thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
          current = parseInt(thumb.dataset.index);
          update();
        });
      });
    }
  }

  // ── PRODUCT INFO ──
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || ''; };
  const setHtml = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val || ''; };

  set('detail-title', p.title);
  set('detail-category', categoryLabel(p.category));
  set('detail-material', p.material);
  set('detail-weight', p.weight || 'Not specified');
  set('detail-description', p.description);
  set('detail-story', p.story || '');
  set('detail-fits', p.fits || '—');

  const storySection = document.getElementById('detail-story-section');
  if (storySection) storySection.style.display = p.story ? '' : 'none';

  // Pricing
 const pricingEl = document.getElementById('detail-pricing');
  if (pricingEl) {
    let html = '';
    if (p.retail_price) {
      html += `<div class="detail-price-row"><span class="detail-price-label">Retail Price</span><span class="detail-price-value" style="color:#e8a020; font-size:1.2rem; font-weight:800;">${p.retail_price}</span></div>`;
    }
    html += `<div class="detail-price-row"><span class="detail-price-label">Individual Orders</span><span class="detail-price-value">Available — No minimum</span></div>`;
    if (p.wholesale_available) {
      html += `<div class="detail-price-row"><span class="detail-price-label">Wholesale / Bulk</span><span class="detail-price-value">Contact for pricing — MOQ 25 units</span></div>`;
    }
    pricingEl.innerHTML = html;
  }

  // Actions — Stripe or contact
  const actionsEl = document.getElementById('detail-actions');
  if (actionsEl) {
    if (p.stripe_link) {
      actionsEl.innerHTML = `
        <a href="${p.stripe_link}" target="_blank" class="btn btn-accent btn-block" style="margin-bottom:0.75rem;">Buy Now — ${p.retail_price || 'Pay Online'}</a>
        <a href="contact.html" class="btn btn-outline btn-block">Request Wholesale Pricing</a>`;
    } else {
      actionsEl.innerHTML = `
        <a href="contact.html" class="btn btn-accent btn-block">Place Order / Request Pricing</a>`;
    }
  }

  // Breadcrumb
  const bc = document.getElementById('detail-breadcrumb');
  if (bc) bc.textContent = p.title;
}
