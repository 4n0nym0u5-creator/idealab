# IdeaLab

IdeaLab is a local research studio for a solo builder in Sydney. It keeps one growing database of small, low-legal-risk product ideas: scores, shortlist, feeders, hard kills, and ideas you have chosen to avoid. Research runs merge in by idea id, and every rescore keeps a score history.

The app is seeded with Run 1 (the baseline sweep) and Run 2 (a cybersecurity deep dive: 40 new ideas plus a partial rescore of `saas-bulk-exporter-pattern`).

## Stack

- Next.js 15, React 19, TypeScript
- Tailwind CSS
- SQLite via `better-sqlite3` and Drizzle ORM
- Recharts for the score radar and the distribution chart

There is no login. `src/lib/auth.ts` exposes `getActor()`, and every mutation calls it. That is the place to add a session later.

SQLite is a file (`data/idealab.db`). That is a good fit for one user on a laptop or a small VM with a persistent disk. It is a poor fit for a stateless host that forgets the filesystem on every deploy.

## Setup

Node.js 22 or newer.

```bash
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`db:setup` applies `drizzle/0001_init.sql` and loads `data/ideas.json` (the merged Run 1 + Run 2 database, 100 ideas). Run it again any time you want to reset the studio back to that file. Your notes, status locks and weight edits live only in the SQLite file, so a re-seed wipes them. Export first.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run db:migrate` | Create tables |
| `npm run db:seed` | Replace the database from `data/ideas.json` |
| `npm run db:setup` | Migrate, then seed |
| `npm test` | Import Run 2 into a fresh Run 1 database and compare it with the merged file |
| `npm run build` / `npm start` | Production build and server |
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

The import writes a backup under `data/backups/` before it merges. `npm test` performs this merge from `data/ideas-run1.json` plus `data/run2.json` and checks it against `data/ideas.json`.

A full IdeaLab export can also be imported. That path replaces the database, which is the restore path rather than a research merge.

## Research files

- `data/ideas.json` — canonical database after Run 2 (what `db:seed` loads)
- `data/ideas-run1.json` — Run 1 only, used by the import test
- `data/run2.json` — the cybersecurity run, including the partial rescore
- `research/rubric.md` — the weighted rubric, including the Run 2 security addendum
- `research/runbook.md` — how a later research run is collected

The methodology still talks about `merge.py`. IdeaLab is the merge now. It follows the same rules: dedupe by id, union evidence and flags, recompute totals from the current weights, recompute feeder / killed / shortlist, and leave human pipeline statuses alone.

## Deploy

Any Node 22 host with a persistent disk works. Set `DATABASE_PATH` to that disk (for example `/data/idealab.db`). On first boot, run `npm run db:setup` if the file is missing, then `npm run build` and `npm start`.

```bash
docker build -t idealab .
docker run --rm -p 3000:3000 -v idealab-data:/data idealab
```

The image seeds `/data/idealab.db` on first start. Do not put this on a host that wipes the disk, and do not expose it publicly until `getActor()` is backed by a real login. The studio assumes one trusted user.

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_PATH` | `data/idealab.db` | SQLite file |
| `BACKUP_DIR` | `data/backups` | JSON snapshots taken before a merge |
| `IDEAS_PATH` | `data/ideas.json` | File `db:seed` reads |
