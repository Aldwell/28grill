# Custom Admin Plan

## Goal

Build a lightweight private admin for 28 GRILL content while keeping the public website static, fast, and safe. The current local fallback files stay in place until the Cloudflare stack is fully tested.

## Architecture

- Public website remains static HTML/CSS/JS.
- Cloudflare Pages Functions provide API routes.
- Cloudflare D1 stores structured menu and gallery metadata.
- Cloudflare R2 stores uploaded images.
- Admin UI lives separately under `/admin/`.
- Public pages can later read `/api/menu` and `/api/gallery`, with local fallback preserved.

## D1 Tables

### categories

- `id`
- `slug`
- `title_bg`
- `title_en`
- `title_fr`
- `title_it`
- `title_es`
- `title_el`
- `sort_order`
- `is_active`
- `created_at`
- `updated_at`

### menu_items

- `id`
- `category_id`
- `slug`
- `name_bg`
- `name_en`
- `name_fr`
- `name_it`
- `name_es`
- `name_el`
- `description_bg`
- `description_en`
- `description_fr`
- `description_it`
- `description_es`
- `description_el`
- `price`
- `image_url`
- `image_key`
- `image_alt`
- `sort_order`
- `is_active`
- `created_at`
- `updated_at`

### gallery_images

- `id`
- `title`
- `alt`
- `image_url`
- `sort_order`
- `is_active`
- `created_at`
- `updated_at`

## R2 Bucket

- Store uploaded menu and gallery images.
- Keep public image URLs stable.
- Prefer optimized WebP/JPEG assets before upload.
- Later phase can add upload endpoints and image validation.

## API Routes

- `GET /api/menu`
  - Returns active categories and active menu items ordered by `sort_order`.
  - If D1 is unavailable, returns a safe error response; public frontend must keep using local fallback.

- `GET /api/gallery`
  - Returns active gallery images ordered by `sort_order`.
  - If D1 is unavailable, returns a safe error response; public frontend must keep using local fallback.

- `POST /api/admin/menu-item`
  - Creates a menu item.

- `PUT /api/admin/menu-item/:id`
  - Updates a menu item.

- `DELETE /api/admin/menu-item/:id`
  - Deletes or deactivates a menu item.

- `POST /api/admin/gallery`
  - Creates gallery image metadata after upload.

- `DELETE /api/admin/gallery/:id`
  - Deletes or deactivates a gallery image.

- `POST /api/admin/upload`
  - Accepts one image file.
  - Validates file type and size.
  - Stores the image in R2.
  - Returns `image_url` and `image_key`.

## Admin Pages

- `/admin/index.html`
- Login screen
- Tabs:
  - Menu
  - Categories
  - Gallery
- Menu editor shell
- Menu item form fields:
  - category
  - name BG/EN/FR/IT/ES/EL
  - description BG/EN/FR/IT/ES/EL
  - price
  - image upload
  - image preview
  - replace image
  - remove image
  - sort order
  - active/inactive toggle
- Categories editor shell
- Gallery uploader shell
- Active/inactive toggles
- Sort order controls

## Auth And Security

- Admin write routes require authentication.
- Use an admin password/session or Cloudflare Access in a later phase.
- Never expose secrets in frontend JavaScript.
- Public API routes are read-only.
- Admin API routes must reject unauthenticated requests.
- R2 write access stays server-side only.
- Uploaded files must be validated server-side before R2 writes.

## Performance

- Public site remains static and cacheable.
- `/api/menu` and `/api/gallery` should be cacheable once stable.
- Public gallery/menu images stay lazy-loaded.
- Uploaded images should be WebP/JPEG optimized.
- Upload size should be limited, for example 5MB.
- Allowed upload types: JPG, PNG, WebP.
- WebP is recommended for product images.
- Keep local fallback data until the API is proven reliable.

## Menu Image Upload Flow

1. Admin chooses a product image in the menu item form.
2. Admin UI previews the selected image locally.
3. Admin submits the image to `POST /api/admin/upload`.
4. Upload API validates size and file type.
5. Upload API stores the file in R2.
6. Upload API returns:
   - `image_url`
   - `image_key`
7. Menu item create/edit saves `image_url`, `image_key`, and `image_alt` into D1.
8. Replacing an image uploads the new file and updates D1.
9. Removing an image clears `image_url`, `image_key`, and `image_alt` in D1. A later cleanup job can delete unused R2 objects.

## Deployment Steps

1. Create Cloudflare D1 database.
2. Apply `migrations/0001_init.sql`.
3. Create R2 bucket for uploaded images.
4. Configure Pages Functions bindings:
   - D1 binding, for example `DB`
   - R2 binding, for example `IMAGES`
   - admin session/password secrets
5. Deploy static site and functions to Cloudflare Pages.
6. Test public read APIs.
7. Test admin auth.
8. Seed existing menu.
9. Connect frontend reads to API with fallback.

## Fallback Strategy

- Do not remove `js/menu-data.js`.
- Do not remove `js/gallery-data.js`.
- Frontend should only switch to API data when valid non-empty data is returned.
- If API fetch fails, times out, or returns empty content, render local fallback data.

## Next Phase

1. Run D1 locally.
2. Seed current menu into D1.
3. Implement admin edit forms.
4. Connect public frontend read APIs.
5. Add R2 upload flow.
