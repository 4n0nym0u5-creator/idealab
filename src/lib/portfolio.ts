import type { Idea, PortfolioFit, PortfolioMonetisation, PortfolioStrategy, RoadmapSlot } from "./types";

const ALLOWED = [
  "portfolio_fit",
  "tier",
  "family",
  "privacy_class",
  "privacy_notes",
  "third_party_personal_data_api",
  "client_side_path",
  "portfolio_monetisation",
  "roadmap_slot",
] as const;

export function emptyPortfolioFields(): Pick<
  Idea,
  | "portfolioFit"
  | "tier"
  | "family"
  | "privacyClass"
  | "privacyNotes"
  | "thirdPartyPersonalDataApi"
  | "clientSidePath"
  | "portfolioMonetisation"
  | "roadmapSlot"
> {
  return {
    portfolioFit: null,
    tier: "",
    family: "",
    privacyClass: "",
    privacyNotes: "",
    thirdPartyPersonalDataApi: "",
    clientSidePath: null,
    portfolioMonetisation: null,
    roadmapSlot: null,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function portfolioFitFromUnknown(value: unknown): PortfolioFit | null {
  const record = asRecord(value);
  if (!record) return null;
  const score = asNumber(record.score);
  const rank = asNumber(record.rank);
  const viability = asNumber(record.viability);
  const opportunity = asNumber(record.opportunity);
  const prePrivacy = asNumber(record.pre_privacy);
  const subscores = asRecord(record.subscores);
  if (score == null || rank == null || viability == null || opportunity == null || prePrivacy == null || !subscores) return null;
  const parsed: Record<string, number> = {};
  for (const [key, item] of Object.entries(subscores)) {
    const number = asNumber(item);
    if (number != null) parsed[key] = number;
  }
  return { score, rank, viability, opportunity, prePrivacy, subscores: parsed };
}

export function monetisationFromUnknown(value: unknown): PortfolioMonetisation | null {
  const record = asRecord(value);
  if (!record || typeof record.model !== "string") return null;
  return { model: record.model, reasoning: typeof record.reasoning === "string" ? record.reasoning : "" };
}

export function roadmapSlotFromUnknown(value: unknown): number | string | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) return value;
  return null;
}

export function applyPortfolioFields(idea: Idea, fields: Record<string, unknown>): string[] {
  const unknown = Object.keys(fields).filter((key) => !ALLOWED.includes(key as (typeof ALLOWED)[number]));
  if (unknown.length) return unknown;
  if ("portfolio_fit" in fields) idea.portfolioFit = portfolioFitFromUnknown(fields.portfolio_fit);
  if (typeof fields.tier === "string") idea.tier = fields.tier;
  if (typeof fields.family === "string") idea.family = fields.family;
  if (typeof fields.privacy_class === "string") idea.privacyClass = fields.privacy_class;
  if (typeof fields.privacy_notes === "string") idea.privacyNotes = fields.privacy_notes;
  if (typeof fields.third_party_personal_data_api === "string") idea.thirdPartyPersonalDataApi = fields.third_party_personal_data_api;
  if ("client_side_path" in fields) idea.clientSidePath = typeof fields.client_side_path === "boolean" ? fields.client_side_path : null;
  if ("portfolio_monetisation" in fields) idea.portfolioMonetisation = monetisationFromUnknown(fields.portfolio_monetisation);
  if ("roadmap_slot" in fields) idea.roadmapSlot = roadmapSlotFromUnknown(fields.roadmap_slot);
  return [];
}

