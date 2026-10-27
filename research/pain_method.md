# Pain-point mining and Complaint Frequency Score (CFS 1.0)

Run 4, 27 Oct 2026 (AEDT). Scripts: `/workspace/sidehustle/pain_raw/`.
Outputs:
- `/workspace/sidehustle/pain_points.json`: the clusters.
- `/workspace/sidehustle/runs/run4_pain_ideas.json`: the ideas.

## 1. Sources

| Source | How collected | Window | Notes |
|---|---|---|---|
| Reddit, ~75 chosen subreddits | Arctic Shift bulk dumps of submissions (`collect_arctic_bulk.py`) | created after 2023-10-27 | Posts only. No comments. |
| Reddit-wide search | reddit.com search RSS, 60 complaint/request queries (`collect_rss.py`, `rss_eng.py` adds score and comments) | top 100 per query, any date | Rate-limited to about 1 request per minute. |
| Hacker News | Algolia API (`collect_hn.py`): Ask HN plus keyword searches | 2019 onwards | |
| Stack Exchange | API (`collect_se.py`): softwarerecs, superuser, apple, money, webapps, lifehacks and others | all | |
| Apple App Store (AU) | public review RSS (`collect_appstore.py`): most recent ~500 per app, all ratings | recent | Used for the low-star share and themes. |
| Google Play | `collect_play.py`: 1-2 star reviews only | recent | Used for themes only, not the share. |
| X | 7-day recent counts | 20-27 Oct 2026 | Sanity check only. Not scored. |

Blocked or not mined:
- Whirlpool and Quora returned 403.
- Not mined: ProductReview.com.au, Indie Hackers, Product Hunt, Chrome Web Store, Facebook groups and Discord, which are private.

## 2. Pipeline (`analyze.py`, then `build_run4.py`)

**1. De-duplicate.** Remove duplicates by post id across all collectors.

**2. Exclude self-promotion.** The `PROMO` regex in `clusters.py` catches posts such as "I built", "vibe coded", "looking for beta testers", "would you use/pay" and "validating my idea".
- Excluded posts are counted per cluster as `self_promo_posts_excluded`.
- That count is a builder-saturation signal: lots of founders are pitching into the space.

**3. Clusters.** `clusters.py` defines 53 hand-written pain clusters. Each one has:
- a pain statement
- a customer type
- a topic regex
- an optional `NEG` regex that rejects known false positives (for example "chore" used as an adjective, or SSL-certificate expiry)

**4. Strict mention.** A post counts toward the score only if one of these is true:
- the topic regex matches the title, and either a complaint/request phrase appears in the first 600 characters or the post comes from a request source (r/SomebodyMakeThis, r/AppIdeas, SE softwarerecs)
- the topic regex and a complaint phrase both match within the first 400 characters

The complaint phrase list is `COMPLAINT` in `clusters.py`. Examples: "frustrat", "hate", "sick of", "is there an app", "how do you keep track", "spreadsheet", "paywall", "alternative to".

**5. Broad mention.** `mentions_broad` also counts posts where the topic regex and a complaint phrase co-occur anywhere within ±250 characters. It is reported only, not scored.

**6. Per-community cap.** At most 50 strict mentions per subreddit or site are counted, so that one topic-named subreddit can't dominate.

**7. Precision audit (manual).** For the top 30 clusters, 12 random strict titles were sampled (seed 11) and judged relevant or not by hand. Results are in `precision_audit.json`.
- `precision_used` = relevant / sampled.
- Unaudited clusters use 0.5.
- With only 12 titles, treat each precision figure as roughly ±0.25.

**8. Estimated relevant mentions.**
- `est_relevant_mentions` = capped strict mentions × precision.
- `est_relevant_per_100k_posts` divides that by the size of the swept forum corpus. Run 4 swept 128,022 posts at the time of writing; the final figure is in pain_points.json `corpus`.
- This normalisation keeps future, larger sweeps comparable.

**9. App reviews are a separate signal.**
- `incumbent_gap_appstore_low_star_share` is the share of sampled App Store reviews rated 1-2 stars for the main incumbents.
- Low-star themes are reported with their counts: paywall/price, ads, bugs/sync/crash, login/account, missing feature.
- Reviews are **not** in the CFS, because review volume tracks app popularity, not how common the problem is.

## 3. Complaint Frequency Score

Each sub-score is the number of fixed thresholds reached (0-5):

