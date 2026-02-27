import { defineField, defineType } from 'sanity'

export const eventType = defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Event Title',
      type: 'string',
      description: 'The name of the event as it will appear on the site.',
      validation: (r) => r.required().error('Event title is required.'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'title' },
      description: 'Auto-generated from the title. Click "Generate" then do not change it after publishing — this is the URL.',
      readOnly: ({ document }) => !!(document?.slug as { current?: string } | undefined)?.current,
      validation: (r) => r.required().error('Slug is required. Click Generate.'),
    }),
    defineField({
      name: 'date',
      title: 'Start Date & Time',
      type: 'datetime',
      description: 'When the event starts.',
      validation: (r) => r.required().error('Start date is required.'),
    }),
    defineField({
      name: 'endDate',
      title: 'End Date & Time',
      type: 'datetime',
      description: 'When the event ends (optional).',
    }),
    defineField({
      name: 'locationName',
      title: 'Location Name',
      type: 'string',
      description: 'e.g. Allegheny County Democratic HQ',
    }),
    defineField({
      name: 'locationAddress',
      title: 'Location Address',
      type: 'string',
      description: 'Full street address used to generate a Google Maps link.',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Full event description shown on the event page.',
    }),
    defineField({
      name: 'image',
      title: 'Event Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Promotional image for the event.',
    }),
    defineField({
      name: 'rsvpUrl',
      title: 'RSVP / Registration Link',
      type: 'url',
      description: 'Mobilize America or other registration URL. Paste the full link.',
    }),
    defineField({
      name: 'isFeatured',
      title: 'Feature on Homepage',
      type: 'boolean',
      initialValue: false,
      description: 'Turn on to show this event in the homepage featured events section.',
    }),
    defineField({
      name: 'municipality',
      title: 'Municipality',
      type: 'reference',
      to: [{ type: 'municipality' }],
      description: 'Which municipality this event belongs to. Leave blank for county-wide events.',
      options: { filter: 'isActive == true', disableNew: false },
    }),
  ],
  orderings: [
    { title: 'Date (Upcoming First)', name: 'dateAsc', by: [{ field: 'date', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'title', subtitle: 'date', media: 'image' },
    prepare({ title, subtitle, media }) {
      const date = subtitle ? new Date(subtitle).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'
      return { title, subtitle: date, media }
    },
  },
})
