import { defineField, defineType } from 'sanity'

export const internalDocType = defineType({
  name: 'internalDoc',
  title: 'Internal Document',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Document name shown to members, e.g. "2026 Committee Bylaws".',
      validation: (r) => r.required().error('Title is required.'),
    }),
    defineField({
      name: 'file',
      title: 'File',
      type: 'file',
      description: 'The document itself (PDF, Word, etc.). Members download it through the secure members area.',
      hidden: ({ parent }) => Boolean(parent?.externalUrl),
    }),
    defineField({
      name: 'externalUrl',
      title: 'External Link',
      type: 'url',
      description:
        'Use this instead of File for documents that need real per-person access control (e.g. a Google Doc shared only with specific committee members) — Sanity datasets are project-wide, not per-document, so anything uploaded here is only as private as the whole project. Set sharing directly on the linked doc.',
      validation: (r) => r.uri({ scheme: ['http', 'https'] }),
      hidden: ({ parent }) => Boolean(parent?.file?.asset),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: ['Bylaws', 'Minutes', 'Forms', 'Training', 'Other'],
        layout: 'radio',
      },
      description: 'Used to group documents on the members page.',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      description: 'Optional sentence about what this document is for.',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'date',
      description: 'When this document was published or last revised.',
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
      description: 'Turn off to hide this document from members without deleting it.',
    }),
  ],
  validation: (Rule) =>
    Rule.custom((doc) => {
      const hasFile = Boolean(doc?.file && (doc.file as { asset?: unknown }).asset)
      const hasLink = Boolean(doc?.externalUrl)
      if (hasFile && hasLink) return 'Use either File or External Link, not both.'
      if (!hasFile && !hasLink) return 'Add a File or an External Link.'
      return true
    }),
  preview: {
    select: { title: 'title', subtitle: 'category' },
    prepare({ title, subtitle }) {
      return { title, subtitle: subtitle ? `🔒 ${subtitle}` : '🔒 Internal' }
    },
  },
})
