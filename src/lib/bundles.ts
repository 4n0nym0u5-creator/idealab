import type { Scores, Weights } from "./criteria";
import { totalOf } from "./scoring";
import type { BundleFit, BundlePrice, BundleRecord, CategoryOverride, Evidence, PriceBreakeven, RevenueMonth, RevenueScenario, ScoreSnapshot } from "./types";

export function emptyBundlePrice(): BundlePrice {
  return { recommended: "", laterTier: "", rejected: "" };
}

export function bundleFitFromUnknown(value: unknown): BundleFit | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.tier !== "string") return null;
  return {
    tier: row.tier,
    module: typeof row.module === "string" ? row.module : "",
    note: typeof row.note === "string" ? row.note : "",
  };
}

export function overridesFromUnknown(value: unknown): Record<string, CategoryOverride> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const overrides: Record<string, CategoryOverride> = {};
  for (const [id, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    if (typeof row.category !== "string") continue;
    const fit = bundleFitFromUnknown(row.bundle_fit);
    overrides[id] = {
      category: row.category,
      ...(typeof row.run === "number" ? { run: row.run } : {}),
      note: typeof row.note === "string" ? row.note : "",
      ...(fit ? { bundleFit: fit } : {}),
      ...(typeof row.merged_into === "string" && row.merged_into ? { mergedInto: row.merged_into } : {}),
    };
  }
  return overrides;
}

function asScores(value: unknown): Scores {
  const scores: Scores = {};
  if (!value || typeof value !== "object") return scores;
  for (const [key, score] of Object.entries(value as Record<string, unknown>)) {
    if (typeof score === "number") scores[key] = score;
  }
  return scores;
}

function priceFromUnknown(value: unknown): BundlePrice {
  if (!value || typeof value !== "object") return emptyBundlePrice();
  const row = value as Record<string, unknown>;
  return {
    recommended: typeof row.recommended === "string" ? row.recommended : "",
    laterTier: typeof row.later_tier === "string" ? row.later_tier : "",
    rejected: typeof row.rejected === "string" ? row.rejected : "",
  };
}

function monthsFromUnknown(value: unknown): RevenueMonth[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    return [{
      month: Number(row.month ?? 0),
      visitors: Number(row.visitors ?? 0),
      newFree: Number(row.new_free ?? 0),
      newPaid: Number(row.new_paid ?? 0),
      renewals: Number(row.renewals ?? 0),
      activePaid: Number(row.active_paid ?? 0),
      netRevenueCum: Number(row.net_revenue_cum ?? 0),
    }];
  });
}

function scenarioFromUnknown(value: unknown): RevenueScenario | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const assumptions: Record<string, number> = {};
  if (row.assumptions && typeof row.assumptions === "object") {
    for (const [key, amount] of Object.entries(row.assumptions as Record<string, unknown>)) {
      if (typeof amount === "number") assumptions[key] = amount;
    }
  }
  return {
    assumptions,
    yearNetRevenueAud: Array.isArray(row.year_net_revenue_aud) ? row.year_net_revenue_aud.filter((item): item is number => typeof item === "number") : [],
    activePaidM12: Number(row.active_paid_m12 ?? 0),
    activePaidM24: Number(row.active_paid_m24 ?? 0),
    activePaidM36: Number(row.active_paid_m36 ?? 0),
    hostingCostPerYearAud: Number(row.hosting_cost_per_year_aud ?? 0),
    year3ProfitBeforeTaxAndTime: Number(row.year3_profit_before_tax_and_time ?? 0),
    ltvNetAud: Number(row.ltv_net_aud ?? 0),
    monthly: monthsFromUnknown(row.monthly),
  };
}

export function scenariosFromUnknown(value: unknown): Record<string, RevenueScenario> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const scenarios: Record<string, RevenueScenario> = {};
  for (const [name, raw] of Object.entries(value as Record<string, unknown>)) {
    const scenario = scenarioFromUnknown(raw);
    if (scenario) scenarios[name] = scenario;
  }
  return scenarios;
}

export function breakevenFromUnknown(value: unknown): PriceBreakeven {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const table: PriceBreakeven = {};
  for (const [price, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    table[price] = {
      netPerSub: Number(row.net_per_sub ?? 0),
      subsFor10k: Number(row.subs_for_A$10k_net ?? 0),
      subsFor50k: Number(row.subs_for_A$50k_net ?? 0),
    };
  }
  return table;
}

function historyFromUnknown(value: unknown): ScoreSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (typeof row.run !== "number" || typeof row.total !== "number") return [];
    return [{
      run: row.run,
      date: typeof row.date === "string" ? row.date : "",
      rubricVersion: typeof row.rubric_version === "string" ? row.rubric_version : "",
      total: row.total,
      scores: asScores(row.scores),
      ...(typeof row.note === "string" ? { note: row.note } : {}),
    }];
  });
}

