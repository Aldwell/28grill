CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  title_bg TEXT,
  title_en TEXT,
  title_fr TEXT,
  title_it TEXT,
  title_es TEXT,
  title_el TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  name_bg TEXT,
  name_en TEXT,
  name_fr TEXT,
  name_it TEXT,
  name_es TEXT,
  name_el TEXT,
  description_bg TEXT,
  description_en TEXT,
  description_fr TEXT,
  description_it TEXT,
  description_es TEXT,
  description_el TEXT,
  ingredients_bg TEXT DEFAULT '[]',
  ingredients_en TEXT DEFAULT '[]',
  ingredients_fr TEXT DEFAULT '[]',
  ingredients_it TEXT DEFAULT '[]',
  ingredients_es TEXT DEFAULT '[]',
  ingredients_el TEXT DEFAULT '[]',
  allergens_bg TEXT DEFAULT '[]',
  allergens_en TEXT DEFAULT '[]',
  allergens_fr TEXT DEFAULT '[]',
  allergens_it TEXT DEFAULT '[]',
  allergens_es TEXT DEFAULT '[]',
  allergens_el TEXT DEFAULT '[]',
  badges TEXT DEFAULT '[]',
  price REAL NOT NULL DEFAULT 0,
  image_url TEXT,
  image_key TEXT,
  image_alt TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_available INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_active_order ON menu_items(is_active, sort_order);

CREATE TABLE IF NOT EXISTS gallery_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  alt TEXT,
  image_url TEXT NOT NULL,
  image_key TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gallery_images_active_order ON gallery_images(is_active, sort_order);
