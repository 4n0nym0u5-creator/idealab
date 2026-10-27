import { z } from "zod";
import { CRITERIA_KEYS, isCriterionKey, type CriterionKey, type Scores, type Weights } from "./criteria";
import { recompute, totalOf } from "./scoring";
import { isManualStatus, isStatus, type Evidence, type Idea, type Run, type ScoreSnapshot, type Status } from "./types";

export class ImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportError";
  }
}

const scoreValue = z.number().int().min(0).max(5);
const scoresSchema = z.object({
  legal: scoreValue,
  pain: scoreValue,
  breadth: scoreValue,
  wtp: scoreValue,
  recurring: scoreValue,
  build: scoreValue,
  maint: scoreValue,
  distro: scoreValue,
  compete: scoreValue,
  defend: scoreValue,
  synergy: scoreValue,
  platform: scoreValue,
});

const evidenceSchema = z.object({
  url: z.string().min(1),
  note: z.string(),
});

const incomingIdeaSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "id must be kebab-case"),
    title: z.string().optional(),
    category: z.string().optional(),
    platform: z.string().optional(),
    problem: z.string().optional(),
    target_users: z.string().optional(),
    monetisation: z.string().optional(),
    price_hypothesis: z.string().optional(),
    scores: scoresSchema,
    status: z.string().optional(),
    kill_flags: z.array(z.string()).optional(),
    avoid_flags: z.array(z.string()).optional(),
    evidence: z.array(evidenceSchema).optional(),
    competitors: z.array(z.string()).optional(),
    notes: z.string().optional(),
    liability_notes: z.string().optional(),
  })
  .passthrough();

const runMetaSchema = z
  .object({
    run_number: z.number().int().positive(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
    author: z.string().optional(),
    sources_swept: z.array(z.string()).optional(),
    notes: z.string().optional(),
    focus: z.string().optional(),
    ideas_added: z.number().optional(),
    ideas_rescored: z.number().optional(),
  })
  .passthrough();

const runFileSchema = z
  .object({
    run: runMetaSchema,
    ideas: z.array(incomingIdeaSchema).min(1, "A run needs at least one idea"),
  })
  .passthrough();

type IncomingIdea = z.infer<typeof incomingIdeaSchema>;

export type ScoreDiff = { key: CriterionKey; from: number; to: number };

export type IdeaChange = {
  id: string;
  title: string;
  partial: boolean;
  kind: "added" | "updated" | "duplicate";
  total: number;
  previousTotal: number | null;
  status: Status;
  previousStatus: Status | null;
  scoreDiffs: ScoreDiff[];
  notesChanged: boolean;
  evidenceAdded: string[];
  competitorsAdded: string[];
  killFlagsAdded: string[];
  avoidFlagsAdded: string[];
  fieldsUpdated: string[];
};

export type ImportReport = {
  mode: "run";
  runNumber: number;
  date: string;
  author: string;
  focus: string;
  notes: string;
  sources: string[];
  added: IdeaChange[];
  updated: IdeaChange[];
  duplicates: IdeaChange[];
  shortlistEntered: { id: string; title: string }[];
  shortlistLeft: { id: string; title: string }[];
  ideasAdded: number;
  ideasRescored: number;
  totalAfter: number;
};

const REQUIRED_NEW = [
  ["title", "title"],
  ["category", "category"],
  ["platform", "platform"],
  ["problem", "problem"],
  ["target_users", "target users"],
  ["monetisation", "monetisation"],
  ["price_hypothesis", "price hypothesis"],
] as const;

function formatZod(error: z.ZodError): string {
  return error.issues
    .slice(0, 8)
    .map((issue) => `${issue.path.join(".") || "file"}: ${issue.message}`)
    .join("; ");
}

export function parseRunFile(value: unknown): z.infer<typeof runFileSchema> {
  const parsed = runFileSchema.safeParse(value);
  if (!parsed.success) throw new ImportError(formatZod(parsed.error));
  const ids = parsed.data.ideas.map((idea) => idea.id);
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) throw new ImportError(`Duplicate id in the run file: ${id}`);
    seen.add(id);
  }
  return parsed.data;
}

