# IdeaLab

IdeaLab is a local research studio for a solo builder in Sydney. It keeps one growing database of small, low-legal-risk product ideas: scores, shortlist, feeders, hard kills, and ideas you have chosen to avoid. Research runs merge in by idea id, and every rescore keeps a score history.

The app is seeded with Run 1 (the baseline sweep) and Run 2 (a cybersecurity deep dive: 40 new ideas plus a partial rescore of `saas-bulk-exporter-pattern`).

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
- **Idea brief.** Score radar, points by criterion, the rubric sentence for each score, reasoning, monetisation, an MVP and distribution reading, sources, competitors, and score history. Security ideas surface liability sentences from the research notes, kill flags, and the Run 2 legal rules.
- **Rubric.** Read every level. Edit weights and watch the ranking move before you save. Weights must sum to 100. Saving bumps `rubric_version` and recomputes totals. Kill criteria, the feeder rule, tie-breaks, calibration anchors, and the security addendum are on the same page.
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

New ideas need `id`, `title`, `category`, `platform`, `problem`, `target_users`, `monetisation`, `price_hypothesis` and all 12 scores (integers 0–5).

An idea that is already in the database can be partial. Run 2’s last record only sends `id`, `scores`, `evidence`, `competitors` and `notes` for `saas-bulk-exporter-pattern`. The import keeps the title and the other fields, unions evidence by URL, unions competitors and kill/avoid flags, replaces notes when they are present, and appends score history. A duplicate run number is rejected. Statuses you set yourself (`backlog`, `researching`, `building`, `launched`, `parked`, `rejected`, a locked status, and `avoid`) are not overwritten.

`avoid` sits beside `killed`. Kill flags, or a legal score of 0 or 1, force `killed`. Avoid flags, or an existing `avoid` status, keep the idea out of the shortlist without treating it as illegal. The shortlist is the top 10 ideas that are still automatic candidates. Feeders are ideas with willingness to pay at 2 or below and recurring revenue at 1 or below.

The import writes a backup before it merges. On a writable disk that is a file under `data/backups/`. It is always also stored in the `backups` table, which is what persists on Vercel. `npm test` performs this merge from `data/ideas-run1.json` plus `data/run2.json` and checks it against `data/ideas.json`.

A full IdeaLab export can also be imported. That path replaces the database, which is the restore path rather than a research merge.

## Research files

- `data/ideas.json` — canonical database after Run 2 (what `db:seed` loads)
- `data/ideas-run1.json` — Run 1 only, used by the import test
- `data/run2.json` — the cybersecurity run, including the partial rescore
- `research/rubric.md` — the weighted rubric, including the Run 2 security addendum
- `research/runbook.md` — how a later research run is collected

The methodology still talks about `merge.py`. IdeaLab is the merge now. It follows the same rules: dedupe by id, union evidence and flags, recompute totals from the current weights, recompute feeder / killed / shortlist, and leave human pipeline statuses alone.

## Deploy on Vercel

Framework preset: **Next.js**. Node.js version: **22** (`engines.node` is `22.x`).

| Setting | Value |
|---|---|
| Install command | default (`npm install`, or `npm ci` if Vercel uses the lockfile) |
| Build command | `npm run build` (also set in `vercel.json`) |
| Output | Next.js default. Do not override it. |

`npm run build` runs `scripts/bootstrap.ts` before `next build`. When `DATABASE_URL` or `POSTGRES_URL` is present it migrates and, if `ideas` is empty, seeds all 100 ideas from `data/ideas.json`. A later deploy does not wipe notes or status locks. If the URL is missing at build time, the bootstrap step skips and the first request does the same migrate-and-seed.

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
