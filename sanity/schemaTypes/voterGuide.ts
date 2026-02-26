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
      description: 'Full name as it appears on the ballot.',
      validation: (rule) => rule.required().error('Candidate name is required.'),
    }),
    defineField({
      name: 'endorsedByAcdc',
      title: 'Endorsed by ACDC',
      type: 'boolean',
      initialValue: false,
      description: 'Turn on if ACDC officially endorses this candidate.',
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
      description: 'How this candidate appears in the guide.',
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      description: 'Candidate headshot. Displayed next to their bio.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'e.g. "Jane Smith headshot"',
        }),
      ],
    }),
    defineField({
      name: 'description',
      title: 'Bio / Description',
      type: 'text',
      rows: 6,
      description: 'Short candidate biography or endorsement rationale.',
    }),
    defineField({
      name: 'campaignWebsite',
      title: 'Campaign Website',
      type: 'url',
      description: 'Full URL, e.g. https://janesmith.com',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'facebookUrl',
      title: 'Facebook URL',
      type: 'url',
      description: 'Full Facebook profile or page URL.',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'instagramUrl',
      title: 'Instagram URL',
      type: 'url',
      description: 'Full Instagram profile URL.',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'xUrl',
      title: 'X (Twitter) URL',
      type: 'url',
      description: 'Full X/Twitter profile URL.',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first within the district. Leave blank to use alphabetical order.',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'ballotStatus',
      media: 'photo',
      endorsedByAcdc: 'endorsedByAcdc',
    },
    prepare({ title, subtitle, media, endorsedByAcdc }) {
      const statusLabel: Record<string, string> = {
        listed: 'Listed',
        alsoAppearing: 'Also on ballot',
        appearing: 'On ballot',
        endorsed: 'Endorsed',
        unknown: 'Unknown',
      }
      const parts = [statusLabel[subtitle as string] ?? subtitle, endorsedByAcdc ? '⭐ ACDC Endorsed' : undefined]
      return {
        title,
        subtitle: parts.filter(Boolean).join(' · '),
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
      description: 'How the district is labeled in the guide, e.g. DISTRICT 12, STATEWIDE, COUNTYWIDE.',
      validation: (rule) => rule.required().error('District label is required.'),
    }),
    defineField({
      name: 'districtDescription',
      title: 'District Description',
      type: 'text',
      rows: 3,
      description: 'Optional geographic description of this district.',
    }),
    defineField({
      name: 'searchTerms',
      title: 'Search Terms',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Optional aliases for district lookup, e.g. Mt Lebanon, Squirrel Hill, Monroeville.',
    }),
    defineField({
      name: 'zipCodes',
      title: 'ZIP Codes',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Optional ZIP codes used for district lookup. Use 5-digit ZIPs only.',
      validation: (rule) =>
        rule.custom((value) => {
          if (!value) return true
          if (!Array.isArray(value)) return 'ZIP Codes must be a list.'
          const invalid = value.find((zip) => !/^\d{5}$/.test(String(zip).trim()))
          return invalid ? `Invalid ZIP code: ${invalid}` : true
        }),
    }),
    defineField({
      name: 'candidates',
      title: 'Candidates',
      type: 'array',
      of: [{ type: 'voterGuideCandidate' }],
      description: 'All candidates running in this district for this race.',
      validation: (rule) => rule.min(1).error('Add at least one candidate.'),
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first within the race.',
    }),
  ],
  preview: {
    select: {
      title: 'districtLabel',
      candidates: 'candidates',
    },
    prepare({ title, candidates }) {
      const count = Array.isArray(candidates) ? candidates.length : 0
      return {
        title,
        subtitle: `${count} candidate${count === 1 ? '' : 's'}`,
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
      description: 'Name of the elected position, e.g. Sheriff, District Attorney, Common Pleas Judge.',
      validation: (rule) => rule.required().error('Office title is required.'),
    }),
    defineField({
      name: 'term',
      title: 'Term Length',
      type: 'string',
      description: 'e.g. 4-year term, 10-year term',
    }),
    defineField({
      name: 'annualSalary',
      title: 'Annual Salary',
      type: 'string',
      description: 'e.g. $95,000',
    }),
    defineField({
      name: 'powersAndDuties',
      title: 'Powers & Duties',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Bullet-point list of what this office does. Add one item per line.',
    }),
    defineField({
      name: 'districts',
      title: 'Districts / Jurisdictions',
      type: 'array',
      of: [{ type: 'voterGuideDistrict' }],
      description: 'Add a district for each geographic area covered by this race. Most countywide races have just one district.',
      validation: (rule) => rule.min(1).error('Add at least one district.'),
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Controls the order races appear in the guide. Lower numbers appear first.',
    }),
  ],
  preview: {
    select: {
      title: 'officeTitle',
      term: 'term',
      districts: 'districts',
    },
    prepare({ title, term, districts }) {
      const districtCount = Array.isArray(districts) ? districts.length : 0
      return {
        title,
        subtitle: [term, `${districtCount} district${districtCount === 1 ? '' : 's'}`].filter(Boolean).join(' · '),
      }
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
      title: 'Guide Title',
      type: 'string',
      description: 'e.g. 2026 ACDC Primary Voter Guide',
      validation: (rule) => rule.required().error('Guide title is required.'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'title' },
      description: 'Auto-generated from the title. Click "Generate" then do not change after publishing.',
      readOnly: ({ document }) => !!(document?.slug as { current?: string } | undefined)?.current,
      validation: (rule) => rule.required().error('Slug is required. Click Generate.'),
    }),
    defineField({
      name: 'cycleYear',
      title: 'Election Year',
      type: 'number',
      description: 'The election year this guide covers, e.g. 2026.',
      validation: (rule) => rule.required().integer().min(2020).error('Election year is required.'),
    }),
    defineField({
      name: 'electionDate',
      title: 'Election Date',
      type: 'date',
      description: 'The date of the election. Shown at the top of the guide.',
    }),
    defineField({
      name: 'heroHeadline',
      title: 'Hero Headline',
      type: 'string',
      description: 'Large text shown on the guide banner. e.g. "Your 2026 Voter Guide"',
    }),
    defineField({
      name: 'heroSubhead',
      title: 'Hero Subhead',
      type: 'text',
      rows: 2,
      description: 'Supporting sentence shown below the hero headline.',
    }),
    defineField({
      name: 'intro',
      title: 'Introduction',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Optional introductory text shown before the list of races.',
    }),
    defineField({
      name: 'races',
      title: 'Races',
      type: 'array',
      of: [{ type: 'voterGuideRace' }],
      description: 'Add one entry per elected office (e.g. Sheriff, District Attorney). Each race contains districts and candidates.',
      validation: (rule) => rule.min(1).error('Add at least one race.'),
    }),
    defineField({
      name: 'sourcePdfTitle',
      title: 'Source PDF Title',
      type: 'string',
      description: 'For editorial reference only — the name of the original PDF this guide was based on.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      cycleYear: 'cycleYear',
      electionDate: 'electionDate',
    },
    prepare({ title, cycleYear, electionDate }) {
      const dateStr = electionDate ? ` · ${new Date(electionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''
      return {
        title,
        subtitle: cycleYear ? `${cycleYear}${dateStr}` : undefined,
      }
    },
  },
})
