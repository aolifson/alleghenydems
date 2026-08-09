import { defineField, defineType } from 'sanity'

// Municipality-project variant: no `municipality` field — see
// sanity/schemaTypes/committeeMember.ts for the county-project variant.
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
      title: 'Ward',
      type: 'string',
      description: 'e.g. Ward 5. Leave blank for leadership/staff.',
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      description: 'Member headshot. Use the focal-point handles to control cropping.',
    }),
    defineField({
      name: 'bio',
      title: 'Short Bio',
      type: 'text',
      rows: 3,
      description: 'A sentence or two about the member, shown when their card is expanded.',
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
      description: 'Contact phone number. Only shown to the public if "Show Phone Publicly" is turned on.',
    }),
    defineField({
      name: 'showPhonePublicly',
      title: 'Show Phone Publicly',
      type: 'boolean',
      initialValue: false,
      description: 'Turn on to display this member\'s phone number in the public directory. Off by default for privacy.',
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
      name: 'xUrl',
      title: 'X (Twitter) URL',
      type: 'url',
      validation: (r) => r.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'blueskyUrl',
      title: 'Bluesky URL',
      type: 'url',
      validation: (r) => r.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'websiteUrl',
      title: 'Website URL',
      type: 'url',
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
      description: 'Lower numbers appear first within the same ward. Leave blank for alphabetical order.',
    }),
  ],
  orderings: [
    { title: 'Ward, then Name', name: 'districtName', by: [{ field: 'district', direction: 'asc' }, { field: 'name', direction: 'asc' }] },
    { title: 'Display Order', name: 'orderAsc', by: [{ field: 'displayOrder', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'name', subtitle: 'title', description: 'district', media: 'photo' },
    prepare({ title, subtitle, description, media }) {
      return { title, subtitle: [subtitle, description].filter(Boolean).join(' · '), media }
    },
  },
})