| Sub-score | Input | Thresholds (1..5) | Weight |
|---|---|---|---|
| Volume (V) | est. relevant mentions per 100k posts swept | 5, 15, 35, 75, 150 | 0.40 |
| Breadth (B) | distinct communities with a strict mention | 2, 4, 8, 15, 25 | 0.25 |
| Recency (R) | share of strict mentions in the last 24 months | 0.20, 0.35, 0.50, 0.65, 0.80 | 0.15 |
| Engagement (E) | strict mentions with ≥20 points or ≥20 comments (SE: score ≥5 or ≥5,000 views), × precision, per 100k posts | 2, 5, 10, 20, 40 | 0.20 |

**CFS = 0.4V + 0.25B + 0.15R + 0.2E**, on a 0-5 scale. The raw counts are always stored next to it.

- The thresholds are absolute and fixed. This lets a cluster's score be compared across runs and lets new clusters be added without re-scaling old ones.
- The thresholds were set so that the strongest Run 4 clusters land around 3. That leaves headroom for bigger or better-targeted sweeps.
- A CFS of 0 does not mean "no pain". It means no forum complaints were matched. Check the app-review signal; sports tipping and team-club admin are examples.

Rough reading guide:

| CFS | Reading |
|---|---|
| ≥ 3 | Widespread and recurring |
| 2-3 | Clear and repeated across several communities |
| 1-2 | Real but niche, or poorly covered |
| < 1 | Anecdotal in this corpus |

## 4. Linking to ideas

- Each idea in `run4_pain_ideas.json` lists `pain_cluster_ids`. The first id is the primary cluster.
- `complaint_frequency` is the highest CFS among the idea's linked clusters.
- The rubric `pain` score (0-5) is still judged on rubric.md's definition. CFS informs it but does not replace it.
- `ai_buildability` = `scores.aibuild`.
- `overlaps_existing_id` names the closest idea already in ideas.json, so the merge can fold the evidence in rather than duplicate it.

## 5. Limitations (read before trusting a number)

- **Selection bias.** Choosing which subreddits to pull decides what can appear. Topic-named subs such as r/weddingplanning, r/ynab, r/googlephotos and r/MealPrepSunday inflate their clusters' volume. The per-community cap and breadth score only partly offset this.
- **Regex precision.** Measured precision ranges from 0.17 (workout-logging, mostly founder pitches) to 0.92 (photo-export-migration). Small audit samples.
- **Posts only.** Comments, where many complaints live, were not mined. Counts are therefore lower bounds.
- **Recency bias.** The Reddit bulk window starts in Oct 2023, so most recency shares are near 0.8-1.0. That is why recency has only 0.15 weight. HN and SE extend further back.
- **Search caps.** Reddit RSS returns at most 100 results per query. HN and SE searches were keyword-driven.
- **Reviews.** App Store review RSS returns only the most recent reviews. Play data is 1-2 star only. Some Play package ids failed. Review shares describe recent sentiment toward incumbents, not the size of the market.
- **Seasonality.** The sweep ran in October, so Christmas/gift and footy-season complaints are under-represented.
- **Geography.** Australian sources (r/australia, r/AskAnAustralian, r/AusFinance, AU App Store) are included, but Whirlpool and ProductReview.com.au were not reachable.
- **X.** Data covers 7 days only.
- **No quote is paraphrased.** Quotes in pain_points.json are verbatim excerpts with their source URL. Engagement numbers are as collected on 27 Oct 2026.

## 6. How to re-run

```bash
cd /workspace/sidehustle/pain_raw
python3 collect_arctic_bulk.py bulk_jobs.txt b0   # etc., or add subs to bulk_jobs*.txt
python3 collect_rss.py rss_queries.txt && python3 rss_eng.py
python3 collect_hn.py; python3 collect_se.py; python3 collect_appstore.py; python3 collect_play.py
python3 analyze.py            # -> analysis_out.json, audit_titles.json (about 3-4 min)
# re-audit precision for any new or changed cluster: edit precision_audit.json
python3 build_run4.py         # -> pain_points.json, runs/run4_pain_ideas.json (copy it and rename for later runs)
```

Notes for later runs:
- To add a pain, add a cluster to `clusters.py`, then re-run `analyze.py`. Audit 12 titles from `audit_titles.json`.
- Keep the thresholds unchanged so scores stay comparable. If they must change, bump `method_version` and re-score every cluster.

## 7. Run 4 status at wrap-up (27 Oct 2026, ~15:00 AEDT)
- The scores come from the last analysis pass (`analysis_out.json`, written 14:24 AEDT). At that point only part of the 60 Reddit RSS queries had been collected (58 finished by 14:45).
- The remaining RSS posts and the RSS engagement back-fill (`rss_eng.py`) were not folded in.
- Two RSS queries timed out:
  - "board game night" schedule
  - "tv shows" track watchlist app
- To bring the numbers up to date, re-run `rss_eng.py`, then `analyze.py`, then `build_run4.py`.
