-- Production D1 schema upgrade for the custom admin.
-- Run this once on the existing production database that still has the old simple schema.

ALTER TABLE categories ADD COLUMN title_bg TEXT;
ALTER TABLE categories ADD COLUMN title_en TEXT;
ALTER TABLE categories ADD COLUMN title_fr TEXT;
ALTER TABLE categories ADD COLUMN title_it TEXT;
ALTER TABLE categories ADD COLUMN title_es TEXT;
ALTER TABLE categories ADD COLUMN title_el TEXT;
ALTER TABLE categories ADD COLUMN is_active INTEGER DEFAULT 1;
ALTER TABLE categories ADD COLUMN updated_at TEXT;

UPDATE categories
SET
  title_bg = COALESCE(title_bg, name),
  title_en = COALESCE(title_en, name),
  title_fr = COALESCE(title_fr, name),
  title_it = COALESCE(title_it, name),
  title_es = COALESCE(title_es, name),
  title_el = COALESCE(title_el, name),
  is_active = COALESCE(is_active, 1),
  updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP);

ALTER TABLE menu_items ADD COLUMN name_bg TEXT;
ALTER TABLE menu_items ADD COLUMN name_en TEXT;
ALTER TABLE menu_items ADD COLUMN name_fr TEXT;
ALTER TABLE menu_items ADD COLUMN name_it TEXT;
ALTER TABLE menu_items ADD COLUMN name_es TEXT;
ALTER TABLE menu_items ADD COLUMN name_el TEXT;
ALTER TABLE menu_items ADD COLUMN description_bg TEXT;
ALTER TABLE menu_items ADD COLUMN description_en TEXT;
ALTER TABLE menu_items ADD COLUMN description_fr TEXT;
ALTER TABLE menu_items ADD COLUMN description_it TEXT;
ALTER TABLE menu_items ADD COLUMN description_es TEXT;
ALTER TABLE menu_items ADD COLUMN description_el TEXT;
ALTER TABLE menu_items ADD COLUMN image_key TEXT;
ALTER TABLE menu_items ADD COLUMN image_alt TEXT;
ALTER TABLE menu_items ADD COLUMN is_available INTEGER DEFAULT 1;
ALTER TABLE menu_items ADD COLUMN updated_at TEXT;

UPDATE menu_items
SET
  name_bg = COALESCE(name_bg, name),
  name_en = COALESCE(name_en, name),
  name_fr = COALESCE(name_fr, name),
  name_it = COALESCE(name_it, name),
  name_es = COALESCE(name_es, name),
  name_el = COALESCE(name_el, name),
  description_bg = COALESCE(description_bg, description),
  description_en = COALESCE(description_en, description),
  description_fr = COALESCE(description_fr, description),
  description_it = COALESCE(description_it, description),
  description_es = COALESCE(description_es, description),
  description_el = COALESCE(description_el, description),
  is_available = COALESCE(is_available, 1),
  updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP);

ALTER TABLE gallery_images ADD COLUMN image_key TEXT;
ALTER TABLE gallery_images ADD COLUMN alt TEXT;
ALTER TABLE gallery_images ADD COLUMN updated_at TEXT;

UPDATE gallery_images
SET
  alt = COALESCE(alt, title),
  updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP);
