import { defineField, defineType } from 'sanity'

export const committeeMemberType = defineType({
  name: 'committeeMember',
  title: 'Committee Member',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Full Name',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title / Role',
      type: 'string',
      description: 'e.g. Ward Chair, Vice Chair, Committee Person',
    }),
    defineField({
      name: 'district',
      title: 'Ward / Municipality',
      type: 'string',
      description: 'e.g. Ward 5, Mt. Lebanon, North Side',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'isActive',
      title: 'Active Member',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first within the same district.',
    }),
    defineField({
      name: 'externalId',
      title: 'External ID',
      type: 'string',
      description: 'Used for CSV import deduplication. Do not edit manually.',
      readOnly: true,
    }),
  ],
  orderings: [
    { title: 'District, then Name', name: 'districtName', by: [{ field: 'district', direction: 'asc' }, { field: 'name', direction: 'asc' }] },
    { title: 'Display Order', name: 'orderAsc', by: [{ field: 'displayOrder', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'name', subtitle: 'title', description: 'district', media: 'photo' },
    prepare({ title, subtitle, description, media }) {
      return { title, subtitle: [subtitle, description].filter(Boolean).join(' · '), media }
    },
  },
})
