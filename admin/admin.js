const SESSION_KEY = 'adminLoggedIn';

const loginPanel = document.querySelector('[data-login-panel]');
const adminPanel = document.querySelector('[data-admin-panel]');
const loginForm = document.querySelector('[data-login-form]');
const loginMessage = document.querySelector('[data-login-message]');
const logoutButton = document.querySelector('[data-logout]');
const tabs = document.querySelectorAll('[data-tab]');
const panels = document.querySelectorAll('[data-panel]');
const imageInput = document.querySelector('[data-image-input]');
const imagePreview = document.querySelector('[data-image-preview]');
const removeImageButton = document.querySelector('[data-remove-image]');
const menuItemsList = document.querySelector('[data-menu-items-list]');
const categoriesList = document.querySelector('[data-categories-list]');
const galleryList = document.querySelector('[data-gallery-list]');

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

function showAdmin() {
  loginPanel.hidden = true;
  adminPanel.hidden = false;
  loadAdminData();
}

function showLogin() {
  adminPanel.hidden = true;
  loginPanel.hidden = false;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return data;
}

async function loadAdminData() {
  await Promise.allSettled([
    loadMenuItems(),
    loadCategories(),
    loadGallery(),
  ]);
}

async function loadMenuItems() {
  if (!menuItemsList) return;
  menuItemsList.innerHTML = '<tr><td colspan="6">Loading menu items...</td></tr>';

  try {
    const data = await fetchJson('/api/admin/menu-items');
    const items = data.items || [];
    menuItemsList.innerHTML = items.length ? items.map((item) => `
      <tr>
        <td>${item.id}</td>
        <td>${escapeHtml(item.name_bg || item.name_en || item.slug)}</td>
        <td>${Number(item.price || 0).toFixed(2)}</td>
        <td>${escapeHtml(item.category_title_bg || item.category_title_en || item.category_slug || '')}</td>
        <td>${item.is_active ? 'Active' : 'Inactive'}</td>
        <td>
          <div class="admin-actions">
            <button type="button">Edit</button>
            <button type="button">Delete</button>
            <button type="button">Toggle active</button>
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
  categoriesList.innerHTML = '<tr><td colspan="5">Loading categories...</td></tr>';

  try {
    const data = await fetchJson('/api/admin/categories');
    const categories = data.categories || [];
    categoriesList.innerHTML = categories.length ? categories.map((category) => `
      <tr>
        <td>${category.id}</td>
        <td>${escapeHtml(category.title_bg || category.title_en || category.slug)}</td>
        <td>${escapeHtml(category.slug)}</td>
        <td>${category.sort_order ?? 0}</td>
        <td>${category.is_active ? 'Active' : 'Inactive'}</td>
      </tr>
    `).join('') : '<tr><td colspan="5">No categories found.</td></tr>';
  } catch (error) {
    categoriesList.innerHTML = `<tr><td colspan="5">${escapeHtml(error.message)}</td></tr>`;
  }
}

async function loadGallery() {
  if (!galleryList) return;
  galleryList.innerHTML = '<tr><td colspan="5">Loading gallery...</td></tr>';

  try {
    const data = await fetchJson('/api/admin/gallery');
    const images = data.images || [];
    galleryList.innerHTML = images.length ? images.map((image) => `
      <tr>
        <td>${image.id}</td>
        <td>${image.image_url ? `<img class="admin-thumb" src="${escapeHtml(image.image_url)}" alt="">` : '<span class="muted">No image</span>'}</td>
        <td>${escapeHtml(image.title || '')}</td>
        <td>${escapeHtml(image.alt || '')}</td>
        <td>${image.is_active ? 'Active' : 'Inactive'}</td>
      </tr>
    `).join('') : '<tr><td colspan="5">No gallery images found.</td></tr>';
  } catch (error) {
    galleryList.innerHTML = `<tr><td colspan="5">${escapeHtml(error.message)}</td></tr>`;
  }
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
    tabs.forEach((item) => item.classList.toggle('active', item === tab));
    panels.forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === tab.dataset.tab));
  });
});

imageInput?.addEventListener('change', () => {
  const file = imageInput.files?.[0];
  if (!file || !imagePreview) return;

  const imageUrl = URL.createObjectURL(file);
  imagePreview.innerHTML = `<img src="${imageUrl}" alt="Selected product preview">`;
});

removeImageButton?.addEventListener('click', () => {
  if (imageInput) imageInput.value = '';
  if (imagePreview) imagePreview.innerHTML = '<span>No image selected</span>';
});

if (localStorage.getItem(SESSION_KEY) === 'true') {
  showAdmin();
}
