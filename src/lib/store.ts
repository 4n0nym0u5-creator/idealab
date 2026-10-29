import fs from "fs";
import path from "path";
import { asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import bundledIdeas from "../../data/ideas.json";
import { CRITERIA_KEYS, DEFAULT_WEIGHTS, isCriterionKey, isOptionalCriterion, type CriterionKey, type Scores, type Weights } from "./criteria";
import { backupDir, execSql, getDb, type AppDatabase } from "./db";
import { applyRun, detectImport, parseJsonText, weightsFromUnknown, type ImportReport } from "./merge";
import { migrationApplied, migrate, recordMigration, splitSql } from "./migrate";
import { applyRubricRescore, rubricHistoryFromRescore, type RescoreFile } from "./rescore";
import { applyBundleAnalysis, bundleFromUnknown, canonicalBundle, canonicalOverrides, overridesFromUnknown, readStoredBundle } from "./bundles";
import { aliasesFromUnknown, canonicalCluster, canonicalMethod, canonicalRun4Merge, clustersFromUnknown, methodFromUnknown, run4MergeFromUnknown } from "./pain";
import { canonicalPortfolio, portfolioFieldsFromIdea, portfolioFitFromUnknown, monetisationFromUnknown, portfolioFromUnknown, roadmapSlotFromUnknown } from "./portfolio";
import { applyRun7Marks, run7Record } from "./run7";
import { backups, bundles, ideas, painClusters, rubricChangelog, runs, settings } from "./schema";
import { assertWeights, assignPresentation, bumpVersion, recompute, sanitizeOverrides, totalOf } from "./scoring";
import { themeForCategory } from "./themes";
import {
  isManualStatus,
  isStatus,
  isCustomerType,
  type CustomerType,
  type Evidence,
  type Idea,
  type PainPoint,
  type BundleFit,
  type BundleRecord,
  type CategoryEvent,
  type CategoryOverride,
  type PainCluster,
  type PainMethod,
  type Portfolio,
  type RubricChange,
  type RubricVersionRecord,
  type Run,
  type Run4Merge,
  type ScoreSnapshot,
  type Settings,
  type Status,
} from "./types";

type IdeaRow = typeof ideas.$inferSelect;
type RunRow = typeof runs.$inferSelect;
type Db = AppDatabase;

export class DatabaseNotReadyError extends Error {
  constructor() {
    super("IdeaLab database is not initialised. Set DATABASE_URL and redeploy, or run npm run db:setup locally.");
    this.name = "DatabaseNotReadyError";
  }
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function asScores(value: unknown): Scores {
  const record = (value ?? {}) as Record<string, unknown>;
  const scores: Scores = {};
  for (const [key, score] of Object.entries(record)) {
    if (!isCriterionKey(key) || typeof score !== "number") continue;
    scores[key] = score;
  }
  return scores;
}

function asPainPoints(value: unknown): PainPoint[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.label !== "string") return [];
    const sources = Array.isArray(row.sources)
      ? row.sources.flatMap((source) => {
          if (!source || typeof source !== "object") return [];
          const entry = source as Record<string, unknown>;
          if (typeof entry.url !== "string") return [];
          return [{ url: entry.url, note: typeof entry.note === "string" ? entry.note : "" }];
        })
      : [];
    const quotes = Array.isArray(row.quotes) ? row.quotes.filter((quote): quote is string => typeof quote === "string") : [];
    return [{
      id: row.id,
      label: row.label,
      count: typeof row.count === "number" ? row.count : 0,
      ...(typeof row.cluster === "string" && row.cluster ? { cluster: row.cluster } : {}),
      sources,
      quotes,
    }];
  });
}

function asRubricHistory(value: unknown): RubricVersionRecord[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (typeof row.version !== "string" || !row.weights || typeof row.weights !== "object") return [];
    return [{
      version: row.version,
      sinceRun: typeof row.since_run === "number" ? row.since_run : 0,
      date: typeof row.date === "string" ? row.date : "",
      weights: row.weights as Weights,
      change: typeof row.change === "string" ? row.change : "",
    }];
  });
}

const DATA_MIGRATION = "0002_rubric_v2_data";
const DATA_MIGRATION_V3 = "0003_schema_v3_data";
const DATA_MIGRATION_V4 = "0004_schema_v4_data";
const DATA_MIGRATION_V5 = "0005_schema_v5_data";
const DATA_MIGRATION_V6 = "0006_run7_lifeadmin_data";

function rowToIdea(row: IdeaRow): Idea {
  const theme = themeForCategory(row.category);
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    platform: row.platform,
    problem: row.problem,
    targetUsers: row.targetUsers,
    monetisation: row.monetisation,
    priceHypothesis: row.priceHypothesis,
    scores: asScores(parseJson(row.scores, {})),
    total: Number(row.total),
    researchTotal: Number(row.researchTotal),
    status: isStatus(row.status) ? row.status : "candidate",
    statusLocked: Number(row.statusLocked) === 1,
    killFlags: parseJson<string[]>(row.killFlags, []),
    avoidFlags: parseJson<string[]>(row.avoidFlags, []),
    evidence: parseJson<Evidence[]>(row.evidence, []),
    competitors: parseJson<string[]>(row.competitors, []),
    notes: row.notes,
    liabilityNotes: row.liabilityNotes,
    userNotes: row.userNotes,
    mvp: row.mvp,
    distribution: row.distribution,
    risks: row.risks,
    scoreOverrides: parseJson<Partial<Scores>>(row.scoreOverrides, {}),
    firstSeenRun: row.firstSeenRun,
    lastScoredRun: row.lastScoredRun,
    scoreHistory: parseJson<ScoreSnapshot[]>(row.scoreHistory, []).map((item) => ({
      ...item,
      rubricVersion: item.rubricVersion ?? "",
      scores: asScores(item.scores),
    })),
    customerType: isCustomerType(row.customerType) ? row.customerType : "",
    aibuildReason: row.aibuildReason ?? "",
    painPoints: asPainPoints(parseJson(row.painPoints, [])),
    secondaryCategories: parseJson<string[]>(row.secondaryCategories, []),
    categoryHistory: parseJson<CategoryEvent[]>(row.categoryHistory, []),
    bundleFit: parseJson<BundleFit | null>(row.bundleFit, null),
    complaintFrequency: row.complaintFrequency == null ? null : Number(row.complaintFrequency),
    painClusterIds: parseJson<string[]>(row.painClusterIds, []),
    relatedPainClusterIds: parseJson<string[]>(row.relatedPainClusterIds, []),
    mergedIds: parseJson<string[]>(row.mergedIds, []),
    relatedIds: parseJson<string[]>(row.relatedIds, []),
    run4Merge: parseJson<Run4Merge[]>(row.run4Merge, []),
    portfolioFit: portfolioFitFromUnknown(parseJson(row.portfolioFit, null)),
    tier: row.tier ?? "",
    family: row.family ?? "",
    privacyClass: row.privacyClass ?? "",
    privacyNotes: row.privacyNotes ?? "",
    thirdPartyPersonalDataApi: row.thirdPartyPersonalDataApi ?? "",
    clientSidePath: parseJson<boolean | null>(row.clientSidePath, null),
    portfolioMonetisation: monetisationFromUnknown(parseJson(row.portfolioMonetisation, null)),
    roadmapSlot: roadmapSlotFromUnknown(parseJson(row.roadmapSlot, null)),
    lineupRole: row.lineupRole ?? "",
    lineupNote: row.lineupNote ?? "",
    pipelineOrder: row.pipelineOrder,
    position: row.position,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
    themeId: theme.id,
    themeName: theme.name,
    rank: null,
  };
}

