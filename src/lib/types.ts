import type { CriterionKey, Scores, Weights } from "./criteria";

export const STATUSES = [
  "shortlist",
  "candidate",
  "feeder",
  "backlog",
  "researching",
  "building",
  "launched",
  "parked",
  "rejected",
  "avoid",
  "killed",
] as const;

export type Status = (typeof STATUSES)[number];

export const MANUAL_STATUSES = [
  "backlog",
  "researching",
  "building",
  "launched",
  "parked",
  "rejected",
] as const;

export type ManualStatus = (typeof MANUAL_STATUSES)[number];

export const STATUS_META: Record<Status, { label: string; hint: string }> = {
  shortlist: { label: "Shortlist", hint: "Top 10 ideas that are still automatic candidates" },
  candidate: { label: "Candidate", hint: "Scored, and outside the current top 10" },
  feeder: { label: "Feeder", hint: "Free SEO or lead tool. Not a standalone bet" },
  backlog: { label: "Backlog", hint: "You intend to come back to this" },
  researching: { label: "Researching", hint: "Active follow-up beyond the last run" },
  building: { label: "Building", hint: "In development" },
  launched: { label: "Launched", hint: "Live in the portfolio" },
  parked: { label: "Parked", hint: "Paused on purpose" },
  rejected: { label: "Rejected", hint: "You decided no" },
  avoid: { label: "Avoid", hint: "Deliberately not pursued. Kept so it is not shortlisted or researched again" },
  killed: { label: "Killed", hint: "Fails a hard kill rule. Kept so future runs do not re-research it" },
};

export type Evidence = { url: string; note: string; run?: number };

export const CUSTOMER_TYPES = ["consumer", "business", "both"] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export type PainPoint = {
  id: string;
  label: string;
  count: number;
  cluster?: string;
  sources: Evidence[];
  quotes: string[];
};

export const BUNDLE_TIERS = ["launch", "v2", "later", "feeder", "exclude"] as const;
export type BundleTier = (typeof BUNDLE_TIERS)[number];

export type BundleFit = {
  tier: string;
  module: string;
  note: string;
};

export type CategoryEvent = {
  run: number;
  date: string;
  from: string;
  to: string;
  note: string;
};

export type CategoryOverride = {
  category: string;
  run?: number;
  note: string;
  bundleFit?: BundleFit | null;
  mergedInto?: string;
};

export type PainQuote = {
  quote: string;
  title: string;
  url: string;
  community: string;
  date: string | null;
  score: number | null;
  comments: number | null;
};

export type PainCluster = {
  id: string;
  rank: number;
  statement: string;
  customerType: string;
  cfs: number;
  subscores: { volume: number; breadth: number; recency: number; engagement: number };
  counts: {
    mentions: number;
    mentionsBroad: number;
    mentionsCapped: number;
    estRelevantMentions: number;
    estRelevantPer100k: number;
    bySource: Record<string, number>;
    selfPromoExcluded: number;
    precisionUsed: number;
    precisionAudit: { relevant: number; sampled: number } | null;
  };
  communities: { count: number; sourceTypes: number; top: Array<{ name: string; mentions: number }> };
  recency24mShare: number;
  engagement: {
    engagedMentions: number;
    scoreSum: number;
    commentsSum: number;
    scoreMedian: number | null;
    commentsMedian: number | null;
  };
  appReviews: {
    reviewsSampled: number | null;
    appstoreLowStarShare: number | null;
    topLowStarThemes: Array<{ theme: string; shareOfLow: number }>;
  };
  existingSolutions: string[];
  whyPeopleStillComplain: string;
  quotes: PainQuote[];
  linkedIdeaIds: string[];
  relatedIdeaIds: string[];
};

export type PainMethod = {
  version: string;
  generated: string;
  doc: string;
  sourceFile: string;
  thresholds: {
    volume: number[];
    breadth: number[];
    recency: number[];
    engagement: number[];
    weights: { volume: number; breadth: number; recency: number; engagement: number };
    perCommunityCap: number;
    defaultPrecisionUnaudited: number;
  };
  coverageNotes: string[];
};

export type Run4Merge = {
  run4Id: string;
  title: string;
  suggestedScores: Scores;
  note: string;
};