export function readStoredBundle(value: unknown): BundleRecord | null {
  if (value && typeof value === "object" && "launchModules" in value && typeof (value as BundleRecord).id === "string") {
    const bundle = value as BundleRecord;
    return {
      ...bundle,
      price: bundle.price ?? emptyBundlePrice(),
      launchModules: bundle.launchModules ?? [],
      members: bundle.members ?? [],
      feeders: bundle.feeders ?? [],
      scores: bundle.scores ?? {},
      scoreReasons: bundle.scoreReasons ?? {},
      scoreHistory: bundle.scoreHistory ?? [],
      revenueScenarios: bundle.revenueScenarios ?? {},
      priceBreakeven: bundle.priceBreakeven ?? {},
      assumptionLabels: bundle.assumptionLabels ?? {},
      evidence: bundle.evidence ?? [],
      netPerAud: bundle.netPerAud ?? null,
    };
  }
  return bundleFromUnknown(value);
}

export function bundleFromUnknown(value: unknown, fallback?: BundleRecord): BundleRecord | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string") return null;
  const scores = asScores(row.scores);
  const reasons: Record<string, string> = {};
  if (row.score_reasons && typeof row.score_reasons === "object") {
    for (const [key, text] of Object.entries(row.score_reasons as Record<string, unknown>)) {
      if (typeof text === "string") reasons[key] = text;
    }
  }
  return {
    id: row.id,
    title: typeof row.title === "string" ? row.title : fallback?.title ?? row.id,
    category: typeof row.category === "string" ? row.category : fallback?.category ?? "",
    customerType: typeof row.customer_type === "string" ? row.customer_type : fallback?.customerType ?? "",
    price: row.price ? priceFromUnknown(row.price) : fallback?.price ?? emptyBundlePrice(),
    launchModules: Array.isArray(row.launch_modules) ? row.launch_modules.filter((item): item is string => typeof item === "string") : fallback?.launchModules ?? [],
    members: Array.isArray(row.members) ? row.members.filter((item): item is string => typeof item === "string") : fallback?.members ?? [],
    feeders: Array.isArray(row.feeders) ? row.feeders.filter((item): item is string => typeof item === "string") : fallback?.feeders ?? [],
    scores: Object.keys(scores).length ? scores : fallback?.scores ?? {},
    scoreReasons: Object.keys(reasons).length ? reasons : fallback?.scoreReasons ?? {},
    notes: typeof row.notes === "string" ? row.notes : fallback?.notes ?? "",
    total: typeof row.total === "number" ? row.total : fallback?.total ?? 0,
    firstSeenRun: typeof row.first_seen_run === "number" ? row.first_seen_run : fallback?.firstSeenRun ?? 0,
    lastScoredRun: typeof row.last_scored_run === "number" ? row.last_scored_run : fallback?.lastScoredRun ?? 0,
    scoreHistory: Array.isArray(row.score_history) ? historyFromUnknown(row.score_history) : fallback?.scoreHistory ?? [],
    revenueScenarios: fallback?.revenueScenarios ?? {},
    priceBreakeven: fallback?.priceBreakeven ?? {},
    assumptionLabels: fallback?.assumptionLabels ?? {},
    netPerAud: fallback?.netPerAud ?? null,
    evidence: fallback?.evidence ?? [],
  };
}

export function applyBundleAnalysis(bundle: BundleRecord, analysis: unknown): BundleRecord {
  if (!analysis || typeof analysis !== "object") return bundle;
  const file = analysis as Record<string, unknown>;
  const nested = file.bundle && typeof file.bundle === "object" ? file.bundle as Record<string, unknown> : null;
  if (nested && typeof nested.id === "string" && nested.id !== bundle.id) return bundle;
  const evidence = Array.isArray(file.evidence)
    ? file.evidence.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        if (typeof row.url !== "string") return [];
        return [{ url: row.url, note: typeof row.note === "string" ? row.note : "", ...(typeof row.run === "number" ? { run: row.run } : {}) }];
      })
    : bundle.evidence;
  const labels: Record<string, string> = {};
  if (file.assumption_labels && typeof file.assumption_labels === "object") {
    for (const [key, text] of Object.entries(file.assumption_labels as Record<string, unknown>)) {
      if (typeof text === "string") labels[key] = text;
    }
  }
  return {
    ...bundle,
    revenueScenarios: Object.keys(scenariosFromUnknown(file.revenue_scenarios)).length ? scenariosFromUnknown(file.revenue_scenarios) : bundle.revenueScenarios,
    priceBreakeven: Object.keys(breakevenFromUnknown(file.price_breakeven)).length ? breakevenFromUnknown(file.price_breakeven) : bundle.priceBreakeven,
    assumptionLabels: Object.keys(labels).length ? labels : bundle.assumptionLabels,
    netPerAud: typeof file.net_per_A$29 === "number" ? file.net_per_A$29 : bundle.netPerAud,
    evidence: evidence.length ? evidence as Array<Evidence & { run?: number }> : bundle.evidence,
  };
}

