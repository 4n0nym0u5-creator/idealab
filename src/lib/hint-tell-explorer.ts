import data from "../../data/run11b_walkthrough.json";

export const walkthrough = data;

export type Choice = {
  platform: string;
  record: string;
  speech: string;
  sync: string;
  box: string;
  remote: string;
  labels: string;
};

const WEIGHTS = data.rubric_weights;
const LABELS: Record<string, string> = {
  legal: "Legal",
  pain: "Pain",
  distro: "Distribution",
  aibuild: "AI-buildable",
  wtp: "Willingness to pay",
  breadth: "Breadth",
  recurring: "Recurring",
  maint: "Maintenance",
  build: "Build effort",
  compete: "Competition",
  synergy: "Synergy",
  platform: "Platform",
  defend: "Defensibility",
};

export const CRITERION_LABELS = LABELS;

export function evaluate(choice: Choice) {
  const scores: Record<string, number> = { ...data.base_scores[choice.platform === "web" ? "web" : "native"] };
  const shift = (key: string, delta: number) => {
    scores[key] = Math.max(1, Math.min(5, scores[key] + delta));
  };
  let privacy = choice.platform === "web" ? "A" : "B";
  const notes: string[] = [];
  if (choice.platform === "xplat") {
    shift("distro", 1);
    shift("maint", -1);
    shift("platform", -1);
    notes.push("Cross-platform still needs native Swift modules for SpeechAnalyzer and Foundation Models. Android on-device speech (ML Kit GenAI) is alpha and en-US only.");
  }
  if (choice.platform !== "web" && choice.record === "no") {
    shift("legal", 1);
    shift("pain", -1);
    shift("recurring", -1);
    shift("defend", -1);
    privacy = "A";
    notes.push("No recording makes the legal side simpler, but loses the archive, Who Said It and On This Day: the moat.");
  }
  if (choice.platform === "web" && choice.record === "yes") {
    shift("legal", -1);
    shift("aibuild", -1);
    privacy = "B";
    notes.push("Browser speech recognition sends audio to a server by default. On-device needs Chrome's experimental processLocally (en-US).");
  }
  if (choice.sync === "plusdrive") {
    shift("distro", 1);
    shift("maint", -1);
    shift("build", -1);
    notes.push("Google Drive appDataFolder keeps data in the user's own storage, but adds a second sync engine.");
  }
  if (choice.box === "box") {
    shift("wtp", 1);
    shift("distro", 1);
    shift("maint", -1);
    notes.push("The box adds a gift and retail channel, plus inventory, printing and shipping. Wait for the E2 pre-order signal.");
  }
  if (choice.remote === "now") {
    shift("recurring", 1);
    shift("build", -1);
    notes.push("SharePlay is Apple-only and adds a second UX mode, plus consent questions about recording over a call.");
  }
  if (choice.labels === "voice" && choice.record === "yes") {
    shift("legal", -1);
    shift("aibuild", -1);
    privacy = "C-redesign";
    notes.push("Voiceprints are biometric, sensitive information under the Privacy Act. That means explicit consent from every person, including children.");
  }
  if (choice.speech === "cloud" && choice.record === "yes") {
    privacy = "C-disq";
    notes.unshift("DISQUALIFIED: cloud speech puts family and children's voices on a third-party server, which breaks the 'no private data on servers' rule.");
  }
  if (choice.record === "no" && choice.speech === "cloud") notes.push("With recording off, the speech choice has no effect.");
  const total = Math.round(Object.keys(WEIGHTS).reduce((sum, key) => sum + (scores[key] / 5) * WEIGHTS[key as keyof typeof WEIGHTS], 0) * 10) / 10;
  const factor: Record<string, number> = { A: 1, B: 0.95, "C-redesign": 0.85, "C-disq": 0 };
  const viability = (0.35 * scores.aibuild + 0.25 * scores.legal + 0.2 * scores.build + 0.2 * scores.maint) / 5;
  const opportunity = (0.25 * scores.pain + 0.25 * scores.wtp + 0.25 * scores.distro + 0.1 * scores.breadth + 0.15 * 3) / 5;
  const fit = Math.round(1000 * Math.sqrt(viability * opportunity) * factor[privacy]) / 10;
  const cost = choice.platform === "web"
    ? "Under about A$1k solo (phases 0–2)"
    : choice.platform === "native"
      ? "A$15–40k for v1 (Run 11 estimate)"
      : "Not estimated. Expect at least native v1, since native modules are still needed";
  const effort = (choice.platform === "web" ? 1 : 3)
    + (choice.platform === "xplat" ? 1 : 0)
    + (choice.sync === "plusdrive" ? 1 : 0)
    + (choice.box === "box" ? 1 : 0)
    + (choice.remote === "now" ? 1 : 0)
    + (choice.labels === "voice" ? 1 : 0);
  const product = [
    choice.record === "yes" && privacy !== "C-disq" ? "Stories saved as audio and transcript" : "Game only: nothing is kept after the night",
    choice.record === "yes" && privacy !== "C-disq" ? "Who Said It + On This Day" : "No Who Said It or On This Day",
    choice.sync === "plusdrive" ? "iPhone + Android families" : "Apple families (others via export)",
    choice.box === "box" ? "Giftable box with a QR unlock" : "App-only, from the App Store",
    choice.remote === "now" ? "Interstate grandparents over FaceTime" : "One phone at the table",
  ];
  return { scores, privacy, total, fit, cost, effort, notes, product };
}

export const RECOMMENDED: Choice = walkthrough.explorer.recommended;
