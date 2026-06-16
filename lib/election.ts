// Election config for the "Make a Plan to Vote" hub.
//
// Dates below are Pennsylvania's statutory deadlines for the November 3, 2026
// General Election (registration: 15 days before; mail-ballot application:
// received by 5pm 7 days before). VERIFY against the official calendar at
// https://www.vote.pa.gov before each cycle and update this file — it's the
// single source of truth for every date the hub shows.

export interface ElectionInfo {
  name: string
  /** ISO date (local PA time) of Election Day. */
  date: string
  /** Pretty Election Day label, e.g. "Tuesday, November 3, 2026". */
  dateLabel: string
  pollHours: string
  registrationDeadlineLabel: string
  mailBallotApplicationDeadlineLabel: string
  mailBallotReturnLabel: string
}

export const ELECTION: ElectionInfo = {
  name: '2026 General Election',
  date: '2026-11-03',
  dateLabel: 'Tuesday, November 3, 2026',
  pollHours: '7:00 AM – 8:00 PM',
  registrationDeadlineLabel: 'Monday, October 19, 2026',
  mailBallotApplicationDeadlineLabel: 'Tuesday, October 27, 2026 (5:00 PM)',
  mailBallotReturnLabel: 'received by 8:00 PM on Election Day',
}

export const VOTE_LINKS = {
  register: 'https://www.pavoterservices.pa.gov/pages/VoterRegistrationApplication.aspx',
  checkRegistration: 'https://www.pavoterservices.pa.gov/pages/voterregistrationstatus.aspx',
  applyMailBallot: 'https://www.pavoterservices.pa.gov/OnlineAbsenteeApplication/#/OnlineAbsenteeBegin',
  pollingPlace: 'https://www.pavoterservices.pa.gov/pages/pollingplaceinfo.aspx',
  trackBallot: 'https://www.pavoterservices.pa.gov/pages/ballottracking.aspx',
  earlyVoting: 'https://www.alleghenycounty.us/elections/early-voting.aspx',
  electionCalendar: 'https://www.vote.pa.gov/About-Elections/Pages/Election-Calendar.aspx',
} as const

/** Whole days from `from` until Election Day (0 on Election Day, negative after). */
export function daysUntilElection(from: Date = new Date()): number {
  const election = new Date(`${ELECTION.date}T00:00:00-05:00`)
  const startOfFrom = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const ms = election.getTime() - startOfFrom.getTime()
  return Math.round(ms / 86_400_000)
}
