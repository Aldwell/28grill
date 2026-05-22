export async function onRequestPost(context) {
  const adminPassword = context.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return jsonResponse({ success: false, error: "ADMIN_PASSWORD not configured" }, 500);
  }

  try {
    const body = await context.request.json();
    if (body.username !== "admingrill28" || body.password !== adminPassword) {
      return jsonResponse({ success: false, error: "Invalid login" }, 401);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ success: false, error: "Invalid login request" }, 400);
  }
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
