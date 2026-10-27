import fs from "fs";
import path from "path";
import { asc, eq } from "drizzle-orm";
import { CRITERIA_KEYS, DEFAULT_WEIGHTS, type CriterionKey, type Scores, type Weights } from "./criteria";
import { backupDir, getDb, getSqlite, isDatabaseReady } from "./db";
import { applyRun, detectImport, parseJsonText, type ImportReport } from "./merge";
import { ideas, rubricChangelog, runs, settings } from "./schema";
import { assertWeights, assignPresentation, bumpVersion, recompute, sanitizeOverrides, totalOf } from "./scoring";
import { themeForCategory } from "./themes";
import {
  isManualStatus,
  isStatus,
  type Evidence,
  type Idea,
  type Portfolio,
  type RubricChange,
  type Run,
  type ScoreSnapshot,
  type Settings,
  type Status,
} from "./types";

type IdeaRow = typeof ideas.$inferSelect;
type RunRow = typeof runs.$inferSelect;

export class DatabaseNotReadyError extends Error {
  constructor() {
    super("IdeaLab database is not initialised. Run npm run db:setup, then refresh.");
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
  const record = (value ?? {}) as Partial<Scores>;
  const scores = {} as Scores;
  for (const key of CRITERIA_KEYS) {
    const score = record[key];
    scores[key] = typeof score === "number" ? score : 0;
  }
  return scores;
}

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
    total: row.total,
    researchTotal: row.researchTotal,
    status: isStatus(row.status) ? row.status : "candidate",
    statusLocked: row.statusLocked === 1,
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
    scoreHistory: parseJson<ScoreSnapshot[]>(row.scoreHistory, []),
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
  };
}

export function requirePortfolio(): Portfolio {
  if (!isDatabaseReady()) throw new DatabaseNotReadyError();
  return loadPortfolio();
}

export function loadPortfolio(): Portfolio {
  const db = getDb();
  const settingsRow = db.select().from(settings).get();
  if (!settingsRow) throw new DatabaseNotReadyError();
  const loadedIdeas = db.select().from(ideas).orderBy(asc(ideas.position), asc(ideas.id)).all().map(rowToIdea);
  const loadedRuns = db.select().from(runs).orderBy(asc(runs.runNumber)).all().map(rowToRun);
  const changes = db.select().from(rubricChangelog).orderBy(asc(rubricChangelog.id)).all().map((row) => ({
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
    },
    runs: loadedRuns,
    ideas: assignPresentation(loadedIdeas),
    changes,
  };
}

function persistIdeas(nextIdeas: Idea[]): void {
  const db = getDb();
  const sqlite = getSqlite();
  const write = sqlite.transaction(() => {
    for (const idea of nextIdeas) {
      const row = ideaToRow(idea);
      db.insert(ideas)
        .values(row)
        .onConflictDoUpdate({ target: ideas.id, set: row })
        .run();
    }
  });
  write();
}

function persistRun(run: Run): void {
  getDb()
    .insert(runs)
    .values({
      runNumber: run.runNumber,
      date: run.date,
      author: run.author,
      sourcesSwept: JSON.stringify(run.sourcesSwept),
      ideasAdded: run.ideasAdded,
      ideasRescored: run.ideasRescored,
      notes: run.notes,
      focus: run.focus,
    })
    .onConflictDoUpdate({
      target: runs.runNumber,
      set: {
        date: run.date,
        author: run.author,
        sourcesSwept: JSON.stringify(run.sourcesSwept),
        ideasAdded: run.ideasAdded,
        ideasRescored: run.ideasRescored,
        notes: run.notes,
        focus: run.focus,
      },
    })
    .run();
}

function persistSettings(next: Settings): void {
  getDb()
    .insert(settings)
    .values({
      id: 1,
      schemaVersion: next.schemaVersion,
      rubricVersion: next.rubricVersion,
      criteriaOrder: JSON.stringify(next.criteriaOrder),
      weights: JSON.stringify(next.weights),
    })
    .onConflictDoUpdate({
      target: settings.id,
      set: {
        schemaVersion: next.schemaVersion,
        rubricVersion: next.rubricVersion,
        criteriaOrder: JSON.stringify(next.criteriaOrder),
        weights: JSON.stringify(next.weights),
      },
    })
    .run();
}

type RawHistory = { run: number; date: string; total: number; scores: Scores };
type RawRun = {
  run_number: number;
  date: string;
  author?: string;
  sources_swept?: string[];
  ideas_added?: number;
  ideas_rescored?: number;
  notes?: string;
  focus?: string;
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
  schema_version?: string;
  rubric_version?: string;
  weights?: Weights;
  criteria_order?: CriterionKey[];
  runs?: RawRun[];
  ideas: RawIdea[];
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
      total: item.total,
      scores: asScores(item.scores),
    })),
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
    score_history: idea.scoreHistory,
  };
}

