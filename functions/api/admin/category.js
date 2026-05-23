export async function onRequestPost(context) {
  const db = context.env.DB;
  if (!db) return json({ success: false, error: "Missing DB binding" }, 500);

  try {
    const payload = await context.request.json();
    const action = payload.action || "create";

    if (action === "update") {
      if (!payload.id) throw new Error("Missing category id");
      return updateCategoryWithPayload(context, payload.id, payload);
    }

    if (action === "toggle") {
      if (!payload.id) throw new Error("Missing category id");
      return updateCategoryActive(context, payload.id, payload.is_active);
    }

    if (action === "delete") {
      if (!payload.id) throw new Error("Missing category id");
      return deleteCategory(context, payload.id);
    }

    if (action !== "create") throw new Error(`Unsupported category action: ${action}`);

    validateCategory(payload);

    await db.prepare(`
      INSERT INTO categories (
        slug, name, title_bg, title_en, title_fr, title_it, title_es, title_el, sort_order, is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      payload.slug,
      payload.name,
      payload.title_bg || payload.name,
      payload.title_en || "",
      payload.title_fr || "",
      payload.title_it || "",
      payload.title_es || "",
      payload.title_el || "",
      Number(payload.sort_order) || 0,
      payload.is_active ? 1 : 0
    ).run();

    return json({ success: true });
  } catch (error) {
    return json({ success: false, error: error.message || String(error) }, 400);
  }
}

export async function updateCategory(context, id) {
  const payload = await context.request.json();
  return updateCategoryWithPayload(context, id, payload);
}

export async function updateCategoryWithPayload(context, id, payload) {
  const db = context.env.DB;
  if (!db) return json({ success: false, error: "Missing DB binding" }, 500);

  try {
    const keys = Object.keys(payload).filter((key) => key !== "action" && key !== "id");
    if (keys.length === 1 && keys[0] === "is_active") return updateCategoryActive(context, id, payload.is_active);

    validateCategory(payload);
    await db.prepare(`
      UPDATE categories
      SET
        slug = ?,
        name = ?,
        title_bg = ?,
        title_en = ?,
        title_fr = ?,
        title_it = ?,
        title_es = ?,
        title_el = ?,
        sort_order = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      payload.slug,
      payload.name,
      payload.title_bg || payload.name,
      payload.title_en || "",
      payload.title_fr || "",
      payload.title_it || "",
      payload.title_es || "",
      payload.title_el || "",
      Number(payload.sort_order) || 0,
      payload.is_active ? 1 : 0,
      id
    ).run();

    return json({ success: true });
  } catch (error) {
    return json({ success: false, error: error.message || String(error) }, 400);
  }
}

export async function updateCategoryActive(context, id) {
  const db = context.env.DB;
  if (!db) return json({ success: false, error: "Missing DB binding" }, 500);

  try {
    await db.prepare(`
      UPDATE categories
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

export async function deleteCategory(context, id) {
  const db = context.env.DB;
  if (!db) return json({ success: false, error: "Missing DB binding" }, 500);

  try {
    const linkedItem = await db.prepare("SELECT id FROM menu_items WHERE category_id = ? LIMIT 1")
      .bind(id)
      .first();

    if (linkedItem) {
      return json({ success: false, error: "Първо преместете или скрийте продуктите в тази категория." }, 400);
    }

    await db.prepare("DELETE FROM categories WHERE id = ?")
      .bind(id)
      .run();

    return json({ success: true });
  } catch (error) {
    return json({ success: false, error: error.message || String(error) }, 400);
  }
}

function validateCategory(payload) {
  if (!payload.slug) throw new Error("Category slug is required");
  if (!payload.name) throw new Error("Category name is required");
}

function json(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: { "cache-control": "no-store" }
  });
}
