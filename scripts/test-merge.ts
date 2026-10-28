import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import test from "node:test";
import { adminToken, passwordMatches, tokenMatches } from "../src/lib/access";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "idealab-"));
process.env.IDEALAB_DRIVER = "pglite";
process.env.PGLITE_PATH = "memory";
process.env.BACKUP_DIR = path.join(dir, "backups");
delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;
delete process.env.POSTGRES_PRISMA_URL;

test("admin password compares without storing the secret", () => {
  assert.equal(passwordMatches("correct horse", "correct horse"), true);
  assert.equal(passwordMatches("nope", "correct horse"), false);
  assert.equal(tokenMatches(adminToken("correct horse"), "correct horse"), true);
  assert.equal(tokenMatches(adminToken("other"), "correct horse"), false);
});

function canonicalFromFile(idea: Record<string, unknown>) {
  return {
    id: idea.id,
    title: idea.title,
    category: idea.category,
    platform: idea.platform,
    problem: idea.problem,
    target_users: idea.target_users,
    monetisation: idea.monetisation,
    price_hypothesis: idea.price_hypothesis,
    scores: idea.scores,
    total: idea.total,
    status: idea.status,
    kill_flags: idea.kill_flags ?? [],
    evidence: idea.evidence ?? [],
    competitors: idea.competitors ?? [],
    notes: idea.notes ?? "",
    first_seen_run: idea.first_seen_run,
    last_scored_run: idea.last_scored_run,
    score_history: (Array.isArray(idea.score_history) ? idea.score_history : []).map((item) => {
      const row = item as Record<string, unknown>;
      return {
        run: row.run,
        date: row.date,
        ...(row.rubric_version ? { rubric_version: row.rubric_version } : {}),
        total: row.total,
        scores: row.scores,
        ...(row.note ? { note: row.note } : {}),
      };
    }),
    ...(idea.customer_type ? { customer_type: idea.customer_type } : {}),
    ...(idea.aibuild_reason ? { aibuild_reason: idea.aibuild_reason } : {}),
    ...(Array.isArray(idea.pain_points) && idea.pain_points.length ? { pain_points: idea.pain_points } : {}),
    ...(Array.isArray(idea.avoid_flags) && idea.avoid_flags.length ? { avoid_flags: idea.avoid_flags } : {}),
    ...(idea.liability_notes ? { liability_notes: idea.liability_notes } : {}),
    ...(Array.isArray(idea.secondary_categories) && idea.secondary_categories.length ? { secondary_categories: idea.secondary_categories } : {}),
    ...(Array.isArray(idea.category_history) && idea.category_history.length ? { category_history: idea.category_history } : {}),
    ...(idea.bundle_fit ? { bundle_fit: idea.bundle_fit } : {}),
    ...(typeof idea.complaint_frequency === "number" ? { complaint_frequency: idea.complaint_frequency } : {}),
    ...(Array.isArray(idea.pain_cluster_ids) && idea.pain_cluster_ids.length ? { pain_cluster_ids: idea.pain_cluster_ids } : {}),
    ...(Array.isArray(idea.related_pain_cluster_ids) && idea.related_pain_cluster_ids.length ? { related_pain_cluster_ids: idea.related_pain_cluster_ids } : {}),
    ...(Array.isArray(idea.merged_ids) && idea.merged_ids.length ? { merged_ids: idea.merged_ids } : {}),
    ...(Array.isArray(idea.related_ids) && idea.related_ids.length ? { related_ids: idea.related_ids } : {}),
    ...(Array.isArray(idea.run4_merge) && idea.run4_merge.length ? { run4_merge: idea.run4_merge } : {}),
    ...(idea.portfolio_fit ? { portfolio_fit: idea.portfolio_fit } : {}),
    ...(idea.tier ? { tier: idea.tier } : {}),
    ...(idea.family ? { family: idea.family } : {}),
    ...(idea.privacy_class ? { privacy_class: idea.privacy_class } : {}),
    ...(idea.privacy_notes ? { privacy_notes: idea.privacy_notes } : {}),
    ...(idea.third_party_personal_data_api ? { third_party_personal_data_api: idea.third_party_personal_data_api } : {}),
    ...(typeof idea.client_side_path === "boolean" ? { client_side_path: idea.client_side_path } : {}),
    ...(idea.portfolio_monetisation ? { portfolio_monetisation: idea.portfolio_monetisation } : {}),
    ...(idea.roadmap_slot != null ? { roadmap_slot: idea.roadmap_slot } : {}),
  };
}

