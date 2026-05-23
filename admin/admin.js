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

async function loadAdminData() {
  await Promise.allSettled([
    loadCategories(),
    loadMenuItems(),
    loadGallery(),
  ]);
}

async function loadMenuItems() {
  if (!menuItemsList) return;
  menuItemsList.innerHTML = '<tr><td colspan="6">Loading menu items...</td></tr>';

  try {
    const data = await fetchJson('/api/admin/menu-items');
    menuItems = data.items || [];
    menuItemsList.innerHTML = menuItems.length ? menuItems.map((item) => `
      <tr>
        <td>${item.id}</td>
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
    `).join('') : '<tr><td colspan="6">No menu items found.</td></tr>';
  } catch (error) {
    menuItemsList.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
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
    galleryList.innerHTML = galleryImages.length ? galleryImages.map((image) => `
      <tr>
        <td>${image.id}</td>
        <td>${image.image_url ? `<img class="admin-thumb" src="${escapeHtml(image.image_url)}" alt="">` : '<span class="muted">No image</span>'}</td>
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
  if (imagePreview) imagePreview.innerHTML = '<span>No image selected</span>';
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
  if (imagePreview) {
    imagePreview.innerHTML = item.image_url
      ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.image_alt || '')}">`
      : '<span>No image selected</span>';
  }
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
}

function fillGalleryForm(image) {
  if (!galleryForm || !image) return;
  resetGalleryForm();
  ['id', 'title', 'alt', 'image_url', 'sort_order'].forEach((field) => {
    if (galleryForm.elements[field]) galleryForm.elements[field].value = image[field] ?? '';
  });
  galleryForm.elements.is_active.checked = Boolean(image.is_active);
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
    if (target.matches('[data-new-menu-item]')) resetMenuForm();
    if (target.matches('[data-cancel-menu-edit]')) resetMenuForm();
    if (target.matches('[data-new-category]')) resetCategoryForm();
    if (target.matches('[data-cancel-category-edit]')) resetCategoryForm();
    if (target.matches('[data-new-gallery-item]')) resetGalleryForm();
    if (target.matches('[data-cancel-gallery-edit]')) resetGalleryForm();

    const menuEditId = target.dataset.menuEdit;
    if (menuEditId) fillMenuForm(menuItems.find((item) => String(item.id) === menuEditId));

    const menuDeleteId = target.dataset.menuDelete;
    if (menuDeleteId) {
      await sendJson('/api/admin/menu-item', 'POST', { action: 'delete', id: menuDeleteId });
      setAdminMessage('Menu item deactivated.');
      await loadMenuItems();
    }

    const menuToggleId = target.dataset.menuToggle;
    if (menuToggleId) {
      const item = menuItems.find((entry) => String(entry.id) === menuToggleId);
      await sendJson('/api/admin/menu-item', 'POST', {
        action: 'toggle',
        id: menuToggleId,
        is_active: item?.is_active ? 0 : 1,
      });
      setAdminMessage('Menu item active state updated.');
      await loadMenuItems();
    }

    const categoryEditId = target.dataset.categoryEdit;
    if (categoryEditId) fillCategoryForm(categories.find((category) => String(category.id) === categoryEditId));

    const categoryToggleId = target.dataset.categoryToggle;
    if (categoryToggleId) {
      const category = categories.find((entry) => String(entry.id) === categoryToggleId);
      await sendJson('/api/admin/category', 'POST', {
        action: 'toggle',
        id: categoryToggleId,
        is_active: category?.is_active ? 0 : 1,
      });
      setAdminMessage('Category active state updated.');
      await loadCategories();
      await loadMenuItems();
    }

    const galleryEditId = target.dataset.galleryEdit;
    if (galleryEditId) fillGalleryForm(galleryImages.find((image) => String(image.id) === galleryEditId));

    const galleryDeleteId = target.dataset.galleryDelete;
    if (galleryDeleteId) {
      await sendJson('/api/admin/gallery', 'POST', { action: 'delete', id: galleryDeleteId });
      setAdminMessage('Gallery item deactivated.');
      await loadGallery();
    }

    const galleryToggleId = target.dataset.galleryToggle;
    if (galleryToggleId) {
      const image = galleryImages.find((entry) => String(entry.id) === galleryToggleId);
      await sendJson('/api/admin/gallery', 'POST', {
        action: 'toggle',
        id: galleryToggleId,
        is_active: image?.is_active ? 0 : 1,
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

removeImageButton?.addEventListener('click', () => {
  if (imageInput) imageInput.value = '';
  if (menuItemForm?.elements.image_url) menuItemForm.elements.image_url.value = '';
  if (menuItemForm?.elements.image_key) menuItemForm.elements.image_key.value = '';
  if (imagePreview) imagePreview.innerHTML = '<span>No image selected</span>';
});

if (localStorage.getItem(SESSION_KEY) === 'true') {
  showAdmin();
}