export function exportDocument(portfolio: Portfolio = loadPortfolio()) {
  return {
    schema_version: portfolio.settings.schemaVersion,
    rubric_version: portfolio.settings.rubricVersion,
    weights: portfolio.settings.weights,
    criteria_order: portfolio.settings.criteriaOrder,
    runs: portfolio.runs.map((run) => ({
      run_number: run.runNumber,
      date: run.date,
      author: run.author,
      sources_swept: run.sourcesSwept,
      ideas_added: run.ideasAdded,
      ideas_rescored: run.ideasRescored,
      notes: run.notes,
      ...(run.focus ? { focus: run.focus } : {}),
    })),
    ideas: [...portfolio.ideas]
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
      rubric_changelog: portfolio.changes,
    },
  };
}

export function replacePortfolio(doc: ResearchDocument, actor = "seed"): { ideas: number; runs: number } {
  const now = new Date().toISOString();
  const weights = doc.weights ?? DEFAULT_WEIGHTS;
  assertWeights(weights);
  const criteriaOrder = (doc.criteria_order?.length ? doc.criteria_order : [...CRITERIA_KEYS]) as CriterionKey[];
  const loaded = doc.ideas.map((idea, index) => ideaFromDocument(idea, index, now));
  const originals = new Map(loaded.map((idea) => [idea.id, { status: idea.status, total: idea.total }]));
  recompute(loaded, weights);
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
  }));

  const sqlite = getSqlite();
  const db = getDb();
  const write = sqlite.transaction(() => {
    sqlite.exec("DELETE FROM ideas; DELETE FROM runs; DELETE FROM settings; DELETE FROM rubric_changelog;");
    persistSettings({
      schemaVersion: doc.schema_version ?? "1.0",
      rubricVersion: doc.rubric_version ?? "1.0",
      criteriaOrder,
      weights,
    });
    for (const run of loadedRuns) persistRun(run);
    for (const idea of loaded) {
      db.insert(ideas).values(ideaToRow(idea)).run();
    }
    for (const change of doc._idealab?.rubric_changelog ?? []) {
      db.insert(rubricChangelog)
        .values({
          at: change.at,
          fromVersion: change.fromVersion,
          toVersion: change.toVersion,
          weights: JSON.stringify(change.weights),
          note: change.note,
        })
        .run();
    }
  });
  write();
  return { ideas: loaded.length, runs: loadedRuns.length };
}

export function previewImport(text: string): ImportReport {
  const portfolio = loadPortfolio();
  const value = parseJsonText(text);
  if (detectImport(value) !== "run") {
    throw new Error("Full-database restore is not previewed as a run. Import a { run, ideas } file.");
  }
  return applyRun(portfolio.ideas, value, portfolio.settings.weights, portfolio.runs).report;
}

export function commitImport(text: string, actor: string): { report: ImportReport; backupPath: string } {
  const portfolio = loadPortfolio();
  const value = parseJsonText(text);
  const shape = detectImport(value);
  if (shape !== "run") {
    const doc = value as ResearchDocument;
    const backupPath = writeBackup("before-database-import");
    replacePortfolio(doc, actor);
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
  const result = applyRun(portfolio.ideas, value, portfolio.settings.weights, portfolio.runs);
  const backupPath = writeBackup(`ideas_before_run_${result.run.runNumber}`);
  const sqlite = getSqlite();
  const write = sqlite.transaction(() => {
    persistIdeas(result.ideas);
    persistRun(result.run);
  });
  write();
  return { report: result.report, backupPath };
}

export function writeBackup(label: string): string {
  const dir = backupDir();
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${label}.json`);
  fs.writeFileSync(file, JSON.stringify(exportDocument(), null, 2));
  return file;
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

export function updateTracking(id: string, patch: TrackingPatch, actor: string): Idea {
  const portfolio = loadPortfolio();
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
  recompute(nextIdeas, portfolio.settings.weights);
  persistIdeas(nextIdeas);
  return nextIdeas.find((item) => item.id === id)!;
}

export function saveWeights(weights: Weights, note: string, actor: string): { version: string } {
  assertWeights(weights);
  const portfolio = loadPortfolio();
  const fromVersion = portfolio.settings.rubricVersion;
  const toVersion = bumpVersion(fromVersion);
  const nextIdeas = portfolio.ideas.map((idea) => structuredClone(idea));
  recompute(nextIdeas, weights);
  const now = new Date().toISOString();
  for (const idea of nextIdeas) {
    idea.updatedAt = now;
    idea.updatedBy = actor;
  }
  const sqlite = getSqlite();
  const db = getDb();
  const write = sqlite.transaction(() => {
    persistSettings({ ...portfolio.settings, rubricVersion: toVersion, weights });
    persistIdeas(nextIdeas);
    db.insert(rubricChangelog)
      .values({
        at: now,
        fromVersion,
        toVersion,
        weights: JSON.stringify(weights),
        note: note.trim() || "Weights updated in IdeaLab.",
      })
      .run();
  });
  write();
  return { version: toVersion };
}

export function ideasPath(): string {
  return process.env.IDEAS_PATH ?? path.join(process.cwd(), "data", "ideas.json");
}

export function readResearchFile(file = ideasPath()): ResearchDocument {
  return JSON.parse(fs.readFileSync(file, "utf8")) as ResearchDocument;
}

export function totalsMatchFile(idea: Idea, weights: Weights): boolean {
  return Math.abs(totalOf(idea.scores, weights) - idea.researchTotal) < 0.001;
}

export { eq };