function ideaToRow(idea: Idea) {
  return {
    id: idea.id,
    title: idea.title,
    category: idea.category,
    platform: idea.platform,
    problem: idea.problem,
    targetUsers: idea.targetUsers,
    monetisation: idea.monetisation,
    priceHypothesis: idea.priceHypothesis,
    scores: JSON.stringify(idea.scores),
    total: idea.total,
    researchTotal: idea.researchTotal,
    status: idea.status,
    statusLocked: idea.statusLocked ? 1 : 0,
    killFlags: JSON.stringify(idea.killFlags),
    avoidFlags: JSON.stringify(idea.avoidFlags),
    evidence: JSON.stringify(idea.evidence),
    competitors: JSON.stringify(idea.competitors),
    notes: idea.notes,
    liabilityNotes: idea.liabilityNotes,
    userNotes: idea.userNotes,
    mvp: idea.mvp,
    distribution: idea.distribution,
    risks: idea.risks,
    scoreOverrides: JSON.stringify(idea.scoreOverrides),
    firstSeenRun: idea.firstSeenRun,
    lastScoredRun: idea.lastScoredRun,
    scoreHistory: JSON.stringify(idea.scoreHistory),
    customerType: idea.customerType,
    aibuildReason: idea.aibuildReason,
    painPoints: JSON.stringify(idea.painPoints),
    secondaryCategories: JSON.stringify(idea.secondaryCategories ?? []),
    categoryHistory: JSON.stringify(idea.categoryHistory ?? []),
    bundleFit: JSON.stringify(idea.bundleFit ?? null),
    complaintFrequency: idea.complaintFrequency,
    painClusterIds: JSON.stringify(idea.painClusterIds ?? []),
    relatedPainClusterIds: JSON.stringify(idea.relatedPainClusterIds ?? []),
    mergedIds: JSON.stringify(idea.mergedIds ?? []),
    relatedIds: JSON.stringify(idea.relatedIds ?? []),
    run4Merge: JSON.stringify(idea.run4Merge ?? []),
    portfolioFit: JSON.stringify(idea.portfolioFit ? {
      score: idea.portfolioFit.score,
      rank: idea.portfolioFit.rank,
      viability: idea.portfolioFit.viability,
      opportunity: idea.portfolioFit.opportunity,
      pre_privacy: idea.portfolioFit.prePrivacy,
      subscores: idea.portfolioFit.subscores,
    } : null),
    tier: idea.tier ?? "",
    family: idea.family ?? "",
    privacyClass: idea.privacyClass ?? "",
    privacyNotes: idea.privacyNotes ?? "",
    thirdPartyPersonalDataApi: idea.thirdPartyPersonalDataApi ?? "",
    clientSidePath: JSON.stringify(idea.clientSidePath ?? null),
    portfolioMonetisation: JSON.stringify(idea.portfolioMonetisation ?? null),
    roadmapSlot: JSON.stringify(idea.roadmapSlot ?? null),
    lineupRole: idea.lineupRole ?? "",
    lineupNote: idea.lineupNote ?? "",
    pipelineOrder: idea.pipelineOrder,
    position: idea.position,
    updatedAt: idea.updatedAt,
    updatedBy: idea.updatedBy,
  };
}

function rowToRun(row: RunRow): Run {
  return {
    runNumber: row.runNumber,
    date: row.date,
    author: row.author,
    sourcesSwept: parseJson<string[]>(row.sourcesSwept, []),
    ideasAdded: row.ideasAdded,
    ideasRescored: row.ideasRescored,
    notes: row.notes,
    focus: row.focus,
    rubricVersion: row.rubricVersion ?? "",
  };
}

export async function loadPortfolio(): Promise<Portfolio> {
  const db = await getDb();
  const [settingsRow] = await db.select().from(settings).limit(1);
  if (!settingsRow) throw new DatabaseNotReadyError();
  const loadedIdeas = (await db.select().from(ideas).orderBy(asc(ideas.position), asc(ideas.id))).map(rowToIdea);
  const loadedRuns = (await db.select().from(runs).orderBy(asc(runs.runNumber))).map(rowToRun);
  const changes = (await db.select().from(rubricChangelog).orderBy(asc(rubricChangelog.id))).map((row) => ({
    id: row.id,
    at: row.at,
    fromVersion: row.fromVersion,
    toVersion: row.toVersion,
    weights: parseJson<Weights>(row.weights, DEFAULT_WEIGHTS),
    note: row.note,
  }));
  return {
    settings: {
      schemaVersion: settingsRow.schemaVersion,
      rubricVersion: settingsRow.rubricVersion,
      criteriaOrder: parseJson<CriterionKey[]>(settingsRow.criteriaOrder, [...CRITERIA_KEYS]),
      weights: parseJson<Weights>(settingsRow.weights, DEFAULT_WEIGHTS),
      rubricHistory: asRubricHistory(parseJson(settingsRow.rubricHistory, [])),
      customerTypes: parseJson<string[]>(settingsRow.customerTypes, ["consumer", "business", "both"]),
      categoryOverrides: overridesFromUnknown(parseJson(settingsRow.categoryOverrides, {})),
      idAliases: aliasesFromUnknown(parseJson(settingsRow.idAliases, {})),
      painMethod: methodFromUnknown(parseJson(settingsRow.painMethod, null)),
      portfolio: portfolioFromUnknown(parseJson(settingsRow.portfolio, null)),
    },
    runs: loadedRuns,
    ideas: assignPresentation(loadedIdeas),
    bundles: (await db.select().from(bundles).orderBy(asc(bundles.id))).flatMap((row) => {
      const bundle = readStoredBundle(parseJson(row.document, {}));
      return bundle ? [bundle] : [];
    }),
    painClusters: (await db.select().from(painClusters)).flatMap((row) => {
      const cluster = clustersFromUnknown([parseJson(row.document, {})])[0];
      return cluster ? [cluster] : [];
    }).sort((a, b) => a.rank - b.rank || b.cfs - a.cfs),
    changes,
  };
}

