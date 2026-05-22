(function () {
  function localizedText(bg, en, fr = en, it = en, es = en, el = en) {
    return { bg, en, fr, it, es, el };
  }

  function menuItemFromSanity(item) {
    const categorySlug = item.categorySlug || "smash";
    const productCategory = categorySlug === "beer" ? "drinks" : categorySlug;
    const price = Number(item.price) || 0;

    return {
      id: item.slug || item._id,
      category: productCategory,
      subcategory: categorySlug === "beer" ? "beer" : "",
      image: item.assetUrl || sanityAssetUrl(item.image, { width: 900, quality: 80 }),
      spicy: item.spicy === true,
      featured: item.featured === true,
      available: true,
      name: localizedText(item.title || "", item.title || ""),
      description: localizedText(
        item.descriptionBg || item.descriptionEn || "",
        item.descriptionEn || item.descriptionBg || "",
        item.descriptionFr || item.descriptionEn || item.descriptionBg || "",
        item.descriptionEn || item.descriptionBg || "",
        item.descriptionEn || item.descriptionBg || "",
        item.descriptionEn || item.descriptionBg || ""
      ),
      ingredients: localizedText([], []),
      allergens: [],
      prices: {
        itemEUR: price
      },
      order: Number(item.order) || 0,
      isActive: item.isActive !== false
    };
  }

  async function fetchSanityMenuCategories() {
    const query = `*[_type == "menuCategory" && isActive == true] | order(order asc) {
      _id,
      title,
      "slug": slug.current,
      order,
      isActive
    }`;

    const categories = await fetchSanityQuery(query);
    if (!categories?.length) return null;

    return categories
      .filter((category) => category.slug)
      .map((category) => ({
        id: category._id,
        title: category.title || category.slug,
        slug: category.slug,
        order: Number(category.order) || 0,
        isActive: category.isActive !== false
      }));
  }

  async function fetchSanityMenuItems() {
    const query = `*[_type == "menuItem" && isActive == true] | order(category->order asc, order asc) {
      _id,
      title,
      "slug": slug.current,
      price,
      "categorySlug": category->slug.current,
      "categoryOrder": category->order,
      "assetUrl": image.asset->url,
      image,
      descriptionBg,
      descriptionEn,
      descriptionFr,
      descriptionDe,
      descriptionRu,
      descriptionTr,
      spicy,
      featured,
      order,
      isActive
    }`;

    const items = await fetchSanityQuery(query);
    if (!items?.length) return null;

    return items
      .map(menuItemFromSanity)
      .filter((item) => item.isActive && item.name.bg && item.prices.itemEUR);
  }

  async function fetchSanityMenuData() {
    const [categories, items] = await Promise.all([
      fetchSanityMenuCategories(),
      fetchSanityMenuItems()
    ]);

    if (!items?.length) return null;

    return {
      categories: categories || [],
      products: items
    };
  }

  window.fetchSanityMenuData = fetchSanityMenuData;
})();
