(function () {
  function localizedText(bg, en, fr = en, it = en, es = en, el = en) {
    return { bg, en, fr, it, es, el };
  }

  function categoryTitle(category) {
    return localizedText(
      category.title_bg || category.slug,
      category.title_en || category.title_bg || category.slug,
      category.title_fr || category.title_en || category.title_bg || category.slug,
      category.title_it || category.title_en || category.title_bg || category.slug,
      category.title_es || category.title_en || category.title_bg || category.slug,
      category.title_el || category.title_en || category.title_bg || category.slug
    );
  }

  function itemName(item) {
    return localizedText(
      item.name_bg || item.slug,
      item.name_en || item.name_bg || item.slug,
      item.name_fr || item.name_en || item.name_bg || item.slug,
      item.name_it || item.name_en || item.name_bg || item.slug,
      item.name_es || item.name_en || item.name_bg || item.slug,
      item.name_el || item.name_en || item.name_bg || item.slug
    );
  }

  function itemDescription(item) {
    return localizedText(
      item.description_bg || "",
      item.description_en || item.description_bg || "",
      item.description_fr || item.description_en || item.description_bg || "",
      item.description_it || item.description_en || item.description_bg || "",
      item.description_es || item.description_en || item.description_bg || "",
      item.description_el || item.description_en || item.description_bg || ""
    );
  }

  function mapMenuApiData(data) {
    const categories = Array.isArray(data.categories) ? data.categories : [];
    const items = Array.isArray(data.items) ? data.items : [];
    const categoriesById = new Map(categories.map((category) => [String(category.id), category]));

    return {
      categories: categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        title: localized(categoryTitle(category)),
        order: Number(category.sort_order) || 0,
        isActive: category.is_active !== 0
      })).filter((category) => category.slug && category.isActive),
      products: items.map((item) => {
        const category = categoriesById.get(String(item.category_id));
        const categorySlug = category?.slug || "smash";
        const productCategory = categorySlug === "beer" ? "drinks" : categorySlug;

        return {
          id: item.slug || String(item.id),
          category: productCategory,
          subcategory: categorySlug === "beer" ? "beer" : "",
          image: item.image_url || "",
          spicy: item.spicy === 1,
          featured: item.featured === 1,
          available: item.is_active !== 0,
          name: itemName(item),
          description: itemDescription(item),
          ingredients: localizedText([], []),
          allergens: [],
          prices: {
            itemEUR: Number(item.price) || 0
          },
          order: Number(item.sort_order) || 0
        };
      }).filter((item) => item.available)
    };
  }

  async function fetchMenuApiData() {
    const response = await fetch("/api/menu", { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`Menu API failed: ${response.status}`);

    const data = await response.json();
    console.log("Menu API:", data);

    if (!data?.success || !Array.isArray(data.items) || !data.items.length) return null;
    return mapMenuApiData(data);
  }

  window.fetchMenuApiData = fetchMenuApiData;
})();
