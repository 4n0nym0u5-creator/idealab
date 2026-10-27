export const DEFAULT_ORDER = [
  "legal",
  "pain",
  "breadth",
  "wtp",
  "recurring",
  "build",
  "maint",
  "distro",
  "compete",
  "defend",
  "synergy",
  "platform",
  "aibuild",
] as const;

/** Active weighted criteria for a fresh v2 database. Optional criteria stay out of this list until a run promotes them. */
export const CRITERIA_KEYS: readonly string[] = DEFAULT_ORDER;

export type CriterionKey = string;
export type Scores = Record<string, number>;
export type Weights = Record<string, number>;

export type Criterion = {
  key: string;
  label: string;
  short: string;
  question: string;
  inverted: boolean;
  optional: boolean;
  defaultWeight: number;
  levels: readonly [string, string, string, string, string, string];
};

export const CRITERIA: readonly Criterion[] = [
  {
    key: "legal",
    label: "Legal safety",
    short: "Legal",
    question: "Regulatory, legal and liability safety",
    inverted: true,
    optional: false,
    defaultWeight: 16,
    levels: [
      "Licensed activity or likely illegal (medical device, financial product advice, handling client money, gambling, children's data as the core, DRM bypass).",
      "Gives advice in a regulated domain (health, finance, legal, food safety, employment awards), or depends on scraping or ToS-grey automation.",
      "Output people act on in a regulated area (pay calculations, recording calls, compliance claims), or heavy Gmail/Drive data. Needs legal review.",
      "Touches a regulated area as record-keeping only, holds third parties' personal data, or involves minors' data indirectly. Needs disclaimers and a yearly rule check.",
      "Light personal data or file operations with undo, or a third-party API used within its terms. A privacy policy, terms and an ACL-compliant refund policy are enough.",
      "No regulated domain. No personal data stored server-side. Can't cause money, safety or data loss. No third-party terms or IP exposure.",
    ],
  },
  {
    key: "pain",
    label: "Pain",
    short: "Pain",
    question: "Pain intensity × frequency",
    inverted: false,
    optional: false,
    defaultWeight: 10,
    levels: [
      "No evidence anyone cares.",
      "Novelty.",
      "Nice to have. Mild annoyance.",
      "A regular annoyance with clumsy workarounds.",
      "Weekly friction people complain about in public, or an episodic but acute pain (weddings, moving house).",
      "Hurts weekly or more, costs money or real time, and people already pay for workarounds.",
    ],
  },
  {
    key: "breadth",
    label: "Breadth",
    short: "Breadth",
    question: "Breadth of audience",
    inverted: false,
    optional: false,
    defaultWeight: 7,
    levels: [
      "Only the founder.",
      "Thousands.",
      "Tens of thousands (one trade in one country).",
      "Hundreds of thousands (Shopify micro-merchants, indie devs, club secretaries).",
      "Millions (all remote workers, all Xero users, all event hosts).",
      "Tens of millions worldwide (all Mac users, all office workers, all homeowners).",
    ],
  },
  {
    key: "wtp",
    label: "Willingness to pay",
    short: "WTP",
    question: "Willingness to pay and monetisation fit",
    inverted: false,
    optional: false,
    defaultWeight: 9,
    levels: [
      "No monetisation path.",
      "Ads or affiliate only.",
      "Mostly free alternatives. Payment would be tips or micro-prices.",
      "Consumers will pay US$5–15 once. Comparable paid apps exist.",
      "Professionals or prosumers who routinely pay US$15–40 once or US$5–15/month. Paid competitors have reviews.",
      "Business buyers with a direct ROI, and A$15+/month is easy to justify.",
    ],
  },
  {
    key: "recurring",
    label: "Recurring revenue",
    short: "Recurring",
    question: "Recurring-revenue potential",
    inverted: false,
    optional: false,
    defaultWeight: 7,
    levels: [
      "One-off use, no repeat.",
      "One-time only. Paid major versions are possible.",
      "Occasional repeat purchases (per event, per project).",
      "Annual or seasonal repeat (yearly tax-time log, yearly paid upgrades).",
      "Subscription is justified by ongoing sync, data or service. Consumers may churn.",
      "Ongoing value for a business. Subscription is natural and churn is low.",
    ],
  },
  {
    key: "build",
    label: "Build effort",
    short: "Build",
    question: "Build effort for a solo AI-assisted builder",
    inverted: true,
    optional: false,
    defaultWeight: 6,
    levels: [
      "Needs a team.",
      "400+ hours, or needs specialist skills.",
      "200–400 hours. Several integrations, mobile and web, or tricky OS APIs.",
      "100–200 hours. Needs a backend, OAuth, or a third-party API and app review.",
      "40–100 hours (Shoji / SpaceJump class). One platform, licence server only.",
      "MVP in 40 hours or less. One platform, no backend.",
    ],
  },
  {
    key: "maint",
    label: "Maintenance",
    short: "Maint",
    question: "Ongoing maintenance and support burden",
    inverted: true,
    optional: false,
    defaultWeight: 7,
    levels: [
      "Needs 24/7 on-call.",
      "Heavy support: onboarding businesses, migrations, phone calls.",
      "Scraping or DOM-dependent UI, or an uptime-critical service. Frequent breakage.",
      "Depends on third-party APIs that change, or support questions are about the customer's data.",
      "Small backend (licences) plus yearly OS updates. About 1–2 hours a week.",
      "Static or local app. Breaks only on major OS releases. Under 1 hour a week of support.",
    ],
  },
  {
    key: "distro",
    label: "Distribution",
    short: "Distro",
    question: "Distribution and discoverability",
    inverted: false,
    optional: false,
    defaultWeight: 10,
    levels: [
      "No known channel.",
      "Needs paid ads or virality.",
      "Needs outbound sales or an existing audience.",
      "Reachable via communities, Product Hunt or Reddit. No strong search intent.",
      "Clear search terms or a marketplace category with moderate competition, and communities that allow self-promotion.",
      "High-intent queries you can own, and/or a thin marketplace niche, and the problem is asked in AI answer engines.",
    ],
  },
  {
    key: "compete",
    label: "Competition",
    short: "Compete",
    question: "Competition and saturation",
    inverted: true,
    optional: false,
    defaultWeight: 5,
    levels: [
      "Owned by the platform itself, or by free market leaders.",
      "Saturated, with strong free options.",
      "Established leaders plus many clones. Differentiation has to be sharp.",
      "A few paid competitors, with room for a simpler, cheaper or local-first angle.",
      "One or two weak or abandoned options, or incumbents ignore this sub-niche.",
      "No credible product. Only forum workarounds.",
    ],
  },
  {
    key: "defend",
    label: "Defensibility",
    short: "Defend",
    question: "Defensibility",
    inverted: false,
    optional: false,
    defaultWeight: 3,
    levels: [
      "The platform owner will ship it next release.",
      "Easily cloned in a weekend.",
      "Execution polish only.",
      "Brand, reviews and SEO rank you earned. Marketplace reviews compound.",
      "Accumulated user data or history, plus an SEO moat and reviews.",
      "Data network effects, official partner status, or switching costs from accumulated data.",
    ],
  },
  {
    key: "synergy",
    label: "Portfolio synergy",
    short: "Synergy",
    question: "Shared shell, audience or channel",
    inverted: false,
    optional: false,
    defaultWeight: 5,
    levels: [
      "Conflicts with the brand (an ad-heavy site next to privacy-first apps).",
      "Unrelated to the current shells and audiences.",
      "New stack and new audience, but the lessons transfer.",
      "Partial reuse of a shell or an audience.",
      "Reuses one shell, or sells to an audience you already have.",
      "Reuses one shell almost entirely, and cross-sells to an audience you already have.",
    ],
  },
  {
    key: "platform",
    label: "Platform risk",
    short: "Platform",
    question: "Platform dependency risk",
    inverted: true,
    optional: false,
    defaultWeight: 5,
    levels: [
      "Against the platform's terms of service.",
      "Depends on DOM scraping of one site, or restricted Google scopes that need a yearly CASA assessment.",
      "Depends on a vendor API that can be revoked or repriced, or the vendor is likely to clone you.",
      "Depends on one marketplace's review and billing, or uses private OS APIs.",
      "Store distribution with clear rules (Mac notarisation, App Store), or a stable API.",
      "Runs on the open web or OS with stable public APIs. No gatekeeper review.",
    ],
  },
  {
    key: "aibuild",
    label: "AI-buildability",
    short: "AI build",
    question: "Can a non-engineer prompt this to a correct, shippable state and keep it working?",
    inverted: false,
    optional: false,
    defaultWeight: 10,
    levels: [
      "Kernel, driver or HAL work, or output that can be wrong, cannot be tested by the owner, and causes harm when wrong (custom crypto, a password vault, child monitoring).",
      "OS system extensions and private APIs (Quick Look, Network Extension, TCC/launchd, menu-bar hacks), audio or video capture, cryptography, heavy on-device ML, or hardware-specific bugs.",
      "Native Swift (Xcode, signing, notarisation, sandbox, StoreKit), extensions that scrape a third-party DOM, security-critical code with invisible false negatives, background location, licence servers, or complex billing.",
      "Review-gated integrations: sensitive Google OAuth, Shopify/Xero/Workspace apps, stable Chrome extensions, real-time sync, Expo with store review, phone camera flows, LLM answers people rely on, or licensed data feeds.",
      "A web app with one moderately tricky piece: drag-and-drop canvas, PDF layout, a documented parser, accounts with row-level security, scheduled email, or one simple API. Needs fixtures or a checklist.",
      "A standard web app: CRUD, forms, checklists, calculators or a simple visual UI. Client-side or one table. Magic-link or no auth. Payment is a checkout link. Mistakes are visible.",
    ],
  },
  {
    key: "complaint_frequency",
    label: "Complaint frequency",
    short: "Complaints",
    question: "How often public forums mention this pain, from pain-point mining",
    inverted: false,
    optional: true,
    defaultWeight: 0,
    levels: [
      "No public mentions attached.",
      "A handful of mentions, or a single thread.",
      "Occasional complaints across one community.",
      "A repeated cluster with a countable set of threads.",
      "Many independent complaints, with quotes and sources.",
      "A dominant, recurring complaint cluster with high mention counts across several sources.",
    ],
  },
];