export async function requirePortfolio(): Promise<Portfolio> {
  return loadPortfolio();
}

async function persistIdeas(db: Db, nextIdeas: Idea[]): Promise<void> {
  for (const idea of nextIdeas) {
    const row = ideaToRow(idea);
    const { id, ...set } = row;
    await db.insert(ideas).values(row).onConflictDoUpdate({ target: ideas.id, set });
  }
}

async function persistRun(db: Db, run: Run): Promise<void> {
  const values = {
    runNumber: run.runNumber,
    date: run.date,
    author: run.author,
    sourcesSwept: JSON.stringify(run.sourcesSwept),
    ideasAdded: run.ideasAdded,
    ideasRescored: run.ideasRescored,
    notes: run.notes,
    focus: run.focus,
    rubricVersion: run.rubricVersion ?? "",
  };
  await db.insert(runs).values(values).onConflictDoUpdate({
    target: runs.runNumber,
    set: {
      date: values.date,
      author: values.author,
      sourcesSwept: values.sourcesSwept,
      ideasAdded: values.ideasAdded,
      ideasRescored: values.ideasRescored,
      notes: values.notes,
      focus: values.focus,
      rubricVersion: values.rubricVersion,
    },
  });
}

async function persistSettings(db: Db, next: Settings): Promise<void> {
  const values = {
    id: 1,
    schemaVersion: next.schemaVersion,
    rubricVersion: next.rubricVersion,
    criteriaOrder: JSON.stringify(next.criteriaOrder),
    weights: JSON.stringify(next.weights),
    rubricHistory: JSON.stringify(next.rubricHistory ?? []),
    customerTypes: JSON.stringify(next.customerTypes ?? ["consumer", "business", "both"]),
    categoryOverrides: JSON.stringify(canonicalOverrides(next.categoryOverrides ?? {})),
    idAliases: JSON.stringify(next.idAliases ?? {}),
    painMethod: JSON.stringify(next.painMethod ? canonicalMethod(next.painMethod) : null),
    portfolio: JSON.stringify(canonicalPortfolio(next.portfolio)),
  };
  await db.insert(settings).values(values).onConflictDoUpdate({
    target: settings.id,
    set: {
      schemaVersion: values.schemaVersion,
      rubricVersion: values.rubricVersion,
      criteriaOrder: values.criteriaOrder,
      weights: values.weights,
      rubricHistory: values.rubricHistory,
      customerTypes: values.customerTypes,
      categoryOverrides: values.categoryOverrides,
      idAliases: values.idAliases,
      painMethod: values.painMethod,
      portfolio: values.portfolio,
    },
  });
}

type RawHistory = { run: number; date: string; total: number; scores: Scores; rubric_version?: string; note?: string };
type RawRun = {
  run_number: number;
  date: string;
  author?: string;
  sources_swept?: string[];
  ideas_added?: number;
  ideas_rescored?: number;
  notes?: string;
  focus?: string;
  rubric_version?: string;
};
type RawApp = {
  user_notes?: string;
  mvp?: string;
  distribution?: string;
  risks?: string;
  score_overrides?: Partial<Scores>;
  status_locked?: boolean;
  pipeline_order?: number;
  position?: number;
  updated_at?: string;
  updated_by?: string;
};
type RawIdea = {
  id: string;
  title: string;
  category: string;
  platform: string;
  problem: string;
  target_users: string;
  monetisation: string;
  price_hypothesis: string;
  scores: Scores;
  total?: number;
  status?: string;
  customer_type?: string;
  aibuild_reason?: string;
  pain_points?: PainPoint[];
  secondary_categories?: string[];
  category_history?: CategoryEvent[];
  bundle_fit?: BundleFit | null;
  complaint_frequency?: number | null;
  pain_cluster_ids?: string[];
  related_pain_cluster_ids?: string[];
  merged_ids?: string[];
  related_ids?: string[];
  run4_merge?: unknown;
  portfolio_fit?: unknown;
  tier?: string;
  family?: string;
  privacy_class?: string;
  privacy_notes?: string;
  third_party_personal_data_api?: string;
  client_side_path?: boolean;
  portfolio_monetisation?: unknown;
  roadmap_slot?: number | string | null;
  kill_flags?: string[];
  avoid_flags?: string[];
  evidence?: Evidence[];
  competitors?: string[];
  notes?: string;
  liability_notes?: string;
  first_seen_run?: number;
  last_scored_run?: number;
  score_history?: RawHistory[];
  _idealab?: RawApp;
};
export type ResearchDocument = {
  schema_version?: string | number;
  portfolio?: unknown;
  rubric_version?: string;
  weights?: Weights;
  criteria_order?: CriterionKey[];
  runs?: RawRun[];
  ideas: RawIdea[];
  customer_types?: string[];
  rubric_history?: unknown;
  category_overrides?: unknown;
  bundles?: unknown[];
  id_aliases?: unknown;
  pain_clusters?: unknown;
  pain_method?: unknown;
  _idealab?: { rubric_changelog?: Array<Omit<RubricChange, "id"> & { id?: number }> };
};

