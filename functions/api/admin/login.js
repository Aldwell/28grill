export async function onRequestPost(context) {
  return jsonResponse({
    ok: false,
    message: "Admin authentication will be implemented in the next phase."
  }, 501);
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
