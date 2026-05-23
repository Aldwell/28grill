const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

function loadScript(file, exposeCode) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${source}\n${exposeCode}`, context);
  return context;
}

function sql(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function localized(value, lang) {
  if (!value || typeof value !== 'object') return value || '';
  return value[lang] || value.bg || value.en || '';
}

function productCategory(product) {
  if (product.category === 'drinks' && product.subcategory === 'beer') return 'beer';
  return product.category;
}

function productPrice(product) {
  return product.prices?.itemEUR || product.prices?.burgerEUR || product.prices?.menuEUR || 0;
}

function productImage(product) {
  if (product.id === 'loaded-fries') return product.variants?.[0]?.image || '';
  return product.image || '';
}

function imageKey(imagePath) {
  return String(imagePath || '').replace(/^\.?\//, '').replace(/^assets\//, '');
}

const menuContext = loadScript('js/menu-data.js', 'this.menuProducts = menuProducts;');
const galleryContext = loadScript('js/gallery-data.js', 'this.galleryImages = LOCAL_GALLERY_IMAGES;');

const products = menuContext.menuProducts || [];
const galleryImages = galleryContext.galleryImages || [];
const categoryOrder = ['smash', 'simple', 'chicken', 'veggie', 'fries', 'drinks', 'beer'];
const categoryTitles = {
  smash: ['Smash', 'Smash', 'Smash', 'Smash', 'Smash', 'Smash'],
  simple: ['Simple', 'Simple', 'Simple', 'Simple', 'Simple', 'Simple'],
  chicken: ['Пилешко', 'Chicken', 'Poulet', 'Pollo', 'Pollo', 'Κοτόπουλο'],
  veggie: ['Veggie', 'Veggie', 'Veggie', 'Veggie', 'Veggie', 'Veggie'],
  fries: ['Fries', 'Fries', 'Frites', 'Patatine', 'Patatas', 'Πατάτες'],
  drinks: ['Безалкохолни', 'Soft Drinks', 'Boissons Sans Alcool', 'Bevande Analcoliche', 'Bebidas Sin Alcohol', 'Αναψυκτικά'],
  beer: ['Бира', 'Beer', 'Bière', 'Birra', 'Cerveza', 'Μπίρα'],
};

const categorySlugs = [...new Set(products.map(productCategory))]
  .sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b));

const lines = [];

categorySlugs.forEach((slug, index) => {
  const [bg, en, fr, it, es, el] = categoryTitles[slug] || [slug, slug, slug, slug, slug, slug];
  lines.push(`INSERT INTO categories (name, slug, title_bg, title_en, title_fr, title_it, title_es, title_el, sort_order, is_active)
VALUES (${sql(bg)}, ${sql(slug)}, ${sql(bg)}, ${sql(en)}, ${sql(fr)}, ${sql(it)}, ${sql(es)}, ${sql(el)}, ${index + 1}, 1)
ON CONFLICT(slug) DO UPDATE SET
  name = excluded.name,
  title_bg = excluded.title_bg,
  title_en = excluded.title_en,
  title_fr = excluded.title_fr,
  title_it = excluded.title_it,
  title_es = excluded.title_es,
  title_el = excluded.title_el,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = CURRENT_TIMESTAMP;`);
});

products.forEach((product, index) => {
  const categorySlug = productCategory(product);
  const nameBg = localized(product.name, 'bg');
  const descriptionBg = localized(product.description, 'bg');
  const imageUrl = productImage(product);

  lines.push(`INSERT INTO menu_items (
  category_id,
  slug,
  name,
  description,
  name_bg,
  name_en,
  name_fr,
  name_it,
  name_es,
  name_el,
  description_bg,
  description_en,
  description_fr,
  description_it,
  description_es,
  description_el,
  price,
  image_url,
  image_key,
  image_alt,
  sort_order,
  is_active,
  is_available
)
VALUES (
  (SELECT id FROM categories WHERE slug = ${sql(categorySlug)}),
  ${sql(product.id)},
  ${sql(nameBg)},
  ${sql(descriptionBg)},
  ${sql(nameBg)},
  ${sql(localized(product.name, 'en'))},
  ${sql(localized(product.name, 'fr'))},
  ${sql(localized(product.name, 'it'))},
  ${sql(localized(product.name, 'es'))},
  ${sql(localized(product.name, 'el'))},
  ${sql(descriptionBg)},
  ${sql(localized(product.description, 'en'))},
  ${sql(localized(product.description, 'fr'))},
  ${sql(localized(product.description, 'it'))},
  ${sql(localized(product.description, 'es'))},
  ${sql(localized(product.description, 'el'))},
  ${Number(productPrice(product))},
  ${sql(imageUrl)},
  ${sql(imageKey(imageUrl))},
  ${sql(nameBg)},
  ${index + 1},
  ${product.available === false ? 0 : 1},
  ${product.available === false ? 0 : 1}
)
ON CONFLICT(slug) DO UPDATE SET
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  name_bg = excluded.name_bg,
  name_en = excluded.name_en,
  name_fr = excluded.name_fr,
  name_it = excluded.name_it,
  name_es = excluded.name_es,
  name_el = excluded.name_el,
  description_bg = excluded.description_bg,
  description_en = excluded.description_en,
  description_fr = excluded.description_fr,
  description_it = excluded.description_it,
  description_es = excluded.description_es,
  description_el = excluded.description_el,
  price = excluded.price,
  image_url = excluded.image_url,
  image_key = excluded.image_key,
  image_alt = excluded.image_alt,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  is_available = excluded.is_available,
  updated_at = CURRENT_TIMESTAMP;`);
});

galleryImages.forEach((image, index) => {
  const title = image.alt || `Gallery image ${index + 1}`;
  const sortOrder = Number(image.order) || index + 1;
  const slugKey = `gallery-${sortOrder}`;

  lines.push(`INSERT INTO gallery_images (title, alt, image_url, image_key, sort_order, is_active)
SELECT ${sql(title)}, ${sql(image.alt || title)}, ${sql(image.src)}, ${sql(slugKey)}, ${sortOrder}, ${image.isActive === false ? 0 : 1}
WHERE NOT EXISTS (SELECT 1 FROM gallery_images WHERE image_url = ${sql(image.src)});

UPDATE gallery_images
SET
  title = ${sql(title)},
  alt = ${sql(image.alt || title)},
  image_key = ${sql(slugKey)},
  sort_order = ${sortOrder},
  is_active = ${image.isActive === false ? 0 : 1},
  updated_at = CURRENT_TIMESTAMP
WHERE image_url = ${sql(image.src)};`);
});

console.log(lines.join('\n\n'));
