const SESSION_KEY = 'adminLoggedIn';

const loginPanel = document.querySelector('[data-login-panel]');
const adminPanel = document.querySelector('[data-admin-panel]');
const loginForm = document.querySelector('[data-login-form]');
const loginMessage = document.querySelector('[data-login-message]');
const adminMessage = document.querySelector('[data-admin-message]');
const logoutButton = document.querySelector('[data-logout]');
const tabs = document.querySelectorAll('[data-tab]');
const panels = document.querySelectorAll('[data-panel]');
const imageInput = document.querySelector('[data-image-input]');
const imagePreview = document.querySelector('[data-image-preview]');
const galleryImageInput = document.querySelector('[data-gallery-image-input]');
const galleryImagePreview = document.querySelector('[data-gallery-image-preview]');
const removeImageButton = document.querySelector('[data-remove-image]');
const menuItemsList = document.querySelector('[data-menu-items-list]');
const categoriesList = document.querySelector('[data-categories-list]');
const galleryList = document.querySelector('[data-gallery-list]');
const menuItemForm = document.querySelector('[data-menu-item-form]');
const categoryForm = document.querySelector('[data-category-form]');
const galleryForm = document.querySelector('[data-gallery-form]');
const categorySelect = menuItemForm?.querySelector('[name="category_id"]');
const friesSpecialNote = document.querySelector('[data-fries-special-note]');
const friesPriceNote = document.querySelector('[data-fries-price-note]');
const menuPreview = document.querySelector('[data-menu-preview]');
const adminToast = document.querySelector('[data-admin-toast]');

const LOADED_FRIES_SLUG = 'loaded-fries';
const LOADED_FRIES_IMAGE = './assets/images/menu/fries/cheddar-fries.webp';
const LOADED_FRIES_IMAGE_KEY = 'images/menu/fries/cheddar-fries.webp';
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const DELETE_CONFIRM_MESSAGE = 'Това ще изтрие елемента завинаги. Сигурни ли сте?';
const META_LANGUAGES = ['bg', 'en', 'fr', 'it', 'es', 'el'];

let menuItems = [];
let categories = [];
let galleryImages = [];
let activeTab = 'menu';
let toastTimer = null;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[char]);
}

function setLoginMessage(message, isError = false) {
  if (!loginMessage) return;
  loginMessage.textContent = message;
  loginMessage.classList.toggle('error', isError);
}

function setAdminMessage(message, isError = false) {
  if (!adminMessage) return;
  adminMessage.textContent = message || '';
  adminMessage.classList.toggle('error', isError);
}

function showToast(message, isError = false) {
  if (!adminToast) return;
  window.clearTimeout(toastTimer);
  adminToast.textContent = message;
  adminToast.hidden = false;
  adminToast.classList.toggle('error', isError);
  requestAnimationFrame(() => adminToast.classList.add('visible'));
  toastTimer = window.setTimeout(() => {
    adminToast.classList.remove('visible');
    window.setTimeout(() => {
      adminToast.hidden = true;
    }, 220);
  }, 3000);
}

function setButtonLoading(button, isLoading, loadingText) {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalText = button.dataset.originalText || button.textContent;
    button.disabled = true;
    button.innerHTML = `<span class="button-spinner" aria-hidden="true"></span>${escapeHtml(loadingText)}`;
    return;
  }
  button.disabled = false;
  button.textContent = button.dataset.originalText || button.textContent;
  delete button.dataset.originalText;
}

function showAdmin() {
  loginPanel.hidden = true;
  adminPanel.hidden = false;
  loadAdminData();
}

function showLogin() {
  adminPanel.hidden = true;
  loginPanel.hidden = false;
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `item-${Date.now()}`;
}

function asInt(value, fallback = 0) {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? number : fallback;
}

function asBool(value) {
  return value ? 1 : 0;
}

function normalizeImageUrl(imageUrl) {
  const value = String(imageUrl || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('/')) return value;
  if (value.startsWith('./')) return `/${value.slice(2)}`;
  if (value.startsWith('assets/')) return `/${value}`;
  return value;
}

function isLoadedFriesItem(item) {
  return item && (
    item.slug === LOADED_FRIES_SLUG
    || item.id === LOADED_FRIES_SLUG
    || item.category_slug === 'fries'
    || item.category === 'fries'
  );
}

