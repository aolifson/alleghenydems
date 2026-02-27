import { defineField, defineType } from 'sanity'

export const pageType = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      description: 'The page title shown in the browser tab and used to generate the URL slug.',
      validation: (r) => r.required().error('Page title is required.'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'title' },
      description: 'Auto-generated from the title. Click "Generate" then do not change after publishing — this becomes the page URL.',
      readOnly: ({ document }) => !!(document?.slug as { current?: string } | undefined)?.current,
      validation: (r) => r.required().error('Slug is required. Click Generate.'),
    }),
    defineField({
      name: 'heroHeadline',
      title: 'Hero Headline',
      type: 'string',
      description: 'Large text shown on the page banner at the top. Keep it short.',
    }),
    defineField({
      name: 'heroSubhead',
      title: 'Hero Subhead',
      type: 'string',
      description: 'Short supporting line shown below the hero headline.',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Background Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Background image for the page banner. Use the focal-point handles to control cropping.',
      fields: [
        defineField({ name: 'alt', title: 'Alt Text', type: 'string', description: 'Describe the image for screen readers and SEO.' }),
      ],
    }),
    defineField({
      name: 'body',
      title: 'Page Content',
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
      description: 'The main content of the page. Use headings, paragraphs, bullet points, and images.',
    }),
    defineField({
      name: 'municipality',
      title: 'Municipality',
      type: 'reference',
      to: [{ type: 'municipality' }],
      description: 'Which municipality this page belongs to. Leave blank for county-wide pages.',
      options: { filter: 'isActive == true', disableNew: false },
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'slug.current' },
    prepare({ title, subtitle }) {
      return { title, subtitle: `/${subtitle}` }
    },
  },
})
