import type { Metadata } from 'next'
import PageHero from '@/components/page-hero'

export const metadata: Metadata = {
  title: 'Legislative Tracker — What They Did & What They Blocked',
  description: 'Track what Democrats accomplished and what Republicans blocked for working families in Allegheny County.',
}

/* ------------------------------------------------------------------ */
/*  Static data – move to Sanity CMS when ready for editorial control */
/* ------------------------------------------------------------------ */

type ActionEntry = {
  official: string
  party: 'D' | 'R'
  office: string
  description: string
  date: string
  type: 'accomplishment' | 'blocked' | 'harmful'
  category: string
  sourceLabel: string
  sourceUrl: string
  municipalities: string[]
}

const ACTIONS: ActionEntry[] = [
  /* ============================================================ */
  /*  DEMOCRATIC ACCOMPLISHMENTS                                  */
  /* ============================================================ */

  // --- Federal infrastructure ---
  {
    official: 'Rep. Summer Lee',
    party: 'D',
    office: 'U.S. House — District 12',
    description:
      'Secured over $800 million in federal dollars for Western PA, including $159 million for Pittsburgh regional transit, a $50 million HUD Choice Housing grant to revitalize Bedford Dwellings and the Hill District, $4.1 million for EV charging in Allegheny County, and $800,000 Reconnecting Communities grant for the Turtle Creek Valley.',
    date: '2023–2024',
    type: 'accomplishment',
    category: 'Infrastructure & Jobs',
    sourceLabel: 'Summer Lee Fact Sheet — $800 M Delivered',
    sourceUrl:
      'https://summerlee.house.gov/newsroom/press-releases/fact-sheet-rep-summer-lee-announces-over-800-million-federal-dollars-delivered-to-western-pa',
    municipalities: [
      'Pittsburgh (all wards)', 'Turtle Creek', 'Braddock', 'Homestead', 'McKeesport',
      'Duquesne', 'Clairton', 'Monroeville', 'Plum', 'Munhall', 'West Mifflin',
      'Whitehall', 'Bethel Park', 'Jefferson Hills', 'Pleasant Hills',
    ],
  },
  {
    official: 'Rep. Summer Lee',
    party: 'D',
    office: 'U.S. House — District 12',
    description:
      'Co-secured $142.34 million for Pittsburgh\'s Parkway East and MLK Jr. East Busway improvements, generating an estimated 2,500 jobs and $254.9 million in economic value.',
    date: '2023',
    type: 'accomplishment',
    category: 'Infrastructure & Jobs',
    sourceLabel: 'Casey, Fetterman, Lee, Deluzio — $142 M for Parkway East',
    sourceUrl:
      'https://www.casey.senate.gov/news/releases/casey-fetterman-lee-deluzio-secure-14234-million-for-pittsburghs-parkway-east',
    municipalities: [
      'Pittsburgh (East End wards)', 'Monroeville', 'Wilkinsburg', 'Swissvale',
      'Edgewood', 'Churchill', 'Forest Hills',
    ],
  },
  {
    official: 'Rep. Summer Lee',
    party: 'D',
    office: 'U.S. House — District 12',
    description:
      'Secured $450,000 in federal funding for the Trade Institute of Pittsburgh\'s new transitional jobs program (TIPX), providing paid masonry and carpentry training for workers re-entering the workforce.',
    date: '2024',
    type: 'accomplishment',
    category: 'Workforce & Jobs',
    sourceLabel: 'Summer Lee — Trade Institute Funding',
    sourceUrl:
      'https://summerlee.house.gov/newsroom/press-releases/rep-summer-lee-celebrates-450000-in-federal-funding-for-trade-institute-of-pittsburgh-s-new-transitional-jobs-program',
    municipalities: ['Pittsburgh (all wards)', 'Homestead', 'Braddock'],
  },
  {
    official: 'Rep. Summer Lee',
    party: 'D',
    office: 'U.S. House — District 12',
    description:
      'Presented over $1 million in federal investment to combat blight and revitalize North Braddock.',
    date: '2024',
    type: 'accomplishment',
    category: 'Community Development',
    sourceLabel: 'Summer Lee — North Braddock Investment',
    sourceUrl:
      'https://summerlee.house.gov/newsroom/press-releases/rep-summer-lee-presents-over-1-million-federal-investment-to-combat-blight-and-revitalize-north-braddock',
    municipalities: ['North Braddock', 'Braddock', 'East Pittsburgh', 'Rankin'],
  },
  {
    official: 'Rep. Summer Lee',
    party: 'D',
    office: 'U.S. House — District 12',
    description:
      'Co-introduced the Child Care for Working Families Act with 83 House and 44 Senate co-sponsors to expand affordable child care nationwide.',
    date: '2025',
    type: 'accomplishment',
    category: 'Children & Families',
    sourceLabel: 'Summer Lee — Child Care for Working Families Act',
    sourceUrl:
      'https://summerlee.house.gov/newsroom/press-releases/rep-summer-lee-reintroduces-child-care-for-working-families-act-to-address-the-national-child-care-crisis',
    municipalities: ['All Allegheny County municipalities (federal legislation)'],
  },
  {
    official: 'Rep. Summer Lee',
    party: 'D',
    office: 'U.S. House — District 12',
    description:
      'Introduced the Head Start for America\'s Children Act to expand Head Start to serve 11 million eligible young children and raise wages for Head Start educators.',
    date: 'February 2026',
    type: 'accomplishment',
    category: 'Children & Families',
    sourceLabel: 'Summer Lee — Head Start Expansion Bill',
    sourceUrl:
      'https://summerlee.house.gov/newsroom/press-releases/rep-summer-lee-introduces-bill-to-expand-head-start-to-11-million-children',
    municipalities: ['All Allegheny County municipalities (federal legislation)'],
  },

  // --- Rep. Chris Deluzio ---
  {
    official: 'Rep. Chris Deluzio',
    party: 'D',
    office: 'U.S. House — District 17',
    description:
      'Lead House sponsor of the Railway Safety Act, establishing two-person crew requirements and stronger safety rules for hazmat trains. Successfully advocated for Dept. of Transportation rule making two-person crews permanent.',
    date: '2023–2024',
    type: 'accomplishment',
    category: 'Worker Safety',
    sourceLabel: 'Deluzio — Railway Safety Act',
    sourceUrl:
      'https://deluzio.house.gov/media/press-releases/deluzio-lalota-rulli-and-garamendi-introduce-bipartisan-railway-safety-bill',
    municipalities: [
      'Coraopolis', 'Moon', 'Sewickley', 'McKees Rocks', 'Carnegie',
      'Aspinwall', 'Fox Chapel', 'Sharpsburg', 'Etna', 'Millvale',
      'McCandless', 'Ross', 'Bellevue', 'Avalon', 'Ben Avon',
      'Penn Hills', 'Wilkinsburg', 'Edgewood', 'Forest Hills',
    ],
  },
  {
    official: 'Rep. Chris Deluzio',
    party: 'D',
    office: 'U.S. House — District 17',
    description:
      'Directed $480+ million in federal grants and contracts to western PA communities in 2023, including transportation, defense industry, and community development projects.',
    date: '2023',
    type: 'accomplishment',
    category: 'Infrastructure & Jobs',
    sourceLabel: 'Deluzio — 2023 Year in Review',
    sourceUrl:
      'https://deluzio.house.gov/media/press-releases/congressman-chris-deluzio-gets-stuff-done-western-pennsylvanians-2023',
    municipalities: [
      'Moon', 'Robinson', 'North Fayette', 'Findlay', 'McCandless',
      'Pine', 'Marshall', 'Hampton', 'Shaler', 'Ross', 'Cheswick',
    ],
  },
  {
    official: 'Rep. Chris Deluzio',
    party: 'D',
    office: 'U.S. House — District 17',
    description:
      'Secured $185+ million in federal funding in 2026 spending bills for western PA community projects — the most community project funding of any House Democrat.',
    date: '2026',
    type: 'accomplishment',
    category: 'Infrastructure & Jobs',
    sourceLabel: 'Deluzio — $185 M in 2026 Funding Bills',
    sourceUrl:
      'https://deluzio.house.gov/media/press-releases/congressman-deluzio-successfully-includes-185-million-western-pa-us-house-2026-funding-bills',
    municipalities: [
      'All District 17 municipalities in Allegheny County',
    ],
  },

  // --- Sen. Fetterman ---
  {
    official: 'Sen. John Fetterman',
    party: 'D',
    office: 'U.S. Senate',
    description:
      'Original co-sponsor of the Raise the Wage Act to increase the federal minimum wage to $17/hour by 2028, benefiting an estimated 28 million workers.',
    date: '2023',
    type: 'accomplishment',
    category: 'Wages & Workers',
    sourceLabel: 'Congress.gov — Raise the Wage Act S.2488',
    sourceUrl: 'https://www.congress.gov/bill/118th-congress/senate-bill/2488/text',
    municipalities: ['All Allegheny County municipalities (federal legislation)'],
  },
  {
    official: 'Sen. John Fetterman',
    party: 'D',
    office: 'U.S. Senate',
    description:
      'Cast firm NO vote on the 2025 Budget Resolution, refusing to support bills that would strip Medicaid, Medicare, and SNAP benefits to fund tax cuts for billionaires.',
    date: '2025',
    type: 'accomplishment',
    category: 'Healthcare & Safety Net',
    sourceLabel: 'Fetterman — Rejects GOP Budget Slashing Medicaid/SNAP',
    sourceUrl:
      'https://www.fetterman.senate.gov/fetterman-rejects-gop-budget-slashing-medicaid-snap-for-billionaire-tax-breaks',
    municipalities: ['All Allegheny County municipalities (federal legislation)'],
  },
  {
    official: 'Sen. John Fetterman',
    party: 'D',
    office: 'U.S. Senate',
    description:
      'Urged the Labor Department to end subminimum wages ($1.50/hour) for workers with disabilities, calling the practice "outrageous."',
    date: '2024',
    type: 'accomplishment',
    category: 'Wages & Workers',
    sourceLabel: 'FOX43 — Fetterman Urges End to Subminimum Wages',
    sourceUrl:
      'https://fox43.com/article/news/politics/national-politics/fetterman-senators-labor-department-end-subminimum-wages-disabled-workers/521-fcec9c30-535c-427e-b955-380f1f75a443',
    municipalities: ['All Allegheny County municipalities (federal legislation)'],
  },

  // --- County Executive Innamorato ---
  {
    official: 'County Exec. Sara Innamorato',
    party: 'D',
    office: 'Allegheny County Executive',
    description:
      'Passed a $1.2 billion county budget with zero property tax increase — unanimously approved by County Council — while preserving rental assistance, transit programs, and human services.',
    date: 'December 2025',
    type: 'accomplishment',
    category: 'Taxes & Budget',
    sourceLabel: 'WESA — County Council Unanimously Backs 2026 Budget',
    sourceUrl:
      'https://www.wesa.fm/politics-government/2025-12-02/allegheny-county-council-unanimously-backs-innamorato-2026-budget-with-no-tax-increase',
    municipalities: ['All 130 Allegheny County municipalities'],
  },
  {
    official: 'County Exec. Sara Innamorato',
    party: 'D',
    office: 'Allegheny County Executive',
    description:
      'Launched AlleghenyGO, a permanent program offering 50% off transit fares for county residents receiving SNAP benefits — over 5,000 enrolled. Budget includes $1.5 million for the program.',
    date: 'June 2024',
    type: 'accomplishment',
    category: 'Transportation',
    sourceLabel: 'WESA — AlleghenyGO Half-Fare Transit',
    sourceUrl:
      'https://www.wesa.fm/development-transportation/2024-05-21/low-income-allegheny-county-public-transit',
    municipalities: ['All 130 Allegheny County municipalities'],
  },
  {
    official: 'County Exec. Sara Innamorato',
    party: 'D',
    office: 'Allegheny County Executive',
    description:
      'Invested $500,000 in child care subsidies to clear the Child Care Matters waitlist, then boosted the Department of Children Initiatives budget by $2.5 million — a threefold increase in local tax dollars for child care.',
    date: '2024–2025',
    type: 'accomplishment',
    category: 'Children & Families',
    sourceLabel: 'WESA — Innamorato Child Care Subsidies',
    sourceUrl:
      'https://www.wesa.fm/politics-government/2024-01-10/innamorato-child-care-subsidies',
    municipalities: ['All 130 Allegheny County municipalities'],
  },

  // --- PA State Democrats ---
  {
    official: 'State Rep. Jessica Benham',
    party: 'D',
    office: 'PA House — District 36',
    description:
      'Sponsored and passed Pharmacy Benefits Manager regulation (H.B. 1993), signed by Gov. Shapiro, protecting working families and seniors from inflated prescription drug costs.',
    date: '2024',
    type: 'accomplishment',
    category: 'Healthcare & Safety Net',
    sourceLabel: 'Benham for PA — PBM Legislation',
    sourceUrl: 'https://www.benhamforpa.com/',
    municipalities: [
      'Brentwood', 'Mount Oliver', 'Pittsburgh (Beechview, Brookline, Carrick, South Side Slopes, Arlington)',
    ],
  },
  {
    official: 'State Rep. Jessica Benham',
    party: 'D',
    office: 'PA House — District 36',
    description:
      'Sponsored the Kinship Caregiver Tuition Waiver Bill, passed unanimously in the House, giving free college tuition to children raised by grandparents and other relatives.',
    date: '2023',
    type: 'accomplishment',
    category: 'Children & Families',
    sourceLabel: 'Ballotpedia — Jessica Benham',
    sourceUrl: 'https://ballotpedia.org/Jessica_Benham',
    municipalities: [
      'Brentwood', 'Mount Oliver', 'Pittsburgh (Beechview, Brookline, Carrick, South Side Slopes, Arlington)',
    ],
  },
  {
    official: 'State Sen. Jay Costa',
    party: 'D',
    office: 'PA Senate — District 43 (Senate Democratic Leader)',
    description:
      'Filed discharge petitions to force Senate votes on House-passed gun safety bills: universal background checks (HB 714) and Emergency Risk Protection Orders (HB 1018) — both blocked by Republican committee chairs.',
    date: 'October 2024',
    type: 'accomplishment',
    category: 'Public Safety',
    sourceLabel: 'PA Senate Democrats — Costa Discharge Petitions',
    sourceUrl:
      'https://pasenate.com/democratic-leader-jay-costa-files-three-discharge-petitions-in-pa-senate-on-gun-safety-lgbtq-nondiscrimination-bills/',
    municipalities: [
      'Pittsburgh (Squirrel Hill, Shadyside, Oakland, Greenfield, Hazelwood, South Side)',
      'Swissvale', 'Edgewood', 'Wilkinsburg', 'Penn Hills', 'Churchill', 'Forest Hills',
    ],
  },
  {
    official: 'PA House Democrats (incl. Kinkead, Venkat, Frankel, and others)',
    party: 'D',
    office: 'PA House of Representatives',
    description:
      'Passed House Bill 1500 to raise Pennsylvania\'s minimum wage from $7.25 to $15/hour by 2026, increase the tipped wage from $2.83/hour, and tie future raises to inflation. The bill passed the House in June 2023.',
    date: 'June 2023',
    type: 'accomplishment',
    category: 'Wages & Workers',
    sourceLabel: 'PA Legislature — HB 1500',
    sourceUrl: 'https://www.palegis.us/legislation/bills/2023/hb1500',
    municipalities: ['All Allegheny County municipalities (state legislation)'],
  },

  /* ============================================================ */
  /*  REPUBLICAN ACTIONS — BLOCKED / HARMFUL                      */
  /* ============================================================ */

  // --- Blocked minimum wage ---
  {
    official: 'PA Senate Republicans (led by Pres. Pro Temp. Kim Ward & Majority Leader Joe Pittman)',
    party: 'R',
    office: 'PA State Senate',
    description:
      'Refused to bring the House-passed $15/hour minimum wage bill (HB 1500) to a Senate floor vote. Pennsylvania\'s minimum wage has remained at $7.25/hour for 16+ years — one of only two states still at the federal minimum. Majority Leader Pittman called $15 a "non-start."',
    date: '2023–present',
    type: 'blocked',
    category: 'Wages & Workers',
    sourceLabel: 'Keystone Newsroom — Republicans Block Minimum Wage for 6 Months',
    sourceUrl:
      'https://keystonenewsroom.com/2023/12/26/pa-republicans-have-blocked-a-minimum-wage-increase-for-six-months/',
    municipalities: ['All Allegheny County municipalities — every worker earning minimum wage affected'],
  },

  // --- Blocked gun safety ---
  {
    official: 'PA Senate Republicans',
    party: 'R',
    office: 'PA State Senate',
    description:
      'Blocked Senate hearings and votes on House-passed universal background check and red flag law bills, despite 95% of PA voters supporting background checks and 86% supporting red flag laws.',
    date: '2024–present',
    type: 'blocked',
    category: 'Public Safety',
    sourceLabel: 'The Trace — PA Senate Gun Safety Inaction',
    sourceUrl:
      'https://www.thetrace.org/2024/10/pennsylvania-election-gun-laws-senate/',
    municipalities: ['All Allegheny County municipalities'],
  },

  // --- Medicaid cuts ---
  {
    official: 'Congressional Republicans (incl. Sen. Dave McCormick)',
    party: 'R',
    office: 'U.S. Congress',
    description:
      'Supported nearly $1 trillion in Medicaid cuts over 10 years through the "One Big Beautiful Bill Act." An estimated 310,000 Pennsylvanians could lose coverage due to new 80-hour/month work requirements and more frequent eligibility checks.',
    date: '2025',
    type: 'harmful',
    category: 'Healthcare & Safety Net',
    sourceLabel: 'PHLP — 310,000 Pennsylvanians Could Lose Coverage',
    sourceUrl:
      'https://www.phlp.org/en/news/historic-medicaid-cuts-coming-to-pennsylvania-310-000-could-lose-coverage',
    municipalities: ['All Allegheny County municipalities — disproportionately affects McKeesport, Clairton, Duquesne, Braddock, McKees Rocks, Wilkinsburg'],
  },

  // --- Blocked paid family leave ---
  {
    official: 'PA House Republicans on Labor & Industry Committee',
    party: 'R',
    office: 'PA House of Representatives',
    description:
      'All committee Republicans voted against the Family Care Act (HB 200), which would provide 12–20 weeks of paid leave for new parents, family caregivers, and violence victims. The bill advanced 14-12 on party lines.',
    date: 'March 2025',
    type: 'blocked',
    category: 'Children & Families',
    sourceLabel: 'City & State PA — Paid Family Leave Vote',
    sourceUrl:
      'https://www.cityandstatepa.com/policy/2025/03/bipartisan-paid-family-leave-bill-advances-pennsylvania-house/403895/',
    municipalities: ['All Allegheny County municipalities (state legislation)'],
  },

  // --- School vouchers ---
  {
    official: 'PA Senate Republicans',
    party: 'R',
    office: 'PA State Senate',
    description:
      'Pushed a $100 million school voucher program ("PA Award for Student Success") to divert public school funding to private schools. Gov. Shapiro vetoed the 2023 version; Senate Republicans revived it in 2024 and 2025.',
    date: '2023–2025',
    type: 'harmful',
    category: 'Education',
    sourceLabel: 'Chalkbeat — PA Voucher Debate',
    sourceUrl:
      'https://www.chalkbeat.org/philadelphia/2023/7/5/23785092/pennsylvania-philadelphia-school-shapiro-private-vouchers-low-achieving-funding-scholarships-budget/',
    municipalities: ['All Allegheny County school districts — especially impacts underfunded districts like McKeesport, Clairton, Duquesne, Wilkinsburg, Sto-Rox'],
  },

  // --- Corporate tax cuts ---
  {
    official: 'PA Legislature (Republican-led initiative)',
    party: 'R',
    office: 'PA State Legislature',
    description:
      'Enacted corporate net income tax cuts from 9.99% to a planned 4.99% by 2031, plus increased net operating loss deductions. This shifts the tax burden from corporations onto working and middle-class families.',
    date: '2022–2031 (phased)',
    type: 'harmful',
    category: 'Taxes & Budget',
    sourceLabel: 'Tax Foundation — PA Corporate Tax Cut',
    sourceUrl: 'https://taxfoundation.org/blog/pa-corporate-tax-cut/',
    municipalities: ['All Allegheny County municipalities — affects state revenue for schools, infrastructure, and services'],
  },

  // --- Sen. Devlin Robinson district-specific ---
  {
    official: 'Sen. Devlin Robinson',
    party: 'R',
    office: 'PA Senate — District 37',
    description:
      'As part of the Senate Republican majority, has not broken ranks to advance minimum wage increases, gun safety bills, or paid family leave legislation despite representing suburban communities where these poll favorably.',
    date: '2023–present',
    type: 'blocked',
    category: 'Wages & Workers',
    sourceLabel: 'Spotlight PA — PA Senate Minimum Wage Stalemate',
    sourceUrl:
      'https://spotlightpa.org/news/2023/06/pa-minimum-wage-raise-legislature/',
    municipalities: [
      'Bethel Park', 'Upper St. Clair', 'South Park', 'Jefferson Hills',
      'Pleasant Hills', 'Moon', 'Sewickley', 'Franklin Park', 'Marshall',
      'North Fayette', 'South Fayette', 'Collier', 'Robinson',
    ],
  },
]