export const DEFAULT_WEIGHTS: Weights = CRITERIA.reduce((weights, criterion) => {
  if (criterion.optional && criterion.defaultWeight === 0) return weights;
  weights[criterion.key] = criterion.defaultWeight;
  return weights;
}, {} as Weights);

export const CRITERIA_BY_KEY: Record<string, Criterion> = CRITERIA.reduce(
  (map, criterion) => {
    map[criterion.key] = criterion;
    return map;
  },
  {} as Record<string, Criterion>,
);

export function isOptionalCriterion(key: string): boolean {
  return CRITERIA_BY_KEY[key]?.optional === true;
}

export function synthesizeCriterion(key: string): Criterion {
  const label = key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  return {
    key,
    label,
    short: label,
    question: label,
    inverted: false,
    optional: true,
    defaultWeight: 0,
    levels: ["0", "1", "2", "3", "4", "5"],
  };
}

/** Display metadata for a criteria order. Unknown keys still render, so a future import can add one without a code change. */
export function criteriaInOrder(order: readonly string[]): Criterion[] {
  return order.map((key) => CRITERIA_BY_KEY[key] ?? synthesizeCriterion(key));
}

export const KILL_CRITERIA: readonly string[] = [
  "Legal score is 1 or 0.",
  "Gives personalised medical, dietary, financial, tax, legal or employment-award advice, or acts as a medical device (TGA SaMD).",
  "Holds or moves customer money (payments facilitation, wallets), or is crypto, gambling or lending.",
  "Core users are children under 16, or the product stores children's data.",
  "Core function needs scraping against terms of service, bypassing paywalls or DRM, or automating accounts in breach of terms (LinkedIn, Instagram).",
  "Safety-critical outputs: allergens, medication dosing, vehicle or electrical compliance certificates.",
  "Records people or communications without explicit consent (state surveillance-devices laws).",
  "Built mainly on someone else's IP or trademarks (fan maps, rulebook content) with no licence.",
  "Needs Gmail or Drive restricted scopes and can't fund the yearly CASA assessment (Google cites US$500–4,500).",
];

