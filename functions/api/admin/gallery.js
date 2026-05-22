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
