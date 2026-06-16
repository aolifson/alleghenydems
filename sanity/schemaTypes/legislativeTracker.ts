import { defineField, defineType } from 'sanity'

export const legislativeActionType = defineType({
  name: 'legislativeAction',
  title: 'Legislative Action',
  type: 'object',
  fields: [
    defineField({ name: 'official', title: 'Official', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'party',
      title: 'Party',
      type: 'string',
      options: { list: [{ title: 'Democrat', value: 'D' }, { title: 'Republican', value: 'R' }] },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'office', title: 'Office', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 5, validation: (r) => r.required() }),
    defineField({ name: 'date', title: 'Date', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'type',
      title: 'Action Type',
      type: 'string',
      options: {
        list: [
          { title: 'Accomplishment', value: 'accomplishment' },
          { title: 'Blocked', value: 'blocked' },
          { title: 'Harmful', value: 'harmful' },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'category', title: 'Category', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'sourceLabel', title: 'Source Label', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'sourceUrl', title: 'Source URL', type: 'url', validation: (r) => r.required() }),
    defineField({
      name: 'municipalities',
      title: 'Municipalities Affected',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (r) => r.min(1),
    }),
    defineField({ name: 'displayOrder', title: 'Display Order', type: 'number' }),
    // ─── Auto-import fields (populated by scripts/refresh-legislative-tracker.py) ───
    defineField({
      name: 'needsReview',
      title: 'Needs Review',
      type: 'boolean',
      initialValue: false,
      description:
        'TRUE for items pulled automatically that have not yet been checked by an editor. Set the Action Type, confirm the framing, verify the source, then uncheck. The public page only shows published items, so review happens here in drafts.',
    }),
    defineField({
      name: 'autoImported',
      title: 'Auto-Imported',
      type: 'boolean',
      initialValue: false,
      readOnly: true,
      description: 'Set automatically when this item came from LegiScan or Congress.gov rather than being entered by hand.',
    }),
    defineField({
      name: 'externalId',
      title: 'External ID',
      type: 'string',
      readOnly: true,
      description: 'Stable de-duplication key (source + chamber + roll-call + official). Do not edit — the importer uses it to avoid duplicates.',
    }),
    defineField({ name: 'billId', title: 'Bill / Roll Call', type: 'string', description: 'e.g. "PA HB 1234" or "US HR 567".' }),
    defineField({
      name: 'chamber',
      title: 'Chamber',
      type: 'string',
      options: {
        list: [
          { title: 'PA House', value: 'pa-house' },
          { title: 'PA Senate', value: 'pa-senate' },
          { title: 'U.S. House', value: 'us-house' },
          { title: 'U.S. Senate', value: 'us-senate' },
        ],
      },
    }),
    defineField({
      name: 'voteValue',
      title: 'How They Voted',
      type: 'string',
      options: {
        list: [
          { title: 'Yea', value: 'Yea' },
          { title: 'Nay', value: 'Nay' },
          { title: 'Present', value: 'Present' },
          { title: 'Not Voting', value: 'Not Voting' },
        ],
      },
    }),
  ],
  preview: {
    select: { title: 'official', subtitle: 'category', type: 'type', needsReview: 'needsReview' },
    prepare({ title, subtitle, type, needsReview }) {
      const labels: Record<string, string> = {
        accomplishment: 'Delivered',
        blocked: 'Blocked',
        harmful: 'Harmful',
      }
      const prefix = needsReview ? '🆕 REVIEW · ' : ''
      return {
        title: `${prefix}${title}`,
        subtitle: [subtitle, labels[String(type)]].filter(Boolean).join(' · '),
      }
    },
  },
})

export const legislativeLocalEntryType = defineType({
  name: 'legislativeLocalEntry',
  title: 'Local Community Entry',
  type: 'object',
  fields: [
    defineField({ name: 'community', title: 'Community', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'outcome',
      title: 'Outcome',
      type: 'string',
      options: {
        list: [
          { title: 'Helped', value: 'helped' },
          { title: 'Hurt', value: 'hurt' },
          { title: 'Ongoing', value: 'ongoing' },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'party',
      title: 'Party',
      type: 'string',
      options: { list: [{ title: 'Democrat', value: 'D' }, { title: 'Republican', value: 'R' }, { title: 'Both', value: 'both' }] },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'summary', title: 'Summary', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'detail', title: 'Detail', type: 'text', rows: 5, validation: (r) => r.required() }),
    defineField({ name: 'date', title: 'Date', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'sourceLabel', title: 'Source Label', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'sourceUrl', title: 'Source URL', type: 'url', validation: (r) => r.required() }),
    defineField({ name: 'displayOrder', title: 'Display Order', type: 'number' }),
  ],
  preview: {
    select: { title: 'community', subtitle: 'summary', outcome: 'outcome' },
    prepare({ title, subtitle, outcome }) {
      const labels: Record<string, string> = {
        helped: 'Helped',
        hurt: 'Hurt',
        ongoing: 'Ongoing',
      }
      return {
        title,
        subtitle: [labels[String(outcome)], subtitle].filter(Boolean).join(' · '),
      }
    },
  },
})

export const legislativeExternalLinkType = defineType({
  name: 'legislativeExternalLink',
  title: 'External Link',
  type: 'object',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'url', title: 'URL', type: 'url', validation: (r) => r.required() }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 2 }),
    defineField({ name: 'displayOrder', title: 'Display Order', type: 'number' }),
  ],
  preview: {
    select: { title: 'label', subtitle: 'url' },
  },
})

