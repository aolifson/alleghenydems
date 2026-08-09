import { municipalitySettingsType } from './municipalitySettings'
import { actionAlertType } from './actionAlert'
import { eventType } from './event'
import { newsType } from './news'
import { committeeMemberType } from './committeeMember'
import { committeeDirectoryEntryType } from './committeeDirectoryEntry'
import { committeeContactEntryType } from './committeeContactEntry'
import { pageType } from './page'

// Schema for a migrated municipality's own Sanity project — a strict subset
// of the county schema (sanity/schemaTypes/index.ts) with no
// municipality/shareWithAll/sharedWith fields, since every document here
// already belongs to this committee. See docs/MULTI-PROJECT-MIGRATION.md.
export const municipalityProjectSchemaTypes = [
  municipalitySettingsType,
  actionAlertType,
  eventType,
  newsType,
  committeeMemberType,
  committeeDirectoryEntryType,
  committeeContactEntryType,
  pageType,
]
