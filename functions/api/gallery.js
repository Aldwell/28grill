export async function onRequestGet(context) {
  const { env } = context;

  if (!env.DB) {
    return jsonResponse({ error: "D1 database unavailable" }, 503);
  }

  try {
    const images = await env.DB.prepare(`
      SELECT *
      FROM gallery_images
      WHERE is_active = 1
      ORDER BY sort_order ASC, id ASC
    `).all();

    return jsonResponse({ images: images.results || [] });
  } catch (error) {
    return jsonResponse({ error: "Gallery API unavailable" }, 500);
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
