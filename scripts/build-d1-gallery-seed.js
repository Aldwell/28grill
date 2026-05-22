const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/gallery-data.js'), 'utf8');
const context = {};

vm.createContext(context);
vm.runInContext(`${source}\nthis.galleryImages = LOCAL_GALLERY_IMAGES;`, context);

function sql(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

const images = context.galleryImages || [];
const lines = ['BEGIN TRANSACTION;'];

images.forEach((image, index) => {
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

lines.push('COMMIT;');

console.log(lines.join('\n\n'));
