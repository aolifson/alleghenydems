import { defineField, defineType } from 'sanity'

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    // Hero
    defineField({
      name: 'heroHeadline',
      title: 'Hero Headline',
      type: 'string',
      description: 'Main text on the homepage hero.',
    }),
    defineField({
      name: 'heroSubtext',
      title: 'Hero Subtext',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Background Image',
      type: 'image',
      options: { hotspot: true },
    }),
    // Social
    defineField({
      name: 'facebookPageUrl',
      title: 'Facebook Page URL',
      type: 'url',
      description: 'e.g. https://www.facebook.com/AlleghenyDems',
    }),
    defineField({
      name: 'instagramHandle',
      title: 'Instagram Handle',
      type: 'string',
      description: 'Without the @ symbol',
    }),
    // Contact
    defineField({
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'string',
    }),
    defineField({
      name: 'contactPhone',
      title: 'Contact Phone',
      type: 'string',
    }),
    defineField({
      name: 'address',
      title: 'Office Address',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'officeHours',
      title: 'Office Hours',
      type: 'string',
    }),
    // Footer
    defineField({
      name: 'footerText',
      title: 'Footer Tagline',
      type: 'string',
    }),
    // Integrations
    defineField({
      name: 'googleCalendarEmbedUrl',
      title: 'Google Calendar Embed URL',
      type: 'url',
      description: 'From Google Calendar → Settings → Integrate calendar → Embed code (copy src= URL only)',
    }),
    defineField({
      name: 'googleAnalyticsId',
      title: 'Google Analytics Measurement ID',
      type: 'string',
      description: 'e.g. G-XXXXXXXXXX',
    }),
    defineField({
      name: 'facebookPixelId',
      title: 'Facebook Pixel ID',
      type: 'string',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Site Settings' }
    },
  },
})
