export async function onRequestGet(context) {
  const db = context.env.DB;

  if (!db) {
    return Response.json({ success: false, error: "Missing DB binding" }, { status: 500 });
  }

  try {
    const images = await db
      .prepare("SELECT * FROM gallery_images ORDER BY sort_order ASC, id ASC")
      .all();

    return Response.json({ success: true, images: images.results || [] });
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  return adminTodoResponse("Create gallery image is not implemented yet.");
}

export async function onRequestDelete(context) {
  return adminTodoResponse("Delete gallery image is not implemented yet.");
}

function adminTodoResponse(message) {
  return new Response(JSON.stringify({ ok: false, message }), {
    status: 501,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
