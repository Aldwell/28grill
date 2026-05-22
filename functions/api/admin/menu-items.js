export async function onRequestGet(context) {
  const db = context.env.DB;

  if (!db) {
    return Response.json({ success: false, error: "Missing DB binding" }, { status: 500 });
  }

  try {
    let items;

    try {
      items = await db.prepare(`
        SELECT
          menu_items.*,
          COALESCE(menu_items.name_bg, menu_items.name, menu_items.slug) AS display_name_bg,
          COALESCE(menu_items.description_bg, menu_items.description, '') AS display_description_bg,
          categories.slug AS category_slug,
          COALESCE(categories.title_bg, categories.name, categories.slug) AS category_title_bg,
          COALESCE(categories.title_en, categories.name, categories.slug) AS category_title_en
        FROM menu_items
        LEFT JOIN categories ON categories.id = menu_items.category_id
        ORDER BY menu_items.sort_order ASC, menu_items.id ASC
      `).all();
    } catch (error) {
      items = await db.prepare(`
        SELECT
          menu_items.*,
          COALESCE(menu_items.name_bg, menu_items.slug) AS display_name_bg,
          COALESCE(menu_items.description_bg, '') AS display_description_bg,
          categories.slug AS category_slug,
          COALESCE(categories.title_bg, categories.slug) AS category_title_bg,
          COALESCE(categories.title_en, categories.slug) AS category_title_en
        FROM menu_items
        LEFT JOIN categories ON categories.id = menu_items.category_id
        ORDER BY menu_items.sort_order ASC, menu_items.id ASC
      `).all();
    }

    return Response.json({ success: true, items: items.results || [] });
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
