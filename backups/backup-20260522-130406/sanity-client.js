const SANITY_CONFIG = {
  projectId: "",
  dataset: "production",
  apiVersion: "2025-01-01",
  useCdn: true
};

function hasSanityConfig() {
  return Boolean(SANITY_CONFIG.projectId && SANITY_CONFIG.dataset);
}

async function fetchSanityGalleryImages() {
  // TODO: Replace this skeleton with a GROQ fetch when the Sanity project is connected.
  // Keep the returned shape compatible with LOCAL_GALLERY_IMAGES.
  if (!hasSanityConfig()) return null;
  return null;
}

async function fetchSanityMenuItems() {
  // TODO: Fetch menu items from Sanity later and return the same shape as menu-data.js.
  // The site should keep using menu-data.js when Sanity is not configured.
  if (!hasSanityConfig()) return null;
  return null;
}