export const TIE_BREAKERS: readonly { key: CriterionKey; text: string }[] = [
  {
    key: "distro",
    text: "Higher distribution. This is the constraint for most indie apps: Roadie, a well-built US$9.99 Mac app, made US$52 all-time.",
  },
  { key: "legal", text: "Higher legal safety." },
  { key: "build", text: "Faster to build." },
];

export const FEEDER_RULE =
  "If willingness to pay is 2 or below and recurring revenue is 1 or below, the idea is a feeder: a free SEO or lead tool that supports paid products. It never sits on the shortlist by itself.";

export type Anchor = {
  name: string;
  note: string;
  scores: Partial<Scores>;
};

export const ANCHORS: readonly Anchor[] = [
  {
    name: "Shoji",
    note: "shojimac.com, scored as a product",
    scores: {
      legal: 5,
      pain: 3,
      breadth: 4,
      wtp: 3,
      recurring: 1,
      build: 3,
      maint: 3,
      distro: 3,
      compete: 1,
      defend: 2,
      synergy: 5,
      platform: 4,
    },
  },
  {
    name: "MacMD Viewer",
    note: "Partial anchor, used to keep distribution and pricing honest",
    scores: { distro: 5, wtp: 3, recurring: 1 },
  },
  {
    name: "TranscriptExporter",
    note: "Partial anchor for a SaaS missing-button integration",
    scores: { pain: 4, distro: 5, platform: 2, compete: 4 },
  },
];

