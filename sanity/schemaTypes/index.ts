import { eventType } from './event'
import { newsType } from './news'
import { committeeMemberType } from './committeeMember'
import { committeeDirectoryEntryType } from './committeeDirectoryEntry'
import { committeeContactEntryType } from './committeeContactEntry'
import { externalLinkType } from './externalLink'
import { pageType } from './page'
import { siteSettingsType } from './siteSettings'
import {
  voterGuideCandidateType,
  voterGuideDistrictType,
  voterGuideRaceType,
  voterGuideType,
} from './voterGuide'
import {
  legislativeActionType,
  legislativeExternalLinkType,
  legislativeLocalEntryType,
  legislativeOfficialRowType,
  legislativeTrackerType,
} from './legislativeTracker'

export const schemaTypes = [
  siteSettingsType,
  eventType,
  newsType,
  committeeMemberType,
  committeeDirectoryEntryType,
  committeeContactEntryType,
  externalLinkType,
  pageType,
  voterGuideCandidateType,
  voterGuideDistrictType,
  voterGuideRaceType,
  voterGuideType,
  legislativeActionType,
  legislativeExternalLinkType,
  legislativeLocalEntryType,
  legislativeOfficialRowType,
  legislativeTrackerType,
]
