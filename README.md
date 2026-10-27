# IdeaLab

IdeaLab is a local research studio for a solo builder in Sydney. It keeps one growing database of small, low-legal-risk product ideas: scores, shortlist, feeders, hard kills, and ideas you have chosen to avoid. Research runs merge in by idea id, and every rescore keeps a score history.

The app is seeded with three research runs: Run 1 (the baseline sweep), Run 2 (a cybersecurity deep dive: 40 new ideas plus a partial rescore of `saas-bulk-exporter-pattern`), and Run 3 (a consumer sweep plus rubric v2.0). Rubric v2.0 adds AI-buildability for a non-engineer and records customer type on every idea.

Browsing is public. Imports, tracking edits, status changes and rubric saves need `ADMIN_PASSWORD`.

## Stack

- Next.js 15, React 19, TypeScript
- Tailwind CSS
- Postgres via Drizzle ORM and `postgres` (postgres.js). Neon’s pooled `DATABASE_URL` works, with `prepare: false` so the PgBouncer pooler accepts the queries.
- Embedded Postgres (`@electric-sql/pglite`) when no database URL is set, so local dev and `npm test` need no server
- Recharts for the score radar and the distribution chart

`src/lib/auth.ts` still exposes `getActor()`. Write actions also call `assertCanWrite()` in `src/lib/session.ts`, which checks an httpOnly cookie set from `ADMIN_PASSWORD`.

## Setup

Node.js 22 or newer.

```bash
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

With no `DATABASE_URL`, `db:setup` creates an embedded Postgres in `data/pglite` and, if that database is empty, loads `data/ideas.json` (100 ideas, both runs). It does not wipe a database that already has ideas. `npm run db:reset` replaces it from the file. Export first if you have notes you want to keep.

To point the same scripts at Neon, export `DATABASE_URL` first. `db:setup` migrates and seeds only when the `ideas` table is empty.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run db:migrate` | Create tables |
| `npm run db:seed` / `db:setup` | Migrate, then seed `data/ideas.json` only if the database is empty |
| `npm run db:reset` | Replace the database from `data/ideas.json` |
| `npm test` | Import Run 2 into a fresh Run 1 database and compare it with the merged file |
| `npm run build` / `npm start` | Migrate and seed Postgres when `DATABASE_URL` is set, then build and serve |
| `npm run typecheck` | `tsc --noEmit` |

## What you can do

- **Dashboard.** Portfolio counts, the current top idea, score distribution, live versus killed, the cybersecurity theme from Run 2, focus themes, and the run log.
- **Ideas.** Search, filter by status (including avoid and killed), category, theme, run and criterion, and switch between a table and cards.
- **Idea brief.** Score radar, points by criterion, the rubric sentence for each score, reasoning, monetisation, an MVP and distribution reading, sources, competitors, and score history grouped by rubric version. AI-buildability and its one-line reason sit at the top. A pain-points section is ready for forum mention counts, sources and quotes. Security ideas surface liability sentences from the research notes, kill flags, and the Run 2 legal rules.
- **Customer and starters.** Filter the explorer, dashboard and compare view by consumer, business, or both. "Start here for non-engineers" sorts live ideas by AI-buildability, then total.
- **Rubric.** Criteria come from the database, so a later run can add one (complaint frequency is reserved as an optional criterion). The page shows the current version and the history of research weights. Edit weights and watch the ranking move before you save. Weights must sum to 100. Saving bumps the local `rubric_version` and recomputes totals. Totals from different rubric versions are not comparable. Kill criteria, the feeder rule, tie-breaks, calibration anchors, and the security addendum are on the same page.
- **Compare.** Two to four ideas, with the best score in each row marked.
- **Pipeline.** Move an idea between shortlist, backlog, researching, building, launched, feeder, parked, rejected, avoid and killed. A move locks the status so the next import will not overwrite it. “Return to automatic status” on the brief unlocks it.
- **Runs.** The log for each sweep, plus import.
- **Export.** Download `ideas.json` from the header. The canonical fields match the research schema. App-only fields (your notes, overrides, locks) are under `_idealab` so a later import can restore them, and the research tools can ignore that key.

