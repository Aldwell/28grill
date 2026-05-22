const loginPanel = document.querySelector('[data-login-panel]');
const adminPanel = document.querySelector('[data-admin-panel]');
const loginForm = document.querySelector('[data-login-form]');
const logoutButton = document.querySelector('[data-logout]');
const tabs = document.querySelectorAll('[data-tab]');
const panels = document.querySelectorAll('[data-panel]');
const imageInput = document.querySelector('[data-image-input]');
const imagePreview = document.querySelector('[data-image-preview]');
const removeImageButton = document.querySelector('[data-remove-image]');

loginForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  loginPanel.hidden = true;
  adminPanel.hidden = false;
});

logoutButton?.addEventListener('click', () => {
  adminPanel.hidden = true;
  loginPanel.hidden = false;
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