export function ideaFromDocument(raw: RawIdea, index: number, now: string): Idea {
  const theme = themeForCategory(raw.category);
  const app = raw._idealab ?? {};
  const scores = asScores(raw.scores);
  const status = raw.status && isStatus(raw.status) ? raw.status : "candidate";
  return {
    id: raw.id,
    title: raw.title,
    category: raw.category,
    platform: raw.platform,
    problem: raw.problem,
    targetUsers: raw.target_users,
    monetisation: raw.monetisation,
    priceHypothesis: raw.price_hypothesis,
    scores,
    total: typeof raw.total === "number" ? raw.total : 0,
    researchTotal: typeof raw.total === "number" ? raw.total : 0,
    status,
    statusLocked: app.status_locked === true || isManualStatus(status),
    killFlags: raw.kill_flags ?? [],
    avoidFlags: raw.avoid_flags ?? [],
    evidence: raw.evidence ?? [],
    competitors: raw.competitors ?? [],
    notes: raw.notes ?? "",
    liabilityNotes: raw.liability_notes ?? "",
    userNotes: app.user_notes ?? "",
    mvp: app.mvp ?? "",
    distribution: app.distribution ?? "",
    risks: app.risks ?? "",
    scoreOverrides: app.score_overrides ?? {},
    firstSeenRun: raw.first_seen_run ?? 1,
    lastScoredRun: raw.last_scored_run ?? raw.first_seen_run ?? 1,
    scoreHistory: (raw.score_history ?? []).map((item) => ({
      run: item.run,
      date: item.date,
      rubricVersion: item.rubric_version ?? "",
      total: item.total,
      scores: asScores(item.scores),
      ...(item.note ? { note: item.note } : {}),
    })),
    customerType: raw.customer_type && isCustomerType(raw.customer_type) ? raw.customer_type : "",
    aibuildReason: raw.aibuild_reason ?? "",
    painPoints: asPainPoints(raw.pain_points),
    secondaryCategories: raw.secondary_categories ?? [],
    categoryHistory: raw.category_history ?? [],
    bundleFit: raw.bundle_fit ?? null,
    complaintFrequency: typeof raw.complaint_frequency === "number" ? raw.complaint_frequency : null,
    painClusterIds: raw.pain_cluster_ids ?? [],
    relatedPainClusterIds: raw.related_pain_cluster_ids ?? [],
    mergedIds: raw.merged_ids ?? [],
    relatedIds: raw.related_ids ?? [],
    run4Merge: run4MergeFromUnknown(raw.run4_merge),
    ...portfolioFieldsFromIdea(raw as unknown as Record<string, unknown>),
    lineupRole: "",
    lineupNote: "",
    pipelineOrder: app.pipeline_order ?? 0,
    position: app.position ?? index,
    updatedAt: app.updated_at ?? now,
    updatedBy: app.updated_by ?? "seed",
    themeId: theme.id,
    themeName: theme.name,
    rank: null,
  };
}

export function canonicalIdea(idea: Idea) {
  return {
    id: idea.id,
    title: idea.title,
    category: idea.category,
    platform: idea.platform,
    problem: idea.problem,
    target_users: idea.targetUsers,
    monetisation: idea.monetisation,
    price_hypothesis: idea.priceHypothesis,
    scores: idea.scores,
    total: idea.researchTotal,
    status: idea.status,
    kill_flags: idea.killFlags,
    ...(idea.avoidFlags.length ? { avoid_flags: idea.avoidFlags } : {}),
    evidence: idea.evidence,
    competitors: idea.competitors,
    notes: idea.notes,
    ...(idea.liabilityNotes ? { liability_notes: idea.liabilityNotes } : {}),
    first_seen_run: idea.firstSeenRun,
    last_scored_run: idea.lastScoredRun,
    score_history: idea.scoreHistory.map((item) => ({
      run: item.run,
      date: item.date,
      ...(item.rubricVersion ? { rubric_version: item.rubricVersion } : {}),
      total: item.total,
      scores: item.scores,
      ...(item.note ? { note: item.note } : {}),
    })),
    ...(idea.customerType ? { customer_type: idea.customerType } : {}),
    ...(idea.aibuildReason ? { aibuild_reason: idea.aibuildReason } : {}),
    ...(idea.painPoints.length ? { pain_points: idea.painPoints } : {}),
    ...(idea.secondaryCategories.length ? { secondary_categories: idea.secondaryCategories } : {}),
    ...(idea.categoryHistory.length ? { category_history: idea.categoryHistory } : {}),
    ...(idea.bundleFit ? { bundle_fit: idea.bundleFit } : {}),
    ...(idea.complaintFrequency != null ? { complaint_frequency: idea.complaintFrequency } : {}),
    ...(idea.painClusterIds.length ? { pain_cluster_ids: idea.painClusterIds } : {}),
    ...(idea.relatedPainClusterIds.length ? { related_pain_cluster_ids: idea.relatedPainClusterIds } : {}),
    ...(idea.mergedIds.length ? { merged_ids: idea.mergedIds } : {}),
    ...(idea.relatedIds.length ? { related_ids: idea.relatedIds } : {}),
    ...(idea.run4Merge.length ? { run4_merge: canonicalRun4Merge(idea.run4Merge) } : {}),
    ...(idea.portfolioFit ? {
      portfolio_fit: {
        score: idea.portfolioFit.score,
        rank: idea.portfolioFit.rank,
        viability: idea.portfolioFit.viability,
        opportunity: idea.portfolioFit.opportunity,
        pre_privacy: idea.portfolioFit.prePrivacy,
        subscores: idea.portfolioFit.subscores,
      },
    } : {}),
    ...(idea.tier ? { tier: idea.tier } : {}),
    ...(idea.family ? { family: idea.family } : {}),
    ...(idea.privacyClass ? { privacy_class: idea.privacyClass } : {}),
    ...(idea.privacyNotes ? { privacy_notes: idea.privacyNotes } : {}),
    ...(idea.thirdPartyPersonalDataApi ? { third_party_personal_data_api: idea.thirdPartyPersonalDataApi } : {}),
    ...(idea.clientSidePath != null ? { client_side_path: idea.clientSidePath } : {}),
    ...(idea.portfolioMonetisation ? { portfolio_monetisation: idea.portfolioMonetisation } : {}),
    ...(idea.roadmapSlot != null ? { roadmap_slot: idea.roadmapSlot } : {}),
    ...(idea.lineupRole ? { lineup_role: idea.lineupRole } : {}),
    ...(idea.lineupNote ? { lineup_note: idea.lineupNote } : {}),
  };
}

export async function exportDocument(portfolio?: Portfolio) {
  const source = portfolio ?? await loadPortfolio();
  return {
    schema_version: source.settings.schemaVersion,
    rubric_version: source.settings.rubricVersion,
    weights: source.settings.weights,
    criteria_order: source.settings.criteriaOrder,
    runs: source.runs.map((run) => ({
      run_number: run.runNumber,
      date: run.date,
      author: run.author,
      sources_swept: run.sourcesSwept,
      ideas_added: run.ideasAdded,
      ideas_rescored: run.ideasRescored,
      notes: run.notes,
      ...(run.focus ? { focus: run.focus } : {}),
      ...(run.rubricVersion ? { rubric_version: run.rubricVersion } : {}),
    })),
    ...(source.settings.customerTypes.length ? { customer_types: source.settings.customerTypes } : {}),
    ...(source.settings.rubricHistory.length ? {
      rubric_history: source.settings.rubricHistory.map((item) => ({
        version: item.version,
        since_run: item.sinceRun,
        ...(item.date ? { date: item.date } : {}),
        weights: item.weights,
        ...(item.change ? { change: item.change } : {}),
      })),
    } : {}),
    ...(Object.keys(source.settings.categoryOverrides).length ? { category_overrides: canonicalOverrides(source.settings.categoryOverrides) } : {}),
    ...(Object.keys(source.settings.idAliases).length ? { id_aliases: source.settings.idAliases } : {}),
    ...(source.painClusters.length ? { pain_clusters: source.painClusters.map((cluster) => canonicalCluster(cluster)) } : {}),
    ...(source.settings.painMethod ? { pain_method: canonicalMethod(source.settings.painMethod) } : {}),
    ...(source.settings.portfolio ? { portfolio: canonicalPortfolio(source.settings.portfolio) } : {}),
    ...(source.bundles.length ? { bundles: source.bundles.map((bundle) => canonicalBundle(bundle)) } : {}),
    ideas: [...source.ideas]
      .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
      .map((idea) => ({
        ...canonicalIdea(idea),
        _idealab: {
          user_notes: idea.userNotes,
          mvp: idea.mvp,
          distribution: idea.distribution,
          risks: idea.risks,
          score_overrides: idea.scoreOverrides,
          status_locked: idea.statusLocked,
          pipeline_order: idea.pipelineOrder,
          position: idea.position,
          working_total: idea.total,
          liability_notes: idea.liabilityNotes,
          avoid_flags: idea.avoidFlags,
          updated_at: idea.updatedAt,
          updated_by: idea.updatedBy,
        },
      })),
    _idealab: {
      exported_at: new Date().toISOString(),
      rubric_changelog: source.changes,
    },
  };
}

