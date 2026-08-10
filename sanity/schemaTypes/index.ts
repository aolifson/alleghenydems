import { municipalityType } from './municipality'
import { actionAlertType } from './actionAlert'
import { eventType } from './event'
import { newsType } from './news'
import { committeeMemberType } from './committeeMember'
import { committeeDirectoryEntryType } from './committeeDirectoryEntry'
import { committeeContactEntryType } from './committeeContactEntry'
import { externalLinkType } from './externalLink'
import { internalDocType } from './internalDoc'
import { voteReminderType } from './voteReminder'
import { pageType } from './page'
import { planToVoteType } from './planToVote'
import { scheduledSectionType } from './scheduledSection'
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
  municipalityType,
  actionAlertType,
  eventType,
  newsType,
  committeeMemberType,
  committeeDirectoryEntryType,
  committeeContactEntryType,
  externalLinkType,
  internalDocType,
  voteReminderType,
  pageType,
  planToVoteType,
  scheduledSectionType,
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
