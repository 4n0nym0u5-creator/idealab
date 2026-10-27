# SideHustle research runbook: how to run Run N

Files (all in `/workspace/sidehustle/`):
- `rubric.md`: the criteria, weights, level definitions and kill rules. Read it first, every run.
- `ideas.json`: the master database (schema below). Never edit totals by hand.
- `merge.py`: merges a run file into `ideas.json`, dedupes by `id`, recomputes totals and statuses, and picks the top-10 shortlist.
- `build_run1.py`: how Run 1 was generated (a reference only; don't re-run it, because it overwrites `ideas.json`).
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
- Score all 12 criteria 0-5 using `rubric.md` level definitions, and check against the calibration anchors.
- Apply the kill criteria first; put reasons in `kill_flags`.
- If a score changes for an existing idea, put one line of rationale in `notes` (e.g. "R2: compete 3->2, X launched").
- Don't touch statuses `building`, `launched`, `parked`, `rejected`: the user sets those.

## 5. Merge
1. Write `/workspace/sidehustle/runs/run_N.json`:
   `{"run":{"run_number":N,"date":"YYYY-MM-DD","author":"...","sources_swept":[...],"notes":"..."},"ideas":[...]}`
2. `cp ideas.json runs/ideas_before_run_N.json` (backup), then `python3 merge.py runs/run_N.json`.
3. Check the printed top 15 makes sense. If a cheap feeder tool ranks high, it should show status `feeder`.

## 6. Update the Page (EditCanvas, never a full rewrite unless the structure changes)
1. `ListCanvases` query "SideHustle Idea Lab" → `ReadCanvas`.
2. Regenerate the `RAW` array from `ideas.json` (one tuple per idea: [id, title, category, platform, status, first_seen_run, total, 12-digit score string in criteria_order, price]) and replace it with one `EditCanvas`. Use the helper below. For any new shortlist idea, add a `DETAILS` entry (why, mvp, money, distro, risk).
3. Append a row to the `RUNS` array (run, date, focus, added, rescored, headline).
4. Update the "Shortlist" and "Focus themes" sections only if the top 10 or the themes changed; add a "What changed in Run N" bullet list under Run log.
5. Share the Page link only after the edit succeeds.

Helper to print the RAW array for the Page:
```
python3 - <<'X'
import json;d=json.load(open('/workspace/sidehustle/ideas.json'));K=d['criteria_order']
out=[[i['id'],i['title'],i['category'],i['platform'],i['status'],i['first_seen_run'],i['total'],''.join(str(i['scores'][k]) for k in K),i['price_hypothesis']] for i in sorted(d['ideas'],key=lambda x:-x['total'])]
print('const RAW: Raw[] = '+json.dumps(out,ensure_ascii=False,separators=(',',':')).replace('],[','],\n[')+';')
X
```
Also update the Metrics counts, the TableOfContents (if sections change) and the Page title (e.g. "Run N (date)").

## ideas.json schema (v1.0)
```
{ schema_version, rubric_version, weights{key:weight}, criteria_order[12 keys],
  runs: [{run_number, date, author, sources_swept[], ideas_added, ideas_rescored, notes}],
  ideas: [{ id*, title, category, platform, problem, target_users, monetisation, price_hypothesis,
            scores{legal,pain,breadth,wtp,recurring,build,maint,distro,compete,defend,synergy,platform},
            total (computed), status (candidate|shortlist|feeder|killed|building|launched|parked|rejected),
            kill_flags[], evidence[{url,note}], competitors[], notes,
            first_seen_run, last_scored_run, score_history[{run,date,total,scores}] }] }
```
`id` is the primary key. Never rename an id; if an idea is reframed, keep the id and edit the title.

## Run history
- Run 1 (27 Oct 2026): baseline sweep, 60 ideas (`build_run1.py`).
- Run 2 (27 Oct 2026): cybersecurity deep dive, 40 new ideas plus a re-score of `saas-bulk-exporter-pattern` (`build_run2.py` -> `runs/run2.json`; backup in `runs/ideas_before_run_2.json`). Security categories are prefixed `Security:`. The rubric.md addendum covers security legal levels. The Page now has a "Cybersecurity deep dive (Run 2)" section with its own `CYBER_DETAILS` array, so add a `DETAILS` entry for any new shortlist id.
- File naming: Run 2 used `runs/run2.json`; keep `runs/runN.json` from now on.