function readBundleAnalysis(): unknown | null {
  const file = path.join(process.cwd(), "data", "run5-bundle.json");
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
  return null;
}

function withAnalysis(list: BundleRecord[]): BundleRecord[] {
  const analysis = readBundleAnalysis();
  if (!analysis) return list;
  return list.map((bundle) => applyBundleAnalysis(bundle, analysis));
}

function bundlesFromDocument(doc: ResearchDocument): BundleRecord[] {
  return (doc.bundles ?? []).flatMap((raw) => {
    const bundle = bundleFromUnknown(raw);
    return bundle ? [bundle] : [];
  });
}

async function persistPainClusters(db: Db, list: PainCluster[]): Promise<void> {
  await db.delete(painClusters);
  for (const cluster of list) {
    await db.insert(painClusters).values({ id: cluster.id, document: JSON.stringify(canonicalCluster(cluster)) });
  }
}

async function persistBundle(db: Db, bundle: BundleRecord): Promise<void> {
  const document = JSON.stringify(bundle);
  await db.insert(bundles).values({ id: bundle.id, document }).onConflictDoUpdate({
    target: bundles.id,
    set: { document },
  });
}

export async function replacePortfolio(
  doc: ResearchDocument,
  actor = "seed",
  options?: { onlyIfEmpty?: boolean },
): Promise<{ ideas: number; runs: number; skipped: boolean }> {
  const now = new Date().toISOString();
  const weights = doc.weights ?? DEFAULT_WEIGHTS;
  assertWeights(weights);
  const criteriaOrder = (doc.criteria_order?.length ? doc.criteria_order : [...CRITERIA_KEYS]) as CriterionKey[];
  const loaded = doc.ideas.map((idea, index) => ideaFromDocument(idea, index, now));
  const originals = new Map(loaded.map((idea) => [idea.id, { status: idea.status, total: idea.total }]));
  recompute(loaded, weights, criteriaOrder);
  const mismatches: string[] = [];
  for (const idea of loaded) {
    const original = originals.get(idea.id)!;
    if (idea.status !== original.status) mismatches.push(`${idea.id} status ${original.status} -> ${idea.status}`);
    if (Math.abs(idea.researchTotal - original.total) > 0.05) mismatches.push(`${idea.id} total ${original.total} -> ${idea.researchTotal}`);
  }
  if (mismatches.length) {
    throw new Error(`Seed does not match the scoring rules:\n${mismatches.slice(0, 12).join("\n")}`);
  }
  for (const idea of loaded) idea.updatedBy = actor;

  const loadedRuns: Run[] = (doc.runs ?? []).map((run) => ({
    runNumber: run.run_number,
    date: run.date,
    author: run.author ?? "Unknown",
    sourcesSwept: run.sources_swept ?? [],
    ideasAdded: run.ideas_added ?? 0,
    ideasRescored: run.ideas_rescored ?? 0,
    notes: run.notes ?? "",
    focus: run.focus ?? "",
    rubricVersion: run.rubric_version ?? "",
  }));

  const db = await getDb();
  let skipped = false;
  await db.transaction(async (tx) => {
    if (options?.onlyIfEmpty) {
      const existing = await tx.select({ id: ideas.id }).from(ideas).limit(1);
      if (existing.length) {
        skipped = true;
        return;
      }
    }
    await tx.delete(rubricChangelog);
    await tx.delete(ideas);
    await tx.delete(runs);
    await tx.delete(bundles);
    await tx.delete(painClusters);
    await tx.delete(settings);
    await persistSettings(tx, {
      schemaVersion: String(doc.schema_version ?? "1.0"),
      rubricVersion: doc.rubric_version ?? "1.0",
      criteriaOrder,
      weights,
      rubricHistory: asRubricHistory(doc.rubric_history),
      customerTypes: doc.customer_types ?? ["consumer", "business", "both"],
      categoryOverrides: overridesFromUnknown(doc.category_overrides),
      idAliases: aliasesFromUnknown(doc.id_aliases),
      painMethod: methodFromUnknown(doc.pain_method),
      portfolio: portfolioFromUnknown(doc.portfolio),
    });
    for (const run of loadedRuns) await persistRun(tx, run);
    for (const bundle of withAnalysis(bundlesFromDocument(doc))) await persistBundle(tx, bundle);
    await persistPainClusters(tx, clustersFromUnknown(doc.pain_clusters));
    for (const idea of loaded) await tx.insert(ideas).values(ideaToRow(idea));
    for (const change of doc._idealab?.rubric_changelog ?? []) {
      await tx.insert(rubricChangelog).values({
        id: change.id,
        at: change.at,
        fromVersion: change.fromVersion,
        toVersion: change.toVersion,
        weights: JSON.stringify(change.weights),
        note: change.note,
      });
    }
    await tx.execute(sql`SELECT setval(pg_get_serial_sequence('rubric_changelog', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM rubric_changelog), 1), 1), true)`);
  });
  if (skipped) return { ideas: 0, runs: 0, skipped: true };
  return { ideas: loaded.length, runs: loadedRuns.length, skipped: false };
}