/* ------------------------------------------------------------------ */
/*  Hyperlocal borough-level data                                      */
/* ------------------------------------------------------------------ */

type LocalEntry = {
  community: string
  outcome: 'helped' | 'hurt' | 'ongoing'
  party: 'D' | 'R' | 'both'
  summary: string
  detail: string
  date: string
  sourceLabel: string
  sourceUrl: string
}

const LOCAL_ENTRIES: LocalEntry[] = [
  // ---- DEMOCRATIC WINS / HELP ----
  {
    community: 'Wilkinsburg',
    outcome: 'helped',
    party: 'D',
    summary: '$10M+ in state grants to replace lead water pipes — free to homeowners',
    detail:
      'The Wilkinsburg-Penn Joint Water Authority received two PENNVEST tranches under Gov. Shapiro: $6.8M grant + $3.1M loan (Oct 2024) for ~1,060 lead lines, and $3.9M grant + $6.1M loan (Jan 2025) for additional lines. Property owners had their privately-owned lead service lines replaced at no cost.',
    date: '2024–2025',
    sourceLabel: 'PA.gov — PENNVEST October 2024 Board Meeting',
    sourceUrl: 'https://www.pa.gov/agencies/pennvest/pennvest-newsroom/-216-3-million-investment-in-water-infrastructure-projects-in-21/',
  },
  {
    community: 'Highlands School District (Brackenridge, Tarentum, Harrison Township)',
    outcome: 'helped',
    party: 'D',
    summary: '$740,000+ school funding increase under Shapiro adequacy formula',
    detail:
      'The Highlands School District received a $740,000+ increase in state funding for the 2024–25 school year, bringing total state aid to $19.2 million. Gov. Shapiro and Democratic legislators celebrated the increase as part of the new adequacy funding formula designed to correct decades of underfunding.',
    date: '2024–2025',
    sourceLabel: 'PA.gov — Gov. Shapiro Celebrates K-12 Funding at Highlands',
    sourceUrl: 'https://www.pa.gov/governor/newsroom/2024-press-releases/gov-shapiro--leg--ed--students-celebrate-k-12-funding-highlands-',
  },
  {
    community: 'All 130 Allegheny County Municipalities',
    outcome: 'helped',
    party: 'D',
    summary: '$130M in American Rescue Plan funds distributed to every borough and township',
    detail:
      'The Biden administration\'s American Rescue Plan delivered $130 million to Allegheny County\'s 130 municipalities. For communities like Penn Hills, the allocation equaled 30% of their entire municipal budget. Most small boroughs used the funds for road repairs, community center upgrades, and emergency infrastructure.',
    date: '2021–2024',
    sourceLabel: 'Next Pittsburgh — How Allegheny County Municipalities Spent ARPA Money',
    sourceUrl: 'https://nextpittsburgh.com/features/how-are-allegheny-county-municipalities-spending-american-rescue-plan-money/',
  },
  {
    community: 'McKees Rocks area (West View Water Authority)',
    outcome: 'helped',
    party: 'D',
    summary: '$8M federal grant to replace 750 lead pipes in underserved communities',
    detail:
      'The West View Water Authority, which serves McKees Rocks and surrounding communities, received $8 million through Biden\'s Bipartisan Infrastructure Law to replace 750 lead service lines in underserved Allegheny County neighborhoods.',
    date: '2023–2025',
    sourceLabel: 'US EPA — Biden Admin Announces $152M for PA Lead Pipe Replacement',
    sourceUrl: 'https://www.epa.gov/newsreleases/biden-harris-administration-announces-over-152-million-pennsylvania-lead-pipe',
  },
  {
    community: 'Braddock, North Braddock, East Pittsburgh',
    outcome: 'helped',
    party: 'D',
    summary: '$6.1M class-action settlement for U.S. Steel air pollution affecting residents',
    detail:
      'A class-action settlement was approved in March 2025 against U.S. Steel\'s Edgar Thomson Plant, covering 3,700 households within one mile of the plant for "noxious odors and fugitive dust" from 2020 onward. The settlement includes $1.5M for residents and $4.6M in on-site environmental improvements — the result of Biden-era EPA enforcement.',
    date: 'March 2025',
    sourceLabel: 'Allegheny Front — U.S. Steel Agrees to $1.5M Settlement',
    sourceUrl: 'https://www.alleghenyfront.org/us-steel-class-action-settlement-edgar-thomson-plant-braddock-air-pollution/',
  },

  // ---- REPUBLICAN ACTIONS THAT HURT ----
  {
    community: 'Braddock, Homestead, Swissvale, Wilmerding, Wilkinsburg',
    outcome: 'hurt',
    party: 'R',
    summary: 'Trump EPA cancelled $930K green infrastructure grant days before work was set to begin',
    detail:
      'In March 2025, the Trump administration\'s EPA cancelled a $930,000 Allegheny County Health Department grant for 10 stormwater mitigation projects across Braddock, Homestead, Swissvale, Wilmerding, and others. Work was scheduled to begin days later. The EPA\'s termination letter stated it would not support programs linked to "environmental justice" or "DEI." Projects included rainwater capture systems and debris cleanups designed to reduce flooding in low-income communities.',
    date: 'March 2025',
    sourceLabel: 'PublicSource — Allegheny County Loses Millions in Green Infrastructure Grants',
    sourceUrl: 'https://www.publicsource.org/allegheny-county-environmental-funding-cuts-epa-deregulation/',
  },
  {
    community: 'All PA municipalities (incl. every Allegheny County borough)',
    outcome: 'hurt',
    party: 'R',
    summary: 'Republican Congress eliminated all Community Project Funding for FY2025, wiping out vetted local infrastructure grants',
    detail:
      'A Republican-led Congress passed a short-term spending bill for FY2025 that eliminated all Community Project Funding — the mechanism used by reps like Chris Deluzio and Summer Lee to direct infrastructure dollars to specific local projects. Communities across Pennsylvania lost police equipment upgrades, flood control projects, and emergency communications improvements that had already been fully vetted and approved.',
    date: '2025',
    sourceLabel: 'WHYY — Pennsylvania Lost Millions in Federal Infrastructure Funding',
    sourceUrl: 'https://whyy.org/articles/pennsylvania-budget-federal-infrastructure-funding/',
  },

  // ---- ONGOING CRISES ----
  {
    community: 'Stowe Township, McKees Rocks (Sto-Rox School District)',
    outcome: 'ongoing',
    party: 'both',
    summary: 'School district in financial recovery — 92.7% of students economically disadvantaged, highest tax burden in county',
    detail:
      'The Sto-Rox School District has been in "moderate financial recovery" status since July 2021. Over 92.7% of its 1,190 students are economically disadvantaged — yet residents face the highest local tax effort index (1.58) in Allegheny County. The district\'s enrollment has fallen 20.1% over five years. Democrats secured $14.4M in federal ESSER funds and $12.6M in state empowerment grants, but these were one-time sources. The root cause — Pennsylvania\'s school funding formula — has been challenged in court and partially fixed by Democratic legislation, but full equity remains unachieved.',
    date: '2021–present',
    sourceLabel: 'PublicSource — The Sto-Rox School District\'s 5-Year Struggle to Survive',
    sourceUrl: 'https://www.publicsource.org/sto-rox-school-district-began-5-year-struggle-to-survive/',
  },
  {
    community: 'Etna',
    outcome: 'ongoing',
    party: 'both',
    summary: 'Record flooding in April 2024 — Pine Creek reached 14 feet, dozens of homes and businesses damaged',
    detail:
      'On April 12, 2024, near-record rainfall caused Pine Creek to reach 14 feet in Etna, forcing evacuations of Sycamore, Cherry, and Railroad/Middle Streets. The National Weather Service called it a "one in 10 to 20 year event." Water backed into dozens of homes and businesses. The flooding highlights the urgent need for stormwater infrastructure investment — the same kind of green infrastructure that Trump\'s EPA cancelled in March 2025.',
    date: 'April 2024',
    sourceLabel: 'Pittsburgh Post-Gazette — Allegheny County Communities Hit Hard by Major Flooding',
    sourceUrl: 'https://www.post-gazette.com/news/weather-news/2024/04/12/ohio-river-flooding-storms-cleanup-etna-millvale-oakdale/',
  },
  {
    community: 'McKees Rocks',
    outcome: 'ongoing',
    party: 'both',
    summary: 'Mazzaro Landfill Superfund Site — abandoned industrial waste site under active remediation',
    detail:
      'The Mazzaro Landfill, used from the 1940s through 1972 and containing unknown industrial waste and exposed drums, is an active EPA Superfund site in McKees Rocks. The PA DEP issued a remedial response notice in February 2021 with a public hearing in April 2021. Remediation is ongoing.',
    date: '2021–present',
    sourceLabel: 'US EPA Superfund Site Profile — Mazzaro Landfill',
    sourceUrl: 'https://cumulis.epa.gov/supercpad/CurSites/csitinfo.cfm?id=0300457',
  },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  'Wages & Workers',
  'Healthcare & Safety Net',
  'Children & Families',
  'Education',
  'Infrastructure & Jobs',
  'Workforce & Jobs',
  'Community Development',
  'Public Safety',
  'Transportation',
  'Taxes & Budget',
]

