import { defineField, defineType } from 'sanity'

const CATEGORIES = [
  { title: 'Voter Resources', value: 'voter-resources' },
  { title: 'Donate', value: 'donate' },
  { title: 'State & Local Party', value: 'party' },
  { title: 'Elected Officials', value: 'officials' },
  { title: 'Volunteer', value: 'volunteer' },
  { title: 'Other', value: 'other' },
]

export const externalLinkType = defineType({
  name: 'externalLink',
  title: 'External Link',
  type: 'document',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'string',
      description: 'Short explanation shown on the links page.',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: { list: CATEGORIES },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'isActive',
      title: 'Show on Site',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first within the same category.',
    }),
  ],
  orderings: [
    { title: 'Category, then Order', name: 'categoryOrder', by: [{ field: 'category', direction: 'asc' }, { field: 'displayOrder', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'label', subtitle: 'category', description: 'url' },
    prepare({ title, subtitle, description }) {
      const cat = CATEGORIES.find(c => c.value === subtitle)?.title ?? subtitle
      return { title, subtitle: `${cat} · ${description}` }
    },
  },
})