function contextFromImport(portfolio: Portfolio, value: unknown): Settings & { changed: boolean } {
  const record = (value ?? {}) as Record<string, unknown>;
  let weights = { ...portfolio.settings.weights };
  let criteriaOrder = [...portfolio.settings.criteriaOrder];
  let rubricVersion = portfolio.settings.rubricVersion;
  let rubricHistory = portfolio.settings.rubricHistory;
  let schemaVersion = portfolio.settings.schemaVersion;
  const customerTypes = portfolio.settings.customerTypes;
  const categoryOverrides = portfolio.settings.categoryOverrides;
  const idAliases = portfolio.settings.idAliases;
  const painMethod = portfolio.settings.painMethod;
  let strategy = portfolio.settings.portfolio;
  let changed = false;
  const nextWeights = weightsFromUnknown(record.weights);
  if (nextWeights) {
    assertWeights(nextWeights);
    weights = nextWeights;
    changed = true;
  }
  if (Array.isArray(record.criteria_order)) {
    const order = record.criteria_order.filter((key): key is string => typeof key === "string" && isCriterionKey(key));
    if (order.length) {
      criteriaOrder = order;
      changed = true;
    }
  }
  for (const key of Object.keys(weights)) {
    if ((weights[key] ?? 0) > 0 && !criteriaOrder.includes(key)) criteriaOrder.push(key);
  }
  if (typeof record.rubric_version === "string" && record.rubric_version) {
    rubricVersion = record.rubric_version;
    changed = true;
  }
  if (record.rubric_history) {
    const history = asRubricHistory(record.rubric_history);
    if (history.length) {
      rubricHistory = history;
      changed = true;
    }
  }
  const nextPortfolio = portfolioFromUnknown(record.portfolio);
  if (nextPortfolio) {
    strategy = nextPortfolio;
    changed = true;
  }
  if (typeof record.schema_version === "string" || typeof record.schema_version === "number") {
    const nextSchema = String(record.schema_version);
    if (Number(nextSchema) > Number(schemaVersion)) {
      schemaVersion = nextSchema;
      changed = true;
    }
  }
  for (const key of criteriaOrder) {
    if (weights[key] === undefined && !isOptionalCriterion(key)) weights[key] = 0;
  }
  return { schemaVersion, rubricVersion, criteriaOrder, weights, rubricHistory, customerTypes, categoryOverrides, idAliases, painMethod, portfolio: strategy, changed };
}

export async function previewImport(text: string): Promise<ImportReport> {
  const portfolio = await loadPortfolio();
  const value = parseJsonText(text);
  if (detectImport(value) !== "run") {
    throw new Error("Full-database restore is not previewed as a run. Import a { run, ideas } file.");
  }
  const context = contextFromImport(portfolio, value);
  return applyRun(portfolio.ideas, value, context.weights, portfolio.runs, {
    criteriaOrder: context.criteriaOrder,
    rubricVersion: context.rubricVersion,
    categoryOverrides: portfolio.settings.categoryOverrides,
    bundles: portfolio.bundles,
    idAliases: portfolio.settings.idAliases,
    painClusters: portfolio.painClusters,
    painMethod: portfolio.settings.painMethod,
  }).report;
}

export async function commitImport(text: string, actor: string): Promise<{ report: ImportReport; backupPath: string }> {
  const portfolio = await loadPortfolio();
  const value = parseJsonText(text);
  const shape = detectImport(value);
  if (shape !== "run") {
    const doc = value as ResearchDocument;
    const backupPath = await writeBackup("before-database-import");
    await replacePortfolio(doc, actor);
    return {
      backupPath,
      report: {
        mode: "run",
        runNumber: 0,
        date: "",
        author: actor,
        focus: "Database restore",
        notes: "Replaced the database from a full export.",
        sources: [],
        added: [],
        updated: [],
        duplicates: [],
        shortlistEntered: [],
        shortlistLeft: [],
        ideasAdded: doc.ideas?.length ?? 0,
        ideasRescored: 0,
        totalAfter: doc.ideas?.length ?? 0,
      },
    };
  }
  const context = contextFromImport(portfolio, value);
  const result = applyRun(portfolio.ideas, value, context.weights, portfolio.runs, {
    criteriaOrder: context.criteriaOrder,
    rubricVersion: context.rubricVersion,
    categoryOverrides: portfolio.settings.categoryOverrides,
    bundles: portfolio.bundles,
    idAliases: portfolio.settings.idAliases,
    painClusters: portfolio.painClusters,
    painMethod: portfolio.settings.painMethod,
  });
  const backupPath = await writeBackup(`ideas_before_run_${result.run.runNumber}`);
  const db = await getDb();
  await db.transaction(async (tx) => {
    if (context.changed) {
      await persistSettings(tx, {
        schemaVersion: context.schemaVersion,
        rubricVersion: context.rubricVersion,
        criteriaOrder: context.criteriaOrder,
        weights: context.weights,
        rubricHistory: context.rubricHistory,
        customerTypes: context.customerTypes,
        categoryOverrides: result.categoryOverrides,
        idAliases: result.idAliases,
        painMethod: result.painMethod,
        portfolio: result.portfolio ?? context.portfolio,
      });
    } else if (
      JSON.stringify(result.categoryOverrides) !== JSON.stringify(portfolio.settings.categoryOverrides)
      || JSON.stringify(result.idAliases) !== JSON.stringify(portfolio.settings.idAliases)
      || JSON.stringify(result.painMethod) !== JSON.stringify(portfolio.settings.painMethod)
      || JSON.stringify(canonicalPortfolio(result.portfolio)) !== JSON.stringify(canonicalPortfolio(portfolio.settings.portfolio))
    ) {
      await persistSettings(tx, {
        ...portfolio.settings,
        categoryOverrides: result.categoryOverrides,
        idAliases: result.idAliases,
        painMethod: result.painMethod,
        portfolio: result.portfolio ?? portfolio.settings.portfolio,
      });
    }
    for (const bundle of withAnalysis(result.bundles)) await persistBundle(tx, bundle);
    if (result.painClusters.length) await persistPainClusters(tx, result.painClusters);
    await persistIdeas(tx, result.ideas);
    await persistRun(tx, result.run);
  });
  return { report: result.report, backupPath };
}

export async function writeBackup(label: string): Promise<string> {
  const document = JSON.stringify(await exportDocument(), null, 2);
  const db = await getDb();
  const inserted = await db.insert(backups).values({
    label,
    createdAt: new Date().toISOString(),
    document,
  }).returning({ id: backups.id });
  const id = inserted[0]?.id;
  const stale = await db.select({ id: backups.id }).from(backups).orderBy(desc(backups.id));
  if (stale.length > 20) {
    await db.delete(backups).where(inArray(backups.id, stale.slice(20).map((row) => row.id)));
  }
  try {
    const dir = backupDir();
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${label}.json`);
    fs.writeFileSync(file, document);
    return file;
  } catch {
    return `database backup #${id ?? "?"}`;
  }
}