function menuItemImageUrl(item) {
  if (isLoadedFriesItem(item)) return item.image_url || LOADED_FRIES_IMAGE;
  return item.image_url || '';
}

function menuItemImageAlt(item) {
  return item.image_alt || item.display_name_bg || item.name_bg || item.name || '';
}

function menuItemDisplayName(item) {
  if (isLoadedFriesItem(item)) return 'Loaded Fries';
  return item.display_name_bg || item.name_bg || item.name || item.name_en || item.slug;
}

function menuItemDisplayCategory(item) {
  if (isLoadedFriesItem(item)) return 'Fries';
  return item.category_title_bg || item.category_title_en || item.category_slug || '';
}

function menuItemDisplayPrice(item) {
  if (isLoadedFriesItem(item)) return `from €${Number(item.price || 5).toFixed(0)}`;
  return Number(item.price || 0).toFixed(2);
}

function confirmHardDelete() {
  return window.confirm(DELETE_CONFIRM_MESSAGE);
}

function validateUploadFile(file) {
  if (!file) throw new Error('Моля, изберете снимка.');
  if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
    throw new Error('Моля, качете JPG, PNG или WEBP снимка.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Снимката е твърде голяма. Максимумът е 5MB.');
  }
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return String(value)
      .split(/\r?\n|,/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
}

function jsonArrayToLines(value) {
  return parseJsonArray(value).join('\n');
}

function linesToJson(value) {
  return JSON.stringify(String(value || '')
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean));
}

function formLinesJson(formData, field) {
  return linesToJson(formData.get(field));
}

function imageMarkup(imageUrl, alt = '', className = 'admin-thumb') {
  const normalized = normalizeImageUrl(imageUrl);
  if (!normalized) return '<span class="muted">No image</span>';
  return `<img class="${className}" src="${escapeHtml(normalized)}" alt="${escapeHtml(alt)}" onerror="this.replaceWith(Object.assign(document.createElement('span'), { className: 'muted', textContent: 'Image not found' }))">`;
}

function setPreview(previewElement, imageUrl, alt = '') {
  if (!previewElement) return;
  const normalized = normalizeImageUrl(imageUrl);
  previewElement.innerHTML = normalized
    ? `<img src="${escapeHtml(normalized)}" alt="${escapeHtml(alt)}" onerror="this.replaceWith(Object.assign(document.createElement('span'), { textContent: 'Image not found' }))">`
    : '<span>No image selected</span>';
}

function updateMenuPreview() {
  if (!menuPreview || !menuItemForm) return;
  const name = menuItemForm.elements.name_bg?.value?.trim() || 'Product preview';
  const description = menuItemForm.elements.description_bg?.value?.trim() || 'Fill the form to preview the item.';
  const price = Number(menuItemForm.elements.price?.value || 0);
  const imageUrl = menuItemForm.elements.image_url?.value || '';
  const categoryOption = categorySelect?.selectedOptions?.[0];
  const category = categoryOption?.textContent?.trim() || 'Menu item';

  const media = menuPreview.querySelector('.admin-preview-media');
  if (media) {
    media.innerHTML = imageUrl
      ? imageMarkup(imageUrl, name, '')
      : '<span>No image</span>';
  }

  menuPreview.querySelector('.admin-preview-category').textContent = category;
  menuPreview.querySelector('h3').textContent = name;
  menuPreview.querySelector('.admin-preview-description').textContent = description;
  menuPreview.querySelector('.admin-preview-price').textContent = price ? `€${price.toFixed(2)}` : '€0';

  const meta = menuPreview.querySelector('[data-menu-preview-meta]');
  if (meta) {
    const ingredients = parseJsonArray(linesToJson(menuItemForm.elements.ingredients_bg?.value || ''));
    const allergens = parseJsonArray(linesToJson(menuItemForm.elements.allergens_bg?.value || ''));
    meta.innerHTML = [
      ingredients.length ? `<div><strong>Ingredients:</strong> ${escapeHtml(ingredients.join(', '))}</div>` : '',
      allergens.length ? `<div><strong>Allergens:</strong> ${escapeHtml(allergens.join(', '))}</div>` : '',
    ].join('');
  }
}

