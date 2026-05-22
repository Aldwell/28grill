# Sanity Menu Setup

The menu can now be managed in Sanity with local `js/menu-data.js` kept as a fallback. The frontend uses Sanity only when published active menu items are available.

## Add A Category

1. Open Sanity Studio.
2. Go to **Menu Category**.
3. Create a new category.
4. Set **Title**, for example `Smash`.
5. Generate or enter the **Slug**. Use the frontend key when possible, for example `smash`, `chicken`, `simple`, `veggie`, `fries`, `drinks`, or `beer`.
6. Set **Order** to control tab sorting.
7. Keep **Active** enabled.
8. Publish.

## Add A Burger Or Menu Item

1. Go to **Menu Item**.
2. Create a new item.
3. Fill **Title**.
4. Generate the **Slug** from the title.
5. Choose a **Category**.
6. Set **Price**.
7. Upload an **Image**.
8. Fill descriptions. The site uses BG, EN, and FR directly; the current IT, ES, and EL frontend languages fall back to EN for Sanity-created items.
9. Set **Spicy** and **Featured** if needed.
10. Set **Order** for sorting within the category.
11. Keep **Active** enabled.
12. Publish.

## Change A Price

1. Open the menu item.
2. Update **Price**.
3. Publish.
4. Hard refresh the menu page if the browser still shows an old value.

## Hide A Product

1. Open the menu item.
2. Turn **Active** off.
3. Publish.
4. The frontend fetch filters out inactive products.

## Image Upload

Upload the product image in the **Image** field. The frontend reads the Sanity image asset through the Sanity CDN and requests optimized images around 900px wide with `auto=format` and quality around 80.

## Import Existing Menu

The import script reads the existing frontend menu data and creates or updates Sanity documents by slug.

```bash
cd studio
SANITY_AUTH_TOKEN="PASTE_WRITE_TOKEN_HERE" npm run import:menu
```

The token must have write access. Do not commit tokens.
