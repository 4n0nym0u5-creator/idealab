import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        elev: "var(--elev)",
        sunken: "var(--sunken)",
        line: "var(--line)",
        ink: "var(--ink)",
        soft: "var(--soft)",
        faint: "var(--faint)",
        accent: "var(--accent)",
        accentink: "var(--accent-ink)",
        clay: "var(--clay)",
        good: "var(--good)",
        mid: "var(--mid)",
        bad: "var(--bad)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "var(--shadow)",
      },
      borderRadius: {
        card: "18px",
      },
    },
  },
  plugins: [],
};

export default config;