test("run 2 import matches the merged research database", async () => {
  const { closeDb } = await import("../src/lib/db");
  const { migrate } = await import("../src/lib/migrate");
  const { readResearchFile, replacePortfolio, commitImport, loadPortfolio, canonicalIdea, updateTracking, previewImport, exportDocument } = await import("../src/lib/store");
  try {
  await migrate();
  const run1 = readResearchFile(path.join(process.cwd(), "data", "ideas-run1.json"));
  const seeded = await replacePortfolio(run1, "test");
  assert.equal(seeded.ideas, 60);
  assert.equal(seeded.runs, 1);

  const run2Text = fs.readFileSync(path.join(process.cwd(), "data", "run2.json"), "utf8");
  const preview = await previewImport(run2Text);
  assert.equal(preview.ideasAdded, 40);
  assert.equal(preview.ideasRescored, 1);
  assert.equal(preview.added.length, 40);
  assert.equal(preview.updated.length, 1);
  assert.equal(preview.duplicates.length, 0);
  const partial = preview.updated.find((idea) => idea.id === "saas-bulk-exporter-pattern");
  assert.ok(partial);
  assert.equal(partial.partial, true);
  assert.ok(partial.scoreDiffs.some((diff) => diff.key === "recurring" && diff.from === 3 && diff.to === 4));
  assert.ok(preview.shortlistEntered.some((idea) => idea.id === "sec-email-auth-monitor"));
  assert.ok(preview.shortlistLeft.some((idea) => idea.id === "wfh-hours-log-au"));

  const committed = await commitImport(run2Text, "test");
  assert.match(committed.backupPath, /ideas_before_run_2/);
  const portfolio = await loadPortfolio();
  assert.equal(portfolio.ideas.length, 100);
  assert.equal(portfolio.runs.length, 2);
  assert.equal(portfolio.runs[1].focus, "Cybersecurity deep dive");
  assert.equal(portfolio.ideas.filter((idea) => idea.category.startsWith("Security:")).length, 40);

  const merged = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "ideas-v1.json"), "utf8")) as {
    ideas: Record<string, unknown>[];
    runs: Record<string, unknown>[];
  };
  const byId = new Map(portfolio.ideas.map((idea) => [idea.id, canonicalIdea(idea)]));
  for (const raw of merged.ideas) {
    const actual = byId.get(String(raw.id));
    assert.deepEqual(actual, canonicalFromFile(raw), String(raw.id));
  }
  assert.equal(portfolio.runs[1].ideasAdded, merged.runs[1].ideas_added);
  assert.equal(portfolio.runs[1].ideasRescored, merged.runs[1].ideas_rescored);

  await assert.rejects(() => commitImport(run2Text, "test"), /already in the database/);

  const bulk = portfolio.ideas.find((idea) => idea.id === "saas-bulk-exporter-pattern");
  assert.ok(bulk);
  assert.equal(bulk.scoreHistory.length, 2);
  assert.equal(bulk.scores.recurring, 4);
  assert.equal(bulk.status, "shortlist");
  assert.ok(bulk.evidence.some((item) => item.url.includes("trustmrr.com/category/security")));
  assert.ok(bulk.notes.includes("R2: recurring 3->4"));

  const killed = portfolio.ideas.find((idea) => idea.id === "sec-indie-password-manager");
  assert.equal(killed?.status, "killed");
  assert.ok(killed?.killFlags.includes("credential custody"));

  await updateTracking("mac-quicklook-data-viewer", { status: "building" }, "test");
  const partialRun = JSON.stringify({
    run: { run_number: 3, date: "2026-11-01", author: "Test", focus: "Partial rescore", sources_swept: ["fixture"], notes: "Partial only." },
    ideas: [
      {
        id: "mac-quicklook-data-viewer",
        scores: { ...bulk.scores, legal: 5, pain: 3, breadth: 4, wtp: 3, recurring: 1, build: 4, maint: 4, distro: 5, compete: 3, defend: 2, synergy: 5, platform: 4 },
        notes: "R3: partial rescore while building.",
      },
      {
        id: "sec-soft-avoid-demo",
        title: "Soft-avoid demo",
        category: "Security: developer",
        platform: "CLI",
        problem: "A high-scoring idea that should stay off the shortlist",
        target_users: "Developers",
        monetisation: "Subscription",
        price_hypothesis: "US$20/mo",
        scores: { legal: 5, pain: 5, breadth: 5, wtp: 5, recurring: 5, build: 5, maint: 5, distro: 5, compete: 5, defend: 5, synergy: 5, platform: 5 },
        avoid_flags: ["dual-use adjacent, keep for reference only"],
        notes: "Liability: illustrative avoid flag. Do not build.",
      },
    ],
  });
  const again = await previewImport(partialRun);
  const rescored = again.updated.find((idea) => idea.id === "mac-quicklook-data-viewer");
  assert.equal(rescored?.partial, true);
  assert.equal(rescored?.status, "building");
  const avoided = again.added.find((idea) => idea.id === "sec-soft-avoid-demo");
  assert.equal(avoided?.status, "avoid");
  await commitImport(partialRun, "test");
  const after = await loadPortfolio();
  const quick = after.ideas.find((idea) => idea.id === "mac-quicklook-data-viewer");
  assert.equal(quick?.status, "building");
  assert.equal(quick?.scoreHistory.length, 2);
  assert.ok(quick?.notes.includes("R3:"));
  assert.equal(quick?.title.includes("CSV"), true);
  const demo = after.ideas.find((idea) => idea.id === "sec-soft-avoid-demo");
  assert.equal(demo?.status, "avoid");
  assert.equal(demo?.rank, null);
  assert.equal(after.ideas.filter((idea) => idea.status === "shortlist").length <= 10, true);

  await assert.rejects(
    () =>
      previewImport(
        JSON.stringify({
          run: { run_number: 4, date: "2026-11-02", author: "Test" },
          ideas: [{ id: "does-not-exist", scores: bulk.scores }],
        }),
      ),
    /partial update/,
  );

  const exported = await exportDocument();
  const exportedBulk = (exported.ideas as Array<{ id: string; score_history: unknown[] }>).find((idea) => idea.id === "saas-bulk-exporter-pattern");
  assert.equal(exportedBulk?.score_history.length, 2);
  assert.equal(exported.schema_version, "1.0");
  assert.equal(exported.ideas.length, 101);
  } finally {
    await closeDb();
  }
});

