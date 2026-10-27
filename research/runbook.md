# SideHustle research runbook: how to run Run N

Files (all in `/workspace/sidehustle/`):
- `rubric.md`: the criteria, weights, level definitions and kill rules. Read it first, every run.
- `ideas.json`: the master database (schema below). Never edit totals by hand.
- `merge.py`: merges a run file into `ideas.json`, dedupes by `id`, recomputes totals and statuses, and picks the top-10 shortlist.
- `build_run1.py`: how Run 1 was generated (a reference only; don't re-run it, because it overwrites `ideas.json`).
- `build_run2.py`, `build_run3.py`: generators for the Run 2/3 import files (copy the `E()`/`I()` helper pattern from `build_run3.py`; it uses 13-digit score strings and a `customer_type` argument).
- `migrate_v2.py`: one-off v1.0→v2.0 rubric migration (already run in Run 3; it refuses to run twice).
- Page: "SideHustle Idea Lab", canvas_id `8f08a468-4039-454a-9a27-358c67955747`, url https://cursor.com/canvas/store-4d61992f-8a12-47ae-9e32-57cfaf4b60d1/8f08a468-4039-454a-9a27-358c67955747 . Use `ReadCanvas`, then `EditCanvas`. Its `RAW` array mirrors `ideas.json`; `DETAILS` holds the shortlist write-ups.

## 1. Prepare (5 min)
1. Read `rubric.md`, and the last entry in `ideas.json.runs` (to see what was already swept).
2. Choose this run's focus: rotate through the sweep list below. Each run should cover at least 3 sources that weren't covered last time.
3. Note today's date (Australia/Sydney) and set `run_number` = last + 1.

## 2. Sweep sources (rotate; record each one in `sources_swept`)
Revenue proof (only cite figures you opened this run, with the URL; never invent numbers):
- trustmrr.com: category pages (utilities, productivity, mobile apps, AI), filtered to small solo apps.
- indiehackers.com product milestones; starterstory.com; setapp.com/tech-talks; stealwhatworks.com.
- MicroConf State of Independent SaaS (microconf.com/state-of-indie-saas); RevenueCat State of Subscription Apps.
Marketplaces (look for thin categories, apps with bad reviews, "missing feature" reviews):
- Mac App Store + Setapp new apps; Homebrew casks trending; Raycast store (free extensions; use it to find demand signals, not revenue).
- Chrome Web Store (search "export", "bulk", "backup" + popular SaaS names); Firefox add-ons.
- Google Workspace Marketplace; Shopify App Store (sort categories by reviews; check 1-2★ reviews); Xero App Store; Figma Community; Canva Apps; Notion integrations; Slack Marketplace; Atlassian Marketplace.
- Product Hunt (last 30 days, Productivity / Mac / Developer Tools).
Pain signals:
- Reddit: r/SideProject, r/SaaS, r/macapps, r/AppIdeas, r/smallbusiness, r/ausbusiness, r/AusElectricians, r/AustralianTeachers, r/eventplanning, r/weddingplanning, r/sysadmin, r/photography. Search "I wish there was", "is there an app", "how do I bulk", "export all", "why can't".
- Apple Community / Microsoft forums: "how to" questions with thousands of views and no good answer.
- Vendor forums and feature-request boards (ideas.xero.com, Shopify Community, Canva/Notion/Fathom feature requests): requests marked "not planned" are gaps.
- Google Trends and autocomplete for "how to … on mac", "… generator", "… template".
AU-specific: ATO/Fair Work/state tenancy changes (new record-keeping rules create tool demand), AU SaaS gaps where US tools don't localise (GST, ABN, AusPost, BAS terms).
Reddit often blocks direct fetches. Use WebSearch summaries, and mark that evidence "(search summary)".

## 3. Capture ideas
For each candidate, write: id (kebab-case, stable, problem-first e.g. `mac-display-arrangement-restorer`), title, category, platform, problem, target_users, monetisation, price_hypothesis, competitors, evidence (url + note), notes.
**Dedupe before scoring:** search `ideas.json` for the same problem (not just the same name). If it exists, reuse its `id`. You can re-score it with the new evidence, or skip it. Variants of a pattern (e.g. another bulk exporter target) get their own id with the pattern's prefix (`saas-bulk-exporter-<target>`).
Aim for at least 10 new ideas, plus re-scores of any shortlisted idea where you found new evidence.

## 4. Score
- Score all 13 criteria 0-5 (rubric v2.0 added `aibuild`, scored last) using `rubric.md` level definitions, and check against the calibration anchors.
- Apply the kill criteria first; put reasons in `kill_flags`. Only hard kills go in `kill_flags` (any entry auto-kills); soft risks go in `notes`.
- Set `customer_type` (consumer | business | both) on every new idea; merge.py rejects new ideas without it.
- For re-scores, send the full record (all 13 scores), not a partial one.
- If a score changes for an existing idea, put one line of rationale in `notes` (e.g. "R2: compete 3->2, X launched").
- Don't touch statuses `building`, `launched`, `parked`, `rejected`: the user sets those.

## 5. Merge
1. Write `/workspace/sidehustle/runs/run_N.json`:
   `{"run":{"run_number":N,"date":"YYYY-MM-DD","author":"...","rubric_version":"2.0","focus":"...","sources_swept":[...],"notes":"..."},"ideas":[...]}`
2. `cp ideas.json runs/ideas_before_run_N.json` (backup), then `python3 merge.py runs/run_N.json`.
3. Check the printed top 15 makes sense. If a cheap feeder tool ranks high, it should show status `feeder`.

## 6. Update the Page (EditCanvas, never a full rewrite unless the structure changes)
1. `ListCanvases` query "SideHustle Idea Lab" → `ReadCanvas`.
2. Regenerate the `RAW` array from `ideas.json` (one tuple per idea: [id, title, category, platform, status, first_seen_run, total, 13-digit score string in criteria_order, price, customer_type]) and replace it with one `EditCanvas`. Use the helper below. For any new shortlist idea, add a `DETAILS` entry (why, mvp, money, distro, risk).
3. Append a row to the `RUNS` array (run, date, focus, added, rescored, headline).
4. Update the "Shortlist" and "Focus themes" sections only if the top 10 or the themes changed; add a "What changed in Run N" bullet list under Run log.
5. Share the Page link only after the edit succeeds.

Helper to print the RAW array for the Page:
```
python3 - <<'X'
import json;d=json.load(open('/workspace/sidehustle/ideas.json'));K=d['criteria_order']
out=[[i['id'],i['title'],i['category'],i['platform'],i['status'],i['first_seen_run'],i['total'],''.join(str(i['scores'][k]) for k in K),i['price_hypothesis'],i['customer_type']] for i in sorted(d['ideas'],key=lambda x:-x['total'])]
print('const RAW: Raw[] = '+json.dumps(out,ensure_ascii=False,separators=(',',':')).replace('],[','],\n[')+';')
X
```
Also update the Metrics counts, the TableOfContents (if sections change) and the Page title (e.g. "Run N (date)").

## Schema v3 additions (Run 5)
- Idea fields: `secondary_categories[]` (old categories kept as tags), `category_history[{run,date,from,to,note}]`,
  `bundle_fit{tier: launch|v2|later|feeder|exclude, module, note}` (set for every Life Admin idea), `history_note` (optional).
- Run-file fields: per-idea `category_change` (moves an existing idea; old category goes to secondary_categories and is logged),
  top-level `category_overrides{id:{category,note,bundle_fit?}}` and `bundles[]`.
- Top-level db fields: `category_overrides` (sticky: if a later run, in any order, sends that id with another category,
  merge.py keeps the override category and adds the incoming one to secondary_categories) and `bundles[]`
  (bundle-level score, price, modules, scenarios; bundles are never shortlisted).
- `category_overrides` already holds 10 Run 4 pain-idea ids (share-house-ledger-roster, chore-fairness-ledger,
  subscription-audit-csv, moving-house-hub-au, household-docs-index, gift-budget-tracker-pain, school-holiday-care-planner,
  school-notice-digest, home-maintenance-log-pain, receipt-shoebox-warranty). **Run 4 worker: merge with the current merge.py
  (schema v3), not a copy from before Run 5**; the old one is runs/merge_before_run_5.py. Override handling was tested only in a sandbox copy.

## ideas.json schema (schema_version 2, rubric v2.0; v3 fields above)
```
{ schema_version (2), rubric_version ("2.0"), weights{key:weight} (13 keys, sum 100), criteria_order[13 keys, aibuild last],
  customer_types ["consumer","business","both"],
  rubric_history: [{version, since_run, date?, weights, change?}],
  runs: [{run_number, date, author, rubric_version?, focus?, sources_swept[], ideas_added, ideas_rescored, notes}],
  ideas: [{ id*, title, category, platform, problem, target_users, monetisation, price_hypothesis,
            customer_type (consumer|business|both), aibuild_reason (one line, backfilled ideas),
            scores{legal,pain,breadth,wtp,recurring,build,maint,distro,compete,defend,synergy,platform,aibuild},
            total (computed), status (candidate|shortlist|feeder|killed|building|launched|parked|rejected),
            kill_flags[], evidence[{url,note}], competitors[], notes,
            first_seen_run, last_scored_run,
            score_history[{run, date, rubric_version, total, scores, note?}] }] }
```
score_history keeps one entry per (run, rubric_version). v1.0 entries have 12 score keys; v2.0 entries have 13.
Never compare totals across rubric versions.

`id` is the primary key. Never rename an id; if an idea is reframed, keep the id and edit the title.

## Run history
- Run 1 (27 Oct 2026): baseline sweep, 60 ideas (`build_run1.py`).
- Run 2 (27 Oct 2026): cybersecurity deep dive, 40 new ideas plus a re-score of `saas-bulk-exporter-pattern` (`build_run2.py` -> `runs/run2.json`; backup in `runs/ideas_before_run_2.json`). Security categories are prefixed `Security:`. The rubric.md addendum covers security legal levels. The Page now has a "Cybersecurity deep dive (Run 2)" section with its own `CYBER_DETAILS` array, so add a `DETAILS` entry for any new shortlist id.
- File naming: Run 2 used `runs/run2.json`; keep `runs/runN.json` from now on.
- Run 3 (27 Oct 2026): consumer sweep + **rubric v2.0** (`aibuild` criterion, weight 10; weights rebalanced; `customer_type` on every idea). Order used: backup → `migrate_v2.py` (backfill all 100, writes `runs/run3_rubric_v2_rescore.json`) → `build_run3.py` → `merge.py runs/run3.json` (35 new consumer ideas, 2 re-scores). Backup in `runs/ideas_before_run_3.json`. The Page has a "Consumer pass (Run 3)" section (consumer shortlist details live in `DETAILS`), an AI-buildability explainer, a v1 vs v2 table and a first-build plan.
- Run 5 (27 Oct 2026): **Life Admin** category + bundle analysis. `build_run5.py` -> `runs/run5.json` (35 new ideas, 16 reclassified with `category_change`, 4 rescored, 10 Run 4 `category_overrides`) and `runs/run5_bundle.json` (Life Admin Pass model: pricing, scenarios, bundle score 68.8). Backups: `runs/ideas_before_run_5.json`, `runs/merge_before_run_5.py`. Result: schema v3, 170 ideas, runs [1,2,3,5]. Run 4 (pain-point pass) is owned by another worker and not merged yet. Page: `build_page_run5.py` builds EditCanvas edits from `page_live_before_run5.tsx` (a ReadCanvas snapshot; always rebuild the base from ReadCanvas, the live page can drift from local files) and writes `page_run5.canvas.tsx`; `page_live_after_run5.tsx` is the live source after the edit. The Page RAW array is now sorted at load (`IDEAS ... .sort(by total)`), so new rows can be appended.

## Schema v4 additions (Run 4 merge, 27 Oct 2026)
- Idea fields:
  - `complaint_frequency`: CFS 0–5, the highest CFS among the linked clusters. Evidence only, not part of `total`.
  - `pain_cluster_ids`: the primary cluster comes first.
  - `related_pain_cluster_ids`: clusters from another idea's `overlaps_also`.
  - `merged_ids`: Run 4 ids that were folded into this id.
  - `run4_merge`: `[{run4_id, title, suggested_scores, note}]`.
  - `related_ids`: on new ideas, pointing to the nearest existing ideas.
- Top-level keys:
  - `pain_clusters`: 53 clusters, sorted by CFS and ready to display. Each has id, rank, statement, customer_type, cfs, subscores, counts, communities{count, source_types, top[]}, recency_24m_share, engagement, app_reviews, existing_solutions, why_people_still_complain, quotes[{quote, title, url, community, date, score, comments}], linked_idea_ids and related_idea_ids.
  - `pain_method`: version, generated, doc, thresholds and coverage_notes.
  - `id_aliases`: incoming id → existing id. merge.py redirects aliases automatically.
- merge.py:
  - accepts `pain_clusters`, `pain_method` and `merged_map`;
  - keeps `db.runs` sorted by run_number.
  - Pre-v4 copy: `runs/merge_before_run_4.py`.
- Merging a pain run in future:
  1. Run `python3 build_run4_merge.py`. It writes the clean import `runs/run4.json`. Edit its MERGE set, which lists ideas with the same core job as their `overlaps_existing_id`.
  2. Run `python3 merge.py runs/runN.json`.
  - For merged ids, the builder sends the **existing** scores, so totals don't move, and appends notes rather than replacing them.

## Run 4 history (merged 27 Oct 2026, after Run 5)
- Source: the forum pain-point worker. Files: `pain_points.json`, `pain_method.md`, `runs/run4_pain_ideas.json` (raw, untouched). Clean import: `runs/run4.json`.
- 34 pain-led ideas:
  - 17 folded into existing ids, for example seating-chart-rsvp-reflow → wedding-seating-planner and gift-budget-tracker-pain → gift-list-budget-tracker. See `id_aliases`.
  - 17 added as new ideas, giving 187 in total.
  - The Life Admin `category_overrides` applied to chore-fairness-ledger and school-notice-digest. The other 8 override ids were merged and are marked `merged_into`.
- 53 clusters were stored. No rescoring and no rubric change.
- Shortlist changes: nosub-app-directory (78.6) and chore-fairness-ledger (76.0) came in. xero-invoice-chaser-lite and appstore-screenshot-maker (76.0 / 75.8) dropped to candidate.
- Caveat: Run 4's notes call nosub-app-directory a feeder (traffic to the other apps) when it stands alone. Its rubric status is shortlist because wtp 2 / recurring 2 sits just above the feeder rule.
- Backup: `runs/ideas_before_run_4.json`.
