import { defineField, defineType } from 'sanity'

export const newsType = defineType({
  name: 'news',
  title: 'News & Updates',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'date',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'Short summary shown in listings.',
    }),
    defineField({
      name: 'image',
      title: 'Featured Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'isExternal',
      title: 'External Article (Press Coverage)',
      type: 'boolean',
      initialValue: false,
      description: 'Toggle on if this links to an outside publication.',
    }),
    defineField({
      name: 'externalUrl',
      title: 'External URL',
      type: 'url',
      description: 'Required if External Article is on.',
      hidden: ({ document }) => !document?.isExternal,
    }),
    defineField({
      name: 'externalPublication',
      title: 'Publication Name',
      type: 'string',
      description: 'e.g. Pittsburgh Post-Gazette',
      hidden: ({ document }) => !document?.isExternal,
    }),
    defineField({
      name: 'body',
      title: 'Article Body',
      type: 'array',
      of: [
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Alt Text', type: 'string' }),
            defineField({ name: 'caption', title: 'Caption', type: 'string' }),
          ],
        },
      ],
      hidden: ({ document }) => !!document?.isExternal,
    }),
  ],
  orderings: [
    { title: 'Published (Newest First)', name: 'publishedDesc', by: [{ field: 'publishedAt', direction: 'desc' }] },
  ],
  preview: {
    select: { title: 'title', subtitle: 'publishedAt', media: 'image', isExternal: 'isExternal' },
    prepare({ title, subtitle, media, isExternal }) {
      return { title, subtitle: `${subtitle ?? ''}${isExternal ? ' · External' : ''}`, media }
    },
  },
})
