let currentLanguage = getInitialLanguage();
let activeMenuProducts = null;
let activeMenuCategories = null;
let usingApiMenu = false;

function getLanguageCodes() {
  return Object.keys(LANGUAGES);
}

function getLanguageEntries() {
  return getLanguageCodes().map((code) => ({ code, ...LANGUAGES[code] }));
}

function isValidLanguage(languageCode) {
  return Object.prototype.hasOwnProperty.call(LANGUAGES, languageCode);
}

function getInitialLanguage() {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (isValidLanguage(saved)) return saved;
  return DEFAULT_LANGUAGE;
}

function t(path) {
  return path.split('.').reduce((value, key) => value && value[key], translations[currentLanguage])
    || path.split('.').reduce((value, key) => value && value[key], translations[DEFAULT_LANGUAGE])
    || path.split('.').reduce((value, key) => value && value[key], translations.en)
    || path;
}

function localized(value) {
  if (!value || typeof value !== 'object') return value || '';
  return value[currentLanguage] || value[DEFAULT_LANGUAGE] || value.en || Object.values(value)[0] || '';
}

function formatPrice(value) {
  const price = Number(value);
  return Number.isInteger(price) ? `€${price}` : `€${price.toFixed(2)}`;
}

function normalizeMenuImageUrl(imageUrl) {
  const value = String(imageUrl || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('/')) return value;
  if (value.startsWith('./')) return `/${value.slice(2)}`;
  if (value.startsWith('assets/')) return `/${value}`;
  return value;
}

function fallbackProductImage() {
  return typeof menuProducts !== 'undefined' && Array.isArray(menuProducts)
    ? menuProducts.find((product) => product.image)?.image || ''
    : '';
}

function preloadImages(urls) {
  urls.forEach((url) => {
    const image = new Image();
    image.src = url;
  });
}

function apiLocalizedObject(item, field) {
  return {
    bg: item[`${field}_bg`] || item[field] || item[`${field}_en`] || '',
    en: item[`${field}_en`] || item[field] || item[`${field}_bg`] || '',
    fr: item[`${field}_fr`] || item[`${field}_en`] || item[field] || item[`${field}_bg`] || '',
    it: item[`${field}_it`] || item[`${field}_en`] || item[field] || item[`${field}_bg`] || '',
    es: item[`${field}_es`] || item[`${field}_en`] || item[field] || item[`${field}_bg`] || '',
    el: item[`${field}_el`] || item[`${field}_en`] || item[field] || item[`${field}_bg`] || '',
  };
}

function apiCategoryLabel(category) {
  return {
    bg: category.title_bg || category.name || category.title_en || category.slug || '',
    en: category.title_en || category.name || category.title_bg || category.slug || '',
    fr: category.title_fr || category.title_en || category.name || category.title_bg || category.slug || '',
    it: category.title_it || category.title_en || category.name || category.title_bg || category.slug || '',
    es: category.title_es || category.title_en || category.name || category.title_bg || category.slug || '',
    el: category.title_el || category.title_en || category.name || category.title_bg || category.slug || '',
  };
}

function mapApiMenuItem(item, categoriesById) {
  const category = categoriesById.get(Number(item.category_id)) || {};
  const image = normalizeMenuImageUrl(item.image_url) || fallbackProductImage();
  const name = apiLocalizedObject(item, 'name');
  const categorySlug = category.slug || item.category_slug || item.category || 'menu';

  return {
    id: item.slug || `menu-item-${item.id}`,
    slug: item.slug || `menu-item-${item.id}`,
    category: categorySlug,
    categoryLabel: apiCategoryLabel(category),
    name,
    description: apiLocalizedObject(item, 'description'),
    image,
    imageAlt: item.image_alt || localized(name),
    prices: {
      itemEUR: Number(item.price) || 0,
    },
    priceLabel: {
      bg: 'Бургер',
      en: 'Burger',
      fr: 'Burger',
      it: 'Burger',
      es: 'Burger',
      el: 'Burger',
    },
    badges: [],
    isActive: item.is_active !== 0,
    available: item.is_available !== 0,
  };
}

