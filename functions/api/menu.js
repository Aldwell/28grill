export async function onRequestGet(context) {
  const { env } = context;

  if (!env.DB) {
    return jsonResponse({ error: "D1 database unavailable" }, 503);
  }

  try {
    const categories = await env.DB.prepare(`
      SELECT *
      FROM categories
      WHERE is_active = 1
      ORDER BY sort_order ASC, id ASC
    `).all();

    const items = await env.DB.prepare(`
      SELECT menu_items.*
      FROM menu_items
      JOIN categories ON categories.id = menu_items.category_id
      WHERE menu_items.is_active = 1
        AND categories.is_active = 1
      ORDER BY categories.sort_order ASC, menu_items.sort_order ASC, menu_items.id ASC
    `).all();

    return jsonResponse({
      categories: categories.results || [],
      items: items.results || []
    });
  } catch (error) {
    return jsonResponse({ error: "Menu API unavailable" }, 500);
  }
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": status === 200 ? "public, max-age=60" : "no-store"
    }
  });
}