test("rescore plus run 3 matches the v2 research database", async () => {
  const { closeDb } = await import("../src/lib/db");
  const { migrate } = await import("../src/lib/migrate");
  const { readResearchFile, replacePortfolio, commitImport, commitRescore, loadPortfolio, canonicalIdea, previewImport } = await import("../src/lib/store");
  try {
    await migrate();
    const v1 = readResearchFile(path.join(process.cwd(), "data", "ideas-v1.json"));
    const seeded = await replacePortfolio(v1, "test");
    assert.equal(seeded.ideas, 100);
    const rescore = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "run3-rubric-v2-rescore.json"), "utf8"));
    await commitRescore(rescore, "test");
    const run3Text = fs.readFileSync(path.join(process.cwd(), "data", "run3.json"), "utf8");
    const preview = await previewImport(run3Text);
    assert.equal(preview.ideasAdded, 35);
    assert.equal(preview.ideasRescored, 2);
    assert.ok(preview.updated.some((idea) => idea.id === "wedding-seating-planner"));
    assert.ok(preview.updated.some((idea) => idea.id === "gcal-time-audit"));
    await commitImport(run3Text, "test");
    const portfolio = await loadPortfolio();
    assert.equal(portfolio.ideas.length, 135);
    assert.equal(portfolio.runs.length, 3);
    assert.equal(portfolio.settings.rubricVersion, "2.0");
    assert.equal(portfolio.settings.criteriaOrder.at(-1), "aibuild");
    assert.equal(portfolio.runs[2].rubricVersion, "2.0");
    assert.match(portfolio.runs[2].focus, /Consumer/);
    assert.equal(portfolio.settings.rubricHistory.length, 2);

    const merged = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "ideas-v2.json"), "utf8")) as { ideas: Record<string, unknown>[] };
    const byId = new Map(portfolio.ideas.map((idea) => [idea.id, canonicalIdea(idea)]));
    for (const raw of merged.ideas) {
      assert.deepEqual(byId.get(String(raw.id)), canonicalFromFile(raw), String(raw.id));
    }
    const sample = portfolio.ideas.find((idea) => idea.id === "mac-display-arrangement-restorer") ?? portfolio.ideas.find((idea) => idea.scoreHistory.length > 1);
    assert.ok(sample);
    assert.ok(sample.scoreHistory.some((item) => item.rubricVersion === "1.0"));
    assert.ok(sample.scoreHistory.some((item) => item.rubricVersion === "2.0"));

    const scored = portfolio.ideas.find((idea) => idea.customerType === "consumer");
    assert.ok(scored);
    await assert.rejects(
      () => previewImport(JSON.stringify({
        run: { run_number: 4, date: "2026-11-03", author: "Test", rubric_version: "2.0", focus: "Pain mining" },
        ideas: [{ id: "missing-customer", title: "Missing customer", category: "Web", platform: "Web", problem: "No type", target_users: "People", monetisation: "Checkout", price_hypothesis: "US$10", scores: scored.scores }],
      })),
      /customer_type/,
    );
    const withPain = await previewImport(JSON.stringify({
      run: { run_number: 4, date: "2026-11-03", author: "Test", rubric_version: "2.0", focus: "Pain mining", weights: portfolio.settings.weights, criteria_order: portfolio.settings.criteriaOrder },
      ideas: [{
        id: scored.id,
        scores: { ...scored.scores, complaint_frequency: 4 },
        pain_points: [{ id: "export-pain", label: "Export complaints", count: 12, cluster: "export", sources: [{ url: "https://example.com/thread", note: "A forum thread" }], quotes: ["I still cannot export."] }],
        notes: scored.notes,
      }],
    }));
    assert.equal(withPain.updated[0]?.partial, true);
    assert.ok(withPain.updated[0]?.fieldsUpdated.includes("pain points"));
    await commitImport(JSON.stringify({
      run: { run_number: 4, date: "2026-11-03", author: "Test", rubric_version: "2.0", focus: "Pain mining" },
      ideas: [{
        id: scored.id,
        scores: { ...scored.scores, complaint_frequency: 4 },
        pain_points: [{ id: "export-pain", label: "Export complaints", count: 12, cluster: "export", sources: [{ url: "https://example.com/thread", note: "A forum thread" }], quotes: ["I still cannot export."] }],
      }],
    }), "test");
    const after = await loadPortfolio();
    const mined = after.ideas.find((idea) => idea.id === scored.id);
    assert.equal(mined?.scores.complaint_frequency, 4);
    assert.equal(mined?.painPoints[0]?.count, 12);
    assert.equal(mined?.painPoints[0]?.quotes[0], "I still cannot export.");
    assert.equal(mined?.scoreHistory.filter((item) => item.run === 4 && item.rubricVersion === "2.0").length, 1);
  } finally {
    await closeDb();
  }
});