export type BundlePrice = {
  recommended: string;
  laterTier: string;
  rejected: string;
};

export type RevenueMonth = {
  month: number;
  visitors: number;
  newFree: number;
  newPaid: number;
  renewals: number;
  activePaid: number;
  netRevenueCum: number;
};

export type RevenueScenario = {
  assumptions: Record<string, number>;
  yearNetRevenueAud: number[];
  activePaidM12: number;
  activePaidM24: number;
  activePaidM36: number;
  hostingCostPerYearAud: number;
  year3ProfitBeforeTaxAndTime: number;
  ltvNetAud: number;
  monthly: RevenueMonth[];
};

export type PriceBreakeven = Record<string, { netPerSub: number; subsFor10k: number; subsFor50k: number }>;

export type BundleRecord = {
  id: string;
  title: string;
  category: string;
  customerType: string;
  price: BundlePrice;
  launchModules: string[];
  members: string[];
  feeders: string[];
  scores: Scores;
  scoreReasons: Record<string, string>;
  notes: string;
  total: number;
  firstSeenRun: number;
  lastScoredRun: number;
  scoreHistory: ScoreSnapshot[];
  revenueScenarios: Record<string, RevenueScenario>;
  priceBreakeven: PriceBreakeven;
  assumptionLabels: Record<string, string>;
  netPerAud: number | null;
  evidence: Array<Evidence & { run?: number }>;
};

export type ScoreSnapshot = {
  run: number;
  date: string;
  rubricVersion: string;
  total: number;
  scores: Scores;
  note?: string;
};

export type Idea = {
  id: string;
  title: string;
  category: string;
  platform: string;
  problem: string;
  targetUsers: string;
  monetisation: string;
  priceHypothesis: string;
  scores: Scores;
  total: number;
  researchTotal: number;
  status: Status;
  statusLocked: boolean;
  killFlags: string[];
  avoidFlags: string[];
  evidence: Evidence[];
  competitors: string[];
  notes: string;
  liabilityNotes: string;
  userNotes: string;
  mvp: string;
  distribution: string;
  risks: string;
  scoreOverrides: Partial<Scores>;
  firstSeenRun: number;
  lastScoredRun: number;
  scoreHistory: ScoreSnapshot[];
  customerType: CustomerType | "";
  aibuildReason: string;
  painPoints: PainPoint[];
  secondaryCategories: string[];
  categoryHistory: CategoryEvent[];
  bundleFit: BundleFit | null;
  complaintFrequency: number | null;
  painClusterIds: string[];
  relatedPainClusterIds: string[];
  mergedIds: string[];
  relatedIds: string[];
  run4Merge: Run4Merge[];
  pipelineOrder: number;
  position: number;
  updatedAt: string;
  updatedBy: string;
  themeId: string;
  themeName: string;
  rank: number | null;
};

export type Run = {
  runNumber: number;
  date: string;
  author: string;
  sourcesSwept: string[];
  ideasAdded: number;
  ideasRescored: number;
  notes: string;
  focus: string;
  rubricVersion: string;
};

export type RubricVersionRecord = {
  version: string;
  sinceRun: number;
  date: string;
  weights: Weights;
  change: string;
};

export type Settings = {
  schemaVersion: string;
  rubricVersion: string;
  criteriaOrder: CriterionKey[];
  weights: Weights;
  rubricHistory: RubricVersionRecord[];
  customerTypes: string[];
  categoryOverrides: Record<string, CategoryOverride>;
  idAliases: Record<string, string>;
  painMethod: PainMethod | null;
};

export type RubricChange = {
  id: number;
  at: string;
  fromVersion: string;
  toVersion: string;
  weights: Weights;
  note: string;
};

export type Portfolio = {
  settings: Settings;
  runs: Run[];
  ideas: Idea[];
  bundles: BundleRecord[];
  painClusters: PainCluster[];
  changes: RubricChange[];
};

export function isStatus(value: string): value is Status {
  return (STATUSES as readonly string[]).includes(value);
}

export function isManualStatus(value: string): value is ManualStatus {
  return (MANUAL_STATUSES as readonly string[]).includes(value);
}

export function isCustomerType(value: string): value is CustomerType {
  return (CUSTOMER_TYPES as readonly string[]).includes(value);
}
