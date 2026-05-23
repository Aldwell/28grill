export async function onRequestGet(context) {
  const db = context.env.DB;

  if (!db) {
    return json({ success: false, error: "Missing DB binding" }, 500);
  }

  try {
    const images = await db
      .prepare("SELECT * FROM gallery_images ORDER BY sort_order ASC, id ASC")
      .all();

    return json({ success: true, images: images.results || [] });
  } catch (error) {
    return json({ success: false, error: error.message || String(error) }, 500);
  }
}

export async function onRequestPost(context) {
  const db = context.env.DB;
  if (!db) return json({ success: false, error: "Missing DB binding" }, 500);

  try {
    const payload = await context.request.json();
    const action = payload.action || "create";

    if (action === "update") {
      if (!payload.id) throw new Error("Missing gallery item id");
      return updateGalleryItemWithPayload(context, payload.id, payload);
    }

    if (action === "delete") {
      if (!payload.id) throw new Error("Missing gallery item id");
      return softDeleteGalleryItem(context, payload.id);
    }

    if (action === "toggle") {
      if (!payload.id) throw new Error("Missing gallery item id");
      return updateGalleryActive(context, payload.id, payload.is_active);
    }

    if (action !== "create") throw new Error(`Unsupported gallery action: ${action}`);

    validateGallery(payload);

    const result = await db.prepare(`
      INSERT INTO gallery_images (title, alt, image_url, image_key, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      payload.title || "",
      payload.alt || payload.title || "",
      payload.image_url,
      payload.image_key || imageKey(payload.image_url),
      Number(payload.sort_order) || 0,
      payload.is_active ? 1 : 0
    ).run();

    return json({ success: true, id: result.meta?.last_row_id });
  } catch (error) {
    return json({ success: false, error: error.message || String(error) }, 400);
  }
}

export async function updateGalleryItem(context, id) {
  const payload = await context.request.json();
  return updateGalleryItemWithPayload(context, id, payload);
}

export async function updateGalleryItemWithPayload(context, id, payload) {
  const db = context.env.DB;
  if (!db) return json({ success: false, error: "Missing DB binding" }, 500);

  try {
    const keys = Object.keys(payload).filter((key) => key !== "action" && key !== "id");
    if (keys.length === 1 && keys[0] === "is_active") return updateGalleryActive(context, id, payload.is_active);

    validateGallery(payload);
    await db.prepare(`
      UPDATE gallery_images
      SET
        title = ?,
        alt = ?,
        image_url = ?,
        image_key = ?,
        sort_order = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      payload.title || "",
      payload.alt || payload.title || "",
      payload.image_url,
      payload.image_key || imageKey(payload.image_url),
      Number(payload.sort_order) || 0,
      payload.is_active ? 1 : 0,
      id
    ).run();

    return json({ success: true });
  } catch (error) {
    return json({ success: false, error: error.message || String(error) }, 400);
  }
}

export async function updateGalleryActive(context, id) {
  const db = context.env.DB;
  if (!db) return json({ success: false, error: "Missing DB binding" }, 500);

  try {
    await db.prepare(`
      UPDATE gallery_images
      SET
        is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
      .bind(id)
      .run();
    return json({ success: true });
  } catch (error) {
    return json({ success: false, error: error.message || String(error) }, 400);
  }
}

export async function softDeleteGalleryItem(context, id) {
  const db = context.env.DB;
  if (!db) return json({ success: false, error: "Missing DB binding" }, 500);

  try {
    await db.prepare("DELETE FROM gallery_images WHERE id = ?")
      .bind(id)
      .run();
    return json({ success: true });
  } catch (error) {
    return json({ success: false, error: error.message || String(error) }, 400);
  }
}

function validateGallery(payload) {
  if (!payload.title) throw new Error("Gallery title is required");
  if (!payload.image_url) throw new Error("Gallery image is required");
}

function imageKey(imageUrl) {
  return String(imageUrl || "").replace(/^assets\//, "");
}

function json(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: { "cache-control": "no-store" }
  });
}
