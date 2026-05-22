import {defineField, defineType} from 'sanity'

export const localizedString = defineType({
  name: 'localizedString',
  title: 'Localized string',
  type: 'object',
  fields: [
    defineField({name: 'bg', title: 'BG', type: 'string'}),
    defineField({name: 'en', title: 'EN', type: 'string'}),
    defineField({name: 'fr', title: 'FR', type: 'string'}),
    defineField({name: 'it', title: 'IT', type: 'string'}),
    defineField({name: 'es', title: 'ES', type: 'string'}),
    defineField({name: 'el', title: 'EL', type: 'string'}),
  ],
})