function updateGalleryPreviewFromForm() {
  if (!galleryForm) return;
  setPreview(
    galleryImagePreview,
    galleryForm.elements.image_url?.value || '',
    galleryForm.elements.alt?.value || galleryForm.elements.title?.value || ''
  );
}

function scrollToForm(formElement, focusSelector) {
  if (!formElement) return;
  formElement.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
  const focusTarget = formElement.querySelector(focusSelector || 'input:not([type="hidden"]), select, textarea');
  window.setTimeout(() => focusTarget?.focus({ preventScroll: true }), 350);
}

async function fetchJson(url, options) {
  const method = options?.method || 'GET';
  console.log('[Admin request]', method, url, options?.body ? JSON.parse(options.body) : null);
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  console.log('[Admin response]', method, url, response.status, data);
  if (!response.ok || data.success === false) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return data;
}

async function sendJson(url, method, payload) {
  return fetchJson(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function uploadImage(fileInput, type) {
  const file = fileInput?.files?.[0];
  validateUploadFile(file);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  console.log('[Admin upload request]', '/api/admin/upload', type, file.name, file.type, file.size);
  const response = await fetch('/api/admin/upload', {
    method: 'POST',
    body: formData,
  });
  const data = await response.json().catch(() => ({}));
  console.log('[Admin upload response]', response.status, data);

  if (!response.ok || data.success === false) {
    throw new Error(data.error || `Upload failed: ${response.status}`);
  }

  if (data.warning) console.warn(data.warning);
  return data;
}

async function loadAdminData() {
  await Promise.allSettled([
    loadCategories(),
    loadMenuItems(),
    loadGallery(),
  ]);
}

async function loadMenuItems() {
  if (!menuItemsList) return;
  menuItemsList.innerHTML = '<tr><td colspan="7">Loading menu items...</td></tr>';

  try {
    const data = await fetchJson('/api/admin/menu-items');
    menuItems = data.items || [];
    menuItemsList.innerHTML = menuItems.length ? menuItems.map((item) => `
      <tr>
        <td>${item.id}</td>
        <td>${imageMarkup(menuItemImageUrl(item), menuItemImageAlt(item))}</td>
        <td>${escapeHtml(menuItemDisplayName(item))}</td>
        <td>${escapeHtml(menuItemDisplayPrice(item))}</td>
        <td>${escapeHtml(menuItemDisplayCategory(item))}</td>
        <td>${item.is_active ? 'Active' : 'Inactive'}</td>
        <td>
          <div class="admin-actions">
            <button type="button" data-menu-edit="${item.id}">Edit</button>
            ${isLoadedFriesItem(item) ? '<span class="admin-badge">Special item</span>' : `<button class="danger" type="button" data-menu-delete="${item.id}">Delete</button>`}
            <button type="button" data-menu-toggle="${item.id}">${item.is_active ? 'Hide from site' : 'Show on site'}</button>
          </div>
        </td>
      </tr>
    `).join('') : '<tr><td colspan="7">No menu items found.</td></tr>';
  } catch (error) {
    menuItemsList.innerHTML = `<tr><td colspan="7">${escapeHtml(error.message)}</td></tr>`;
  }
}

async function loadCategories() {
  if (!categoriesList) return;
  categoriesList.innerHTML = '<tr><td colspan="6">Loading categories...</td></tr>';

  try {
    const data = await fetchJson('/api/admin/categories');
    categories = data.categories || [];
    renderCategorySelect();
    categoriesList.innerHTML = categories.length ? categories.map((category) => `
      <tr>
        <td>${category.id}</td>
        <td>${escapeHtml(category.display_title_bg || category.title_bg || category.name || category.title_en || category.slug)}</td>
        <td>${escapeHtml(category.slug)}</td>
        <td>${category.sort_order ?? 0}</td>
        <td>${category.is_active ? 'Active' : 'Inactive'}</td>
        <td>
          <div class="admin-actions">
            <button type="button" data-category-edit="${category.id}">Edit</button>
            <button class="danger" type="button" data-category-delete="${category.id}">Delete</button>
            <button type="button" data-category-toggle="${category.id}">${category.is_active ? 'Hide from site' : 'Show on site'}</button>
          </div>
        </td>
      </tr>
    `).join('') : '<tr><td colspan="6">No categories found.</td></tr>';
  } catch (error) {
    categoriesList.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
  }
}

function renderCategorySelect() {
  if (!categorySelect) return;
  const currentValue = categorySelect.value;
  categorySelect.innerHTML = '<option value="">Select category</option>' + categories.map((category) => `
    <option value="${category.id}">${escapeHtml(category.display_title_bg || category.title_bg || category.name || category.slug)}</option>
  `).join('');
  categorySelect.value = currentValue;
}

async function loadGallery() {
  if (!galleryList) return;
  galleryList.innerHTML = '<tr><td colspan="6">Loading gallery...</td></tr>';

  try {
    const data = await fetchJson('/api/admin/gallery');
    galleryImages = data.images || [];
    console.log('Admin gallery images:', galleryImages);
    galleryList.innerHTML = galleryImages.length ? galleryImages.map((image) => `
      <tr>
        <td>${image.id}</td>
        <td>${imageMarkup(image.image_url, image.alt || image.title || '')}</td>
        <td>${escapeHtml(image.title || '')}</td>
        <td>${escapeHtml(image.alt || '')}</td>
        <td>${image.is_active ? 'Active' : 'Inactive'}</td>
        <td>
          <div class="admin-actions">
            <button type="button" data-gallery-edit="${image.id}">Edit</button>
            <button class="danger" type="button" data-gallery-delete="${image.id}">Delete</button>
            <button type="button" data-gallery-toggle="${image.id}">${image.is_active ? 'Hide from site' : 'Show on site'}</button>
          </div>
        </td>
      </tr>
    `).join('') : '<tr><td colspan="6">No gallery images found.</td></tr>';
  } catch (error) {
    galleryList.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
  }
}

function resetMenuForm() {
  menuItemForm?.reset();
  if (!menuItemForm) return;
  menuItemForm.elements.id.value = '';
  menuItemForm.elements.is_active.checked = true;
  menuItemForm.elements.is_available.checked = true;
  if (friesSpecialNote) friesSpecialNote.hidden = true;
  if (friesPriceNote) friesPriceNote.hidden = true;
  if (menuItemForm.elements.price) menuItemForm.elements.price.disabled = false;
  setPreview(imagePreview, '');
  updateMenuPreview();
}

function fillMenuForm(item) {
  if (!menuItemForm || !item) return;
  resetMenuForm();
  const fields = [
    'id', 'category_id', 'name_bg', 'name_en', 'name_fr', 'name_it', 'name_es', 'name_el',
    'description_bg', 'description_en', 'description_fr', 'description_it', 'description_es',
    'description_el', 'price', 'image_url', 'image_key', 'image_alt', 'sort_order',
  ];
  fields.forEach((field) => {
    if (menuItemForm.elements[field]) menuItemForm.elements[field].value = item[field] ?? '';
  });
  META_LANGUAGES.forEach((language) => {
    const ingredientsField = `ingredients_${language}`;
    const allergensField = `allergens_${language}`;
    if (menuItemForm.elements[ingredientsField]) {
      menuItemForm.elements[ingredientsField].value = jsonArrayToLines(item[ingredientsField]);
    }
    if (menuItemForm.elements[allergensField]) {
      menuItemForm.elements[allergensField].value = jsonArrayToLines(item[allergensField]);
    }
  });
  if (menuItemForm.elements.badges) menuItemForm.elements.badges.value = jsonArrayToLines(item.badges);
  menuItemForm.elements.is_active.checked = Boolean(item.is_active);
  menuItemForm.elements.is_available.checked = item.is_available !== 0;
  if (isLoadedFriesItem(item) && !menuItemForm.elements.image_url.value) {
    menuItemForm.elements.image_url.value = LOADED_FRIES_IMAGE;
    if (menuItemForm.elements.image_key) menuItemForm.elements.image_key.value = LOADED_FRIES_IMAGE_KEY;
  }
  if (friesSpecialNote) friesSpecialNote.hidden = !isLoadedFriesItem(item);
  if (friesPriceNote) friesPriceNote.hidden = !isLoadedFriesItem(item);
  if (menuItemForm.elements.price) menuItemForm.elements.price.disabled = isLoadedFriesItem(item);
  setPreview(imagePreview, menuItemImageUrl(item), item.image_alt || item.name_bg || item.name || 'Loaded Fries');
  updateMenuPreview();
}

function resetCategoryForm() {
  categoryForm?.reset();
  if (!categoryForm) return;
  categoryForm.elements.id.value = '';
  categoryForm.elements.is_active.checked = true;
}

function fillCategoryForm(category) {
  if (!categoryForm || !category) return;
  resetCategoryForm();
  ['id', 'slug', 'name', 'title_bg', 'title_en', 'title_fr', 'title_it', 'title_es', 'title_el', 'sort_order'].forEach((field) => {
    if (categoryForm.elements[field]) categoryForm.elements[field].value = category[field] ?? '';
  });
  categoryForm.elements.is_active.checked = Boolean(category.is_active);
}

function resetGalleryForm() {
  galleryForm?.reset();
  if (!galleryForm) return;
  galleryForm.elements.id.value = '';
  galleryForm.elements.is_active.checked = true;
  setPreview(galleryImagePreview, '');
  updateGalleryPreviewFromForm();
}

function fillGalleryForm(image) {
  if (!galleryForm || !image) return;
  resetGalleryForm();
  ['id', 'title', 'alt', 'image_url', 'image_key', 'sort_order'].forEach((field) => {
    if (galleryForm.elements[field]) galleryForm.elements[field].value = image[field] ?? '';
  });
  galleryForm.elements.is_active.checked = Boolean(image.is_active);
  setPreview(galleryImagePreview, image.image_url, image.alt || image.title || '');
  updateGalleryPreviewFromForm();
}

function menuPayload() {
  const formData = new FormData(menuItemForm);
  const nameBg = formData.get('name_bg')?.trim();
  const nameEn = formData.get('name_en')?.trim();
  const id = formData.get('id')?.trim();
  const currentItem = menuItems.find((item) => String(item.id) === id);
  const isFries = isLoadedFriesItem(currentItem);

  if (!formData.get('category_id')) throw new Error('Category is required.');
  if (!nameBg) throw new Error('BG name is required.');
  if (!isFries && formData.get('price') === '') throw new Error('Price is required.');
  const imageUrl = formData.get('image_url')?.trim();
  const finalImageUrl = imageUrl || (isFries ? LOADED_FRIES_IMAGE : '');
  if (!finalImageUrl) throw new Error('Upload a product image before saving.');

  return {
    category_id: asInt(formData.get('category_id')),
    name_bg: nameBg,
    name_en: nameEn,
    name_fr: formData.get('name_fr')?.trim(),
    name_it: formData.get('name_it')?.trim(),
    name_es: formData.get('name_es')?.trim(),
    name_el: formData.get('name_el')?.trim(),
    description_bg: formData.get('description_bg')?.trim(),
    description_en: formData.get('description_en')?.trim(),
    description_fr: formData.get('description_fr')?.trim(),
    description_it: formData.get('description_it')?.trim(),
    description_es: formData.get('description_es')?.trim(),
    description_el: formData.get('description_el')?.trim(),
    ingredients_bg: formLinesJson(formData, 'ingredients_bg'),
    ingredients_en: formLinesJson(formData, 'ingredients_en'),
    ingredients_fr: formLinesJson(formData, 'ingredients_fr'),
    ingredients_it: formLinesJson(formData, 'ingredients_it'),
    ingredients_es: formLinesJson(formData, 'ingredients_es'),
    ingredients_el: formLinesJson(formData, 'ingredients_el'),
    allergens_bg: formLinesJson(formData, 'allergens_bg'),
    allergens_en: formLinesJson(formData, 'allergens_en'),
    allergens_fr: formLinesJson(formData, 'allergens_fr'),
    allergens_it: formLinesJson(formData, 'allergens_it'),
    allergens_es: formLinesJson(formData, 'allergens_es'),
    allergens_el: formLinesJson(formData, 'allergens_el'),
    badges: formLinesJson(formData, 'badges'),
    price: isFries ? Number(currentItem?.price || 5) : Number(formData.get('price')),
    image_url: finalImageUrl,
    image_key: formData.get('image_key')?.trim() || (isFries ? LOADED_FRIES_IMAGE_KEY : ''),
    image_alt: formData.get('image_alt')?.trim(),
    sort_order: asInt(formData.get('sort_order')),
    is_active: asBool(formData.get('is_active')),
    is_available: asBool(formData.get('is_available')),
  };
}

function categoryPayload() {
  const formData = new FormData(categoryForm);
  const name = formData.get('name')?.trim();
  const slug = formData.get('slug')?.trim() || slugify(name || formData.get('title_bg'));

  if (!name) throw new Error('Category name is required.');
  if (!slug) throw new Error('Category slug is required.');

  return {
    slug,
    name,
    title_bg: formData.get('title_bg')?.trim() || name,
    title_en: formData.get('title_en')?.trim(),
    title_fr: formData.get('title_fr')?.trim(),
    title_it: formData.get('title_it')?.trim(),
    title_es: formData.get('title_es')?.trim(),
    title_el: formData.get('title_el')?.trim(),
    sort_order: asInt(formData.get('sort_order')),
    is_active: asBool(formData.get('is_active')),
  };
}

function galleryPayload() {
  const formData = new FormData(galleryForm);
  const title = formData.get('title')?.trim();
  if (!title) throw new Error('Title is required.');
  const imageUrl = formData.get('image_url')?.trim();
  if (!imageUrl) throw new Error('Upload a gallery image before saving.');

  return {
    title,
    alt: formData.get('alt')?.trim() || title,
    image_url: imageUrl,
    image_key: formData.get('image_key')?.trim(),
    sort_order: asInt(formData.get('sort_order')),
    is_active: asBool(formData.get('is_active')),
  };
}

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const username = formData.get('username');
  const password = formData.get('password');

  setLoginMessage('Checking password...');

  try {
    await fetchJson('/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem(SESSION_KEY, 'true');
    showAdmin();
  } catch (error) {
    localStorage.removeItem(SESSION_KEY);
    setLoginMessage(error.message, true);
  }
});

logoutButton?.addEventListener('click', () => {
  localStorage.removeItem(SESSION_KEY);
  showLogin();
});

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    activeTab = tab.dataset.tab;
    tabs.forEach((item) => item.classList.toggle('active', item === tab));
    panels.forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === activeTab));
  });
});