test("production upgrade preserves notes, statuses and overrides", async () => {
  const { closeDb } = await import("../src/lib/db");
  const { migrate } = await import("../src/lib/migrate");
  const { readResearchFile, replacePortfolio, updateTracking, seedIfEmpty, loadPortfolio } = await import("../src/lib/store");
  try {
    await migrate();
    await replacePortfolio(readResearchFile(path.join(process.cwd(), "data", "ideas-v1.json")), "test");
    await updateTracking("mac-quicklook-data-viewer", {
      status: "building",
      userNotes: "Keep this note through the upgrade.",
      scoreOverrides: { distro: 1 },
    }, "test");
    const upgraded = await seedIfEmpty("migrate-v2");
    assert.equal(upgraded.skipped, false);
    assert.equal(upgraded.ideas, 187);
    const portfolio = await loadPortfolio();
    assert.equal(portfolio.ideas.length, 187);
    assert.equal(portfolio.runs.length, 7);
    assert.equal(portfolio.settings.rubricVersion, "2.0");
    assert.equal(portfolio.settings.schemaVersion, "5");
    assert.equal(portfolio.settings.portfolio?.roadmap.length, 8);
    assert.equal(portfolio.settings.portfolio?.lens.rubricTotalsUnchanged, true);
    assert.equal(portfolio.ideas.find((idea) => idea.id === "gift-list-budget-tracker")?.tier, "Build now");
    assert.equal(portfolio.ideas.find((idea) => idea.id === "ai-symptom-checker")?.portfolioFit, null);
    assert.equal(portfolio.ideas.find((idea) => idea.id === "warranty-receipt-vault")?.lineupRole, "merged-into-renewal-radar");
    assert.equal(portfolio.ideas.find((idea) => idea.id === "moving-house-checklist-au")?.lineupRole, "pass-v1.1");
    assert.equal(portfolio.ideas.find((idea) => idea.id === "chore-fairness-ledger")?.lineupRole, "considered-not-added");
    assert.equal(portfolio.ideas.find((idea) => idea.id === "family-calendar-feed-merger")?.lineupRole, "dropped-from-pass");
    assert.equal(portfolio.ideas.some((idea) => idea.id === "household-handbook" || idea.id === "moving-mode"), false);
    assert.equal(portfolio.ideas.find((idea) => idea.id === "gift-list-budget-tracker")?.researchTotal, 83.4);
    assert.equal(portfolio.runs.find((run) => run.runNumber === 7)?.ideasRescored, 0);
    assert.equal(portfolio.bundles.length, 1);
    assert.equal(portfolio.bundles[0]?.id, "life-admin-pass");
    assert.equal(portfolio.bundles[0]?.total, 68.8);
    assert.ok(portfolio.bundles[0]?.revenueScenarios.base);
    assert.equal(portfolio.ideas.filter((idea) => idea.category === "Life Admin").length, 53);
    assert.equal(portfolio.painClusters.length, 53);
    assert.equal(Object.keys(portfolio.settings.idAliases).length, 17);
    assert.equal(portfolio.ideas.find((idea) => idea.id === "xero-invoice-chaser-lite")?.status, "candidate");
    assert.equal(portfolio.ideas.find((idea) => idea.id === "appstore-screenshot-maker")?.status, "candidate");
    const kept = portfolio.ideas.find((idea) => idea.id === "mac-quicklook-data-viewer");
    assert.equal(kept?.status, "building");
    assert.equal(kept?.statusLocked, true);
    assert.equal(kept?.userNotes, "Keep this note through the upgrade.");
    assert.equal(kept?.scoreOverrides.distro, 1);
    assert.equal(kept?.customerType.length > 0, true);
    assert.equal(typeof kept?.scores.aibuild, "number");
    const again = await seedIfEmpty("migrate-v2");
    assert.equal(again.skipped, true);
    await updateTracking("mac-quicklook-data-viewer", { userNotes: "Edited after the upgrade." }, "test");
    await seedIfEmpty("migrate-v2");
    const after = await loadPortfolio();
    assert.equal(after.ideas.find((idea) => idea.id === "mac-quicklook-data-viewer")?.userNotes, "Edited after the upgrade.");
    assert.equal(after.ideas.length, 187);
    assert.equal(after.runs.filter((run) => run.runNumber === 7).length, 1);
    assert.equal(after.ideas.find((idea) => idea.id === "bills-calendar-household")?.lineupRole, "merged-into-renewal-radar");
    assert.equal(after.ideas.find((idea) => idea.id === "bills-calendar-household")?.researchTotal, portfolio.ideas.find((idea) => idea.id === "bills-calendar-household")?.researchTotal);
    assert.equal(after.bundles[0]?.revenueScenarios.base?.monthly.length, 36);
  } finally {
    await closeDb();
  }
});

