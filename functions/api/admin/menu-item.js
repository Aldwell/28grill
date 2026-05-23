export async function onRequestPost(context) {
  const db = context.env.DB;
  if (!db) return json({ success: false, error: "Missing DB binding" }, 500);

  try {
    const payload = await context.request.json();
    const action = payload.action || "create";

    if (action === "update") {
      if (!payload.id) throw new Error("Missing menu item id");
      return updateMenuItemWithPayload(context, payload.id, payload);
    }

    if (action === "delete") {
      if (!payload.id) throw new Error("Missing menu item id");
      return softDeleteMenuItem(context, payload.id);
    }

    if (action === "toggle") {
      if (!payload.id) throw new Error("Missing menu item id");
      return updateMenuItemActive(context, payload.id, payload.is_active);
    }

    if (action !== "create") throw new Error(`Unsupported menu item action: ${action}`);

    validateMenuItem(payload);

    const name = payload.name_bg || payload.name_en;
    const description = payload.description_bg || payload.description_en || "";
    const slug = await uniqueSlug(db, slugify(payload.name_en || payload.name_bg), "menu_items");

    const result = await db.prepare(`
      INSERT INTO menu_items (
        category_id, slug, name, description,
        name_bg, name_en, name_fr, name_it, name_es, name_el,
        description_bg, description_en, description_fr, description_it, description_es, description_el,
        price, image_url, image_key, image_alt, sort_order, is_active, is_available
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      Number(payload.category_id),
      slug,
      name,
      description,
      payload.name_bg || "",
      payload.name_en || "",
      payload.name_fr || "",
      payload.name_it || "",
      payload.name_es || "",
      payload.name_el || "",
      payload.description_bg || "",
      payload.description_en || "",
      payload.description_fr || "",
      payload.description_it || "",
      payload.description_es || "",
      payload.description_el || "",
      Number(payload.price),
      payload.image_url || "",
      payload.image_key || "",
      payload.image_alt || name,
      Number(payload.sort_order) || 0,
      payload.is_active ? 1 : 0,
      payload.is_available ? 1 : 0
    ).run();

    return json({ success: true, id: result.meta?.last_row_id, slug });
  } catch (error) {
    return json({ success: false, error: error.message || String(error) }, 400);
  }
}

export async function onRequestPut(context) {
  const id = new URL(context.request.url).searchParams.get("id");
  if (!id) return json({ success: false, error: "Missing menu item id" }, 400);
  return updateMenuItem(context, id);
}

export async function onRequestDelete(context) {
  const id = new URL(context.request.url).searchParams.get("id");
  if (!id) return json({ success: false, error: "Missing menu item id" }, 400);
  return softDeleteMenuItem(context, id);
}

export async function updateMenuItem(context, id) {
  const payload = await context.request.json();
  return updateMenuItemWithPayload(context, id, payload);
}

export async function updateMenuItemWithPayload(context, id, payload) {
  const db = context.env.DB;
  if (!db) return json({ success: false, error: "Missing DB binding" }, 500);

  try {
    const keys = Object.keys(payload).filter((key) => key !== "action" && key !== "id");
    if (keys.length === 1 && keys[0] === "is_active") return updateMenuItemActive(context, id, payload.is_active);

    validateMenuItem(payload);
    const name = payload.name_bg || payload.name_en;
    const description = payload.description_bg || payload.description_en || "";

    await db.prepare(`
      UPDATE menu_items
      SET
        category_id = ?,
        name = ?,
        description = ?,
        name_bg = ?,
        name_en = ?,
        name_fr = ?,
        name_it = ?,
        name_es = ?,
        name_el = ?,
        description_bg = ?,
        description_en = ?,
        description_fr = ?,
        description_it = ?,
        description_es = ?,
        description_el = ?,
        price = ?,
        image_url = ?,
        image_key = ?,
        image_alt = ?,
        sort_order = ?,
        is_active = ?,
        is_available = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      Number(payload.category_id),
      name,
      description,
      payload.name_bg || "",
      payload.name_en || "",
      payload.name_fr || "",
      payload.name_it || "",
      payload.name_es || "",
      payload.name_el || "",
      payload.description_bg || "",
      payload.description_en || "",
      payload.description_fr || "",
      payload.description_it || "",
      payload.description_es || "",
      payload.description_el || "",
      Number(payload.price),
      payload.image_url || "",
      payload.image_key || "",
      payload.image_alt || name,
      Number(payload.sort_order) || 0,
      payload.is_active ? 1 : 0,
      payload.is_available ? 1 : 0,
      id
    ).run();

    return json({ success: true });
  } catch (error) {
    return json({ success: false, error: error.message || String(error) }, 400);
  }
}

export async function updateMenuItemActive(context, id) {
  const db = context.env.DB;
  if (!db) return json({ success: false, error: "Missing DB binding" }, 500);

  try {
    await db.prepare(`
      UPDATE menu_items
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

export async function softDeleteMenuItem(context, id) {
  const db = context.env.DB;
  if (!db) return json({ success: false, error: "Missing DB binding" }, 500);

  try {
    const item = await db.prepare("SELECT slug FROM menu_items WHERE id = ? LIMIT 1")
      .bind(id)
      .first();

    if (item?.slug === "loaded-fries") {
      return json({ success: false, error: "Loaded Fries is a special item and cannot be deleted." }, 400);
    }

    await db.prepare("DELETE FROM menu_items WHERE id = ?")
      .bind(id)
      .run();
    return json({ success: true });
  } catch (error) {
    return json({ success: false, error: error.message || String(error) }, 400);
  }
}

function validateMenuItem(payload) {
  if (!payload.category_id) throw new Error("Category is required");
  if (!payload.name_bg) throw new Error("BG name is required");
  if (!payload.image_url) throw new Error("Product image is required");
  if (payload.price === "" || payload.price === null || payload.price === undefined || Number.isNaN(Number(payload.price))) {
    throw new Error("Price is required");
  }
}

async function uniqueSlug(db, baseSlug, table) {
  let slug = baseSlug;
  let index = 2;

  while (true) {
    const existing = await db.prepare(`SELECT id FROM ${table} WHERE slug = ? LIMIT 1`).bind(slug).first();
    if (!existing) return slug;
    slug = `${baseSlug}-${index}`;
    index += 1;
  }
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `item-${Date.now()}`;
}

function json(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: { "cache-control": "no-store" }
  });
}
