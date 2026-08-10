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
      description: 'e.g. Ward Chair, Vice Chair, Committee Person, State Representative',
    }),
    defineField({
      name: 'memberType',
      title: 'Type',
      type: 'string',
      description: 'Controls where this person appears on the site. Committee Member → public Committee Directory. Elected Official → the Elected Officials page. Leadership → the "Who We Are" leadership section.',
      options: {
        list: [
          { title: 'Committee Member', value: 'committee-member' },
          { title: 'Elected Official', value: 'elected-official' },
          { title: 'Leadership (Who We Are)', value: 'leadership' },
        ],
        layout: 'radio',
      },
      initialValue: 'committee-member',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'district',
      title: 'Ward / Municipality',
      type: 'string',
      description: 'e.g. Ward 5, Mt. Lebanon, North Side. Only applies to Committee Members — leave blank for Elected Officials and Leadership.',
      hidden: ({ document }) => document?.memberType !== 'committee-member',
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
      description: 'Contact phone number. Only shown to the public if "Show Phone Publicly" is turned on; always visible in the members-only roster.',
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
      name: 'blueskyUrl',
      title: 'Bluesky URL',
      type: 'url',
      description: 'Full Bluesky profile URL.',
      validation: (r) => r.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'websiteUrl',
      title: 'Website URL',
      type: 'url',
      description: 'Personal or campaign website URL.',
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
    defineField({
      name: 'municipality',
      title: 'Municipality',
      type: 'reference',
      to: [{ type: 'municipality' }],
      description: 'Which municipality this member belongs to. Leave blank for county-level members.',
      options: { filter: 'isActive == true', disableNew: false },
    }),
  ],
  orderings: [
    { title: 'Type, then Name', name: 'typeName', by: [{ field: 'memberType', direction: 'asc' }, { field: 'name', direction: 'asc' }] },
    { title: 'District, then Name', name: 'districtName', by: [{ field: 'district', direction: 'asc' }, { field: 'name', direction: 'asc' }] },
    { title: 'Display Order', name: 'orderAsc', by: [{ field: 'displayOrder', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'name', subtitle: 'title', description: 'district', media: 'photo', memberType: 'memberType' },
    prepare({ title, subtitle, description, media, memberType }) {
      const typeLabel = memberType === 'elected-official' ? 'Elected Official' : memberType === 'leadership' ? 'Leadership' : null
      return { title, subtitle: [subtitle, description, typeLabel].filter(Boolean).join(' · '), media }
    },
  },
})