export type TrackingPatch = {
  status?: Status;
  userNotes?: string;
  mvp?: string;
  distribution?: string;
  risks?: string;
  liabilityNotes?: string;
  scoreOverrides?: Partial<Scores>;
  pipelineOrder?: number;
  unlock?: boolean;
};

export async function updateTracking(id: string, patch: TrackingPatch, actor: string): Promise<Idea> {
  const portfolio = await loadPortfolio();
  const nextIdeas = portfolio.ideas.map((idea) => structuredClone(idea));
  const idea = nextIdeas.find((item) => item.id === id);
  if (!idea) throw new Error(`No idea with id ${id}.`);
  if (patch.unlock) {
    idea.statusLocked = false;
    if (isManualStatus(idea.status) || idea.status === "avoid" || idea.status === "killed" || idea.status === "shortlist") {
      idea.status = "candidate";
    }
  }
  if (patch.status) {
    if (!isStatus(patch.status)) throw new Error("Unknown status.");
    idea.status = patch.status;
    idea.statusLocked = true;
  }
  if (patch.userNotes !== undefined) idea.userNotes = patch.userNotes.slice(0, 8000);
  if (patch.mvp !== undefined) idea.mvp = patch.mvp.slice(0, 8000);
  if (patch.distribution !== undefined) idea.distribution = patch.distribution.slice(0, 8000);
  if (patch.risks !== undefined) idea.risks = patch.risks.slice(0, 8000);
  if (patch.liabilityNotes !== undefined) idea.liabilityNotes = patch.liabilityNotes.slice(0, 8000);
  if (patch.scoreOverrides) idea.scoreOverrides = sanitizeOverrides(patch.scoreOverrides);
  if (patch.pipelineOrder !== undefined) idea.pipelineOrder = patch.pipelineOrder;
  idea.updatedAt = new Date().toISOString();
  idea.updatedBy = actor;
  recompute(nextIdeas, portfolio.settings.weights, portfolio.settings.criteriaOrder);
  const db = await getDb();
  await db.transaction(async (tx) => {
    await persistIdeas(tx, nextIdeas);
  });
  return nextIdeas.find((item) => item.id === id)!;
}

export async function saveWeights(weights: Weights, note: string, actor: string): Promise<{ version: string }> {
  assertWeights(weights);
  const portfolio = await loadPortfolio();
  const fromVersion = portfolio.settings.rubricVersion;
  const toVersion = bumpVersion(fromVersion);
  const nextIdeas = portfolio.ideas.map((idea) => structuredClone(idea));
  recompute(nextIdeas, weights, portfolio.settings.criteriaOrder);
  const now = new Date().toISOString();
  for (const idea of nextIdeas) {
    idea.updatedAt = now;
    idea.updatedBy = actor;
  }
  const db = await getDb();
  await db.transaction(async (tx) => {
    await persistSettings(tx, { ...portfolio.settings, rubricVersion: toVersion, weights });
    await persistIdeas(tx, nextIdeas);
    await tx.insert(rubricChangelog).values({
      at: now,
      fromVersion,
      toVersion,
      weights: JSON.stringify(weights),
      note: note.trim() || "Weights updated in IdeaLab.",
    });
  });
  return { version: toVersion };
}

let ready: Promise<{ ideas: number; runs: number; skipped: boolean }> | null = null;

