import { defineField, defineType } from 'sanity'

// Municipality-project variant: no `municipality` field — see
// sanity/schemaTypes/committeeDirectoryEntry.ts for the county-project variant.
export const committeeDirectoryEntryType = defineType({
  name: 'committeeDirectoryEntry',
  title: 'Committee Directory Entry',
  type: 'document',
  fields: [
    defineField({
      name: 'committee',
      title: 'Committee',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'ward',
      title: 'Ward',
      type: 'string',
    }),
    defineField({
      name: 'district',
      title: 'District',
      type: 'string',
    }),
    defineField({
      name: 'firstName',
      title: 'First Name',
      type: 'string',
    }),
    defineField({
      name: 'lastName',
      title: 'Last Name',
      type: 'string',
    }),
    defineField({
      name: 'committeeOffice',
      title: 'Committee Office',
      type: 'string',
      description: 'e.g. Chair, Vice Chair, Committee Person',
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
      description: 'Turn off to hide this entry without deleting it.',
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Controls the order within this committee/ward. Lower numbers appear first.',
    }),
  ],
  orderings: [
    {
      title: 'Committee / Ward / District',
      name: 'committeeWardDistrict',
      by: [
        { field: 'committee', direction: 'asc' },
        { field: 'ward', direction: 'asc' },
        { field: 'district', direction: 'asc' },
      ],
    },
    {
      title: 'Display Order',
      name: 'displayOrder',
      by: [{ field: 'displayOrder', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      committee: 'committee',
      ward: 'ward',
      district: 'district',
      firstName: 'firstName',
      lastName: 'lastName',
      committeeOffice: 'committeeOffice',
    },
    prepare({ committee, ward, district, firstName, lastName, committeeOffice }) {
      const name = [firstName, lastName].filter(Boolean).join(' ').trim() || '(vacant)'
      const seat = [committee, ward && `Ward ${ward}`, district && `District ${district}`]
        .filter(Boolean)
        .join(' · ')
      const subtitle = [name, committeeOffice].filter(Boolean).join(' · ')
      return {
        title: seat || committee || 'Committee Directory Entry',
        subtitle,
      }
    },
  },
})
