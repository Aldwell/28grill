export async function onRequestGet(context) {
  const db = context.env.DB;

  if (!db) {
    return Response.json({ error: "Missing DB binding" }, { status: 500 });
  }

  try {
    const categories = await db
      .prepare("SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC")
      .all();

    const items = await db
      .prepare("SELECT * FROM menu_items WHERE is_active = 1 AND is_available = 1 ORDER BY sort_order ASC")
      .all();

    return Response.json({
      success: true,
      categories: categories.results,
      items: items.results
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