Manual score overrides change the working total inside the app. The export still writes the research scores and the research total, which is what the next run should merge against.

## Import a run

Use **Runs → Import a run**, or work from the JSON directly.

A run file looks like `data/run2.json`:

```json
{
  "run": {
    "run_number": 3,
    "date": "2026-11-01",
    "author": "You",
    "focus": "What this sweep looked at",
    "sources_swept": ["source you actually opened"],
    "notes": "What changed."
  },
  "ideas": []
}
```

New ideas need `id`, `title`, `category`, `platform`, `problem`, `target_users`, `monetisation`, `price_hypothesis` and a score for every active criterion (integers 0–5). Under rubric v2.0 a new idea also needs `customer_type` (`consumer`, `business`, or `both`). Optional criteria, including `complaint_frequency`, can be omitted. A run file may also carry `weights`, `criteria_order` and `rubric_version` when it introduces a criterion.

An idea that is already in the database can be partial. Run 2’s last record only sends `id`, `scores`, `evidence`, `competitors` and `notes` for `saas-bulk-exporter-pattern`. The import keeps the title and the other fields, unions evidence by URL, unions competitors and kill/avoid flags, replaces notes when they are present, and appends score history. A duplicate run number is rejected. Statuses you set yourself (`backlog`, `researching`, `building`, `launched`, `parked`, `rejected`, a locked status, and `avoid`) are not overwritten.

`avoid` sits beside `killed`. Kill flags, or a legal score of 0 or 1, force `killed`. Avoid flags, or an existing `avoid` status, keep the idea out of the shortlist without treating it as illegal. The shortlist is the top 10 ideas that are still automatic candidates. Feeders are ideas with willingness to pay at 2 or below and recurring revenue at 1 or below.

Score history keeps one entry per run and rubric version. A rescore under the same run and version replaces that entry. Totals from v1.0 and v2.0 are stored as scored and are not compared with each other.

The import writes a backup before it merges. On a writable disk that is a file under `data/backups/`. It is always also stored in the `backups` table, which is what persists on Vercel. `npm test` checks Run 2 against `data/ideas-v1.json`, the rubric v2 rescore plus `data/run3.json` against `data/ideas-v2.json`, Run 5 against `data/ideas-v3.json`, and Run 4 against `data/ideas.json`.

Schema v3 adds `secondary_categories`, `category_history`, and `bundle_fit` on each idea, plus top-level `category_overrides` and `bundles`. A category override sticks: a later import that sends a different category for that id keeps the override and stores the incoming category as a secondary tag. The same stickiness applies to an idea that already has category history, unless that record includes `category_change`. Bundles are scored with the idea rubric and are not shortlisted.

A full IdeaLab export can also be imported. That path replaces the database, which is the restore path rather than a research merge.

## Research files

- `data/ideas.json` — canonical database after Run 4 (187 ideas, rubric v2.0, schema 4; what `db:seed` loads). Complaint frequency is evidence, not a weighted score.
- `data/ideas-v3.json` — the Run 5 database (170 ideas), kept so the importer test can replay Run 4
- `data/ideas-v2.json` — the Run 3 database (135 ideas), kept so the importer test can replay Run 5
- `data/ideas-v1.json` — the Run 2 database, kept so the importer test can replay the v1 to v2 path
- `data/run4.json` — Run 4 import (17 new ideas, 32 evidence merges, 53 pain clusters)
- `data/pain_points.json` — source clusters behind `pain_clusters` in `ideas.json`
- `data/run5.json` — Run 5 import (35 new ideas, 16 rescores, Life Admin category and the Life Admin Pass bundle)
- `data/run5-bundle.json` — revenue scenarios, price comparison and pricing evidence for the Life Admin Pass
- `data/run3.json` — Run 3 import (35 new ideas, 2 rescores)
- `data/run3-rubric-v2-rescore.json` — the rubric v2 backfill for the original 100 ideas
- `data/ideas-run1.json` — Run 1 only, used by the import test
- `data/run2.json` — the cybersecurity run, including the partial rescore
- `research/pain_method.md` — how CFS 1.0 was counted
- `research/rubric.md` — rubric v2.0, including AI-buildability, the Run 2 security addendum, the Run 5 “Dates, not documents” note, and the decision that CFS is evidence only
- `research/runbook.md` — how a later research run is collected

