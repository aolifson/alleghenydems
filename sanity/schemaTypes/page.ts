import { defineField, defineType } from 'sanity'
import type { SlugIsUniqueValidator } from 'sanity'

// Slugs only need to be unique per-municipality (or per-county, for
// municipality-less pages) — this lets Fox Chapel and Mt. Lebanon each have
// their own "who-we-are" page at the same slug without colliding with the
// county's own "who-we-are" page. Sanity's default isUnique check is scoped
// only to _type, so without this override the second municipality to use a
// given slug would be blocked.
const isSlugUniquePerMunicipality: SlugIsUniqueValidator = async (slug, context) => {
  const { document, getClient } = context
  const client = getClient({ apiVersion: '2024-01-01' })
  const id = document?._id.replace(/^drafts\./, '') ?? ''
  const municipalityRef = (document as { municipality?: { _ref?: string } } | undefined)?.municipality?._ref

  const query = municipalityRef
    ? `!defined(*[_type == "page" && !(_id in [$draft, $published]) && slug.current == $slug && municipality._ref == $municipalityRef][0]._id)`
    : `!defined(*[_type == "page" && !(_id in [$draft, $published]) && slug.current == $slug && !defined(municipality)][0]._id)`

  return client.fetch(query, {
    draft: `drafts.${id}`,
    published: id,
    slug,
    ...(municipalityRef ? { municipalityRef } : {}),
  })
}

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
      options: { source: 'title', isUnique: isSlugUniquePerMunicipality },
      description: 'Auto-generated from the title. Click "Generate" then do not change after publishing — this becomes the page URL. Only needs to be unique within this municipality (or within county pages) — e.g. every committee can have their own "who-we-are" page.',
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
    select: { title: 'title', slug: 'slug.current', municipalityName: 'municipality.name' },
    prepare({ title, slug, municipalityName }) {
      return { title, subtitle: `${municipalityName ?? 'ACDC'} · /${slug}` }
    },
  },
})