test("run 5 import matches the v3 research database and keeps category overrides sticky", async () => {
  const { closeDb } = await import("../src/lib/db");
  const { migrate } = await import("../src/lib/migrate");
  const { readResearchFile, replacePortfolio, commitImport, loadPortfolio, canonicalIdea, previewImport } = await import("../src/lib/store");
  const { canonicalBundle, canonicalOverrides } = await import("../src/lib/bundles");
  try {
    await migrate();
    const v2 = readResearchFile(path.join(process.cwd(), "data", "ideas-v2.json"));
    await replacePortfolio(v2, "test");
    const run5Text = fs.readFileSync(path.join(process.cwd(), "data", "run5.json"), "utf8");
    const preview = await previewImport(run5Text);
    assert.equal(preview.ideasAdded, 35);
    assert.equal(preview.ideasRescored, 16);
    await commitImport(run5Text, "test");
    const portfolio = await loadPortfolio();
    const golden = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "ideas-v3.json"), "utf8")) as {
      ideas: Record<string, unknown>[];
      bundles: Record<string, unknown>[];
      category_overrides: Record<string, unknown>;
    };
    const byId = new Map(portfolio.ideas.map((idea) => [idea.id, canonicalIdea(idea)]));
    assert.equal(portfolio.ideas.length, golden.ideas.length);
    for (const raw of golden.ideas) {
      assert.deepEqual(byId.get(String(raw.id)), canonicalFromFile(raw), String(raw.id));
    }
    assert.equal(portfolio.runs.length, 4);
    assert.deepEqual(canonicalBundle(portfolio.bundles[0]), golden.bundles[0]);
    assert.deepEqual(canonicalOverrides(portfolio.settings.categoryOverrides), golden.category_overrides);
    assert.ok(portfolio.bundles[0]?.revenueScenarios.low);
    assert.ok(portfolio.ideas.some((idea) => idea.categoryHistory.some((event) => event.note.length > 0)));
    assert.ok(portfolio.ideas.some((idea) => idea.scoreHistory.some((item) => item.run === 5 && item.note)));

    const moved = portfolio.ideas.find((idea) => idea.categoryHistory.length > 0);
    assert.ok(moved);
    const sampleScores = moved.scores;
    await commitImport(JSON.stringify({
      run: { run_number: 6, date: "2026-11-04", author: "Test", rubric_version: "2.0" },
      ideas: [
        {
          id: "share-house-ledger-roster",
          title: "Share-house ledger",
          category: "Household",
          platform: "Web",
          problem: "Who paid for the shared house this month.",
          target_users: "Share houses",
          monetisation: "Free feeder",
          price_hypothesis: "A$0",
          customer_type: "consumer",
          scores: sampleScores,
        },
        {
          id: moved.id,
          category: "Incoming only",
          scores: sampleScores,
        },
      ],
    }), "test");
    const sticky = await loadPortfolio();
    const overrideIdea = sticky.ideas.find((idea) => idea.id === "share-house-ledger-roster");
    assert.equal(overrideIdea?.category, "Life Admin");
    assert.deepEqual(overrideIdea?.secondaryCategories, ["Household"]);
    assert.equal(overrideIdea?.categoryHistory.at(-1)?.note, "auto: category_overrides");
    const held = sticky.ideas.find((idea) => idea.id === moved.id);
    assert.equal(held?.category, moved.category);
    assert.ok(held?.secondaryCategories.includes("Incoming only"));

    await commitImport(JSON.stringify({
      run: { run_number: 7, date: "2026-11-05", author: "Test", rubric_version: "2.0" },
      ideas: [{
        id: moved.id,
        category: "Pets",
        category_change: { from: moved.category, to: "Pets", note: "explicit move" },
        scores: sampleScores,
      }],
    }), "test");
    const changed = (await loadPortfolio()).ideas.find((idea) => idea.id === moved.id);
    assert.equal(changed?.category, "Pets");
    assert.ok(changed?.secondaryCategories.includes(moved.category));
    assert.equal(changed?.categoryHistory.at(-1)?.note, "explicit move");
  } finally {
    await closeDb();
  }
});

