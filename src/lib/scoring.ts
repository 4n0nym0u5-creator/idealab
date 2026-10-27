import { CRITERIA_KEYS, type CriterionKey, type Scores, type Weights } from "./criteria";
import { isManualStatus, type Idea, type Status } from "./types";

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function totalOf(scores: Scores, weights: Weights): number {
  let sum = 0;
  for (const key of CRITERIA_KEYS) {
    sum += (scores[key] / 5) * weights[key];
  }
  return round1(sum);
}

export function contribution(score: number, weight: number): number {
  return round1((score / 5) * weight);
}

export function workingScores(idea: Pick<Idea, "scores" | "scoreOverrides">): Scores {
  const scores = { ...idea.scores };
  for (const key of CRITERIA_KEYS) {
    const override = idea.scoreOverrides[key];
    if (override !== undefined) scores[key] = override;
  }
  return scores;
}

export function compareRank(a: Pick<Idea, "id" | "total" | "scores" | "scoreOverrides">, b: Pick<Idea, "id" | "total" | "scores" | "scoreOverrides">): number {
  if (a.total !== b.total) return b.total - a.total;
  const left = workingScores(a);
  const right = workingScores(b);
  if (left.distro !== right.distro) return right.distro - left.distro;
  if (left.legal !== right.legal) return right.legal - left.legal;
  if (left.build !== right.build) return right.build - left.build;
  return a.id.localeCompare(b.id);
}

export function recompute(ideas: Idea[], weights: Weights): void {
  for (const idea of ideas) {
    const working = workingScores(idea);
    idea.researchTotal = totalOf(idea.scores, weights);
    idea.total = totalOf(working, weights);
    if (idea.statusLocked || isManualStatus(idea.status)) continue;
    const killFlags = idea.killFlags.map((flag) => flag.trim()).filter(Boolean);
    const avoidFlags = idea.avoidFlags.map((flag) => flag.trim()).filter(Boolean);
    if (working.legal <= 1 || killFlags.length > 0) idea.status = "killed";
    else if (idea.status === "avoid" || avoidFlags.length > 0) idea.status = "avoid";
    else if (working.wtp <= 2 && working.recurring <= 1) idea.status = "feeder";
    else idea.status = "candidate";
  }

  // Match merge.py: top 10 candidates by total only. JS sort is stable, so ties
  // keep the current portfolio order (file order, then newly imported ideas).
  const pool = ideas
    .filter((idea) => idea.status === "candidate")
    .sort((a, b) => b.total - a.total);
  for (const idea of pool.slice(0, 10)) idea.status = "shortlist";
}

export function assignPresentation(ideas: Idea[]): Idea[] {
  const ranked = [...ideas].sort(compareRank);
  let liveRank = 0;
  for (const idea of ranked) {
    if (idea.status === "killed" || idea.status === "avoid") idea.rank = null;
    else idea.rank = ++liveRank;
  }
  return ranked;
}

export function assertWeights(weights: Weights): void {
  let sum = 0;
  for (const key of CRITERIA_KEYS) {
    const weight = weights[key];
    if (!Number.isInteger(weight) || weight < 0 || weight > 100) {
      throw new Error(`${key} weight must be a whole number from 0 to 100.`);
    }
    sum += weight;
  }
  if (sum !== 100) throw new Error(`Weights sum to ${sum}. They need to sum to 100.`);
}

export function normalizeWeights(weights: Weights): Weights {
  const sum = CRITERIA_KEYS.reduce((total, key) => total + (Number.isFinite(weights[key]) ? weights[key] : 0), 0);
  const next = {} as Weights;
  if (sum <= 0) {
    for (const key of CRITERIA_KEYS) next[key] = 0;
    next.legal = 100;
    return next;
  }
  let acc = 0;
  for (const key of CRITERIA_KEYS) {
    next[key] = Math.max(0, Math.round((weights[key] / sum) * 100));
    acc += next[key];
  }
  let diff = 100 - acc;
  const order = [...CRITERIA_KEYS].sort((a, b) => next[b] - next[a] || a.localeCompare(b));
  let index = 0;
  while (diff !== 0 && index < 500) {
    const key = order[index % order.length];
    if (diff > 0) {
      next[key] += 1;
      diff -= 1;
    } else if (next[key] > 0) {
      next[key] -= 1;
      diff += 1;
    }
    index += 1;
  }
  return next;
}

export function bumpVersion(version: string): string {
  const match = version.match(/^(\d+)\.(\d+)$/);
  if (!match) return `${version}.1`;
  return `${match[1]}.${Number(match[2]) + 1}`;
}

export function sanitizeOverrides(input: Partial<Record<CriterionKey, number>>): Partial<Scores> {
  const overrides: Partial<Scores> = {};
  for (const key of CRITERIA_KEYS) {
    const value = input[key];
    if (value === undefined) continue;
    if (!Number.isInteger(value) || value < 0 || value > 5) {
      throw new Error(`${key} override must be a whole number from 0 to 5.`);
    }
    overrides[key] = value;
  }
  return overrides;
}

export function statusRank(status: Status): number {
  const order: Status[] = [
    "launched",
    "building",
    "researching",
    "backlog",
    "shortlist",
    "candidate",
    "feeder",
    "parked",
    "rejected",
    "avoid",
    "killed",
  ];
  const index = order.indexOf(status);
  return index === -1 ? order.length : index;
}
