import { defineField, defineType } from 'sanity'
import { HomeIcon } from '@sanity/icons'
import { navItemArrayField } from '../municipality'
import { HiddenSharedItemsInput } from '../../components/HiddenSharedItemsInput'
import { DEFAULT_NAV_SECTION_OPTIONS } from '@/lib/default-nav'

// Singleton, one per migrated municipality project. Branding/nav/contact
// fields a committee fully controls — the county's `municipality` doc keeps
// only the routing fields (slug/customDomain/subdomain/isActive) needed to
// resolve which project a hostname belongs to. See
// sanity/schemaTypes/municipality.ts for the county-side registry doc, and
// docs/MULTI-PROJECT-MIGRATION.md for the split rationale.
export const municipalitySettingsType = defineType({
  name: 'municipalitySettings',
  title: 'Municipality Settings',
  type: 'document',
  icon: HomeIcon,
  groups: [
    { name: 'branding', title: 'Branding' },
    { name: 'content', title: 'Homepage Content' },
    { name: 'contact', title: 'Contact & Social' },
    { name: 'nav', title: 'Navigation' },
    { name: 'sharing', title: 'Shared County Content' },
    { name: 'technical', title: 'Technical' },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Municipality Name',
      type: 'string',
      group: 'branding',
      description: 'e.g. "Fox Chapel Democrats"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      group: 'branding',
      options: { hotspot: false },
      description: 'SVG or PNG. Replaces the county seal in the Nav and Footer.',
    }),
    defineField({
      name: 'accentColor',
      title: 'Accent Color (hex)',
      type: 'string',
      group: 'branding',
      description: 'e.g. #2ea3f2. Overrides the default blue accent color for this municipality.',
      validation: (r) =>
        r.custom((val) => {
          if (!val) return true
          return /^#[0-9a-fA-F]{6}$/.test(val as string) || 'Must be a 6-digit hex color, e.g. #2ea3f2'
        }),
    }),

    defineField({
      name: 'heroHeadline',
      title: 'Hero Headline',
      type: 'string',
      group: 'content',
      description: 'Main bold text on the homepage hero banner.',
    }),
    defineField({
      name: 'heroSubtext',
      title: 'Hero Subtext',
      type: 'text',
      rows: 2,
      group: 'content',
      description: 'Supporting sentence shown below the headline.',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Background Image',
      type: 'image',
      group: 'content',
      options: { hotspot: true },
      description: 'Background image for the homepage hero.',
    }),

    defineField({
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'string',
      group: 'contact',
    }),
    defineField({
      name: 'contactPhone',
      title: 'Contact Phone',
      type: 'string',
      group: 'contact',
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'text',
      rows: 2,
      group: 'contact',
    }),
    defineField({
      name: 'facebookPageUrl',
      title: 'Facebook Page URL',
      type: 'url',
      group: 'contact',
      description: 'Full URL, e.g. https://www.facebook.com/FoxChapelDems',
    }),
    defineField({
      name: 'instagramHandle',
      title: 'Instagram Handle',
      type: 'string',
      group: 'contact',
      description: 'Handle without the @ symbol.',
    }),
    defineField({
      name: 'footerText',
      title: 'Footer Tagline',
      type: 'string',
      group: 'contact',
      description: 'Short tagline shown at the bottom of every page.',
    }),

    defineField({
      name: 'hiddenDefaultNavSections',
      title: 'Hide Default Sections',
      type: 'array',
      group: 'nav',
      description: 'Top-level county nav sections to remove from this committee\'s menu. Has no effect if "Full Navigation Override" below is filled in.',
      of: [{ type: 'string' }],
      options: { list: DEFAULT_NAV_SECTION_OPTIONS, layout: 'grid' },
    }),
    navItemArrayField(
      'additionalNavItems',
      'Additional Sections',
      'Extra top-level sections to append after the (filtered) county default nav. Has no effect if "Full Navigation Override" below is filled in.'
    ),
    navItemArrayField(
      'navigationItems',
      'Full Navigation Override (Advanced)',
      'Completely replaces the menu — the county default nav and the Hide/Additional Sections fields above are ignored entirely.'
    ),

    defineField({
      name: 'hiddenSharedItems',
      title: 'Hide Shared County Items',
      type: 'array',
      group: 'sharing',
      description: 'Opt individual events, news, or alerts OUT of your site that the county has shared with you or with all municipalities.',
      of: [{ type: 'string' }],
      components: { input: HiddenSharedItemsInput },
    }),

    defineField({
      name: 'googleAnalyticsId',
      title: 'Google Analytics Measurement ID',
      type: 'string',
      group: 'technical',
      description: 'Format: G-XXXXXXXXXX. Leave blank to use the county analytics ID.',
    }),
    defineField({
      name: 'voterGuideSearchTerms',
      title: 'Voter Guide Search Terms',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'technical',
      description: 'Terms to auto-filter the county voter guide for residents of this municipality. The first term is used as the default.',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Municipality Settings' }
    },
  },
})
