# Sanity Preparation Plan

The site continues to work from local data first. Sanity can be connected later by returning the same shapes used by the current local JavaScript data files.

## galleryImage

- `title`
- `image`
- `alt`
- `category`
- `order`
- `isActive`

## menuCategory

- `title`
- `slug`
- `order`
- `isActive`

## menuItem

- `name`
- `description`
- `category`
- `price`
- `image`
- `ingredients`
- `isAvailable`
- `isActive`
- `order`

## Integration Notes

- `js/gallery-data.js` is the current gallery fallback.
- `js/menu-data.js` remains the current menu fallback.
- Future Sanity gallery fetches should return the same shape as `LOCAL_GALLERY_IMAGES`.
- Future Sanity menu fetches should return the same product shape as `menuProducts`.
- If Sanity is not configured or a fetch fails, the site should keep rendering local data.
- Frontend reads only public published content through the Sanity CDN.
- Do not add a write token to frontend JavaScript.
- Replace `CLIENT_PROJECT_ID` in `js/sanity-client.js` and `studio/sanity.config.js` when the client project is ready.
- Gallery image URLs should use `auto=format`, width around `800-1200`, and quality around `75-82`.
- Menu image URLs should use `auto=format`, width around `600-900`, and quality around `75-82`.

## Frontend Test Checklist

- Add 2 active `galleryImage` documents and confirm they appear on `gallery.html`.
- Add 1 active `menuItem` and confirm it appears on `menu.html`.
- Set `isActive` to `false` on 1 menu item and confirm it is hidden.
- Change 1 `price` and confirm the menu card updates.
- Clear or leave `CLIENT_PROJECT_ID` empty and confirm local fallback still renders.
