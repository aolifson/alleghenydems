import { defineField, defineType } from 'sanity'

export const voterGuideCandidateType = defineType({
  name: 'voterGuideCandidate',
  title: 'Voter Guide Candidate',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'Candidate Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'campaignWebsite',
      title: 'Campaign Website',
      type: 'url',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'facebookUrl',
      title: 'Facebook URL',
      type: 'url',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'instagramUrl',
      title: 'Instagram URL',
      type: 'url',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'xUrl',
      title: 'X (Twitter) URL',
      type: 'url',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 8,
    }),
    defineField({
      name: 'endorsedByAcdc',
      title: 'Endorsed by ACDC',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'ballotStatus',
      title: 'Ballot Status',
      type: 'string',
      options: {
        list: [
          { title: 'Listed Candidate', value: 'listed' },
          { title: 'Also Appearing on Ballot', value: 'alsoAppearing' },
          { title: 'Appearing on Ballot', value: 'appearing' },
          { title: 'Endorsed', value: 'endorsed' },
          { title: 'Unknown', value: 'unknown' },
        ],
        layout: 'radio',
      },
      initialValue: 'listed',
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first within each district.',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'campaignWebsite',
      media: 'photo',
      endorsedByAcdc: 'endorsedByAcdc',
    },
    prepare({ title, subtitle, media, endorsedByAcdc }) {
      const suffix = endorsedByAcdc ? 'Endorsed by ACDC' : undefined
      return {
        title,
        subtitle: [subtitle, suffix].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})

export const voterGuideDistrictType = defineType({
  name: 'voterGuideDistrict',
  title: 'Voter Guide District',
  type: 'object',
  fields: [
    defineField({
      name: 'districtLabel',
      title: 'District Label',
      type: 'string',
      description: 'Examples: DISTRICT 12, STATEWIDE',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'districtDescription',
      title: 'District Description',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'candidates',
      title: 'Candidates',
      type: 'array',
      of: [{ type: 'voterGuideCandidate' }],
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
    }),
  ],
  preview: {
    select: {
      title: 'districtLabel',
      subtitle: 'districtDescription',
    },
    prepare({ title, subtitle }) {
      return {
        title,
        subtitle: subtitle ? String(subtitle).slice(0, 80) : undefined,
      }
    },
  },
})

export const voterGuideRaceType = defineType({
  name: 'voterGuideRace',
  title: 'Voter Guide Race',
  type: 'object',
  fields: [
    defineField({
      name: 'officeTitle',
      title: 'Office Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'term',
      title: 'Term',
      type: 'string',
    }),
    defineField({
      name: 'annualSalary',
      title: 'Annual Salary',
      type: 'string',
    }),
    defineField({
      name: 'powersAndDuties',
      title: 'Powers & Duties',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'districts',
      title: 'Districts',
      type: 'array',
      of: [{ type: 'voterGuideDistrict' }],
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
    }),
  ],
  preview: {
    select: {
      title: 'officeTitle',
      subtitle: 'term',
    },
  },
})

export const voterGuideType = defineType({
  name: 'voterGuide',
  title: 'Voter Guide',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'cycleYear',
      title: 'Cycle Year',
      type: 'number',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroHeadline',
      title: 'Hero Headline',
      type: 'string',
    }),
    defineField({
      name: 'heroSubhead',
      title: 'Hero Subhead',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'electionDate',
      title: 'Election Date',
      type: 'date',
    }),
    defineField({
      name: 'intro',
      title: 'Intro Content',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'races',
      title: 'Races',
      type: 'array',
      of: [{ type: 'voterGuideRace' }],
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'sourcePdfTitle',
      title: 'Source PDF Title',
      type: 'string',
      description: 'For editorial reference only.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'cycleYear',
    },
    prepare({ title, subtitle }) {
      return {
        title,
        subtitle: subtitle ? `Cycle ${subtitle}` : undefined,
      }
    },
  },
})
