import { defineField, defineType } from 'sanity'

export const voteReminderType = defineType({
  name: 'voteReminder',
  title: 'Vote Reminder Signups',
  type: 'document',
  // These are captured from the public website, not authored in the Studio.
  readOnly: true,
  fields: [
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'name',
      title: 'First name',
      type: 'string',
    }),
    defineField({
      name: 'voteMethod',
      title: 'How they plan to vote',
      type: 'string',
      options: {
        list: [
          { title: 'By mail', value: 'mail' },
          { title: 'In person', value: 'in-person' },
          { title: 'Undecided', value: 'undecided' },
        ],
      },
    }),
    defineField({
      name: 'zip',
      title: 'ZIP code',
      type: 'string',
    }),
    defineField({
      name: 'source',
      title: 'Signup source',
      type: 'string',
      description: 'Where this signup came from, e.g. "plan-to-vote".',
    }),
    defineField({
      name: 'createdAt',
      title: 'Signed up at',
      type: 'datetime',
    }),
    defineField({
      name: 'unsubscribed',
      title: 'Unsubscribed',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'unsubscribeToken',
      title: 'Unsubscribe token',
      type: 'string',
      description: 'Secret token used to build the one-click unsubscribe link.',
    }),
  ],
  orderings: [
    {
      title: 'Newest first',
      name: 'createdAtDesc',
      by: [{ field: 'createdAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      email: 'email',
      name: 'name',
      voteMethod: 'voteMethod',
      unsubscribed: 'unsubscribed',
      createdAt: 'createdAt',
    },
    prepare({ email, name, voteMethod, unsubscribed, createdAt }) {
      const status = unsubscribed ? '🚫' : '✅'
      const method =
        voteMethod === 'mail'
          ? 'by mail'
          : voteMethod === 'in-person'
            ? 'in person'
            : voteMethod === 'undecided'
              ? 'undecided'
              : null
      const date = createdAt ? new Date(createdAt).toLocaleDateString('en-US') : null
      const subtitleParts = [method, date].filter(Boolean)
      return {
        title: `${status} ${name ? `${name} — ` : ''}${email}`,
        subtitle: subtitleParts.join(' · ') || undefined,
      }
    },
  },
})