document.addEventListener('click', async (event) => {
  const target = event.target.closest('button');
  if (!target) return;

  try {
    if (target.matches('[data-new-menu-item]')) {
      resetMenuForm();
      scrollToForm(menuItemForm, '[name="category_id"]');
    }
    if (target.matches('[data-cancel-menu-edit]')) resetMenuForm();
    if (target.matches('[data-new-category]')) {
      resetCategoryForm();
      scrollToForm(categoryForm, '[name="slug"]');
    }
    if (target.matches('[data-cancel-category-edit]')) resetCategoryForm();
    if (target.matches('[data-new-gallery-item]')) {
      resetGalleryForm();
      scrollToForm(galleryForm, '[name="title"]');
    }
    if (target.matches('[data-cancel-gallery-edit]')) resetGalleryForm();

    if (target.matches('[data-replace-image]')) {
      imageInput?.click();
    }

    if (target.matches('[data-upload-menu-image]')) {
      if (target.disabled) return;
      setButtonLoading(target, true, 'Uploading...');
      try {
        const data = await uploadImage(imageInput, 'menu');
        menuItemForm.elements.image_url.value = data.image_url || '';
        menuItemForm.elements.image_key.value = data.image_key || '';
        setPreview(imagePreview, data.image_url, menuItemForm.elements.image_alt?.value || '');
        updateMenuPreview();
        setAdminMessage('Снимката е качена успешно.');
        showToast('Снимката е качена успешно.');
      } finally {
        setButtonLoading(target, false);
      }
    }

    if (target.matches('[data-upload-gallery-image]')) {
      if (target.disabled) return;
      setButtonLoading(target, true, 'Uploading...');
      try {
        const data = await uploadImage(galleryImageInput, 'gallery');
        galleryForm.elements.image_url.value = data.image_url || '';
        galleryForm.elements.image_key.value = data.image_key || '';
        setPreview(galleryImagePreview, data.image_url, galleryForm.elements.alt?.value || galleryForm.elements.title?.value || '');
        setAdminMessage('Снимката е качена успешно.');
        showToast('Снимката е качена успешно.');
      } finally {
        setButtonLoading(target, false);
      }
    }

    if (target.matches('[data-remove-gallery-image]')) {
      if (galleryImageInput) galleryImageInput.value = '';
      if (galleryForm?.elements.image_url) galleryForm.elements.image_url.value = '';
      if (galleryForm?.elements.image_key) galleryForm.elements.image_key.value = '';
      setPreview(galleryImagePreview, '');
    }

    const menuEditId = target.dataset.menuEdit;
    if (menuEditId) {
      fillMenuForm(menuItems.find((item) => String(item.id) === menuEditId));
      scrollToForm(menuItemForm, '[name="category_id"]');
      setAdminMessage('Editing menu item.');
    }

    const menuDeleteId = target.dataset.menuDelete;
    if (menuDeleteId) {
      if (!confirmHardDelete()) return;
      await sendJson('/api/admin/menu-item', 'POST', { action: 'delete', id: menuDeleteId });
      setAdminMessage('Deleted');
      resetMenuForm();
      await loadMenuItems();
    }

    const menuToggleId = target.dataset.menuToggle;
    if (menuToggleId) {
      const item = menuItems.find((entry) => String(entry.id) === menuToggleId);
      await sendJson('/api/admin/menu-item', 'POST', {
        action: 'toggle',
        id: menuToggleId,
      });
      setAdminMessage(item?.is_active ? 'Hidden from site' : 'Shown on site');
      await loadMenuItems();
    }

    const categoryEditId = target.dataset.categoryEdit;
    if (categoryEditId) {
      fillCategoryForm(categories.find((category) => String(category.id) === categoryEditId));
      scrollToForm(categoryForm, '[name="slug"]');
      setAdminMessage('Editing category.');
    }

    const categoryToggleId = target.dataset.categoryToggle;
    if (categoryToggleId) {
      const category = categories.find((entry) => String(entry.id) === categoryToggleId);
      await sendJson('/api/admin/category', 'POST', {
        action: 'toggle',
        id: categoryToggleId,
      });
      setAdminMessage(category?.is_active ? 'Hidden from site' : 'Shown on site');
      await loadCategories();
      await loadMenuItems();
    }

    const categoryDeleteId = target.dataset.categoryDelete;
    if (categoryDeleteId) {
      if (!confirmHardDelete()) return;
      await sendJson('/api/admin/category', 'POST', { action: 'delete', id: categoryDeleteId });
      setAdminMessage('Deleted');
      resetCategoryForm();
      await loadCategories();
      await loadMenuItems();
    }

    const galleryEditId = target.dataset.galleryEdit;
    if (galleryEditId) {
      fillGalleryForm(galleryImages.find((image) => String(image.id) === galleryEditId));
      scrollToForm(galleryForm, '[name="title"]');
      setAdminMessage('Editing gallery item.');
    }

    const galleryDeleteId = target.dataset.galleryDelete;
    if (galleryDeleteId) {
      if (!confirmHardDelete()) return;
      await sendJson('/api/admin/gallery', 'POST', { action: 'delete', id: galleryDeleteId });
      setAdminMessage('Deleted');
      resetGalleryForm();
      await loadGallery();
    }

    const galleryToggleId = target.dataset.galleryToggle;
    if (galleryToggleId) {
      const image = galleryImages.find((entry) => String(entry.id) === galleryToggleId);
      await sendJson('/api/admin/gallery', 'POST', {
        action: 'toggle',
        id: galleryToggleId,
      });
      setAdminMessage(image?.is_active ? 'Hidden from site' : 'Shown on site');
      await loadGallery();
    }
  } catch (error) {
    setAdminMessage(error.message, true);
    showToast(error.message, true);
  }
});

menuItemForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  setAdminMessage('');
  const submitButton = event.submitter || menuItemForm.querySelector('button[type="submit"]');
  if (submitButton?.disabled) return;
  setButtonLoading(submitButton, true, 'Saving...');

  try {
    const id = menuItemForm.elements.id.value;
    const payload = menuPayload();
    await sendJson('/api/admin/menu-item', 'POST', {
      action: id ? 'update' : 'create',
      id,
      ...payload,
    });
    setAdminMessage('Запазено успешно.');
    showToast('Запазено успешно.');
    if (!id) resetMenuForm();
    await loadMenuItems();
  } catch (error) {
    setAdminMessage(error.message, true);
    showToast(error.message, true);
  } finally {
    setButtonLoading(submitButton, false);
  }
});

categoryForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  setAdminMessage('');
  const submitButton = event.submitter || categoryForm.querySelector('button[type="submit"]');
  if (submitButton?.disabled) return;
  setButtonLoading(submitButton, true, 'Saving...');

  try {
    const id = categoryForm.elements.id.value;
    const payload = categoryPayload();
    await sendJson('/api/admin/category', 'POST', {
      action: id ? 'update' : 'create',
      id,
      ...payload,
    });
    setAdminMessage('Запазено успешно.');
    showToast('Запазено успешно.');
    if (!id) resetCategoryForm();
    await loadCategories();
    await loadMenuItems();
  } catch (error) {
    setAdminMessage(error.message, true);
    showToast(error.message, true);
  } finally {
    setButtonLoading(submitButton, false);
  }
});

galleryForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  setAdminMessage('');
  const submitButton = event.submitter || galleryForm.querySelector('button[type="submit"]');
  if (submitButton?.disabled) return;
  setButtonLoading(submitButton, true, 'Saving...');

  try {
    const id = galleryForm.elements.id.value;
    const payload = galleryPayload();
    await sendJson('/api/admin/gallery', 'POST', {
      action: id ? 'update' : 'create',
      id,
      ...payload,
    });
    setAdminMessage('Запазено успешно.');
    showToast('Запазено успешно.');
    if (!id) resetGalleryForm();
    await loadGallery();
  } catch (error) {
    setAdminMessage(error.message, true);
    showToast(error.message, true);
  } finally {
    setButtonLoading(submitButton, false);
  }
});

imageInput?.addEventListener('change', () => {
  const file = imageInput.files?.[0];
  if (!file || !imagePreview) return;
  try {
    validateUploadFile(file);
  } catch (error) {
    imageInput.value = '';
    setAdminMessage(error.message, true);
    showToast(error.message, true);
    return;
  }

  const imageUrl = URL.createObjectURL(file);
  imagePreview.innerHTML = `<img src="${imageUrl}" alt="Selected product preview">`;
  updateMenuPreview();
  const media = menuPreview?.querySelector('.admin-preview-media');
  if (media) media.innerHTML = `<img src="${imageUrl}" alt="Selected product preview">`;
});