async function loadApiMenu() {
  if (document.body.dataset.page !== 'menu') return;

  try {
    const response = await fetch('/api/menu', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || data.success === false) {
      throw new Error(data.error || `Menu API failed: ${response.status}`);
    }

    const categories = Array.isArray(data.categories) ? data.categories : [];
    const items = Array.isArray(data.items) ? data.items : [];
    console.log('Using API menu items:', items.length);

    const categoriesById = new Map(categories.map((category) => [Number(category.id), category]));
    activeMenuCategories = categories.map((category) => ({
      ...category,
      label: apiCategoryLabel(category),
    }));
    activeMenuProducts = items.map((item) => mapApiMenuItem(item, categoriesById));
    usingApiMenu = true;
  } catch (error) {
    console.warn('Menu API unavailable, using static fallback.', error);
    console.log('Using static fallback menu');
    activeMenuProducts = null;
    activeMenuCategories = null;
    usingApiMenu = false;
  }
}

function getMenuProducts() {
  if (Array.isArray(activeMenuProducts)) return activeMenuProducts;
  if (typeof menuProducts !== 'undefined' && Array.isArray(menuProducts)) return menuProducts;
  return [];
}

function renderCategoryTabs() {
  const container = document.querySelector('.category-tabs');
  if (!container || !usingApiMenu || !Array.isArray(activeMenuCategories)) return;

  const previousCategory = container.querySelector('.category-tab.active')?.dataset.category || 'all';
  const availableSlugs = new Set(activeMenuCategories.map((category) => category.slug));
  const activeCategory = previousCategory === 'all' || availableSlugs.has(previousCategory)
    ? previousCategory
    : 'all';

  const tabHtml = [
    {
      slug: 'all',
      label: t('categories.all'),
    },
    ...activeMenuCategories.map((category) => ({
      slug: category.slug,
      label: localized(category.label) || category.slug,
    })),
  ].map((category) => {
    const isActive = category.slug === activeCategory;
    return `
      <button class="category-tab${isActive ? ' active' : ''}"
        type="button"
        role="tab"
        aria-selected="${isActive}"
        aria-pressed="${isActive}"
        data-category="${category.slug}">
        ${category.label}
      </button>
    `;
  }).join('');

  container.innerHTML = tabHtml;
}

function setLanguage(languageCode) {
  if (!isValidLanguage(languageCode)) return;
  currentLanguage = languageCode;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
  applyTranslations();
  renderCategoryTabs();
  setupCategoryTabs();
  renderMenu();
  renderFeaturedProducts();
  renderLanguageSwitchers();
}

function applyTranslations() {
  const language = LANGUAGES[currentLanguage];
  document.documentElement.lang = language.locale;

  const page = document.body.dataset.page || 'index';
  const pageTitleKey = page === 'index' ? 'indexTitle' : `${page}Title`;
  document.title = t(`meta.${pageTitleKey}`);

  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute('content', t('meta.description'));

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  document.querySelectorAll('[data-i18n-aria]').forEach((element) => {
    element.setAttribute('aria-label', t(element.dataset.i18nAria));
  });

  document.querySelectorAll('[data-i18n-title]').forEach((element) => {
    element.setAttribute('title', t(element.dataset.i18nTitle));
  });
}

function renderLanguageSwitchers() {
  document.querySelectorAll('[data-language-switcher]').forEach((switcher) => {
    const isOpen = switcher.classList.contains('active');
    const activeLanguage = LANGUAGES[currentLanguage];

    switcher.setAttribute('aria-label', t('nav.language'));
    switcher.classList.toggle('active', isOpen);
    switcher.innerHTML = `
      <button class="language-toggle"
        type="button"
        data-language-toggle
        aria-label="${t('nav.language')}"
        aria-haspopup="menu"
        aria-expanded="${isOpen}">
        <span class="language-toggle-flag" aria-hidden="true">${activeLanguage.flag}</span>
      </button>
      <div class="language-dropdown" role="menu">
        ${getLanguageEntries().map((language) => `
          <button class="language-option${language.code === currentLanguage ? ' active' : ''}"
            type="button"
            role="menuitem"
            data-lang="${language.code}"
            aria-label="${language.label}"
            tabindex="${isOpen ? '0' : '-1'}">
            ${language.flag}
          </button>
        `).join('')}
      </div>
    `;
  });
}

