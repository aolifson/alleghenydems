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
      description: 'Member\'s full name.',
      validation: (r) => r.required().error('Name is required.'),
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
      description: 'e.g. Ward 5, Mt. Lebanon, North Side. Leave blank for leadership/staff.',
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      description: 'Member headshot. Use the focal-point handles to control cropping.',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      description: 'Public contact email.',
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
      description: 'Public contact phone number.',
    }),
    defineField({
      name: 'facebookUrl',
      title: 'Facebook URL',
      type: 'url',
      description: 'Full Facebook profile or page URL.',
      validation: (r) => r.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'instagramUrl',
      title: 'Instagram URL',
      type: 'url',
      description: 'Full Instagram profile URL.',
      validation: (r) => r.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'xUrl',
      title: 'X (Twitter) URL',
      type: 'url',
      description: 'Full X/Twitter profile URL.',
      validation: (r) => r.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'isActive',
      title: 'Active Member',
      type: 'boolean',
      initialValue: true,
      description: 'Turn off to hide this member from the public site without deleting the record.',
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first within the same ward/district. Leave blank for alphabetical order.',
    }),
    defineField({
      name: 'externalId',
      title: 'External ID (System)',
      type: 'string',
      description: 'Auto-assigned during CSV import for deduplication. Do not edit.',
      readOnly: true,
      hidden: ({ currentUser }) =>
        !currentUser?.roles?.some((r: { name: string }) => r.name === 'administrator'),
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