export function mergeBundles(current: BundleRecord[], incoming: unknown, meta: { runNumber: number; date: string; weights: Weights; order: readonly string[]; rubricVersion: string }): BundleRecord[] {
  if (!Array.isArray(incoming) || !incoming.length) return current;
  const byId = new Map(current.map((bundle) => [bundle.id, bundle]));
  for (const raw of incoming) {
    const parsed = bundleFromUnknown(raw);
    if (!parsed || !Object.keys(parsed.scores).length) continue;
    const previous = byId.get(parsed.id);
    const total = totalOf(parsed.scores, meta.weights, meta.order);
    const snapshot: ScoreSnapshot = {
      run: meta.runNumber,
      date: meta.date,
      rubricVersion: meta.rubricVersion,
      total,
      scores: { ...parsed.scores },
    };
    const scoreHistory = [...(previous?.scoreHistory ?? []).filter((item) => item.run !== meta.runNumber), snapshot];
    byId.set(parsed.id, {
      ...(previous ?? parsed),
      ...parsed,
      total,
      firstSeenRun: previous?.firstSeenRun || meta.runNumber,
      lastScoredRun: meta.runNumber,
      scoreHistory,
      revenueScenarios: Object.keys(parsed.revenueScenarios).length ? parsed.revenueScenarios : previous?.revenueScenarios ?? {},
      priceBreakeven: Object.keys(parsed.priceBreakeven).length ? parsed.priceBreakeven : previous?.priceBreakeven ?? {},
      assumptionLabels: Object.keys(parsed.assumptionLabels).length ? parsed.assumptionLabels : previous?.assumptionLabels ?? {},
      netPerAud: parsed.netPerAud ?? previous?.netPerAud ?? null,
      evidence: parsed.evidence.length ? parsed.evidence : previous?.evidence ?? [],
    });
  }
  return [...byId.values()];
}

export function canonicalBundle(bundle: BundleRecord) {
  return {
    id: bundle.id,
    title: bundle.title,
    category: bundle.category,
    customer_type: bundle.customerType,
    price: {
      recommended: bundle.price.recommended,
      ...(bundle.price.laterTier ? { later_tier: bundle.price.laterTier } : {}),
      ...(bundle.price.rejected ? { rejected: bundle.price.rejected } : {}),
    },
    launch_modules: bundle.launchModules,
    members: bundle.members,
    feeders: bundle.feeders,
    scores: bundle.scores,
    score_reasons: bundle.scoreReasons,
    notes: bundle.notes,
    total: bundle.total,
    first_seen_run: bundle.firstSeenRun,
    last_scored_run: bundle.lastScoredRun,
    score_history: bundle.scoreHistory.map((item) => ({
      run: item.run,
      date: item.date,
      ...(item.rubricVersion ? { rubric_version: item.rubricVersion } : {}),
      total: item.total,
      scores: item.scores,
      ...(item.note ? { note: item.note } : {}),
    })),
  };
}

export function canonicalOverrides(overrides: Record<string, CategoryOverride>) {
  const document: Record<string, unknown> = {};
  for (const [id, override] of Object.entries(overrides)) {
    document[id] = {
      category: override.category,
      ...(override.run !== undefined ? { run: override.run } : {}),
      note: override.note,
      ...(override.bundleFit ? { bundle_fit: override.bundleFit } : {}),
      ...(override.mergedInto ? { merged_into: override.mergedInto } : {}),
    };
  }
  return document;
}

export function tierLabel(tier: string): string {
  if (tier === "exclude") return "Excluded";
  if (tier === "v2") return "v2";
  if (!tier) return "Unset";
  return tier.slice(0, 1).toUpperCase() + tier.slice(1);
}