function closeLanguageDropdowns(except) {
  document.querySelectorAll('[data-language-switcher]').forEach((switcher) => {
    if (except && switcher === except) return;
    switcher.classList.remove('open');
    switcher.classList.remove('active');
    const toggle = switcher.querySelector('[data-language-toggle]');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    switcher.querySelectorAll('[data-lang]').forEach((option) => {
      option.setAttribute('tabindex', '-1');
    });
  });
}

function setLanguageDropdownOpen(switcher, open) {
  closeLanguageDropdowns(open ? switcher : null);
  switcher.classList.toggle('active', open);

  const toggle = switcher.querySelector('[data-language-toggle]');
  if (toggle) toggle.setAttribute('aria-expanded', String(open));

  switcher.querySelectorAll('[data-lang]').forEach((option) => {
    option.setAttribute('tabindex', open ? '0' : '-1');
  });

  if (open) {
    const activeOption = switcher.querySelector('[data-lang].active') || switcher.querySelector('[data-lang]');
    activeOption?.focus();
  }
}

function setupLanguageSwitcher() {
  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-language-toggle]');
    if (toggle) {
      const switcher = toggle.closest('[data-language-switcher]');
      setLanguageDropdownOpen(switcher, !switcher.classList.contains('active'));
      return;
    }

    const option = event.target.closest('[data-lang]');
    if (option) {
      setLanguage(option.dataset.lang);
      closeLanguageDropdowns();
      option.closest('[data-language-switcher]')?.querySelector('[data-language-toggle]')?.focus();
      return;
    }

    if (!event.target.closest('[data-language-switcher]')) closeLanguageDropdowns();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeLanguageDropdowns();
      document.querySelector('[data-language-switcher].active [data-language-toggle]')?.focus();
      return;
    }

    const switcher = event.target.closest('[data-language-switcher]');
    if (!switcher) return;

    const toggle = event.target.closest('[data-language-toggle]');
    const options = [...switcher.querySelectorAll('[data-lang]')];
    const activeIndex = options.indexOf(document.activeElement);

    if (toggle && ['Enter', ' ', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      setLanguageDropdownOpen(switcher, true);
      return;
    }

    if (!switcher.classList.contains('active')) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const offset = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = activeIndex < 0
        ? 0
        : (activeIndex + offset + options.length) % options.length;
      options[nextIndex]?.focus();
      return;
    }

    if (['Enter', ' '].includes(event.key) && document.activeElement?.matches('[data-lang]')) {
      event.preventDefault();
      setLanguage(document.activeElement.dataset.lang);
      closeLanguageDropdowns();
      switcher.querySelector('[data-language-toggle]')?.focus();
    }
  });
}

