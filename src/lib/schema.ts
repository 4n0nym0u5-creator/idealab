import { doublePrecision, index, integer, pgTable, text } from "drizzle-orm/pg-core";

export const settings = pgTable("settings", {
  id: integer("id").primaryKey(),
  schemaVersion: text("schema_version").notNull(),
  rubricVersion: text("rubric_version").notNull(),
  criteriaOrder: text("criteria_order").notNull(),
  weights: text("weights").notNull(),
});

export const runs = pgTable("runs", {
  runNumber: integer("run_number").primaryKey(),
  date: text("date").notNull(),
  author: text("author").notNull(),
  sourcesSwept: text("sources_swept").notNull(),
  ideasAdded: integer("ideas_added").notNull(),
  ideasRescored: integer("ideas_rescored").notNull(),
  notes: text("notes").notNull().default(""),
  focus: text("focus").notNull().default(""),
});

export const ideas = pgTable("ideas", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  platform: text("platform").notNull(),
  problem: text("problem").notNull(),
  targetUsers: text("target_users").notNull(),
  monetisation: text("monetisation").notNull(),
  priceHypothesis: text("price_hypothesis").notNull(),
  scores: text("scores").notNull(),
  total: doublePrecision("total").notNull(),
  researchTotal: doublePrecision("research_total").notNull(),
  status: text("status").notNull(),
  statusLocked: integer("status_locked").notNull().default(0),
  killFlags: text("kill_flags").notNull(),
  avoidFlags: text("avoid_flags").notNull().default("[]"),
  evidence: text("evidence").notNull(),
  competitors: text("competitors").notNull(),
  notes: text("notes").notNull().default(""),
  liabilityNotes: text("liability_notes").notNull().default(""),
  userNotes: text("user_notes").notNull().default(""),
  mvp: text("mvp").notNull().default(""),
  distribution: text("distribution").notNull().default(""),
  risks: text("risks").notNull().default(""),
  scoreOverrides: text("score_overrides").notNull().default("{}"),
  firstSeenRun: integer("first_seen_run").notNull(),
  lastScoredRun: integer("last_scored_run").notNull(),
  scoreHistory: text("score_history").notNull(),
  pipelineOrder: integer("pipeline_order").notNull().default(0),
  position: integer("position").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
  updatedBy: text("updated_by").notNull().default("local"),
}, (table) => [
  index("ideas_status").on(table.status),
  index("ideas_category").on(table.category),
  index("ideas_total").on(table.total),
]);

export const rubricChangelog = pgTable("rubric_changelog", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  at: text("at").notNull(),
  fromVersion: text("from_version").notNull(),
  toVersion: text("to_version").notNull(),
  weights: text("weights").notNull(),
  note: text("note").notNull(),
});

export const backups = pgTable("backups", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  label: text("label").notNull(),
  createdAt: text("created_at").notNull(),
  document: text("document").notNull(),
});

export const migrations = pgTable("_migrations", {
  id: text("id").primaryKey(),
  appliedAt: text("applied_at").notNull(),
});
