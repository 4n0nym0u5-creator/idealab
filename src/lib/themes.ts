export type Theme = {
  id: string;
  name: string;
  blurb: string;
  categories: readonly string[];
};

export const SECURITY_THEME: Theme = {
  id: "security",
  name: "Cybersecurity",
  blurb: "Run 2 deep dive: public monitors, SMB baselines, Mac endpoint tools, privacy and developer security.",
  categories: [],
};

export const THEMES: readonly Theme[] = [
  SECURITY_THEME,
  {
    id: "mac",
    name: "Mac utilities",
    blurb: "Menu-bar and OS-gap tools that can share the Shoji shell.",
    categories: ["Mac OS-gap utility"],
  },
  {
    id: "local",
    name: "Local-first tools",
    blurb: "File and media utilities where nothing has to be uploaded.",
    categories: ["Local-first file/media"],
  },
  {
    id: "market",
    name: "Marketplace integrations",
    blurb: "Thin categories in SaaS, browser, Workspace and Shopify stores.",
    categories: ["SaaS missing-button integration", "Browser productivity", "Workspace add-on", "Shopify app"],
  },
  {
    id: "smb",
    name: "Small business & Australia",
    blurb: "Sole traders, clubs, classrooms and Australian record-keeping.",
    categories: ["SMB admin papercut", "Community admin", "AU-specific", "Education admin"],
  },
  {
    id: "life",
    name: "Events & household",
    blurb: "Episodic pains: weddings, moves, home, pets and travel.",
    categories: ["Events & occasions", "Home & household", "Pets", "Travel"],
  },
  {
    id: "indie",
    name: "Indie & creator tools",
    blurb: "Tools for makers, creators and the portfolio's own peers.",
    categories: ["Indie developer tools", "Creator tools", "iOS micro-utility", "Templates", "Productivity", "Hobbies & games"],
  },
  {
    id: "risk",
    name: "High-risk reference",
    blurb: "Kept so later runs do not research the same dead ends again.",
    categories: ["Health", "Hospitality", "Shopping", "Sales"],
  },
];

const OTHER: Theme = {
  id: "other",
  name: "Other",
  blurb: "A category that is not on a focus theme yet.",
  categories: [],
};

export function isSecurityCategory(category: string): boolean {
  return category.startsWith("Security:");
}

export function securitySubtype(category: string): string {
  return category.replace(/^Security:\s*/, "");
}

export function themeForCategory(category: string): Theme {
  if (isSecurityCategory(category)) return SECURITY_THEME;
  return THEMES.find((theme) => theme.categories.includes(category)) ?? { ...OTHER, categories: [category] };
}

export const RUN_ONE_FOCUS =
  "Baseline sweep across Mac OS gaps, local-first file tools, SaaS missing buttons, small-business admin and Australian record-keeping.";