galleryImageInput?.addEventListener('change', () => {
  const file = galleryImageInput.files?.[0];
  if (!file || !galleryImagePreview) return;
  try {
    validateUploadFile(file);
  } catch (error) {
    galleryImageInput.value = '';
    setAdminMessage(error.message, true);
    showToast(error.message, true);
    return;
  }

  const imageUrl = URL.createObjectURL(file);
  galleryImagePreview.innerHTML = `<img src="${imageUrl}" alt="Selected gallery preview">`;
});

removeImageButton?.addEventListener('click', () => {
  if (imageInput) imageInput.value = '';
  if (menuItemForm?.elements.image_url) menuItemForm.elements.image_url.value = '';
  if (menuItemForm?.elements.image_key) menuItemForm.elements.image_key.value = '';
  setPreview(imagePreview, '');
});

menuItemForm?.elements.image_url?.addEventListener('input', () => {
  setPreview(imagePreview, menuItemForm.elements.image_url.value, menuItemForm.elements.image_alt?.value || '');
  updateMenuPreview();
});

galleryForm?.elements.image_url?.addEventListener('input', () => {
  setPreview(galleryImagePreview, galleryForm.elements.image_url.value, galleryForm.elements.alt?.value || galleryForm.elements.title?.value || '');
});

['name_bg', 'description_bg', 'price', 'category_id', 'ingredients_bg', 'allergens_bg'].forEach((field) => {
  menuItemForm?.elements[field]?.addEventListener('input', updateMenuPreview);
  menuItemForm?.elements[field]?.addEventListener('change', updateMenuPreview);
});

['title', 'alt'].forEach((field) => {
  galleryForm?.elements[field]?.addEventListener('input', updateGalleryPreviewFromForm);
});

if (localStorage.getItem(SESSION_KEY) === 'true') {
  showAdmin();
}
