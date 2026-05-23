ALTER TABLE menu_items ADD COLUMN ingredients_bg TEXT DEFAULT '[]';
ALTER TABLE menu_items ADD COLUMN ingredients_en TEXT DEFAULT '[]';
ALTER TABLE menu_items ADD COLUMN ingredients_fr TEXT DEFAULT '[]';
ALTER TABLE menu_items ADD COLUMN ingredients_it TEXT DEFAULT '[]';
ALTER TABLE menu_items ADD COLUMN ingredients_es TEXT DEFAULT '[]';
ALTER TABLE menu_items ADD COLUMN ingredients_el TEXT DEFAULT '[]';

ALTER TABLE menu_items ADD COLUMN allergens_bg TEXT DEFAULT '[]';
ALTER TABLE menu_items ADD COLUMN allergens_en TEXT DEFAULT '[]';
ALTER TABLE menu_items ADD COLUMN allergens_fr TEXT DEFAULT '[]';
ALTER TABLE menu_items ADD COLUMN allergens_it TEXT DEFAULT '[]';
ALTER TABLE menu_items ADD COLUMN allergens_es TEXT DEFAULT '[]';
ALTER TABLE menu_items ADD COLUMN allergens_el TEXT DEFAULT '[]';

ALTER TABLE menu_items ADD COLUMN badges TEXT DEFAULT '[]';