test("run 4 import matches the v4 research database and redirects aliases", async () => {
  const { closeDb } = await import("../src/lib/db");
  const { migrate } = await import("../src/lib/migrate");
  const { readResearchFile, replacePortfolio, commitImport, loadPortfolio, canonicalIdea, previewImport } = await import("../src/lib/store");
  const { canonicalBundle, canonicalOverrides } = await import("../src/lib/bundles");
  const { canonicalCluster, canonicalMethod } = await import("../src/lib/pain");
  try {
    await migrate();
    const v3 = readResearchFile(path.join(process.cwd(), "data", "ideas-v3.json"));
    await replacePortfolio(v3, "test");
    const run4Text = fs.readFileSync(path.join(process.cwd(), "data", "run4.json"), "utf8");
    const preview = await previewImport(run4Text);
    assert.equal(preview.ideasAdded, 17);
    assert.equal(preview.ideasRescored, 32);
    await commitImport(run4Text, "test");
    const portfolio = await loadPortfolio();
    const golden = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "ideas-v4.json"), "utf8")) as {
      ideas: Record<string, unknown>[];
      bundles: Record<string, unknown>[];
      category_overrides: Record<string, unknown>;
      pain_clusters: Record<string, unknown>[];
      pain_method: Record<string, unknown>;
      id_aliases: Record<string, string>;
    };
    const byId = new Map(portfolio.ideas.map((idea) => [idea.id, canonicalIdea(idea)]));
    assert.equal(portfolio.ideas.length, golden.ideas.length);
    for (const raw of golden.ideas) {
      assert.deepEqual(byId.get(String(raw.id)), canonicalFromFile(raw), String(raw.id));
    }
    assert.equal(portfolio.runs.map((run) => run.runNumber).join(","), "1,2,3,4,5");
    assert.equal(portfolio.runs.find((run) => run.runNumber === 4)?.ideasAdded, 17);
    assert.equal(portfolio.runs.find((run) => run.runNumber === 4)?.ideasRescored, 32);
    assert.match(portfolio.runs.find((run) => run.runNumber === 4)?.focus ?? "", /pain-point/);
    assert.deepEqual(canonicalOverrides(portfolio.settings.categoryOverrides), golden.category_overrides);
    assert.deepEqual(portfolio.settings.idAliases, golden.id_aliases);
    assert.equal(portfolio.settings.idAliases["notion-local-backup"], "saas-bulk-exporter-pattern");
    assert.deepEqual(canonicalMethod(portfolio.settings.painMethod!), golden.pain_method);
    assert.equal(portfolio.painClusters.length, golden.pain_clusters.length);
    const clusters = new Map(portfolio.painClusters.map((cluster) => [cluster.id, canonicalCluster(cluster)]));
    for (const raw of golden.pain_clusters) {
      assert.deepEqual(clusters.get(String(raw.id)), raw, String(raw.id));
    }
    assert.equal(portfolio.bundles.length, 1);
    assert.deepEqual(canonicalBundle(portfolio.bundles[0]), golden.bundles[0]);
    const folded = portfolio.ideas.find((idea) => idea.id === "saas-bulk-exporter-pattern");
    assert.equal(folded?.complaintFrequency, 2.4);
    assert.ok(folded?.scoreHistory.some((item) => item.run === 4 && item.note?.includes("scores unchanged")));
    const before = folded?.scoreHistory.find((item) => item.run === 3);
    const evidence = folded?.scoreHistory.find((item) => item.run === 4);
    assert.equal(evidence?.total, before?.total);
    assert.equal(portfolio.ideas.find((idea) => idea.id === "xero-invoice-chaser-lite")?.status, "candidate");
    assert.equal(portfolio.ideas.find((idea) => idea.id === "appstore-screenshot-maker")?.status, "candidate");
    assert.equal(portfolio.ideas.some((idea) => idea.id === "notion-local-backup"), false);

    const sample = portfolio.ideas.find((idea) => idea.id === "clean-recipe-box");
    assert.ok(sample);
    await commitImport(JSON.stringify({
      run: { run_number: 6, date: "2026-11-06", author: "Test", rubric_version: "2.0" },
      ideas: [{
        id: "notion-local-backup",
        notes: `${folded?.notes}\nAlias redirect check.`,
        scores: folded?.scores,
      }],
    }), "test");
    const after = await loadPortfolio();
    assert.equal(after.ideas.some((idea) => idea.id === "notion-local-backup"), false);
    assert.match(after.ideas.find((idea) => idea.id === "saas-bulk-exporter-pattern")?.notes ?? "", /Alias redirect check/);
    assert.equal(after.ideas.find((idea) => idea.id === "clean-recipe-box")?.complaintFrequency, sample.complaintFrequency);
  } finally {
    await closeDb();
  }
});

