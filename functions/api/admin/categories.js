export async function onRequestGet(context) {
  const db = context.env.DB;

  if (!db) {
    return Response.json({ success: false, error: "Missing DB binding" }, { status: 500 });
  }

  try {
    const categories = await db
      .prepare("SELECT * FROM categories ORDER BY sort_order ASC, id ASC")
      .all();

    return Response.json({ success: true, categories: categories.results || [] });
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
