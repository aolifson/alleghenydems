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
  preview: {
    select: { title: 'title', subtitle: 'category' },
    prepare({ title, subtitle }) {
      return { title, subtitle: subtitle ? `🔒 ${subtitle}` : '🔒 Internal' }
    },
  },
})