test("run 6 portfolio annotations match schema v5 without changing rubric totals", async () => {
  const { closeDb } = await import("../src/lib/db");
  const { migrate } = await import("../src/lib/migrate");
  const { readResearchFile, replacePortfolio, commitImport, loadPortfolio, canonicalIdea } = await import("../src/lib/store");
  const { canonicalPortfolio } = await import("../src/lib/portfolio");
  try {
    await migrate();
    const v4 = readResearchFile(path.join(process.cwd(), "data", "ideas-v4.json"));
    await replacePortfolio(v4, "test");
    const before = await loadPortfolio();
    const beforeHistory = new Map(before.ideas.map((idea) => [idea.id, idea.scoreHistory.length]));
    const beforeTotals = new Map(before.ideas.map((idea) => [idea.id, idea.researchTotal]));
    const run6Text = fs.readFileSync(path.join(process.cwd(), "data", "run6.json"), "utf8");
    const committed = await commitImport(run6Text, "test");
    assert.equal(committed.report.ideasAdded, 0);
    assert.equal(committed.report.ideasRescored, 0);
    const portfolio = await loadPortfolio();
    const golden = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "ideas.json"), "utf8")) as {
      ideas: Record<string, unknown>[];
      portfolio: Record<string, unknown>;
    };
    const byId = new Map(portfolio.ideas.map((idea) => [idea.id, canonicalIdea(idea)]));
    assert.equal(portfolio.ideas.length, golden.ideas.length);
    for (const raw of golden.ideas) {
      assert.deepEqual(byId.get(String(raw.id)), canonicalFromFile(raw), String(raw.id));
      assert.equal(portfolio.ideas.find((idea) => idea.id === raw.id)?.scoreHistory.length, beforeHistory.get(String(raw.id)));
      assert.equal(portfolio.ideas.find((idea) => idea.id === raw.id)?.researchTotal, beforeTotals.get(String(raw.id)));
    }
    assert.deepEqual(canonicalPortfolio(portfolio.settings.portfolio), golden.portfolio);
    assert.equal(portfolio.settings.schemaVersion, "5");
    assert.equal(portfolio.runs.map((run) => run.runNumber).join(","), "1,2,3,4,5,6");
    const run = portfolio.runs.find((item) => item.runNumber === 6);
    assert.equal(run?.ideasAdded, 0);
    assert.equal(run?.ideasRescored, 0);
    assert.match(run?.focus ?? "", /Portfolio lens/);
    assert.equal(portfolio.ideas.find((idea) => idea.id === "school-notice-digest")?.privacyClass, "");
    assert.equal(portfolio.ideas.find((idea) => idea.id === "xero-invoice-chaser-lite")?.privacyClass, "C-disq");
    await assert.rejects(
      () => commitImport(JSON.stringify({
        run: { run_number: 7, date: "2026-10-28", focus: "bad" },
        annotations: [{ id: "missing-idea", fields: { tier: "Park" } }],
      }), "test"),
      /not in the database/,
    );
    await assert.rejects(() => commitImport(run6Text, "test"), /already in the database/);
    const again = await loadPortfolio();
    assert.equal(again.ideas.find((idea) => idea.id === "gift-list-budget-tracker")?.scoreHistory.length, beforeHistory.get("gift-list-budget-tracker"));
    assert.equal(again.ideas.find((idea) => idea.id === "gift-list-budget-tracker")?.researchTotal, beforeTotals.get("gift-list-budget-tracker"));
  } finally {
    await closeDb();
  }
});
