import { defineField, defineType } from 'sanity'

// Municipality-project variant: no `municipality`/`shareWithAll`/`sharedWith`
// fields — see sanity/schemaTypes/actionAlert.ts for the county-project variant.
export const actionAlertType = defineType({
  name: 'actionAlert',
  title: 'Action Alerts',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Internal Label',
      type: 'string',
      description: 'Admin-only label to identify this alert (not shown to visitors)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      description: 'The main message shown to visitors',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Details',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Optional supporting context or instructions',
    }),
    defineField({
      name: 'urgency',
      title: 'Urgency Level',
      type: 'string',
      options: {
        list: [
          { title: 'Urgent (red) — votes, deadlines', value: 'urgent' },
          { title: 'Action (gold) — calls, emails, petitions', value: 'action' },
          { title: 'Announcement (blue) — general updates', value: 'announcement' },
        ],
        layout: 'radio',
      },
      initialValue: 'action',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'ctaLabel',
      title: 'Button Label',
      type: 'string',
      description: 'Text on the call-to-action button, e.g. "Call Your Rep" or "Sign Petition"',
    }),
    defineField({
      name: 'ctaUrl',
      title: 'Button Link',
      type: 'url',
      description: 'URL for the button. Can be an external link, internal path (e.g. /events), or phone link (tel:+14125551234)',
      validation: (Rule) =>
        Rule.uri({ allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel'] }),
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date & Time',
      type: 'datetime',
      description: 'When this alert becomes active',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'End Date & Time',
      type: 'datetime',
      description: 'When this alert expires. Leave blank for no expiry.',
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Quick on/off toggle. Inactive alerts never display.',
      initialValue: false,
    }),
    defineField({
      name: 'showInBanner',
      title: 'Show as Sitewide Banner',
      type: 'boolean',
      description: 'Display this alert as a banner across all pages. If multiple are enabled, the most recent shows.',
      initialValue: false,
    }),
  ],
  orderings: [
    {
      title: 'Start Date, Newest First',
      name: 'startDateDesc',
      by: [{ field: 'startDate', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      headline: 'headline',
      urgency: 'urgency',
      isActive: 'isActive',
    },
    prepare({ title, headline, urgency, isActive }) {
      const urgencyEmoji = urgency === 'urgent' ? '🔴' : urgency === 'action' ? '🟡' : '🔵'
      const status = isActive ? '✅' : '⏸️'
      return {
        title: `${status} ${urgencyEmoji} ${title}`,
        subtitle: headline,
      }
    },
  },
})
