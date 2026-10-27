import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["postgres", "@electric-sql/pglite"],
  outputFileTracingIncludes: {
    "/*": ["./data/ideas.json", "./data/run5-bundle.json", "./drizzle/0001_init.sql", "./drizzle/0002_rubric_v2.sql", "./drizzle/0003_schema_v3.sql", "./drizzle/0004_schema_v4.sql"],
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
