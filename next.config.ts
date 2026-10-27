import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["postgres", "@electric-sql/pglite"],
  outputFileTracingIncludes: {
    "/*": ["./data/ideas.json", "./drizzle/0001_init.sql", "./drizzle/0002_rubric_v2.sql"],
  },
  outputFileTracingExcludes: {
    "/*": ["./node_modules/@electric-sql/pglite/**"],
  },
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
