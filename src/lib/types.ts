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

export type Evidence = { url: string; note: string };

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
