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

let menuItems = [];
let categories = [];
let galleryImages = [];
let activeTab = 'menu';

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
  if (!file) throw new Error('Choose an image first.');

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
        <td>${imageMarkup(item.image_url, item.image_alt || item.display_name_bg || item.name_bg || '')}</td>
        <td>${escapeHtml(item.display_name_bg || item.name_bg || item.name || item.name_en || item.slug)}</td>
        <td>${Number(item.price || 0).toFixed(2)}</td>
        <td>${escapeHtml(item.category_title_bg || item.category_title_en || item.category_slug || '')}</td>
        <td>${item.is_active ? 'Active' : 'Inactive'}</td>
        <td>
          <div class="admin-actions">
            <button type="button" data-menu-edit="${item.id}">Edit</button>
            <button type="button" data-menu-delete="${item.id}">Delete</button>
            <button type="button" data-menu-toggle="${item.id}">Toggle active</button>
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
            <button type="button" data-category-delete="${category.id}">Delete</button>
            <button type="button" data-category-toggle="${category.id}">Toggle active</button>
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
            <button type="button" data-gallery-delete="${image.id}">Delete</button>
            <button type="button" data-gallery-toggle="${image.id}">Toggle active</button>
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
  setPreview(imagePreview, '');
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
  menuItemForm.elements.is_active.checked = Boolean(item.is_active);
  menuItemForm.elements.is_available.checked = item.is_available !== 0;
  setPreview(imagePreview, item.image_url, item.image_alt || item.name_bg || item.name || '');
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
}

function fillGalleryForm(image) {
  if (!galleryForm || !image) return;
  resetGalleryForm();
  ['id', 'title', 'alt', 'image_url', 'image_key', 'sort_order'].forEach((field) => {
    if (galleryForm.elements[field]) galleryForm.elements[field].value = image[field] ?? '';
  });
  galleryForm.elements.is_active.checked = Boolean(image.is_active);
  setPreview(galleryImagePreview, image.image_url, image.alt || image.title || '');
}

function menuPayload() {
  const formData = new FormData(menuItemForm);
  const nameBg = formData.get('name_bg')?.trim();
  const nameEn = formData.get('name_en')?.trim();

  if (!formData.get('category_id')) throw new Error('Category is required.');
  if (!nameBg && !nameEn) throw new Error('Name BG or Name EN is required.');
  if (formData.get('price') === '') throw new Error('Price is required.');

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
    price: Number(formData.get('price')),
    image_url: formData.get('image_url')?.trim(),
    image_key: formData.get('image_key')?.trim(),
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
  const imageUrl = formData.get('image_url')?.trim();
  if (!imageUrl) throw new Error('Image URL is required.');

  return {
    title: formData.get('title')?.trim(),
    alt: formData.get('alt')?.trim(),
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
      const data = await uploadImage(imageInput, 'menu');
      menuItemForm.elements.image_url.value = data.image_url || '';
      menuItemForm.elements.image_key.value = data.image_key || '';
      setPreview(imagePreview, data.image_url, menuItemForm.elements.image_alt?.value || '');
      setAdminMessage('Menu image uploaded.');
    }

    if (target.matches('[data-upload-gallery-image]')) {
      const data = await uploadImage(galleryImageInput, 'gallery');
      galleryForm.elements.image_url.value = data.image_url || '';
      galleryForm.elements.image_key.value = data.image_key || '';
      setPreview(galleryImagePreview, data.image_url, galleryForm.elements.alt?.value || galleryForm.elements.title?.value || '');
      setAdminMessage('Gallery image uploaded.');
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
      await sendJson('/api/admin/menu-item', 'POST', { action: 'delete', id: menuDeleteId });
      setAdminMessage('Menu item deleted.');
      resetMenuForm();
      await loadMenuItems();
    }

    const menuToggleId = target.dataset.menuToggle;
    if (menuToggleId) {
      await sendJson('/api/admin/menu-item', 'POST', {
        action: 'toggle',
        id: menuToggleId,
      });
      setAdminMessage('Menu item active state updated.');
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
      await sendJson('/api/admin/category', 'POST', {
        action: 'toggle',
        id: categoryToggleId,
      });
      setAdminMessage('Category active state updated.');
      await loadCategories();
      await loadMenuItems();
    }

    const categoryDeleteId = target.dataset.categoryDelete;
    if (categoryDeleteId) {
      await sendJson('/api/admin/category', 'POST', { action: 'delete', id: categoryDeleteId });
      setAdminMessage('Category deleted.');
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
      await sendJson('/api/admin/gallery', 'POST', { action: 'delete', id: galleryDeleteId });
      setAdminMessage('Gallery item deleted.');
      resetGalleryForm();
      await loadGallery();
    }

    const galleryToggleId = target.dataset.galleryToggle;
    if (galleryToggleId) {
      await sendJson('/api/admin/gallery', 'POST', {
        action: 'toggle',
        id: galleryToggleId,
      });
      setAdminMessage('Gallery active state updated.');
      await loadGallery();
    }
  } catch (error) {
    setAdminMessage(error.message, true);
  }
});

menuItemForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  setAdminMessage('');

  try {
    const id = menuItemForm.elements.id.value;
    const payload = menuPayload();
    await sendJson('/api/admin/menu-item', 'POST', {
      action: id ? 'update' : 'create',
      id,
      ...payload,
    });
    setAdminMessage(id ? 'Menu item updated.' : 'Menu item created.');
    if (!id) resetMenuForm();
    await loadMenuItems();
  } catch (error) {
    setAdminMessage(error.message, true);
  }
});

categoryForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  setAdminMessage('');

  try {
    const id = categoryForm.elements.id.value;
    const payload = categoryPayload();
    await sendJson('/api/admin/category', 'POST', {
      action: id ? 'update' : 'create',
      id,
      ...payload,
    });
    setAdminMessage(id ? 'Category updated.' : 'Category created.');
    if (!id) resetCategoryForm();
    await loadCategories();
    await loadMenuItems();
  } catch (error) {
    setAdminMessage(error.message, true);
  }
});

galleryForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  setAdminMessage('');

  try {
    const id = galleryForm.elements.id.value;
    const payload = galleryPayload();
    await sendJson('/api/admin/gallery', 'POST', {
      action: id ? 'update' : 'create',
      id,
      ...payload,
    });
    setAdminMessage(id ? 'Gallery item updated.' : 'Gallery item created.');
    if (!id) resetGalleryForm();
    await loadGallery();
  } catch (error) {
    setAdminMessage(error.message, true);
  }
});

imageInput?.addEventListener('change', () => {
  const file = imageInput.files?.[0];
  if (!file || !imagePreview) return;

  const imageUrl = URL.createObjectURL(file);
  imagePreview.innerHTML = `<img src="${imageUrl}" alt="Selected product preview">`;
});

galleryImageInput?.addEventListener('change', () => {
  const file = galleryImageInput.files?.[0];
  if (!file || !galleryImagePreview) return;

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
});

galleryForm?.elements.image_url?.addEventListener('input', () => {
  setPreview(galleryImagePreview, galleryForm.elements.image_url.value, galleryForm.elements.alt?.value || galleryForm.elements.title?.value || '');
});

if (localStorage.getItem(SESSION_KEY) === 'true') {
  showAdmin();
}