export const legislativeOfficialRowType = defineType({
  name: 'legislativeOfficialRow',
  title: 'Official Row',
  type: 'object',
  fields: [
    defineField({ name: 'official', title: 'Official', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'office', title: 'Office', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'municipalities', title: 'Municipalities', type: 'text', rows: 3, validation: (r) => r.required() }),
    defineField({ name: 'displayOrder', title: 'Display Order', type: 'number' }),
  ],
  preview: {
    select: { title: 'official', subtitle: 'office' },
  },
})

export const legislativeTrackerType = defineType({
  name: 'legislativeTracker',
  title: 'Legislative Tracker',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'title' },
      readOnly: ({ document }) => !!(document?.slug as { current?: string } | undefined)?.current,
      validation: (r) => r.required(),
    }),
    defineField({ name: 'heroHeadline', title: 'Hero Headline', type: 'string' }),
    defineField({ name: 'heroSubhead', title: 'Hero Subhead', type: 'text', rows: 2 }),
    defineField({
      name: 'heroImage',
      title: 'Hero Background Image',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
    }),
    defineField({
      name: 'categories',
      title: 'Category Order',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Controls category ordering for both sections. Categories not listed here are appended alphabetically.',
    }),
    defineField({
      name: 'actions',
      title: 'Legislative Actions',
      type: 'array',
      of: [{ type: 'legislativeAction' }],
      validation: (r) => r.min(1),
    }),
    defineField({
      name: 'localEntries',
      title: 'Your Borough, Your Story Entries',
      type: 'array',
      of: [{ type: 'legislativeLocalEntry' }],
    }),
    defineField({
      name: 'districtLookupIntro',
      title: 'District Lookup Intro',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'districtLookupLinks',
      title: 'District Lookup External Links',
      type: 'array',
      of: [{ type: 'legislativeExternalLink' }],
    }),
    defineField({
      name: 'officialTableIntro',
      title: 'Official Table Intro',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'republicanOfficials',
      title: 'Republican Official Table Rows',
      type: 'array',
      of: [{ type: 'legislativeOfficialRow' }],
    }),
    defineField({ name: 'aboutTitle', title: 'About Box Title', type: 'string' }),
    defineField({ name: 'aboutBody', title: 'About Box Body', type: 'text', rows: 4 }),
    defineField({ name: 'lastUpdatedNote', title: 'Last Updated Note', type: 'text', rows: 3 }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'slug.current' },
    prepare({ title, subtitle }) {
      return { title, subtitle: subtitle ? `/${subtitle}` : 'no slug' }
    },
  },
})
