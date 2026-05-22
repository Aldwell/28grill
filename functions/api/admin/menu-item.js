export async function onRequestPost(context) {
  return adminTodoResponse("Create menu item is not implemented yet. It will save image_url, image_key, and image_alt from the upload API.");
}

export async function onRequestPut(context) {
  return adminTodoResponse("Update menu item is not implemented yet. It will support replacing or removing product images.");
}

export async function onRequestDelete(context) {
  return adminTodoResponse("Delete menu item is not implemented yet.");
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
