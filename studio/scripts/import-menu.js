const {createClient} = require('@sanity/client')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const PROJECT_ROOT = path.resolve(__dirname, '../..')
const token = process.env.SANITY_AUTH_TOKEN

if (!token) {
  console.error('Missing SANITY_AUTH_TOKEN. Create a write token in Sanity and run:')
  console.error('SANITY_AUTH_TOKEN="..." node scripts/import-menu.js')
  process.exit(1)
}

const client = createClient({
  projectId: '90dh9czw',
  dataset: 'production',
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
})

const CATEGORY_TITLES = {
  smash: 'Smash',
  chicken: 'Chicken',
  simple: 'Simple',
  veggie: 'Veggie',
  fries: 'Fries',
  drinks: 'Soft Drinks',
  beer: 'Beer',
}

const CATEGORY_ORDER = ['smash', 'chicken', 'simple', 'veggie', 'fries', 'drinks', 'beer']

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function localize(value, language, fallback = '') {
  if (!value || typeof value !== 'object') return value || fallback
  return value[language] || value.bg || value.en || fallback
}

function loadLocalMenuProducts() {
  const file = path.join(PROJECT_ROOT, 'js/menu-data.js')
  const source = fs.readFileSync(file, 'utf8')
  const context = {}
  vm.createContext(context)
  vm.runInContext(`${source}\nthis.__menuProducts = menuProducts;`, context)
  return context.__menuProducts || []
}

function categorySlugForProduct(product) {
  if (product.category === 'drinks' && product.subcategory === 'beer') return 'beer'
  return product.category
}

async function findBySlug(type, slug) {
  return client.fetch('*[_type == $type && slug.current == $slug][0]', {type, slug})
}

async function uploadImage(imagePath) {
  if (!imagePath) return undefined

  const cleanPath = imagePath.replace(/^\.\//, '')
  const absolutePath = path.join(PROJECT_ROOT, cleanPath)
  if (!fs.existsSync(absolutePath)) return undefined

  const stream = fs.createReadStream(absolutePath)
  const asset = await client.assets.upload('image', stream, {
    filename: path.basename(absolutePath),
  })

  return {
    _type: 'image',
    asset: {
      _type: 'reference',
      _ref: asset._id,
    },
  }
}

async function upsertCategory(slug, order) {
  const existing = await findBySlug('menuCategory', slug)
  const patch = {
    _type: 'menuCategory',
    title: CATEGORY_TITLES[slug] || slug,
    slug: {_type: 'slug', current: slug},
    order,
    isActive: true,
  }

  if (existing?._id) {
    await client.patch(existing._id).set(patch).commit()
    return existing._id
  }

  const created = await client.create(patch)
  return created._id
}

async function upsertMenuItem(product, categoryId, order) {
  const title = localize(product.name, 'bg', localize(product.name, 'en', product.id))
  const slug = slugify(product.id || title)
  const existing = await findBySlug('menuItem', slug)
  const image = existing?.image || await uploadImage(product.image)
  const price = product.prices?.itemEUR || product.prices?.burgerEUR || product.prices?.menuEUR || 0

  const patch = {
    _type: 'menuItem',
    title,
    slug: {_type: 'slug', current: slug},
    category: {
      _type: 'reference',
      _ref: categoryId,
    },
    price,
    image,
    descriptionBg: localize(product.description, 'bg'),
    descriptionEn: localize(product.description, 'en'),
    descriptionFr: localize(product.description, 'fr', localize(product.description, 'en')),
    descriptionDe: localize(product.description, 'en'),
    descriptionRu: localize(product.description, 'en'),
    descriptionTr: localize(product.description, 'en'),
    spicy: product.spicy === true,
    featured: product.featured === true,
    order,
    isActive: product.available !== false,
  }

  if (existing?._id) {
    await client.patch(existing._id).set(patch).commit()
    return existing._id
  }

  const created = await client.create(patch)
  return created._id
}

async function main() {
  const products = loadLocalMenuProducts()
  const categorySlugs = [...new Set(products.map(categorySlugForProduct).filter(Boolean))]
    .sort((a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b))
  const categoryIds = new Map()

  for (const slug of categorySlugs) {
    const order = CATEGORY_ORDER.includes(slug) ? CATEGORY_ORDER.indexOf(slug) + 1 : 100
    const id = await upsertCategory(slug, order)
    categoryIds.set(slug, id)
    console.log(`Category ready: ${slug}`)
  }

  for (const [index, product] of products.entries()) {
    const categorySlug = categorySlugForProduct(product)
    const categoryId = categoryIds.get(categorySlug)
    if (!categoryId) continue

    await upsertMenuItem(product, categoryId, index + 1)
    console.log(`Menu item ready: ${product.id}`)
  }

  console.log(`Imported ${categoryIds.size} categories and ${products.length} menu items.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
