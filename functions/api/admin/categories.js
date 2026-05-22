export async function onRequestGet(context) {
  const db = context.env.DB;

  if (!db) {
    return Response.json({ success: false, error: "Missing DB binding" }, { status: 500 });
  }

  try {
    let categories;

    try {
      categories = await db.prepare(`
        SELECT
          *,
          COALESCE(title_bg, name, slug) AS display_title_bg,
          COALESCE(title_en, name, slug) AS display_title_en
        FROM categories
        ORDER BY sort_order ASC, id ASC
      `).all();
    } catch (error) {
      categories = await db.prepare(`
        SELECT
          *,
          COALESCE(title_bg, slug) AS display_title_bg,
          COALESCE(title_en, slug) AS display_title_en
        FROM categories
        ORDER BY sort_order ASC, id ASC
      `).all();
    }

    return Response.json({ success: true, categories: categories.results || [] });
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