function productCard(product, index = 0, eagerImages = 0) {
  if (product.variants) return loadedFriesCard(product, index, eagerImages);

  const name = localized(product.name);
  const description = localized(product.description);
  const ingredients = localized(product.ingredients) || [];
  const category = product.categoryLabel
    ? localized(product.categoryLabel)
    : product.category === 'drinks' && product.subcategory === 'beer'
    ? t('categories.beer')
    : t(`categories.${product.category}`);
  const delay = Math.min(index * 0.04, 0.24).toFixed(2);
  const imageAlt = product.imageAlt || `${name} - ${description}`;
  const orderLabel = `${t('common.orderItem')} ${name}`;
  const badges = [
    product.badge ? t(`badges.${product.badge}`) : '',
    product.spicy ? t('badges.spicy') : '',
  ].filter(Boolean);
  const hasIngredients = Array.isArray(ingredients) ? ingredients.length > 0 : Boolean(ingredients);
  const singlePriceLabel = product.priceLabel
    ? localized(product.priceLabel)
    : product.category === 'drinks'
    ? t(product.subcategory === 'beer' ? 'common.beer' : 'common.drink')
    : t('common.item');
  const priceHtml = product.prices.itemEUR
    ? `<span><strong>${singlePriceLabel}</strong>${formatPrice(product.prices.itemEUR)}</span>`
    : `
      <span><strong>${t('common.burger')}</strong>${formatPrice(product.prices.burgerEUR)}</span>
      <span><strong>${t('common.combo')}</strong>${formatPrice(product.prices.menuEUR)}</span>
    `;
  const allergenHtml = (product.allergens || []).map((allergen) => `<li>${t(`allergens.${allergen}`)}</li>`).join('');
  const imageLoading = index < eagerImages ? 'eager' : 'lazy';
  const mediaHtml = product.image
    ? `
      <div class="menu-card-media">
        <img src="${product.image}" alt="${imageAlt}" width="900" height="675" loading="${imageLoading}" decoding="async">
      </div>
    `
    : `
      <div class="menu-card-media" aria-hidden="true"></div>
    `;

  return `
    <article class="menu-card fade-up" data-category="${product.category}" data-subcategory="${product.subcategory || ''}" style="--delay:${delay}s">
      ${mediaHtml}
      <div class="menu-card-content">
        <div class="menu-card-topline">
          <span class="menu-card-category">${category}</span>
          ${badges.length ? `<div class="menu-card-badges">${badges.map((badge) => `<span>${badge}</span>`).join('')}</div>` : ''}
        </div>
        <h2>${name}</h2>
        <p>${description}</p>
        <div class="price-grid${product.prices.itemEUR ? ' single-price' : ''}" aria-label="${name} prices">
          ${priceHtml}
        </div>
        ${hasIngredients ? `<div class="ingredients"><h3>${t('common.ingredients')}</h3><ul>${ingredients.map((ingredient) => `<li>${ingredient}</li>`).join('')}</ul></div>` : ''}
        ${allergenHtml ? `<div class="allergens"><h3>${t('common.allergens')}</h3><ul>${allergenHtml}</ul></div>` : ''}
        <a class="menu-card-order" href="order.html" aria-label="${orderLabel}">${t('common.orderItem')}</a>
      </div>
    </article>
  `;
}

function loadedFriesCard(product, index = 0, eagerImages = 0) {
  const name = localized(product.name);
  const activeVariant = product.variants[0];
  const description = localized(activeVariant.description) || localized(product.description);
  const ingredients = localized(activeVariant.ingredients) || localized(product.ingredients) || [];
  const category = t(`categories.${product.category}`);
  const delay = Math.min(index * 0.04, 0.24).toFixed(2);
  const imageLoading = index < eagerImages ? 'eager' : 'lazy';
  const orderLabel = `${t('common.orderItem')} ${name}`;
  const allergenHtml = (product.allergens || []).map((allergen) => `<li>${t(`allergens.${allergen}`)}</li>`).join('');
  const variantButtons = product.variants.map((variant, variantIndex) => `
    <button class="fries-variant${variantIndex === 0 ? ' active' : ''}"
      type="button"
      data-fries-variant="${variant.id}"
      aria-pressed="${variantIndex === 0}"
      aria-label="${localized(variant.name)}">
      ${localized(variant.name)}
    </button>
  `).join('');

  return `
    <article class="menu-card loaded-fries-card fade-up" data-category="${product.category}" data-loaded-fries style="--delay:${delay}s">
      <div class="menu-card-media loaded-fries-media">
        <img class="loaded-fries-image" src="${activeVariant.image}" alt="${name} - ${description}" width="900" height="675" loading="${imageLoading}" decoding="async" data-fries-image>
      </div>
      <div class="menu-card-content">
        <div class="menu-card-topline">
          <span class="menu-card-category">${category}</span>
          <div class="menu-card-badges" data-fries-badges>${activeVariant.spicy ? `<span>${t('badges.spicy')}</span>` : ''}</div>
        </div>
        <h2>${name}</h2>
        <p data-fries-description>${description}</p>
        <div class="price-grid single-price loaded-fries-price" aria-label="${name} prices">
          <span><strong>${t('common.item')}</strong>${formatPrice(product.prices.itemEUR)}</span>
        </div>
        <div class="fries-variants" role="group" aria-label="${name} add-ons">
          ${variantButtons}
        </div>
        <div class="ingredients">
          <h3>${t('common.ingredients')}</h3>
          <ul data-fries-ingredients>${ingredients.map((ingredient) => `<li>${ingredient}</li>`).join('')}</ul>
        </div>
        ${allergenHtml ? `<div class="allergens"><h3>${t('common.allergens')}</h3><ul>${allergenHtml}</ul></div>` : ''}
        <a class="menu-card-order" href="order.html" aria-label="${orderLabel}">${t('common.orderItem')}</a>
      </div>
    </article>
  `;
}

