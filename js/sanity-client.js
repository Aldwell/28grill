const SANITY_CONFIG = {
  projectId: "90dh9czw",
  dataset: "production",
  apiVersion: "2025-01-01",
  useCdn: true
};

console.log("Sanity connected:", SANITY_CONFIG.projectId);

function hasSanityConfig() {
  return Boolean(SANITY_CONFIG.projectId && SANITY_CONFIG.dataset);
}

function sanityApiBase() {
  const host = "api.sanity.io";
  return `https://${SANITY_CONFIG.projectId}.${host}/v${SANITY_CONFIG.apiVersion}/data/query/${SANITY_CONFIG.dataset}`;
}

function sanityAssetUrl(asset, options = {}) {
  const ref = asset?._ref || asset?.asset?._ref;
  if (!hasSanityConfig() || !ref || !ref.startsWith("image-")) return "";

  const [, id, dimensions, format] = ref.match(/^image-(.+)-(\d+x\d+)-(\w+)$/) || [];
  if (!id || !dimensions || !format) return "";

  const params = new URLSearchParams({
    auto: "format",
    q: String(options.quality || 80)
  });

  if (options.width) params.set("w", String(options.width));

  return `https://cdn.sanity.io/images/${SANITY_CONFIG.projectId}/${SANITY_CONFIG.dataset}/${id}-${dimensions}.${format}?${params}`;
}

async function fetchSanityQuery(query) {
  if (!hasSanityConfig()) return null;

  const url = `${sanityApiBase()}?query=${encodeURIComponent(query)}`;
  console.log("Sanity query URL:", url);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Sanity request failed: ${response.status}`);

  const payload = await response.json();
  return Array.isArray(payload.result) ? payload.result : null;
}

async function fetchSanityGalleryImages() {
  const query = `*[_type == "galleryImage"] | order(order asc) {
    _id,
    title,
    alt,
    order,
    isActive,
    "assetUrl": image.asset->url,
    category,
    image
  }`;
  const items = await fetchSanityQuery(query);
  console.log("Raw Sanity gallery documents:", items);
  if (!items?.length) return null;

  return items.map((item) => ({
    src: item.assetUrl || sanityAssetUrl(item.image, { width: 1200, quality: 80 }),
    alt: item.alt || item.title || "28 GRILL gallery image",
    category: item.category || "gallery",
    order: Number(item.order) || 0,
    isActive: item.isActive !== false
  })).filter((item) => item.src && item.isActive);
}

function localizedIngredientList(ingredients) {
  if (!Array.isArray(ingredients)) return undefined;
  const languages = ["bg", "en", "fr", "it", "es", "el"];

  return Object.fromEntries(languages.map((language) => [
    language,
    ingredients.map((item) => {
      if (typeof item === "string") return item;
      return item?.[language] || item?.bg || item?.en || "";
    }).filter(Boolean)
  ]));
}
