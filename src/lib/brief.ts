import { CRITERIA_BY_KEY, type Weights } from "./criteria";
import { liabilitySentences } from "./format";
import { contribution, workingScores } from "./scoring";
import { isSecurityCategory, securitySubtype } from "./themes";
import type { Idea } from "./types";

export type Brief = {
  reasoning: string;
  security: boolean;
  subtype: string;
  monetisation: { model: string; price: string; reading: string };
  mvp: { yours: string; implied: string };
  distribution: { yours: string; implied: string };
  liability: string[];
  risks: { yours: string; flags: string[]; avoidFlags: string[]; weak: { label: string; score: number; text: string }[] };
};

export function buildBrief(idea: Idea, weights: Weights): Brief {
  const scores = workingScores(idea);
  const reasoning = idea.notes.trim() || `${idea.title} is aimed at ${idea.targetUsers}. ${idea.problem}`;
  const wtp = CRITERIA_BY_KEY.wtp.levels[scores.wtp] ?? "";
  const recurring = CRITERIA_BY_KEY.recurring.levels[scores.recurring] ?? "";
  const build = CRITERIA_BY_KEY.build.levels[scores.build] ?? "";
  const distro = CRITERIA_BY_KEY.distro.levels[scores.distro] ?? "";
  const weak = Object.keys(scores)
    .filter((key) => scores[key] <= 2 && CRITERIA_BY_KEY[key] && !CRITERIA_BY_KEY[key].optional)
    .map((key) => ({
      label: CRITERIA_BY_KEY[key].label,
      score: scores[key],
      text: CRITERIA_BY_KEY[key].levels[scores[key]] ?? "",
    }))
    .sort((a, b) => a.score - b.score || contribution(b.score, weights.legal) - contribution(a.score, weights.legal));

  return {
    reasoning,
    security: isSecurityCategory(idea.category),
    subtype: isSecurityCategory(idea.category) ? securitySubtype(idea.category) : idea.category,
    monetisation: {
      model: idea.monetisation,
      price: idea.priceHypothesis,
      reading: `Willingness to pay ${scores.wtp}/5. ${wtp} Recurring revenue ${scores.recurring}/5. ${recurring}`,
    },
    mvp: {
      yours: idea.mvp.trim(),
      implied: `${idea.platform}. Build score ${scores.build}/5. ${build}`,
    },
    distribution: {
      yours: idea.distribution.trim(),
      implied: `Distribution score ${scores.distro}/5. ${distro}`,
    },
    liability: liabilitySentences(idea.notes, idea.liabilityNotes),
    risks: {
      yours: idea.risks.trim(),
      flags: idea.killFlags,
      avoidFlags: idea.avoidFlags,
      weak,
    },
  };
}