function setupLoadedFriesCards() {
  document.querySelectorAll('[data-loaded-fries]').forEach((card) => {
    const product = getMenuProducts().find((item) => item.id === 'loaded-fries');
    if (!product) return;

    preloadImages(product.variants.map((variant) => variant.image));

    card.querySelectorAll('[data-fries-variant]').forEach((button) => {
      button.addEventListener('click', () => {
        const variant = product.variants.find((item) => item.id === button.dataset.friesVariant);
        if (!variant) return;

        card.querySelectorAll('[data-fries-variant]').forEach((item) => {
          item.classList.toggle('active', item === button);
          item.setAttribute('aria-pressed', String(item === button));
        });

        const image = card.querySelector('[data-fries-image]');
        const description = card.querySelector('[data-fries-description]');
        const ingredients = card.querySelector('[data-fries-ingredients]');
        const badges = card.querySelector('[data-fries-badges]');
        const nextDescription = localized(variant.description) || localized(product.description);

        image.classList.add('is-switching');
        window.setTimeout(() => {
          image.src = variant.image;
          image.alt = `${localized(product.name)} - ${nextDescription}`;
          description.textContent = nextDescription;
          ingredients.innerHTML = (localized(variant.ingredients) || []).map((ingredient) => `<li>${ingredient}</li>`).join('');
          badges.innerHTML = variant.spicy ? `<span>${t('badges.spicy')}</span>` : '';
          image.classList.remove('is-switching');
        }, 140);
      });
    });
  });
}

function renderMenu() {
  const grid = document.querySelector('[data-menu-grid]');
  if (!grid) return;

  const activeCategory = document.querySelector('.category-tab.active')?.dataset.category || 'all';
  const productsSource = getMenuProducts();
  const products = activeCategory === 'all'
    ? productsSource
    : activeCategory === 'drinks'
      ? productsSource.filter((product) => product.category === 'drinks' && product.subcategory !== 'beer')
    : activeCategory === 'beer'
        ? productsSource.filter((product) => product.category === 'beer' || (product.category === 'drinks' && product.subcategory === 'beer'))
        : productsSource.filter((product) => product.category === activeCategory);

  grid.innerHTML = products.length
    ? products.map((product, index) => productCard(product, index, 4)).join('')
    : `<p class="empty-state">${t('menu.empty')}</p>`;

  setupLoadedFriesCards();
  setupScrollRevealTargets();
  observeFadeUp();
}

function renderFeaturedProducts() {
  const grid = document.querySelector('[data-featured-grid]');
  if (!grid) return;
  grid.innerHTML = getMenuProducts().filter((product) => product.featured).map(productCard).join('');
  setupScrollRevealTargets();
  observeFadeUp();
}

