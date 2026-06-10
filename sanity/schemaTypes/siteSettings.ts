import { defineField, defineType } from 'sanity'

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  groups: [
    { name: 'hero', title: 'Homepage Hero' },
    { name: 'nav', title: 'Navigation' },
    { name: 'contact', title: 'Contact Info' },
    { name: 'social', title: 'Social Media' },
    { name: 'footer', title: 'Footer' },
    { name: 'technical', title: 'Technical / Integrations' },
  ],
  fields: [
    // ── Homepage Hero ──────────────────────────────────────────────────
    defineField({
      name: 'heroHeadline',
      title: 'Hero Headline',
      type: 'string',
      group: 'hero',
      description: 'Main bold text on the homepage hero banner. Keep it short and punchy.',
    }),
    defineField({
      name: 'heroSubtext',
      title: 'Hero Subtext',
      type: 'text',
      rows: 2,
      group: 'hero',
      description: 'Supporting sentence or two shown below the headline.',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Background Image',
      type: 'image',
      options: { hotspot: true },
      group: 'hero',
      description: 'Background image for the homepage hero. Use the focal-point handles to control cropping on mobile.',
    }),

    // ── Navigation ────────────────────────────────────────────────────
    defineField({
      name: 'navigationItems',
      title: 'Navigation Items',
      type: 'array',
      group: 'nav',
      description: 'Top-level navigation links. Each item can have optional dropdown sub-links. Leave blank to use the site defaults.',
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
              description: 'Text shown in the navigation bar.',
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
              description: 'Optional sub-links shown in a dropdown when this item is hovered.',
              of: [
                {
                  type: 'object',
                  name: 'navChild',
                  title: 'Dropdown Link',
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
                      description: 'Internal path (/about) or full external URL — links to outside websites automatically open in a new tab and show a small ↗ icon.',
                      validation: (r) => r.required(),
                    }),
                    defineField({
                      name: 'external',
                      title: 'Opens in new tab',
                      type: 'boolean',
                      initialValue: false,
                      description: 'Turn on for links to outside websites.',
                    }),
                  ],
                  preview: {
                    select: { title: 'label', subtitle: 'href' },
                  },
                },
              ],
            }),
          ],
          preview: {
            select: { title: 'label', subtitle: 'href' },
          },
        },
      ],
    }),

    // ── Contact Info ──────────────────────────────────────────────────
    defineField({
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'string',
      group: 'contact',
      description: 'Shown in the footer and contact page.',
    }),
    defineField({
      name: 'contactPhone',
      title: 'Contact Phone',
      type: 'string',
      group: 'contact',
      description: 'Shown in the footer and contact page.',
    }),
    defineField({
      name: 'address',
      title: 'Office Address',
      type: 'text',
      rows: 2,
      group: 'contact',
      description: 'Street address shown in the footer.',
    }),
    defineField({
      name: 'officeHours',
      title: 'Office Hours',
      type: 'string',
      group: 'contact',
      description: 'e.g. Mon–Fri 9am–5pm',
    }),

    // ── Social Media ──────────────────────────────────────────────────
    defineField({
      name: 'facebookPageUrl',
      title: 'Facebook Page URL',
      type: 'url',
      group: 'social',
      description: 'Full URL, e.g. https://www.facebook.com/AlleghenyDems',
    }),
    defineField({
      name: 'instagramHandle',
      title: 'Instagram Handle',
      type: 'string',
      group: 'social',
      description: 'Handle without the @ symbol, e.g. alleghenydems',
    }),

    // ── Footer ────────────────────────────────────────────────────────
    defineField({
      name: 'footerText',
      title: 'Footer Tagline',
      type: 'string',
      group: 'footer',
      description: 'Short tagline or slogan shown at the bottom of every page.',
    }),

    // ── Technical / Integrations ──────────────────────────────────────
    defineField({
      name: 'googleCalendarEmbedUrl',
      title: 'Google Calendar Embed URL',
      type: 'url',
      group: 'technical',
      description: 'From Google Calendar → Settings → Integrate calendar → Embed code. Copy the src= URL only.',
    }),
    defineField({
      name: 'googleAnalyticsId',
      title: 'Google Analytics Measurement ID',
      type: 'string',
      group: 'technical',
      description: 'Format: G-XXXXXXXXXX. Found in GA4 → Admin → Data Streams.',
    }),
    defineField({
      name: 'facebookPixelId',
      title: 'Facebook Pixel ID',
      type: 'string',
      group: 'technical',
      description: 'Numeric ID from Facebook Business Manager → Events Manager.',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Site Settings' }
    },
  },
})
