import { defineField, defineType } from 'sanity'
import { CalendarIcon } from '@sanity/icons'

// An in-body block for content that should only appear on the site during a
// specific window — e.g. an endorsement-process notice that only matters
// near Endorsement Day, or filing requirements that only matter during
// candidate-petition season. Outside the window the section is simply
// skipped when the page renders (see sanity/lib/pageBody.ts,
// applyScheduledSections); leave both dates blank to show it always, same as
// a normal block.
export const scheduledSectionType = defineType({
  name: 'scheduledSection',
  title: 'Scheduled Section',
  type: 'object',
  icon: CalendarIcon,
  fields: [
    defineField({
      name: 'internalLabel',
      title: 'Internal Label',
      type: 'string',
      description: 'Admin-only name to identify this section in the content list (not shown to visitors).',
    }),
    defineField({
      name: 'publishFrom',
      title: 'Visible From',
      type: 'datetime',
      description: 'The section appears on the site starting this date. Leave blank to show immediately.',
    }),
    defineField({
      name: 'publishUntil',
      title: 'Visible Until',
      type: 'datetime',
      description: 'The section stops appearing on the site at this date. Leave blank for no expiration.',
    }),
    defineField({
      name: 'content',
      title: 'Section Content',
      type: 'array',
      of: [
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Alt Text', type: 'string', description: 'Describe the image for screen readers.' }),
            defineField({ name: 'caption', title: 'Caption', type: 'string' }),
          ],
        },
      ],
      description: 'Content shown only while this section is visible.',
    }),
  ],
  preview: {
    select: { title: 'internalLabel', from: 'publishFrom', until: 'publishUntil' },
    prepare({ title, from, until }) {
      const fromLabel = from ? new Date(from).toLocaleDateString() : 'always'
      const untilLabel = until ? new Date(until).toLocaleDateString() : 'no end'
      return {
        title: title || 'Scheduled Section',
        subtitle: `📅 ${fromLabel} → ${untilLabel}`,
      }
    },
  },
})