function setupCategoryTabs() {
  const tabs = document.querySelectorAll('.category-tab');
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    if (tab.dataset.categoryReady === 'true') return;
    tab.dataset.categoryReady = 'true';
    tab.addEventListener('click', () => {
      tabs.forEach((item) => {
        item.classList.remove('active');
        item.setAttribute('aria-selected', 'false');
        item.setAttribute('aria-pressed', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      tab.setAttribute('aria-pressed', 'true');
      renderMenu();
    });
  });
}

function setupMobileNavigation() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const menu = document.querySelector('[data-nav-menu]');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    toggle.classList.toggle('active', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('nav-open', isOpen);
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    });
  });
}

function setupNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  const update = () => navbar.classList.toggle('scrolled', window.scrollY > 16);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

function setupPageEntrance() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.classList.add('page-ready');
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add('page-ready');
    });
  });
}

function addRevealTargets(selector, step = 0.06, maxDelay = 0.24) {
  document.querySelectorAll(selector).forEach((element, index) => {
    if (!element.classList.contains('fade-up')) {
      element.classList.add('fade-up');
    }

    if (!element.style.getPropertyValue('--delay')) {
      const delay = Math.min(index * step, maxDelay).toFixed(2);
      element.style.setProperty('--delay', `${delay}s`);
    }
  });
}

function setupScrollRevealTargets() {
  addRevealTargets('.kapana-art-copy, .kapana-art-media', 0.08, 0.12);
  addRevealTargets('.story-grid > div', 0.08, 0.12);
  addRevealTargets('.proof-grid article', 0.05, 0.18);
  addRevealTargets('.platform-row .platform-link', 0.05, 0.16);
  addRevealTargets('.menu-intro-card, .category-tabs', 0.04, 0.08);
  addRevealTargets('.order-platform-grid .order-platform-card', 0.06, 0.18);
  addRevealTargets('.visit-card, .contact-grid > section', 0.06, 0.16);
  addRevealTargets('.footer-grid > *', 0.05, 0.15);
}

let fadeObserver;
function observeFadeUp() {
  const items = document.querySelectorAll('.fade-up:not(.visible)');
  if (!items.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('visible'));
    return;
  }

  fadeObserver = fadeObserver || new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

  items.forEach((item) => fadeObserver.observe(item));
}

function setupHeroCanvas() {
  const canvas = document.querySelector('.hero-sparks, #heroCanvas');
  const hero = canvas?.closest('.hero');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canvas || !hero || reduceMotion) return;

  const context = canvas.getContext('2d');
  const density = window.matchMedia('(max-width: 520px)').matches
    ? 38
    : window.matchMedia('(max-width: 920px)').matches
      ? 72
      : 115;
  const particles = Array.from({ length: density }, () => ({}));
  let active = true;
  let frameId = 0;
  let canvasWidth = 1;
  let canvasHeight = 1;

  function reset(particle, initial = false) {
    const bright = Math.random() > 0.84;
    particle.x = canvasWidth * (0.08 + Math.random() * 0.84);
    particle.y = initial
      ? canvasHeight * (0.58 + Math.random() * 0.42)
      : canvasHeight + Math.random() * 44;
    particle.r = bright ? Math.random() * 1.6 + 2.1 : Math.random() * 1.8 + 0.8;
    particle.vx = (Math.random() - 0.5) * 0.42;
    particle.vy = -(Math.random() * 0.85 + 0.42);
    particle.a = bright ? Math.random() * 0.32 + 0.62 : Math.random() * 0.35 + 0.22;
    particle.decay = Math.random() * 0.0032 + 0.0022;
    particle.wobble = Math.random() * Math.PI * 2;
    particle.wobbleSpeed = Math.random() * 0.028 + 0.012;
    particle.color = bright ? '#ffd08a' : (Math.random() > 0.45 ? '#ff7a1a' : '#ff4f0a');
  }

  function resize() {
    const rect = hero.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = Math.max(1, rect.width);
    canvasHeight = Math.max(1, rect.height);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles.forEach((particle) => reset(particle, true));
  }

  function tick() {
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    particles.forEach((particle) => {
      particle.wobble += particle.wobbleSpeed;
      particle.x += particle.vx + Math.sin(particle.wobble) * 0.18;
      particle.y += particle.vy;
      particle.a -= particle.decay;
      if (particle.a <= 0 || particle.y < canvasHeight * 0.18) reset(particle);

      context.save();
      context.globalAlpha = Math.max(0, particle.a);
      context.fillStyle = particle.color;
      context.shadowBlur = particle.r > 2 ? 18 : 10;
      context.shadowColor = '#ff6b00';
      context.beginPath();
      context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      context.fill();
      context.restore();
    });

    if (active) frameId = requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting;
      if (active && !frameId) tick();
      if (!active && frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
    }, { threshold: 0.08 });
    observer.observe(hero);
  } else {
    tick();
  }
}

