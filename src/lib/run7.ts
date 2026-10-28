import research from "../../data/run7_lifeadmin.json";
import type { Idea, Run } from "./types";

export const RUN7 = research;

export type Run7Mark = { id: string; role: string; note: string };

export const RUN7_MARKS: Run7Mark[] = research.marks;

const HANDBOOK_MATCHES = [
  "house-sitter-handover-guide",
  "ice-emergency-info-sheet",
  "sec-account-recovery-planner",
  "pet-admin-records",
];

export function lineupLabel(role: string): string {
  if (role === "merged-into-renewal-radar") return "Merged into Renewal Radar";
  if (role === "merged-into-household-handbook") return "Household Handbook";
  if (role === "dropped-from-pass") return "Dropped from the Pass";
  if (role === "pass-v1.1") return "Pass v1.1";
  if (role === "considered-not-added") return "Considered, not added";
  return role;
}

export function run7Record(): Run {
  return {
    runNumber: research.run.run_number,
    date: research.run.date,
    author: research.run.author,
    sourcesSwept: [],
    ideasAdded: 0,
    ideasRescored: 0,
    notes: research.run.notes,
    focus: research.run.focus,
    rubricVersion: "",
  };
}

export function applyRun7Marks(ideas: Idea[]): { changed: number; added: string[] } {
  const byId = new Map(ideas.map((idea) => [idea.id, idea]));
  let changed = 0;
  for (const mark of RUN7_MARKS) {
    const idea = byId.get(mark.id);
    if (!idea) continue;
    if (idea.lineupRole === mark.role && idea.lineupNote === mark.note) continue;
    idea.lineupRole = mark.role;
    idea.lineupNote = mark.note;
    changed += 1;
  }
  const added: string[] = [];
  const handbookExists = ideas.some((idea) => idea.id === "household-handbook" || idea.title === "Household Handbook")
    || HANDBOOK_MATCHES.every((id) => byId.has(id));
  const movingExists = byId.has("moving-house-checklist-au") || byId.has("moving-mode");
  if (!handbookExists) added.push("household-handbook");
  if (!movingExists) added.push("moving-mode");
  return { changed, added };
}
