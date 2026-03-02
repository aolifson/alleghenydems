import { defineField, defineType } from 'sanity'

export const newsType = defineType({
  name: 'news',
  title: 'News & Updates',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Headline',
      type: 'string',
      description: 'The article headline as it will appear on the site.',
      validation: (r) => r.required().error('Headline is required.'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'title' },
      description: 'Auto-generated from the headline. Click "Generate" then do not change it after publishing — this is the URL.',
      readOnly: ({ document }) => !!(document?.slug as { current?: string } | undefined)?.current,
      validation: (r) => r.required().error('Slug is required. Click Generate.'),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'date',
      description: 'Date shown alongside the article in listings.',
      validation: (r) => r.required().error('Published date is required.'),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'Short summary shown in listings and social media previews. 1–2 sentences.',
    }),
    defineField({
      name: 'image',
      title: 'Featured Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Thumbnail image shown in article listings.',
    }),
    defineField({
      name: 'isExternal',
      title: 'External Article (Press Coverage)',
      type: 'boolean',
      initialValue: false,
      description: 'Turn on if this links out to a news article from another publication (e.g. Post-Gazette coverage).',
    }),
    defineField({
      name: 'externalUrl',
      title: 'External URL',
      type: 'url',
      description: 'Full link to the article on the external site.',
      hidden: ({ document }) => !document?.isExternal,
    }),
    defineField({
      name: 'externalPublication',
      title: 'Publication Name',
      type: 'string',
      description: 'e.g. Pittsburgh Post-Gazette, WPXI',
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
            defineField({ name: 'alt', title: 'Alt Text', type: 'string', description: 'Describe the image for screen readers.' }),
            defineField({ name: 'caption', title: 'Caption', type: 'string' }),
          ],
        },
      ],
      description: 'The full article content. Use headings, bullet points, and images to organize.',
      hidden: ({ document }) => !!document?.isExternal,
    }),
    defineField({
      name: 'municipality',
      title: 'Municipality',
      type: 'reference',
      to: [{ type: 'municipality' }],
      description: 'Which municipality this post belongs to. Leave blank for county-wide news.',
      options: { filter: 'isActive == true', disableNew: false },
    }),
    defineField({
      name: 'shareWithAll',
      title: 'Share with all municipality sites',
      type: 'boolean',
      description: 'Show this county post on every active municipality site.',
      initialValue: false,
      hidden: ({ document }) => !!document?.municipality,
    }),
    defineField({
      name: 'sharedWith',
      title: 'Or share with specific municipalities',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'municipality' }], options: { filter: 'isActive == true' } }],
      description: 'Leave blank if using "Share with all" above.',
      hidden: ({ document }) => !!document?.municipality || !!(document?.shareWithAll),
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
