const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/menu-data.js'), 'utf8');
const context = {};

vm.createContext(context);
vm.runInContext(`${source}\nthis.menuProducts = menuProducts;`, context);

const products = context.menuProducts || [];
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

const categorySlugs = [...new Set(products.map(productCategory))]
  .sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b));

const lines = [
  'BEGIN TRANSACTION;',
];

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
  const imageUrl = productImage(product);
  lines.push(`INSERT INTO menu_items (
  category_id,
  slug,
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
  image_alt,
  sort_order,
  is_active
)
VALUES (
  (SELECT id FROM categories WHERE slug = ${sql(categorySlug)}),
  ${sql(product.id)},
  ${sql(localized(product.name, 'bg'))},
  ${sql(localized(product.name, 'en'))},
  ${sql(localized(product.name, 'fr'))},
  ${sql(localized(product.name, 'it'))},
  ${sql(localized(product.name, 'es'))},
  ${sql(localized(product.name, 'el'))},
  ${sql(localized(product.description, 'bg'))},
  ${sql(localized(product.description, 'en'))},
  ${sql(localized(product.description, 'fr'))},
  ${sql(localized(product.description, 'it'))},
  ${sql(localized(product.description, 'es'))},
  ${sql(localized(product.description, 'el'))},
  ${Number(productPrice(product))},
  ${sql(imageUrl)},
  ${sql(localized(product.name, 'bg'))},
  ${index + 1},
  ${product.available === false ? 0 : 1}
)
ON CONFLICT(slug) DO UPDATE SET
  category_id = excluded.category_id,
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
  image_alt = excluded.image_alt,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = CURRENT_TIMESTAMP;`);
});

lines.push('COMMIT;');

console.log(lines.join('\n\n'));
