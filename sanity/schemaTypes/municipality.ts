import { defineField, defineType } from 'sanity'
import { HomeIcon } from '@sanity/icons'

export const municipalityType = defineType({
  name: 'municipality',
  title: 'Municipality',
  type: 'document',
  icon: HomeIcon,
  groups: [
    { name: 'identity', title: 'Identity & Domain' },
    { name: 'branding', title: 'Branding' },
    { name: 'content', title: 'Homepage Content' },
    { name: 'contact', title: 'Contact & Social' },
    { name: 'nav', title: 'Navigation' },
    { name: 'technical', title: 'Technical' },
  ],
  fields: [
    // ── Identity ──────────────────────────────────────────────
    defineField({
      name: 'name',
      title: 'Municipality Name',
      type: 'string',
      group: 'identity',
      description: 'e.g. "Northside Democrats" or "Allegheny County Democratic Committee"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (internal ID)',
      type: 'slug',
      group: 'identity',
      options: { source: 'name' },
      description: 'Used internally to scope content. Never change after initial setup.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      group: 'identity',
      initialValue: true,
      description: 'Inactive municipalities fall back to displaying the county site.',
    }),

    // ── Domain routing ────────────────────────────────────────
    defineField({
      name: 'customDomain',
      title: 'Custom Domain',
      type: 'string',
      group: 'identity',
      description: 'e.g. northsidedems.com — must also be added to Vercel and middleware.ts',
    }),
    defineField({
      name: 'subdomain',
      title: 'Subdomain Prefix',
      type: 'string',
      group: 'identity',
      description: 'e.g. "northside" → northside.alleghenydems.com (auto-resolved via wildcard DNS)',
    }),

    // ── Branding ──────────────────────────────────────────────
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

    // ── Homepage Content ──────────────────────────────────────
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

    // ── Contact & Social ──────────────────────────────────────
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
      description: 'Full URL, e.g. https://www.facebook.com/NorthsideDems',
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

    // ── Navigation ────────────────────────────────────────────
    defineField({
      name: 'navigationItems',
      title: 'Navigation Override',
      type: 'array',
      group: 'nav',
      description: 'Leave empty to use the county default navigation.',
      of: [
        {
          type: 'object',
          name: 'navItem',
          title: 'Nav Item',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'href',
              title: 'Link',
              type: 'string',
              description: 'Internal: /about, /events. External: https://example.com — links to outside websites automatically open in a new tab and show a small ↗ icon.',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'children',
              title: 'Dropdown Items',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'navChild',
                  title: 'Dropdown Link',
                  fields: [
                    defineField({ name: 'label', title: 'Label', type: 'string', validation: (r) => r.required() }),
                    defineField({ name: 'href', title: 'Link', type: 'string', description: 'Internal path (/about) or full external URL — links to outside websites automatically open in a new tab and show a small ↗ icon.', validation: (r) => r.required() }),
                    defineField({ name: 'external', title: 'Opens in new tab', type: 'boolean', initialValue: false }),
                  ],
                  preview: { select: { title: 'label', subtitle: 'href' } },
                },
              ],
            }),
          ],
          preview: { select: { title: 'label', subtitle: 'href' } },
        },
      ],
    }),

    // ── Technical ─────────────────────────────────────────────
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
      description: 'Terms to auto-filter the county voter guide for residents of this municipality (e.g. "NORTHSIDE", "15212"). The first term is used as the default. Must match the district labels or searchTerms in the voter guide.',
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'slug.current', isActive: 'isActive' },
    prepare({ title, subtitle, isActive }) {
      return {
        title,
        subtitle: `${isActive ? '✅' : '⏸️'} ${subtitle ?? 'no-slug'}`,
      }
    },
  },
})