export function ensureDatabase(): Promise<{ ideas: number; runs: number; skipped: boolean }> {
  if (!ready) {
    ready = seedIfEmpty("seed").catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}

export async function applyRun7Lineup(): Promise<{ changed: number; skippedNew: string[] }> {
  const portfolio = await loadPortfolio();
  const before = new Map(portfolio.ideas.map((idea) => [idea.id, { total: idea.researchTotal, status: idea.status, history: idea.scoreHistory.length }]));
  const result = applyRun7Marks(portfolio.ideas);
  for (const idea of portfolio.ideas) {
    const prior = before.get(idea.id);
    if (!prior) continue;
    if (idea.researchTotal !== prior.total || idea.status !== prior.status || idea.scoreHistory.length !== prior.history) {
      throw new Error(`Run 7 changed rubric data on ${idea.id}`);
    }
  }
  const db = await getDb();
  await db.transaction(async (tx) => {
    const marked = portfolio.ideas.filter((idea) => idea.lineupRole);
    if (marked.length) await persistIdeas(tx, marked);
    if (!portfolio.runs.some((run) => run.runNumber === 7)) await persistRun(tx, run7Record());
  });
  return { changed: result.changed, skippedNew: result.added };
}

async function ensureHintAndTell(): Promise<number> {
  const db = await getDb();
  const existing = await db.select({ id: ideas.id }).from(ideas).where(eq(ideas.id, "hint-and-tell-family-memory-game"));
  if (existing.length > 0) return 0;
  const [{ n }] = await db.select({ n: count() }).from(ideas);
  if (Number(n) === 0) return 0;
  const sqlText = fs.readFileSync(path.join(process.cwd(), "drizzle", "0007_run11_memorygame.sql"), "utf8");
  for (const statement of splitSql(sqlText)) await execSql(statement);
  return 1;
}

export async function seedIfEmpty(actor = "seed"): Promise<{ ideas: number; runs: number; skipped: boolean }> {
  await migrate();
  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(ideas);
  const populated = Number(n) > 0;
  if (!populated) {
    const result = await replacePortfolio(readResearchFile(), actor, { onlyIfEmpty: true });
    if (!result.skipped) {
      await applyRun7Lineup();
      await recordMigration(DATA_MIGRATION);
      await recordMigration(DATA_MIGRATION_V3);
      await recordMigration(DATA_MIGRATION_V4);
      await recordMigration(DATA_MIGRATION_V5);
      await recordMigration(DATA_MIGRATION_V6);
      const added = await ensureHintAndTell();
      return { ...result, ideas: result.ideas + added };
    }
  }
  const needsV2 = !(await migrationApplied(DATA_MIGRATION));
  const needsV3 = !(await migrationApplied(DATA_MIGRATION_V3));
  const needsV4 = !(await migrationApplied(DATA_MIGRATION_V4));
  const needsV5 = !(await migrationApplied(DATA_MIGRATION_V5));
  const needsV6 = !(await migrationApplied(DATA_MIGRATION_V6));
  if (needsV2 || needsV3 || needsV4 || needsV5 || needsV6) {
    let ideasAfter = Number(n);
    let runsAfter = 0;
    if (needsV2 || needsV3 || needsV4 || needsV5) {
      const upgraded = await upgradeResearchData(readResearchFile(), actor);
      ideasAfter = upgraded.ideas;
      runsAfter = upgraded.runs;
    }
    if (needsV6) await applyRun7Lineup();
    if (needsV2) await recordMigration(DATA_MIGRATION);
    if (needsV3) await recordMigration(DATA_MIGRATION_V3);
    if (needsV4) await recordMigration(DATA_MIGRATION_V4);
    if (needsV5) await recordMigration(DATA_MIGRATION_V5);
    if (needsV6) await recordMigration(DATA_MIGRATION_V6);
    const added = await ensureHintAndTell();
    return { ideas: ideasAfter + added, runs: runsAfter, skipped: false };
  }
  await ensureHintAndTell();
  const [{ n: after }] = await db.select({ n: count() }).from(ideas);
  return { ideas: Number(after), runs: 0, skipped: true };
}

export async function commitRescore(file: RescoreFile, actor = "rescore"): Promise<void> {
  const portfolio = await loadPortfolio();
  const nextIdeas = applyRubricRescore(portfolio.ideas, file);
  const weights = file.weights_v2;
  assertWeights(weights, file.criteria_order_v2);
  recompute(nextIdeas, weights, file.criteria_order_v2);
  const now = new Date().toISOString();
  for (const idea of nextIdeas) {
    idea.updatedAt = now;
    idea.updatedBy = actor;
  }
  const db = await getDb();
  await db.transaction(async (tx) => {
    await persistSettings(tx, {
      schemaVersion: "2",
      rubricVersion: file.rubric_to,
      criteriaOrder: file.criteria_order_v2,
      weights,
      rubricHistory: rubricHistoryFromRescore(file),
      customerTypes: ["consumer", "business", "both"],
      categoryOverrides: portfolio.settings.categoryOverrides,
      idAliases: portfolio.settings.idAliases,
      painMethod: portfolio.settings.painMethod,
      portfolio: portfolio.settings.portfolio,
    });
    await persistIdeas(tx, nextIdeas);
  });
}

export async function upgradeResearchData(doc: ResearchDocument, actor = "migrate-v2"): Promise<{ ideas: number; runs: number; preserved: number }> {
  const portfolio = await loadPortfolio();
  const existing = new Map(portfolio.ideas.map((idea) => [idea.id, idea]));
  const now = new Date().toISOString();
  const weights = doc.weights ?? portfolio.settings.weights;
  assertWeights(weights);
  const criteriaOrder = (doc.criteria_order?.length ? doc.criteria_order : portfolio.settings.criteriaOrder) as CriterionKey[];
  const next: Idea[] = [];
  let preserved = 0;
  const expected = new Map<string, { status: Status; total: number; locked: boolean }>();
  doc.ideas.forEach((raw, index) => {
    const incoming = ideaFromDocument(raw, index, now);
    const prior = existing.get(incoming.id);
    const keepStatus = Boolean(prior && (prior.statusLocked || isManualStatus(prior.status) || prior.status === "avoid"));
    if (prior) {
      preserved += 1;
      incoming.userNotes = prior.userNotes;
      incoming.mvp = prior.mvp;
      incoming.distribution = prior.distribution;
      incoming.risks = prior.risks;
      incoming.scoreOverrides = prior.scoreOverrides;
      incoming.pipelineOrder = prior.pipelineOrder;
      incoming.position = prior.position;
      incoming.updatedAt = prior.updatedAt;
      incoming.updatedBy = prior.updatedBy;
      if (prior.liabilityNotes && !incoming.liabilityNotes) incoming.liabilityNotes = prior.liabilityNotes;
      if (prior.avoidFlags.length && incoming.avoidFlags.length === 0) incoming.avoidFlags = prior.avoidFlags;
      if (keepStatus) {
        incoming.status = prior.status;
        incoming.statusLocked = true;
      }
    } else {
      incoming.updatedBy = actor;
    }
    expected.set(incoming.id, { status: incoming.status, total: incoming.researchTotal, locked: keepStatus });
    next.push(incoming);
  });
  for (const prior of portfolio.ideas) {
    if (!next.some((idea) => idea.id === prior.id)) next.push(prior);
  }
  recompute(next, weights, criteriaOrder);
  const mismatches: string[] = [];
  for (const idea of next) {
    const original = expected.get(idea.id);
    if (!original) continue;
    if (!original.locked && idea.status !== original.status) mismatches.push(`${idea.id} status ${original.status} -> ${idea.status}`);
    if (Math.abs(idea.researchTotal - original.total) > 0.05) mismatches.push(`${idea.id} total ${original.total} -> ${idea.researchTotal}`);
  }
  if (mismatches.length) {
    throw new Error(`Rubric v2 upgrade does not match the research file:\n${mismatches.slice(0, 12).join("\n")}`);
  }
  const loadedRuns: Run[] = (doc.runs ?? []).map((run) => ({
    runNumber: run.run_number,
    date: run.date,
    author: run.author ?? "Unknown",
    sourcesSwept: run.sources_swept ?? [],
    ideasAdded: run.ideas_added ?? 0,
    ideasRescored: run.ideas_rescored ?? 0,
    notes: run.notes ?? "",
    focus: run.focus ?? "",
    rubricVersion: run.rubric_version ?? "",
  }));
  const db = await getDb();
  await db.transaction(async (tx) => {
    await persistSettings(tx, {
      schemaVersion: String(doc.schema_version ?? "2"),
      rubricVersion: doc.rubric_version ?? "2.0",
      criteriaOrder,
      weights,
      rubricHistory: asRubricHistory(doc.rubric_history),
      customerTypes: doc.customer_types ?? ["consumer", "business", "both"],
      categoryOverrides: overridesFromUnknown(doc.category_overrides),
      idAliases: aliasesFromUnknown(doc.id_aliases),
      painMethod: methodFromUnknown(doc.pain_method),
      portfolio: portfolioFromUnknown(doc.portfolio),
    });
    for (const run of loadedRuns) await persistRun(tx, run);
    for (const bundle of withAnalysis(bundlesFromDocument(doc))) await persistBundle(tx, bundle);
    await persistPainClusters(tx, clustersFromUnknown(doc.pain_clusters));
    await persistIdeas(tx, next);
  });
  return { ideas: next.length, runs: loadedRuns.length, preserved };
}

export function ideasPath(): string {
  return process.env.IDEAS_PATH ?? path.join(process.cwd(), "data", "ideas.json");
}

export function readResearchFile(file = ideasPath()): ResearchDocument {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8")) as ResearchDocument;
  } catch {
    // The serverless trace may not include the file on disk.
  }
  if (path.resolve(file) === path.resolve(ideasPath())) return bundledIdeas as unknown as ResearchDocument;
  throw new Error(`Could not read ${file}`);
}

export function totalsMatchFile(idea: Idea, weights: Weights): boolean {
  return Math.abs(totalOf(idea.scores, weights) - idea.researchTotal) < 0.001;
}

export { eq };