The methodology still talks about `merge.py`. IdeaLab is the merge now. It follows the same rules: dedupe by id, union evidence and flags, recompute totals from the current weights, recompute feeder / killed / shortlist, and leave human pipeline statuses alone.

## Deploy on Vercel

Framework preset: **Next.js**. Node.js version: **22** (`engines.node` is `22.x`).

| Setting | Value |
|---|---|
| Install command | default (`npm install`, or `npm ci` if Vercel uses the lockfile) |
| Build command | `npm run build` (also set in `vercel.json`) |
| Output | Next.js default. Do not override it. |

`npm run build` runs `scripts/bootstrap.ts` before `next build`. When `DATABASE_URL` or `POSTGRES_URL` is present it migrates and, if `ideas` is empty, seeds all 187 ideas from `data/ideas.json` and records the data migrations. A database that already applied `0003_schema_v3_data` (170 ideas, schema 3) then gets `0004_schema_v4` and a one-time overlay `0004_schema_v4_data`. The SQL adds complaint frequency, pain-cluster links, merged ids, related ids, Run 4 merge notes, id aliases, the pain method, and a `pain_clusters` table. The overlay loads the schema 4 file: 187 ideas, runs 1 through 5, 53 pain clusters, and 17 id aliases. It keeps user notes, MVP and distribution notes, risks, score overrides, pipeline order, and any status you locked or set by hand (`backlog`, `researching`, `building`, `launched`, `parked`, `rejected`, `avoid`). Unlocked research statuses follow the file, so `xero-invoice-chaser-lite` and `appstore-screenshot-maker` become candidates. It does not delete ideas that exist only in the database, and it does not wipe the database. A second deploy sees `0004_schema_v4_data` and leaves the data alone. An empty database seeds the 187-idea file and records the `0002`, `0003`, and `0004` data markers together. If the URL is missing at build time, the bootstrap step skips and the first request does the same migrate, seed-if-empty, or one-time upgrade.

Attach **Neon Postgres** from the Vercel Marketplace. That integration creates the variables below. Leave them available to Production and Preview, including during the build, so the seed can run before the site goes live. The first request still seeds an empty database if the build could not see the URL.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes on Vercel | Neon pooled Postgres URL. `POSTGRES_URL` and `POSTGRES_PRISMA_URL` are accepted if `DATABASE_URL` is unset. |
| `ADMIN_PASSWORD` | Yes once the site is public | Unlocks imports, tracking edits, pipeline moves and rubric saves. Browsing and JSON export stay open. Use a long passphrase. |
| `POSTGRES_URL` | No | Fallback connection string, same role as `DATABASE_URL`. |
| `IDEAS_PATH` | No | Defaults to `data/ideas.json`. |
| `BACKUP_DIR` | No | Where a writable disk also stores the pre-merge JSON. On Vercel the copy is kept in the `backups` table. |
| `PGLITE_PATH` | No | Local embedded data directory. Defaults to `data/pglite`. Ignored when a Postgres URL is set. |

The header shows an **Unlock** field when `ADMIN_PASSWORD` is set. A correct password sets an httpOnly cookie for 30 days (`idealab_admin`, HMAC of the password, Secure on Vercel). **Lock editing** clears it. With no password in local development, writes stay open. With no password in production, every write is rejected.

```bash
docker build -t idealab .
docker run --rm -p 3000:3000 -e DATABASE_URL=postgres://... -e ADMIN_PASSWORD=... idealab
```

Without `DATABASE_URL`, the container uses embedded Postgres on the `/data` volume and seeds it on first use. Set `ADMIN_PASSWORD` before exposing any host.
