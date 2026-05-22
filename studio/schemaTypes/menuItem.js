import {defineField, defineType} from 'sanity'

export const menuItem = defineType({
  name: 'menuItem',
  title: 'Menu Item',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'menuCategory'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'price', title: 'Price', type: 'number'}),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({name: 'descriptionBg', title: 'Description BG', type: 'text'}),
    defineField({name: 'descriptionEn', title: 'Description EN', type: 'text'}),
    defineField({name: 'descriptionFr', title: 'Description FR', type: 'text'}),
    defineField({name: 'descriptionDe', title: 'Description DE', type: 'text'}),
    defineField({name: 'descriptionRu', title: 'Description RU', type: 'text'}),
    defineField({name: 'descriptionTr', title: 'Description TR', type: 'text'}),
    defineField({name: 'spicy', title: 'Spicy', type: 'boolean', initialValue: false}),
    defineField({name: 'featured', title: 'Featured', type: 'boolean', initialValue: false}),
    defineField({name: 'order', title: 'Order', type: 'number', initialValue: 0}),
    defineField({name: 'isActive', title: 'Active', type: 'boolean', initialValue: true}),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
      category: 'category.title',
    },
    prepare({title, media, category}) {
      return {
        title,
        media,
        subtitle: category,
      }
    },
  },
})