export function detectImport(value: unknown): "run" | "database" {
  if (!value || typeof value !== "object") throw new ImportError("The JSON root must be an object.");
  const record = value as Record<string, unknown>;
  if (record.run && typeof record.run === "object" && Array.isArray(record.ideas)) return "run";
  if (Array.isArray(record.ideas)) return "database";
  throw new ImportError("Expected a run file { run, ideas } or a full IdeaLab export with an ideas array.");
}

function pySorted(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function unionEvidence(current: Evidence[], incoming: Evidence[]): { evidence: Evidence[]; added: string[] } {
  const map = new Map<string, Evidence>();
  for (const item of current) map.set(item.url, { ...item });
  const added: string[] = [];
  for (const item of incoming) {
    const previous = map.get(item.url);
    if (!previous) added.push(item.url);
    else if (previous.note !== item.note) added.push(item.url);
    map.set(item.url, { url: item.url, note: item.note });
  }
  return { evidence: [...map.values()], added };
}

function blankIdea(id: string, position: number, now: string): Idea {
  const scores = CRITERIA_KEYS.reduce((map, key) => {
    map[key] = 0;
    return map;
  }, {} as Scores);
  return {
    id,
    title: "",
    category: "",
    platform: "",
    problem: "",
    targetUsers: "",
    monetisation: "",
    priceHypothesis: "",
    scores,
    total: 0,
    researchTotal: 0,
    status: "candidate",
    statusLocked: false,
    killFlags: [],
    avoidFlags: [],
    evidence: [],
    competitors: [],
    notes: "",
    liabilityNotes: "",
    userNotes: "",
    mvp: "",
    distribution: "",
    risks: "",
    scoreOverrides: {},
    firstSeenRun: 0,
    lastScoredRun: 0,
    scoreHistory: [],
    pipelineOrder: 0,
    position,
    updatedAt: now,
    updatedBy: "import",
    themeId: "",
    themeName: "",
    rank: null,
  };
}

function isPartial(idea: IncomingIdea): boolean {
  return REQUIRED_NEW.some(([key]) => {
    const value = idea[key];
    return typeof value !== "string" || value.trim().length === 0;
  });
}

function applyIncoming(current: Idea, incoming: IncomingIdea, isNew: boolean): {
  partial: boolean;
  scoreDiffs: ScoreDiff[];
  notesChanged: boolean;
  evidenceAdded: string[];
  competitorsAdded: string[];
  killFlagsAdded: string[];
  avoidFlagsAdded: string[];
  fieldsUpdated: string[];
  material: boolean;
} {
  const previousScores = { ...current.scores };
  const fieldsUpdated: string[] = [];
  const partial = isPartial(incoming);

  const scalars: [keyof IncomingIdea, keyof Idea, string][] = [
    ["title", "title", "title"],
    ["category", "category", "category"],
    ["platform", "platform", "platform"],
    ["problem", "problem", "problem"],
    ["target_users", "targetUsers", "target users"],
    ["monetisation", "monetisation", "monetisation"],
    ["price_hypothesis", "priceHypothesis", "price hypothesis"],
    ["notes", "notes", "notes"],
    ["liability_notes", "liabilityNotes", "liability notes"],
  ];

  for (const [source, target, label] of scalars) {
    const value = incoming[source];
    if (typeof value !== "string") continue;
    if (current[target] !== value) fieldsUpdated.push(label);
    (current[target] as string) = value;
  }

  const scoreDiffs: ScoreDiff[] = [];
  for (const key of CRITERIA_KEYS) {
    const next = incoming.scores[key];
    if (previousScores[key] !== next) scoreDiffs.push({ key, from: previousScores[key] ?? 0, to: next });
  }
  current.scores = { ...incoming.scores };

  let evidenceAdded: string[] = [];
  if (incoming.evidence) {
    const merged = unionEvidence(current.evidence, incoming.evidence);
    current.evidence = merged.evidence;
    evidenceAdded = merged.added;
  }

  let competitorsAdded: string[] = [];
  if (incoming.competitors) {
    const before = new Set(current.competitors);
    current.competitors = isNew ? [...incoming.competitors] : pySorted([...current.competitors, ...incoming.competitors]);
    competitorsAdded = current.competitors.filter((item) => !before.has(item));
  } else if (isNew) {
    current.competitors = [];
  }

  let killFlagsAdded: string[] = [];
  if (incoming.kill_flags) {
    const before = new Set(current.killFlags);
    current.killFlags = isNew ? [...incoming.kill_flags] : pySorted([...current.killFlags, ...incoming.kill_flags]);
    killFlagsAdded = current.killFlags.filter((item) => !before.has(item));
  } else if (isNew) {
    current.killFlags = [];
  }

  let avoidFlagsAdded: string[] = [];
  if (incoming.avoid_flags) {
    const before = new Set(current.avoidFlags);
    current.avoidFlags = isNew ? [...incoming.avoid_flags] : pySorted([...current.avoidFlags, ...incoming.avoid_flags]);
    avoidFlagsAdded = current.avoidFlags.filter((item) => !before.has(item));
  } else if (isNew) {
    current.avoidFlags = [];
  }

  const protectedStatus = !isNew && (current.statusLocked || isManualStatus(current.status) || current.status === "avoid");
  if (incoming.status && isStatus(incoming.status) && !protectedStatus && current.status !== incoming.status) {
    fieldsUpdated.push("status");
    current.status = incoming.status;
  }

  const material =
    isNew ||
    scoreDiffs.length > 0 ||
    fieldsUpdated.length > 0 ||
    evidenceAdded.length > 0 ||
    competitorsAdded.length > 0 ||
    killFlagsAdded.length > 0 ||
    avoidFlagsAdded.length > 0;

  return {
    partial,
    scoreDiffs: isNew ? [] : scoreDiffs,
    notesChanged: fieldsUpdated.includes("notes"),
    evidenceAdded,
    competitorsAdded,
    killFlagsAdded,
    avoidFlagsAdded,
    fieldsUpdated: isNew ? [] : fieldsUpdated,
    material,
  };
}

export function applyRun(inputIdeas: Idea[], file: unknown, weights: Weights, runs: Run[] = []): { ideas: Idea[]; run: Run; report: ImportReport } {
  const parsed = parseRunFile(file);
  const runNumber = parsed.run.run_number;
  if (runs.some((run) => run.runNumber === runNumber)) {
    throw new ImportError(`Run ${runNumber} is already in the database.`);
  }

  const ideas = inputIdeas.map((idea) => structuredClone(idea));
  const byId = new Map(ideas.map((idea) => [idea.id, idea]));
  const shortlistBefore = new Map(ideas.filter((idea) => idea.status === "shortlist").map((idea) => [idea.id, idea.title]));
  const now = new Date().toISOString();
  let nextPosition = ideas.reduce((max, idea) => Math.max(max, idea.position), -1) + 1;
  const changes: (ReturnType<typeof applyIncoming> & { id: string; previousTotal: number | null; previousStatus: Status | null; isNew: boolean })[] = [];

  for (const incoming of parsed.ideas) {
    const existing = byId.get(incoming.id);
    if (!existing && isPartial(incoming)) {
      const missing = REQUIRED_NEW.filter(([key]) => {
        const value = incoming[key];
        return typeof value !== "string" || value.trim().length === 0;
      }).map(([, label]) => label);
      throw new ImportError(
        `${incoming.id} is a partial update (missing ${missing.join(", ")}). Partial records only merge into an idea that already exists.`,
      );
    }

    const isNew = !existing;
    const current = existing ?? blankIdea(incoming.id, nextPosition++, now);
    const previousTotal = existing ? existing.researchTotal : null;
    const previousStatus = existing ? existing.status : null;
    if (isNew) {
      current.firstSeenRun = runNumber;
      current.scoreHistory = [];
      current.status = incoming.status && isStatus(incoming.status) ? incoming.status : "candidate";
      ideas.push(current);
      byId.set(current.id, current);
    }

    const change = applyIncoming(current, incoming, isNew);
    const snapshot: ScoreSnapshot = {
      run: runNumber,
      date: parsed.run.date,
      total: totalOf(current.scores, weights),
      scores: { ...current.scores },
    };
    current.scoreHistory = [...current.scoreHistory.filter((item) => item.run !== runNumber), snapshot];
    current.lastScoredRun = runNumber;
    current.researchTotal = snapshot.total;
    current.total = snapshot.total;
    current.updatedAt = now;
    current.updatedBy = "import";
    changes.push({ ...change, id: current.id, previousTotal, previousStatus, isNew });
  }

  recompute(ideas, weights);

  const added: IdeaChange[] = [];
  const updated: IdeaChange[] = [];
  const duplicates: IdeaChange[] = [];
  for (const change of changes) {
    const idea = byId.get(change.id)!;
    const row: IdeaChange = {
      id: idea.id,
      title: idea.title,
      partial: change.partial,
      kind: change.isNew ? "added" : change.material ? "updated" : "duplicate",
      total: idea.researchTotal,
      previousTotal: change.previousTotal,
      status: idea.status,
      previousStatus: change.previousStatus,
      scoreDiffs: change.isNew ? [] : change.scoreDiffs,
      notesChanged: change.notesChanged,
      evidenceAdded: change.evidenceAdded,
      competitorsAdded: change.competitorsAdded,
      killFlagsAdded: change.killFlagsAdded,
      avoidFlagsAdded: change.avoidFlagsAdded,
      fieldsUpdated: change.fieldsUpdated,
    };
    if (row.kind === "added") added.push(row);
    else if (row.kind === "updated") updated.push(row);
    else duplicates.push(row);
  }

  const shortlistAfter = new Map(ideas.filter((idea) => idea.status === "shortlist").map((idea) => [idea.id, idea.title]));
  const shortlistEntered = [...shortlistAfter.keys()]
    .filter((id) => !shortlistBefore.has(id))
    .map((id) => ({ id, title: shortlistAfter.get(id)! }));
  const shortlistLeft = [...shortlistBefore.keys()]
    .filter((id) => !shortlistAfter.has(id))
    .map((id) => ({ id, title: shortlistBefore.get(id)! }));

  const run: Run = {
    runNumber,
    date: parsed.run.date,
    author: parsed.run.author?.trim() || "Unknown",
    sourcesSwept: parsed.run.sources_swept ?? [],
    ideasAdded: added.length,
    ideasRescored: updated.length + duplicates.length,
    notes: parsed.run.notes ?? "",
    focus: parsed.run.focus ?? "",
  };

  return {
    ideas,
    run,
    report: {
      mode: "run",
      runNumber: run.runNumber,
      date: run.date,
      author: run.author,
      focus: run.focus,
      notes: run.notes,
      sources: run.sourcesSwept,
      added,
      updated,
      duplicates,
      shortlistEntered,
      shortlistLeft,
      ideasAdded: run.ideasAdded,
      ideasRescored: run.ideasRescored,
      totalAfter: ideas.length,
    },
  };
}

export function parseJsonText(text: string): unknown {
  try {
    return JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    throw new ImportError("That file is not valid JSON.");
  }
}

export function weightsFromUnknown(value: unknown): Weights | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const weights = {} as Weights;
  for (const key of CRITERIA_KEYS) {
    const weight = record[key];
    if (typeof weight !== "number") return null;
    weights[key] = weight;
  }
  for (const key of Object.keys(record)) {
    if (!isCriterionKey(key)) return null;
  }
  return weights;
}
