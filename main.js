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
  const manifest = await fetchJSON('/data/products/manifest.json');
  if (manifest && Array.isArray(manifest)) return manifest;
  return [];
}

function categoryLabel(cat) {
  const map = { tools: 'Tool Organizers', marine: 'Marine', pegboard: 'Pegboard Accessories', custom: 'Custom / Other' };
  return map[cat] || cat;
}

// ── SITE SETTINGS ──
async function applySettings() {
  const settings = await fetchJSON('/data/pages/settings.json');
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
  const home = await fetchJSON('/data/pages/home.json');
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
  const ws = await fetchJSON('/data/pages/wholesale.json');
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
  const retail = await fetchJSON('/data/pages/retail.json');
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

  const imgHtml = p.image
    ? `<img src="${p.image}" alt="${p.title}" loading="lazy" style="width:100%;height:100%;object-fit:cover;" />`
    : `<div class="product-img-placeholder">
        <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="20" width="80" height="60" rx="4" fill="currentColor" opacity=".15" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="60" cy="50" r="18" fill="currentColor" opacity=".2"/>
          <circle cx="60" cy="50" r="8" fill="currentColor" opacity=".4"/>
        </svg>
      </div>`;

  const retailBadge = p.retail_available ? `<div class="product-badge-retail">Retail Available</div>` : '';

  let pricingHtml = '';
  if (p.retail_available && p.wholesale_available) {
    const priceLabel = p.retail_price ? p.retail_price : 'Contact for price';
    pricingHtml = `
      <div class="dual-pricing">
        <div class="price-option price-option--retail">
          <div class="price-label">Individual / Retail</div>
          <div class="price-desc">${priceLabel} — No minimum. Ships direct.</div>
          <a href="contact.html" class="btn btn-accent btn-sm">Buy Single Unit</a>
        </div>
        <div class="price-option price-option--wholesale">
          <div class="price-label">Wholesale / Bulk</div>
          <div class="price-desc">MOQ ${p.moq} units. Tiered pricing available.</div>
          <a href="contact.html" class="btn btn-outline btn-sm">Wholesale Pricing</a>
        </div>
      </div>`;
  } else if (p.retail_available) {
    const priceLabel = p.retail_price ? `<div class="retail-price-display">${p.retail_price}</div>` : '';
    pricingHtml = `<div class="retail-only-pricing">${priceLabel}<a href="contact.html" class="btn btn-accent btn-block">Order Now</a></div>`;
  } else {
    pricingHtml = `<a href="contact.html" class="btn btn-primary btn-block">Request Pricing</a>`;
  }

  return `
    <div class="product-card${p.featured ? ' product-card--featured' : ''}" data-category="${categories.join(' ')}">
      <div class="product-img">
        ${imgHtml}
        <div class="product-badge">${p.material}</div>
        ${retailBadge}
      </div>
      <div class="product-info">
        <div class="product-cat">${categoryLabel(p.category)}</div>
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <div class="product-meta">
          ${p.wholesale_available ? `<span class="meta-item">MOQ: ${p.moq}</span>` : ''}
          <span class="meta-item">${p.material}</span>
          ${p.fits ? `<span class="meta-item">${p.fits}</span>` : ''}
        </div>
        ${pricingHtml}
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
    manifest.map(f => fetchJSON(`/data/products/${f}`))
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
});
