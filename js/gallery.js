(function () {
  const grid = document.querySelector("[data-gallery-grid]");
  const lightbox = document.querySelector("[data-gallery-lightbox]");
  const lightboxImage = document.querySelector("[data-lightbox-image]");
  const lightboxCaption = document.querySelector("[data-lightbox-caption]");
  const closeButton = document.querySelector("[data-lightbox-close]");
  const prevButton = document.querySelector("[data-lightbox-prev]");
  const nextButton = document.querySelector("[data-lightbox-next]");
  let galleryItems = [];
  let activeIndex = 0;

  function getLocalImages() {
    return typeof LOCAL_GALLERY_IMAGES !== "undefined" && Array.isArray(LOCAL_GALLERY_IMAGES)
      ? LOCAL_GALLERY_IMAGES
      : [];
  }

  async function getGalleryImages() {
    try {
      const response = await fetch("/api/gallery", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || `Gallery API failed: ${response.status}`);
      }

      console.log("Public gallery API images:", data.images);
      return (data.images || []).map((image) => ({
        src: image.image_url,
        alt: image.alt || image.title || "28 GRILL gallery image",
        category: image.category || "gallery",
        order: image.sort_order,
        isActive: true,
      }));
    } catch (error) {
      console.warn("Gallery API unavailable, using local fallback.", error);
    }

    console.log("Using fallback gallery:", getLocalImages());
    return getLocalImages();
  }

  function normalizeImages(images) {
    return images
      .filter((item) => item && item.isActive === true && item.src)
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  }

  function renderGallery(images) {
    if (!grid) return;
    galleryItems = normalizeImages(images);

    grid.innerHTML = galleryItems.map((item, index) => `
      <button class="gallery-card fade-up" type="button" data-gallery-index="${index}" aria-label="${item.alt}">
        <img src="${item.src}" alt="${item.alt}" loading="lazy" decoding="async">
      </button>
    `).join("");

    setupScrollRevealTargets?.();
    observeFadeUp?.();
  }

  function updateLightbox() {
    const item = galleryItems[activeIndex];
    if (!item || !lightboxImage) return;
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt;
    if (lightboxCaption) lightboxCaption.textContent = item.alt;
  }

  function openLightbox(index) {
    if (!lightbox || !galleryItems[index]) return;
    activeIndex = index;
    updateLightbox();
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    closeButton?.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
  }

  function moveLightbox(offset) {
    if (!galleryItems.length) return;
    activeIndex = (activeIndex + offset + galleryItems.length) % galleryItems.length;
    updateLightbox();
  }

  function setupLightbox() {
    grid?.addEventListener("click", (event) => {
      const card = event.target.closest("[data-gallery-index]");
      if (!card) return;
      openLightbox(Number(card.dataset.galleryIndex));
    });

    closeButton?.addEventListener("click", closeLightbox);
    prevButton?.addEventListener("click", () => moveLightbox(-1));
    nextButton?.addEventListener("click", () => moveLightbox(1));

    lightbox?.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", (event) => {
      if (!lightbox || lightbox.hidden) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") moveLightbox(-1);
      if (event.key === "ArrowRight") moveLightbox(1);
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    setupLightbox();
    renderGallery(await getGalleryImages());
  });
})();
