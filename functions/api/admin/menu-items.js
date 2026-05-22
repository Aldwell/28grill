export async function onRequestGet(context) {
  const db = context.env.DB;

  if (!db) {
    return Response.json({ success: false, error: "Missing DB binding" }, { status: 500 });
  }

  try {
    const items = await db.prepare(`
      SELECT
        menu_items.*,
        categories.slug AS category_slug,
        categories.title_bg AS category_title_bg,
        categories.title_en AS category_title_en
      FROM menu_items
      LEFT JOIN categories ON categories.id = menu_items.category_id
      ORDER BY menu_items.sort_order ASC, menu_items.id ASC
    `).all();

    return Response.json({ success: true, items: items.results || [] });
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
