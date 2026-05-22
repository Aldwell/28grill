BEGIN TRANSACTION;

INSERT INTO gallery_images (title, alt, image_url, image_key, sort_order, is_active)
SELECT '28 GRILL burger photo', '28 GRILL burger photo', 'assets/gallery/gallery-1.webp', 'gallery-1', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM gallery_images WHERE image_url = 'assets/gallery/gallery-1.webp');

UPDATE gallery_images
SET
  title = '28 GRILL burger photo',
  alt = '28 GRILL burger photo',
  image_key = 'gallery-1',
  sort_order = 1,
  is_active = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE image_url = 'assets/gallery/gallery-1.webp';

INSERT INTO gallery_images (title, alt, image_url, image_key, sort_order, is_active)
SELECT '28 GRILL smash burger', '28 GRILL smash burger', 'assets/gallery/gallery-2.webp', 'gallery-2', 2, 1
WHERE NOT EXISTS (SELECT 1 FROM gallery_images WHERE image_url = 'assets/gallery/gallery-2.webp');

UPDATE gallery_images
SET
  title = '28 GRILL smash burger',
  alt = '28 GRILL smash burger',
  image_key = 'gallery-2',
  sort_order = 2,
  is_active = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE image_url = 'assets/gallery/gallery-2.webp';

INSERT INTO gallery_images (title, alt, image_url, image_key, sort_order, is_active)
SELECT '28 GRILL crispy burger', '28 GRILL crispy burger', 'assets/gallery/gallery-3.webp', 'gallery-3', 3, 1
WHERE NOT EXISTS (SELECT 1 FROM gallery_images WHERE image_url = 'assets/gallery/gallery-3.webp');

UPDATE gallery_images
SET
  title = '28 GRILL crispy burger',
  alt = '28 GRILL crispy burger',
  image_key = 'gallery-3',
  sort_order = 3,
  is_active = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE image_url = 'assets/gallery/gallery-3.webp';

INSERT INTO gallery_images (title, alt, image_url, image_key, sort_order, is_active)
SELECT '28 GRILL Kapana moment', '28 GRILL Kapana moment', 'assets/gallery/gallery-4.webp', 'gallery-4', 4, 1
WHERE NOT EXISTS (SELECT 1 FROM gallery_images WHERE image_url = 'assets/gallery/gallery-4.webp');

UPDATE gallery_images
SET
  title = '28 GRILL Kapana moment',
  alt = '28 GRILL Kapana moment',
  image_key = 'gallery-4',
  sort_order = 4,
  is_active = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE image_url = 'assets/gallery/gallery-4.webp';

COMMIT;
