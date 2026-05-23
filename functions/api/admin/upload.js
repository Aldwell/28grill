const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.BUCKET) {
    return jsonResponse({ success: false, error: "Missing R2 bucket binding" }, 500);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const type = String(formData.get("type") || "").trim();

    if (!file || typeof file === "string") {
      return jsonResponse({ success: false, error: "Моля, изберете снимка." }, 400);
    }

    if (type !== "gallery" && type !== "menu") {
      return jsonResponse({ success: false, error: "Невалиден тип качване." }, 400);
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return jsonResponse({ success: false, error: "Моля, качете JPG, PNG или WEBP снимка." }, 415);
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return jsonResponse({ success: false, error: "Снимката е твърде голяма. Максимумът е 5MB." }, 413);
    }

    const extension = ALLOWED_TYPES.get(file.type);
    const imageKey = `${type}/${dateStamp()}-${crypto.randomUUID()}-${safeBaseName(file.name)}.${extension}`;
    const bytes = await file.arrayBuffer();

    await env.BUCKET.put(imageKey, bytes, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: "public, max-age=31536000, immutable",
      },
    });

    // Configure R2_PUBLIC_URL to a public R2 bucket URL or custom domain.
    // Without it, /cdn-cgi/r2/... is returned as a deploy-time placeholder and may need routing/CDN setup.
    const publicBaseUrl = String(env.R2_PUBLIC_URL || "").replace(/\/$/, "");
    const imageUrl = publicBaseUrl ? `${publicBaseUrl}/${imageKey}` : `/cdn-cgi/r2/${imageKey}`;

    return jsonResponse({
      success: true,
      image_url: imageUrl,
      image_key: imageKey,
      public_url_configured: Boolean(publicBaseUrl),
      warning: publicBaseUrl ? "" : "Set R2_PUBLIC_URL to a public R2 URL or custom domain before production use.",
    });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message || String(error) }, 500);
  }
}

function safeBaseName(fileName) {
  const base = String(fileName || "image")
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "image";
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