function setupHeroParallax() {
  const hero = document.querySelector('.hero--collage');
  const background = hero?.querySelector('.hero-bg-image');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 721px)').matches;

  if (!hero || !background || reduceMotion || !desktopPointer) return;

  let frameId = 0;
  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;

  function render() {
    currentX += (targetX - currentX) * 0.12;
    currentY += (targetY - currentY) * 0.12;

    hero.style.setProperty('--hero-parallax-x', `${currentX.toFixed(2)}px`);
    hero.style.setProperty('--hero-parallax-y', `${currentY.toFixed(2)}px`);

    if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
      frameId = requestAnimationFrame(render);
    } else {
      frameId = 0;
    }
  }

  function requestRender() {
    if (!frameId) frameId = requestAnimationFrame(render);
  }

  hero.addEventListener('mousemove', (event) => {
    const rect = hero.getBoundingClientRect();
    const pointerX = (event.clientX - rect.left) / rect.width - 0.5;
    const pointerY = (event.clientY - rect.top) / rect.height - 0.5;
    targetX = pointerX * -14;
    targetY = pointerY * -10;
    requestRender();
  }, { passive: true });

  hero.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
    requestRender();
  });
}

function setupFooterYear() {
  document.querySelectorAll('[data-year]').forEach((item) => {
    item.textContent = new Date().getFullYear();
  });
}

function setupTestimonialBook() {
  const book = document.querySelector('[data-testimonial-book]');
  if (!book) return;

  const pages = [...book.querySelectorAll('[data-book-page]')];
  const prev = book.querySelector('[data-book-prev]');
  const next = book.querySelector('[data-book-next]');
  const status = book.querySelector('[data-book-status]');
  let currentPage = 0;
  let isTurning = false;

  function updateBook() {
    pages.forEach((page, index) => {
      page.classList.toggle('is-active', index === currentPage);
      page.classList.remove('is-turning');
      page.style.zIndex = index === currentPage ? pages.length + 1 : pages.length - index;
    });

    if (prev) prev.disabled = currentPage === 0;
    if (next) next.disabled = currentPage === pages.length - 1;
    if (status) status.textContent = `${currentPage + 1} / ${pages.length}`;
  }

  function turnTo(nextPage) {
    if (isTurning || nextPage === currentPage || nextPage < 0 || nextPage >= pages.length) return;

    isTurning = true;
    const activePage = pages[currentPage];
    activePage?.classList.add('is-turning');

    window.setTimeout(() => {
      currentPage = nextPage;
      isTurning = false;
      updateBook();
    }, 220);
  }

  prev?.addEventListener('click', () => turnTo(currentPage - 1));

  next?.addEventListener('click', () => turnTo(currentPage + 1));

  pages.forEach((page, index) => {
    page.addEventListener('click', () => {
      if (index === currentPage && currentPage < pages.length - 1) turnTo(currentPage + 1);
    });
  });

  updateBook();
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadApiMenu();
  setupPageEntrance();
  setupLanguageSwitcher();
  setupMobileNavigation();
  setupNavbar();
  setupHeroParallax();
  setupHeroCanvas();
  setupFooterYear();
  setupTestimonialBook();
  renderLanguageSwitchers();
  applyTranslations();
  setupScrollRevealTargets();
  renderCategoryTabs();
  setupCategoryTabs();
  renderMenu();
  renderFeaturedProducts();
  observeFadeUp();
});
