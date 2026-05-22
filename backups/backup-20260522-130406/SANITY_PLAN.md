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
