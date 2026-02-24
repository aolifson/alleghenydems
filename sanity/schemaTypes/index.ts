import { eventType } from './event'
import { newsType } from './news'
import { committeeMemberType } from './committeeMember'
import { externalLinkType } from './externalLink'
import { pageType } from './page'
import { siteSettingsType } from './siteSettings'

export const schemaTypes = [
  siteSettingsType,
  eventType,
  newsType,
  committeeMemberType,
  externalLinkType,
  pageType,
]