export function portfolioFieldsFromIdea(raw: Record<string, unknown>): ReturnType<typeof emptyPortfolioFields> {
  const fields = emptyPortfolioFields();
  applyPortfolioFields({ ...fields } as Idea, raw);
  return {
    portfolioFit: portfolioFitFromUnknown(raw.portfolio_fit),
    tier: typeof raw.tier === "string" ? raw.tier : "",
    family: typeof raw.family === "string" ? raw.family : "",
    privacyClass: typeof raw.privacy_class === "string" ? raw.privacy_class : "",
    privacyNotes: typeof raw.privacy_notes === "string" ? raw.privacy_notes : "",
    thirdPartyPersonalDataApi: typeof raw.third_party_personal_data_api === "string" ? raw.third_party_personal_data_api : "",
    clientSidePath: typeof raw.client_side_path === "boolean" ? raw.client_side_path : null,
    portfolioMonetisation: monetisationFromUnknown(raw.portfolio_monetisation),
    roadmapSlot: roadmapSlotFromUnknown(raw.roadmap_slot),
  };
}

function stringMap(value: unknown): Record<string, string> {
  const record = asRecord(value);
  if (!record) return {};
  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(record)) if (typeof item === "string") result[key] = item;
  return result;
}

function numberMap(value: unknown): Record<string, number> {
  const record = asRecord(value);
  if (!record) return {};
  const result: Record<string, number> = {};
  for (const [key, item] of Object.entries(record)) {
    const number = asNumber(item);
    if (number != null) result[key] = number;
  }
  return result;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function numberList(value: unknown): number[] {
  return Array.isArray(value) ? value.filter((item): item is number => typeof item === "number") : [];
}

function familyMap(value: unknown): Record<string, string[]> {
  const record = asRecord(value);
  if (!record) return {};
  const result: Record<string, string[]> = {};
  for (const [key, item] of Object.entries(record)) result[key] = stringList(item);
  return result;
}

function scenarioMap(value: unknown): Record<string, number[]> {
  const record = asRecord(value);
  if (!record) return {};
  const result: Record<string, number[]> = {};
  for (const [key, item] of Object.entries(record)) result[key] = numberList(item);
  return result;
}

export function portfolioFromUnknown(value: unknown): PortfolioStrategy | null {
  const record = asRecord(value);
  if (!record) return null;
  const lens = asRecord(record.lens);
  const roadmap = Array.isArray(record.roadmap) ? record.roadmap : [];
  if (!lens || !roadmap.length) return null;
  const slots: RoadmapSlot[] = roadmap.map((item) => {
    const row = asRecord(item) ?? {};
    return {
      slot: asNumber(row.slot) ?? 0,
      id: typeof row.id === "string" ? row.id : "",
      name: typeof row.name === "string" ? row.name : "",
      start: typeof row.start === "string" ? row.start : "",
      weeks: typeof row.weeks === "string" ? row.weeks : "",
      launch: typeof row.launch === "string" ? row.launch : "",
      price: typeof row.price === "string" ? row.price : "",
      model: typeof row.model === "string" ? row.model : "",
      why: typeof row.why === "string" ? row.why : "",
      metrics: typeof row.metrics === "string" ? row.metrics : "",
      kill: typeof row.kill === "string" ? row.kill : "",
    };
  });
  const scenarios = asRecord(record.scenarios) ?? {};
  const apps = Array.isArray(scenarios.apps) ? scenarios.apps : [];
  return {
    lens: {
      version: typeof lens.version === "string" ? lens.version : "",
      run: asNumber(lens.run) ?? 0,
      formula: typeof lens.formula === "string" ? lens.formula : "",
      viability: typeof lens.viability === "string" ? lens.viability : "",
      opportunity: typeof lens.opportunity === "string" ? lens.opportunity : "",
      privacyFactor: numberMap(lens.privacy_factor),
      audienceFactor: numberMap(lens.audience_factor),
      privacyClasses: stringMap(lens.privacy_classes),
      tiers: typeof lens.tiers === "string" ? lens.tiers : "",
      rubricTotalsUnchanged: lens.rubric_totals_unchanged === true,
    },
    roadmap: slots,
    scenarios: {
      months: stringList(scenarios.months),
      monthlyNetAud: scenarioMap(scenarios.monthly_net_aud),
      cumulativeNetAud: scenarioMap(scenarios.cumulative_net_aud),
      assumptions: stringList(scenarios.assumptions),
      apps: apps.map((item) => {
        const row = asRecord(item) ?? {};
        return {
          name: typeof row.name === "string" ? row.name : "",
          launch: typeof row.launch === "string" ? row.launch : "",
          priceAud: asNumber(row.price_aud) ?? 0,
          kind: typeof row.kind === "string" ? row.kind : "",
          visitors: numberList(row.visitors),
          conversion: numberList(row.conversion),
        };
      }),
    },
    families: familyMap(record.families),
    disqualified: (Array.isArray(record.disqualified) ? record.disqualified : []).map((item) => {
      const row = asRecord(item) ?? {};
      return {
        id: typeof row.id === "string" ? row.id : "",
        title: typeof row.title === "string" ? row.title : "",
        reason: typeof row.reason === "string" ? row.reason : "",
      };
    }),
    redesign: (Array.isArray(record.redesign) ? record.redesign : []).map((item) => {
      const row = asRecord(item) ?? {};
      return {
        id: typeof row.id === "string" ? row.id : "",
        title: typeof row.title === "string" ? row.title : "",
        path: typeof row.path === "string" ? row.path : "",
      };
    }),
    run: asNumber(record.run) ?? asNumber(lens.run) ?? 0,
  };
}

export function canonicalPortfolio(strategy: PortfolioStrategy | null): Record<string, unknown> | null {
  if (!strategy) return null;
  return {
    lens: {
      version: strategy.lens.version,
      run: strategy.lens.run,
      formula: strategy.lens.formula,
      viability: strategy.lens.viability,
      opportunity: strategy.lens.opportunity,
      privacy_factor: strategy.lens.privacyFactor,
      audience_factor: strategy.lens.audienceFactor,
      privacy_classes: strategy.lens.privacyClasses,
      tiers: strategy.lens.tiers,
      rubric_totals_unchanged: strategy.lens.rubricTotalsUnchanged,
    },
    roadmap: strategy.roadmap.map((slot) => ({
      slot: slot.slot,
      id: slot.id,
      name: slot.name,
      start: slot.start,
      weeks: slot.weeks,
      launch: slot.launch,
      price: slot.price,
      model: slot.model,
      why: slot.why,
      metrics: slot.metrics,
      kill: slot.kill,
    })),
    scenarios: {
      months: strategy.scenarios.months,
      monthly_net_aud: strategy.scenarios.monthlyNetAud,
      cumulative_net_aud: strategy.scenarios.cumulativeNetAud,
      assumptions: strategy.scenarios.assumptions,
      apps: strategy.scenarios.apps.map((app) => ({
        name: app.name,
        launch: app.launch,
        price_aud: app.priceAud,
        kind: app.kind,
        visitors: app.visitors,
        conversion: app.conversion,
      })),
    },
    families: strategy.families,
    disqualified: strategy.disqualified,
    redesign: strategy.redesign,
    run: strategy.run,
  };
}

export function privacyLabel(value: string): string {
  if (value === "A") return "A · local-only";
  if (value === "B") return "B · user-owned or E2E sync";
  if (value === "C-disq") return "needs server-held personal data";
  if (value === "C-redesign") return "C · redesign required";
  return value || "Not classed";
}

export function privacyClassName(value: string): string {
  if (value === "A") return "badge badge-privacy-a";
  if (value === "B") return "badge badge-privacy-b";
  if (value === "C-disq") return "badge badge-disq";
  if (value === "C-redesign") return "badge badge-privacy-c";
  return "badge";
}

export function monetisationLabel(model: string): string {
  if (model === "one-time") return "One-time";
  if (model === "subscription") return "Subscription";
  if (model === "both") return "One-time + subscription";
  return model;
}
