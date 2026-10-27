import type { Scores, Weights } from "./criteria";
import { isCustomerType, isManualStatus, type CustomerType, type Idea, type RubricVersionRecord } from "./types";

export const RUBRIC_V2_CHANGE =
  "added aibuild (AI-buildability for a non-engineer, weight 10); pain 11->10, breadth 8->7, wtp 10->9, recurring 8->7, build 8->6, maint 8->7, distro 11->10, compete 6->5, defend 4->3; legal stays 16";

export type RescoreRow = {
  id: string;
  customer_type?: string;
  aibuild_reason?: string;
  scores?: Scores;
  total_v2?: number;
  status_v2?: string;
};

export type RescoreFile = {
  rubric_from: string;
  rubric_to: string;
  run: number;
  date: string;
  weights_v1: Weights;
  weights_v2: Weights;
  criteria_order_v2: string[];
  ideas: RescoreRow[];
};

export function rubricHistoryFromRescore(file: RescoreFile): RubricVersionRecord[] {
  return [
    { version: file.rubric_from, sinceRun: 1, date: "", weights: file.weights_v1, change: "" },
    {
      version: file.rubric_to,
      sinceRun: file.run,
      date: file.date,
      weights: file.weights_v2,
      change: RUBRIC_V2_CHANGE,
    },
  ];
}

/** Tag existing history with rubric v1 and append the v2 backfill entry. A later import of the same run and version replaces that entry. */
export function applyRubricRescore(ideas: Idea[], file: RescoreFile): Idea[] {
  const byId = new Map(file.ideas.map((row) => [row.id, row]));
  return ideas.map((idea) => {
    const row = byId.get(idea.id);
    if (!row || !row.scores) return idea;
    const next = structuredClone(idea);
    next.scoreHistory = next.scoreHistory.map((item) => ({
      ...item,
      rubricVersion: item.rubricVersion || file.rubric_from,
    }));
    if (row.customer_type && isCustomerType(row.customer_type)) next.customerType = row.customer_type as CustomerType;
    if (typeof row.aibuild_reason === "string") next.aibuildReason = row.aibuild_reason;
    next.scores = { ...row.scores };
    const total = typeof row.total_v2 === "number" ? row.total_v2 : next.total;
    next.scoreHistory = [
      ...next.scoreHistory.filter((item) => item.run !== file.run || item.rubricVersion !== file.rubric_to),
      {
        run: file.run,
        date: file.date,
        rubricVersion: file.rubric_to,
        total,
        scores: { ...row.scores },
        note: "rubric v2 backfill (aibuild added, weights rebalanced)",
      },
    ];
    next.lastScoredRun = file.run;
    next.researchTotal = total;
    next.total = total;
    const locked = next.statusLocked || isManualStatus(next.status) || next.status === "avoid";
    if (!locked && row.status_v2 && (row.status_v2 === "candidate" || row.status_v2 === "shortlist" || row.status_v2 === "feeder" || row.status_v2 === "killed")) {
      next.status = row.status_v2;
    }
    return next;
  });
}