function badgeColor(type: ActionEntry['type']) {
  switch (type) {
    case 'accomplishment':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'blocked':
      return 'bg-red-100 text-red-800 border-red-300'
    case 'harmful':
      return 'bg-red-200 text-red-900 border-red-400'
  }
}

function badgeLabel(type: ActionEntry['type']) {
  switch (type) {
    case 'accomplishment':
      return 'Delivered'
    case 'blocked':
      return 'Blocked by GOP'
    case 'harmful':
      return 'Harmful'
  }
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function LegislativeTrackerPage() {
  const accomplishments = ACTIONS.filter((a) => a.type === 'accomplishment')
  const blockedOrHarmful = ACTIONS.filter((a) => a.type !== 'accomplishment')

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <PageHero
        headline="Legislative Tracker"
        subhead="What Democrats delivered — and what Republicans blocked — for working families in Allegheny County. Every item links to its source so you can verify it yourself."
      />

      {/* Jump links */}
      <nav className="flex flex-wrap gap-2 mb-10">
        <a
          href="#accomplishments"
          className="px-4 py-2 text-sm font-semibold rounded bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
        >
          Democratic Accomplishments ({accomplishments.length})
        </a>
        <a
          href="#blocked"
          className="px-4 py-2 text-sm font-semibold rounded bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
        >
          Blocked or Harmful ({blockedOrHarmful.length})
        </a>
        <a
          href="#hyperlocal"
          className="px-4 py-2 text-sm font-semibold rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
        >
          Your Borough, Your Story ({LOCAL_ENTRIES.length})
        </a>
        <a
          href="#fact-checks"
          className="px-4 py-2 text-sm font-semibold rounded bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors"
        >
          Fact Checks
        </a>
        <a
          href="#find-your-district"
          className="px-4 py-2 text-sm font-semibold rounded bg-[var(--color-blue-light)] text-[var(--color-blue)] hover:opacity-80 transition-colors"
        >
          Find Your District
        </a>
      </nav>

      {/* =========== ACCOMPLISHMENTS =========== */}
      <section id="accomplishments" className="mb-16">
        <h2 className="text-2xl font-display font-bold text-green-800 border-b-2 border-green-300 pb-2 mb-6">
          What Democrats Delivered
        </h2>

        {CATEGORIES.map((cat) => {
          const items = accomplishments.filter((a) => a.category === cat)
          if (!items.length) return null
          return (
            <div key={cat} className="mb-8">
              <h3 className="text-lg font-bold text-[var(--color-blue)] mb-3">{cat}</h3>
              <div className="space-y-4">
                {items.map((item, i) => (
                  <ActionCard key={`${item.official}-${i}`} item={item} />
                ))}
              </div>
            </div>
          )
        })}
      </section>

      {/* =========== BLOCKED / HARMFUL =========== */}
      <section id="blocked" className="mb-16">
        <h2 className="text-2xl font-display font-bold text-red-800 border-b-2 border-red-300 pb-2 mb-6">
          What Republicans Blocked or Pushed Through Against Working Families
        </h2>

        {CATEGORIES.map((cat) => {
          const items = blockedOrHarmful.filter((a) => a.category === cat)
          if (!items.length) return null
          return (
            <div key={cat} className="mb-8">
              <h3 className="text-lg font-bold text-red-700 mb-3">{cat}</h3>
              <div className="space-y-4">
                {items.map((item, i) => (
                  <ActionCard key={`${item.official}-${i}`} item={item} />
                ))}
              </div>
            </div>
          )
        })}
      </section>

      {/* =========== HYPERLOCAL =========== */}
      <section id="hyperlocal" className="mb-16">
        <h2 className="text-2xl font-display font-bold text-yellow-800 border-b-2 border-yellow-300 pb-2 mb-2">
          Your Borough, Your Story
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          How state and federal policy decisions have played out in specific Allegheny County communities — the things
          that affect your street, your school, your water.
        </p>
        <div className="space-y-4">
          {LOCAL_ENTRIES.map((entry, i) => (
            <LocalCard key={i} entry={entry} />
          ))}
        </div>
      </section>

    

      {/* =========== FIND YOUR DISTRICT =========== */}
      <section id="find-your-district" className="mb-16">
        <h2 className="text-2xl font-display font-bold text-[var(--color-blue)] border-b-2 border-[var(--color-blue-light)] pb-2 mb-6">
          Find Your District &amp; Representatives
        </h2>
        <p className="text-[var(--color-text)] mb-6">
          Not sure who represents you? Use these official tools to look up your state and county districts by address:
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <ExternalLink
            href="https://www.pavoterservices.pa.gov/pages/FindYourDistrict.aspx"
            label="PA Voter Services — Find Your District"
            description="Enter your address to see your exact PA House, Senate, and Congressional districts."
          />
          <ExternalLink
            href="https://www.palegis.us/find-my-legislator/by-county?county=ALLEGHENY"
            label="PA Legislature — Allegheny County Legislators"
            description="Full list of every state legislator representing Allegheny County."
          />
          <ExternalLink
            href="https://www.alleghenycounty.us/Government/Departments-and-Offices/County-Council/Council-Districts"
            label="Allegheny County Council Districts"
            description="Map and listing of all 13 county council districts and their representatives."
          />
          <ExternalLink
            href="https://lwvpgh.org"
            label="League of Women Voters of Greater Pittsburgh"
            description="Nonpartisan voter guides and district information for the greater Pittsburgh area."
          />
        </div>

        <h3 className="text-lg font-bold text-[var(--color-blue)] mb-3">
          Who Represents My Municipality?
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Below is a quick reference for which Republican state legislators represent parts of Allegheny County.
          If your borough or township appears here, that Republican is one of your state-level representatives.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded">
            <thead className="bg-red-50">
              <tr>
                <th className="text-left px-4 py-2 font-semibold text-red-800">Republican Official</th>
                <th className="text-left px-4 py-2 font-semibold text-red-800">Office</th>
                <th className="text-left px-4 py-2 font-semibold text-red-800">Allegheny County Municipalities</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-2 font-medium">Sen. Devlin Robinson</td>
                <td className="px-4 py-2">PA Senate — Dist. 37</td>
                <td className="px-4 py-2">Bethel Park, Upper St. Clair, Moon, Sewickley, Franklin Park, Marshall, South Fayette, North Fayette, Robinson, South Park, Jefferson Hills, Pleasant Hills, Bridgeville, Collier, Findlay, Crescent, Coraopolis, and more</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium">Rep. Jeremy Shaffer</td>
                <td className="px-4 py-2">PA House — Dist. 28</td>
                <td className="px-4 py-2">Pine, Marshall, Hampton, Bradford Woods, West Deer, Richland</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium">Rep. Natalie Mihalek</td>
                <td className="px-4 py-2">PA House — Dist. 40</td>
                <td className="px-4 py-2">Bethel Park, part of Upper St. Clair</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium">Rep. Valerie Gaydos</td>
                <td className="px-4 py-2">PA House — Dist. 44</td>
                <td className="px-4 py-2">Moon, Sewickley, North Fayette, Crescent, Findlay, and west hills communities</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium">Rep. Jason Ortitay</td>
                <td className="px-4 py-2">PA House — Dist. 46</td>
                <td className="px-4 py-2">South Fayette, Oakdale, McDonald (Allegheny County portion)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium">Sen. Dave McCormick</td>
                <td className="px-4 py-2">U.S. Senate</td>
                <td className="px-4 py-2">All of Pennsylvania (statewide)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* =========== DISCLAIMER =========== */}
      <section className="bg-[var(--color-blue-light)] rounded-lg p-6 text-sm text-[var(--color-text)]">
        <p className="font-semibold mb-2">About this page</p>
        <p>
          Every item on this page links to a public source — news articles, official press releases, legislative records,
          or nonpartisan reporting — so you can verify the facts yourself. We are committed to accuracy.
          If you believe anything here is incorrect or missing context, please{' '}
          <a href="/contact" className="text-[var(--color-blue)] underline hover:no-underline">contact us</a>.
        </p>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Last updated: February 2026. Sources include official congressional and state legislative records, WESA, Spotlight PA,
          Keystone Newsroom, The Trace, Chalkbeat, City &amp; State PA, and the PA Health Law Project.
        </p>
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ActionCard({ item }: { item: ActionEntry }) {
  return (
    <article className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${badgeColor(item.type)}`}>
          {badgeLabel(item.type)}
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">{item.date}</span>
        <span className="text-xs font-medium text-[var(--color-blue)]">{item.category}</span>
      </div>

      <p className="font-semibold text-[var(--color-text)] mb-1">{item.official}</p>
      <p className="text-xs text-[var(--color-text-muted)] mb-2">{item.office}</p>
      <p className="text-sm text-[var(--color-text)] mb-3">{item.description}</p>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-[var(--color-blue)] hover:underline"
        >
          Source: {item.sourceLabel} ↗
        </a>
      </div>

      <details className="mt-2">
        <summary className="text-xs text-[var(--color-text-muted)] cursor-pointer hover:text-[var(--color-blue)]">
          Municipalities affected
        </summary>
        <p className="text-xs text-[var(--color-text-muted)] mt-1 pl-2 border-l-2 border-gray-200">
          {item.municipalities.join(' · ')}
        </p>
      </details>
    </article>
  )
}

function LocalCard({ entry }: { entry: LocalEntry }) {
  const outcomeStyles = {
    helped: { badge: 'bg-green-100 text-green-800 border-green-300', label: '✓ Helped community', bar: 'bg-green-500' },
    hurt:   { badge: 'bg-red-100 text-red-800 border-red-300',   label: '✗ Hurt community',   bar: 'bg-red-500' },
    ongoing:{ badge: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: '⚠ Ongoing issue', bar: 'bg-yellow-400' },
  }
  const style = outcomeStyles[entry.outcome]

  return (
    <article className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
      <div className={`h-1 ${style.bar}`} />
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="font-bold text-sm text-[var(--color-blue)]">{entry.community}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${style.badge}`}>{style.label}</span>
          <span className="text-xs text-[var(--color-text-muted)]">{entry.date}</span>
        </div>
        <p className="font-semibold text-sm text-[var(--color-text)] mb-2">{entry.summary}</p>
        <p className="text-sm text-[var(--color-text)] mb-3">{entry.detail}</p>
        <a
          href={entry.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-[var(--color-blue)] hover:underline"
        >
          Source: {entry.sourceLabel} ↗
        </a>
      </div>
    </article>
  )
}

function ExternalLink({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-[var(--color-blue)] transition-all bg-white"
    >
      <p className="font-semibold text-[var(--color-blue)] text-sm mb-1">{label} ↗</p>
      <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
    </a>
  )
}
