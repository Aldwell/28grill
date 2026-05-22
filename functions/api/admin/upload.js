const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.IMAGES) {
    return jsonResponse({ ok: false, message: "R2 bucket binding unavailable" }, 503);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return jsonResponse({ ok: false, message: "Missing image file" }, 400);
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return jsonResponse({ ok: false, message: "Only JPG, PNG, and WebP images are allowed" }, 415);
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return jsonResponse({ ok: false, message: "Image must be 5MB or smaller" }, 413);
  }

  return jsonResponse({
    ok: false,
    message: "R2 upload implementation will be connected in the next phase.",
    image_url: "",
    image_key: ""
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
