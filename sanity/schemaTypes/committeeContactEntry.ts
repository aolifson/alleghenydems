import { defineField, defineType } from 'sanity'

export const committeeContactEntryType = defineType({
  name: 'committeeContactEntry',
  title: 'Committee Contact Entry',
  type: 'document',
  fields: [
    defineField({
      name: 'committee',
      title: 'Committee',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'chair',
      title: 'Chair',
      type: 'string',
    }),
    defineField({
      name: 'websiteUrl',
      title: 'Website URL',
      type: 'url',
      validation: (r) => r.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'facebookUrl',
      title: 'Facebook URL',
      type: 'url',
      validation: (r) => r.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'instagramUrl',
      title: 'Instagram URL',
      type: 'url',
      validation: (r) => r.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'otherUrl',
      title: 'Other URL (Bluesky/X/Linktree)',
      type: 'url',
      validation: (r) => r.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Used to preserve table row order from import.',
    }),
    defineField({
      name: 'sourceTableId',
      title: 'Source Table ID',
      type: 'number',
      readOnly: true,
    }),
    defineField({
      name: 'sourceRowId',
      title: 'Source Row ID',
      type: 'number',
      readOnly: true,
    }),
  ],
  orderings: [
    {
      title: 'Committee',
      name: 'committee',
      by: [{ field: 'committee', direction: 'asc' }],
    },
    {
      title: 'Display Order',
      name: 'displayOrder',
      by: [{ field: 'displayOrder', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'committee',
      chair: 'chair',
      websiteUrl: 'websiteUrl',
      facebookUrl: 'facebookUrl',
      instagramUrl: 'instagramUrl',
      otherUrl: 'otherUrl',
    },
    prepare({ title, chair, websiteUrl, facebookUrl, instagramUrl, otherUrl }) {
      const channels = [websiteUrl, facebookUrl, instagramUrl, otherUrl].filter(Boolean).length
      return {
        title: title || 'Committee Contact Entry',
        subtitle: [chair, channels ? `${channels} link${channels === 1 ? '' : 's'}` : 'no links']
          .filter(Boolean)
          .join(' · '),
      }
    },
  },
})
