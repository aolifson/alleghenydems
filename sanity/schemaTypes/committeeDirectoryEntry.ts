import { defineField, defineType } from 'sanity'

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
