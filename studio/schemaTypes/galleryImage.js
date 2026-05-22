import {defineField, defineType} from 'sanity'

export const galleryImage = defineType({
  name: 'galleryImage',
  title: 'Gallery Image',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'alt', title: 'Alt text', type: 'string'}),
    defineField({name: 'category', title: 'Category', type: 'string'}),
    defineField({name: 'order', title: 'Order', type: 'number', initialValue: 0}),
    defineField({name: 'isActive', title: 'Active', type: 'boolean', initialValue: true}),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
      subtitle: 'category',
    },
  },
})