export const SECURITY_LEGAL_ADDENDUM = {
  title: "Security-specific guidance for legal",
  versionNote: "Clarification added in Run 2. It still applies under rubric v2.0, and the legal weight stays at 16.",
  levels: [
    { score: "5", text: "Local, read-only, advisory. No credentials and no network scanning (a Mac login-items viewer, a checklist)." },
    { score: "4", text: "Passive checks of public data for domains or accounts the user adds (DNS, certificates, headers). Official read-only APIs with tokens kept on the device. HIBP Pwned Passwords via k-anonymity." },
    { score: "3", text: "Hosted monitors whose silent failure causes harm. Compliance-style outputs (Essential Eight, insurance prep, questionnaires). Scanning a user's own assets after an ownership check. Holding personal information (Privacy Act / NDB if covered)." },
    { score: "2", text: "Credential or identity-document handling. Acting as someone's legal agent. Anything close to legal advice, including whether an NDB notification or a ransomware report is required. Simulated phishing sends." },
    { score: "0–1 / kill", text: "Credential custody (password vaults), scanning third-party systems without permission (Criminal Code Part 10.7), offensive or dual-use tooling, OSINT people lookup, stalkerware or monitoring other people, building a breach search engine (HIBP terms)." },
  ],
  rules: [
    "Never claim to make anyone secure or compliant, and never give a safe verdict.",
    "Alert on your own failures (heartbeats).",
    "Verify ownership before any active check.",
    "Keep secrets local.",
    "Put soft risks in the notes, not in kill flags. Any kill flag auto-sets status to killed.",
    "Use avoid flags, or set status to avoid, when an idea should stay out of the shortlist without being a hard kill.",
  ],
};

export const PORTFOLIO_SHELLS = [
  "Native Mac utility shell: Swift menu-bar app, licensing, Sparkle updates, landing-page template.",
  "Local-first web tool shell: client-side or WASM, Stripe or Dodo checkout.",
  "SaaS-integration shell: OAuth and a marketplace listing.",
  "Audiences already in reach: indie makers and small businesses.",
];

export function isCriterionKey(value: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(value);
}

export function emptyScores(keys: readonly string[] = DEFAULT_ORDER): Scores {
  return keys.reduce((scores, key) => {
    scores[key] = 0;
    return scores;
  }, {} as Scores);
}
