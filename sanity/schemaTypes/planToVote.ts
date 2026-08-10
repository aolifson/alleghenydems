import { defineField, defineType } from 'sanity'
import { CalendarIcon } from '@sanity/icons'

// Editable copy and outbound links for the "Make a Plan to Vote" hub.
//
// Deliberately does NOT hold the election dates. Those are statutory
// deadlines that also drive the reminder emails, so they stay in
// lib/election.ts as one source of truth — otherwise the page and the emails
// could disagree about when a deadline is. Update dates there each cycle.
export const planToVoteType = defineType({
  name: 'planToVote',
  title: 'Make a Plan to Vote',
  type: 'document',
  icon: CalendarIcon,
  groups: [
    { name: 'intro', title: 'Intro' },
    { name: 'steps', title: 'The Four Steps' },
    { name: 'links', title: 'Outbound Links' },
    { name: 'help', title: 'Help Box' },
  ],
  fields: [
    defineField({
      name: 'heroHeadline',
      title: 'Headline',
      type: 'string',
      group: 'intro',
      description: 'Large heading at the top of the page.',
    }),
    defineField({
      name: 'heroIntro',
      title: 'Intro Text',
      type: 'text',
      rows: 3,
      group: 'intro',
      description: 'Short paragraph below the headline, above the countdown.',
    }),

    ...stepFields(1, 'Check that you’re registered'),
    ...stepFields(2, 'Choose how you’ll vote'),
    ...stepFields(3, 'Know what’s on your ballot'),
    ...stepFields(4, 'Lock in your plan'),

    defineField({
      name: 'mailCardHeading',
      title: 'Vote-by-Mail Card Heading',
      type: 'string',
      group: 'steps',
      description: 'Heading on the vote-by-mail box inside step 2.',
    }),
    defineField({
      name: 'inPersonCardHeading',
      title: 'In-Person Card Heading',
      type: 'string',
      group: 'steps',
      description: 'Heading on the vote-in-person box inside step 2.',
    }),

    ...linkField('registerUrl', 'Register to Vote'),
    ...linkField('checkRegistrationUrl', 'Check Registration'),
    ...linkField('applyMailBallotUrl', 'Apply for a Mail Ballot'),
    ...linkField('trackBallotUrl', 'Track My Ballot'),
    ...linkField('pollingPlaceUrl', 'Find My Polling Place'),
    ...linkField('earlyVotingUrl', 'Early Voting'),
    ...linkField('electionCalendarUrl', 'Full Election Calendar'),

    defineField({
      name: 'helpHeading',
      title: 'Help Box Heading',
      type: 'string',
      group: 'help',
    }),
    defineField({
      name: 'helpBody',
      title: 'Help Box Text',
      type: 'text',
      rows: 3,
      group: 'help',
      description: 'Shown in the tinted box at the bottom of the page.',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Make a Plan to Vote' }
    },
  },
})

function stepFields(n: number, defaultTitle: string) {
  return [
    defineField({
      name: `step${n}Title`,
      title: `Step ${n} — Heading`,
      type: 'string',
      group: 'steps',
      description: `Default: "${defaultTitle}"`,
    }),
    defineField({
      name: `step${n}Body`,
      title: `Step ${n} — Text`,
      type: 'text',
      rows: 3,
      group: 'steps',
    }),
  ]
}

function linkField(name: string, label: string) {
  return [
    defineField({
      name,
      title: label,
      type: 'url',
      group: 'links',
      description: 'Leave blank to use the site default.',
      validation: (r) => r.uri({ scheme: ['http', 'https'] }),
    }),
  ]
}
