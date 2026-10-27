import type { Scores } from "./criteria";
import type { PainCluster, PainMethod, PainQuote, Run4Merge } from "./types";

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function numOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
}

function sourceCounts(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  const counts: Record<string, number> = {};
  for (const [key, count] of Object.entries(value as Record<string, unknown>)) {
    if (typeof count === "number") counts[key] = count;
  }
  return counts;
}

export function aliasesFromUnknown(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const aliases: Record<string, string> = {};
  for (const [from, to] of Object.entries(value as Record<string, unknown>)) {
    if (typeof to === "string" && to && to !== from) aliases[from] = to;
  }
  return aliases;
}

export function resolveAlias(id: string, aliases: Record<string, string>): string {
  const seen = new Set<string>();
  let current = id;
  while (aliases[current] && !seen.has(current)) {
    seen.add(current);
    current = aliases[current];
  }
  return current;
}

export function run4MergeFromUnknown(value: unknown): Run4Merge[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (typeof row.run4_id !== "string") return [];
    const scores: Scores = {};
    if (row.suggested_scores && typeof row.suggested_scores === "object") {
      for (const [key, score] of Object.entries(row.suggested_scores as Record<string, unknown>)) {
        if (typeof score === "number") scores[key] = score;
      }
    }
    return [{
      run4Id: row.run4_id,
      title: typeof row.title === "string" ? row.title : row.run4_id,
      suggestedScores: scores,
      note: typeof row.note === "string" ? row.note : "",
    }];
  });
}

export function clusterFromUnknown(value: unknown): PainCluster | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.statement !== "string") return null;
  const subs = (row.subscores ?? {}) as Record<string, unknown>;
  const counts = (row.counts ?? {}) as Record<string, unknown>;
  const audit = counts.precision_audit as Record<string, unknown> | undefined;
  const communities = (row.communities ?? {}) as Record<string, unknown>;
  const engagement = (row.engagement ?? {}) as Record<string, unknown>;
  const reviews = (row.app_reviews ?? {}) as Record<string, unknown>;
  const quotes: PainQuote[] = Array.isArray(row.quotes)
    ? row.quotes.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const quote = item as Record<string, unknown>;
        if (typeof quote.url !== "string" || typeof quote.quote !== "string") return [];
        return [{
          quote: quote.quote,
          title: typeof quote.title === "string" ? quote.title : "",
          url: quote.url,
          community: typeof quote.community === "string" ? quote.community : "",
          date: typeof quote.date === "string" ? quote.date : null,
          score: numOrNull(quote.score),
          comments: numOrNull(quote.comments),
        }];
      })
    : [];
  return {
    id: row.id,
    rank: num(row.rank),
    statement: row.statement,
    customerType: typeof row.customer_type === "string" ? row.customer_type : "",
    cfs: num(row.cfs),
    subscores: {
      volume: num(subs.volume),
      breadth: num(subs.breadth),
      recency: num(subs.recency),
      engagement: num(subs.engagement),
    },
    counts: {
      mentions: num(counts.mentions),
      mentionsBroad: num(counts.mentions_broad),
      mentionsCapped: num(counts.mentions_capped),
      estRelevantMentions: num(counts.est_relevant_mentions),
      estRelevantPer100k: num(counts.est_relevant_per_100k_posts),
      bySource: sourceCounts(counts.by_source),
      selfPromoExcluded: num(counts.self_promo_posts_excluded),
      precisionUsed: num(counts.precision_used),
      precisionAudit: audit && typeof audit.relevant === "number" && typeof audit.sampled === "number"
        ? { relevant: audit.relevant, sampled: audit.sampled }
        : null,
    },
    communities: {
      count: num(communities.count),
      sourceTypes: num(communities.source_types),
      top: Array.isArray(communities.top)
        ? communities.top.flatMap((item) => {
            if (!item || typeof item !== "object") return [];
            const entry = item as Record<string, unknown>;
            if (typeof entry.name !== "string") return [];
            return [{ name: entry.name, mentions: num(entry.mentions) }];
          })
        : [],
    },
    recency24mShare: num(row.recency_24m_share),
    engagement: {
      engagedMentions: num(engagement.engaged_mentions),
      scoreSum: num(engagement.score_sum),
      commentsSum: num(engagement.comments_sum),
      scoreMedian: numOrNull(engagement.score_median),
      commentsMedian: numOrNull(engagement.comments_median),
    },
    appReviews: {
      reviewsSampled: numOrNull(reviews.reviews_sampled),
      appstoreLowStarShare: numOrNull(reviews.appstore_low_star_share),
      topLowStarThemes: Array.isArray(reviews.top_low_star_themes)
        ? reviews.top_low_star_themes.flatMap((item) => {
            if (!item || typeof item !== "object") return [];
            const theme = item as Record<string, unknown>;
            if (typeof theme.theme !== "string") return [];
            return [{ theme: theme.theme, shareOfLow: num(theme.share_of_low) }];
          })
        : [],
    },
    existingSolutions: strings(row.existing_solutions),
    whyPeopleStillComplain: typeof row.why_people_still_complain === "string" ? row.why_people_still_complain : "",
    quotes,
    linkedIdeaIds: strings(row.linked_idea_ids),
    relatedIdeaIds: strings(row.related_idea_ids),
  };
}

export function clustersFromUnknown(value: unknown): PainCluster[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const cluster = clusterFromUnknown(item);
    return cluster ? [cluster] : [];
  });
}

export function canonicalCluster(cluster: PainCluster) {
  return {
    id: cluster.id,
    rank: cluster.rank,
    statement: cluster.statement,
    customer_type: cluster.customerType,
    cfs: cluster.cfs,
    subscores: cluster.subscores,
    counts: {
      mentions: cluster.counts.mentions,
      mentions_broad: cluster.counts.mentionsBroad,
      mentions_capped: cluster.counts.mentionsCapped,
      est_relevant_mentions: cluster.counts.estRelevantMentions,
      est_relevant_per_100k_posts: cluster.counts.estRelevantPer100k,
      by_source: cluster.counts.bySource,
      self_promo_posts_excluded: cluster.counts.selfPromoExcluded,
      precision_used: cluster.counts.precisionUsed,
      precision_audit: cluster.counts.precisionAudit,
    },
    communities: {
      count: cluster.communities.count,
      source_types: cluster.communities.sourceTypes,
      top: cluster.communities.top,
    },
    recency_24m_share: cluster.recency24mShare,
    engagement: {
      engaged_mentions: cluster.engagement.engagedMentions,
      score_sum: cluster.engagement.scoreSum,
      comments_sum: cluster.engagement.commentsSum,
      score_median: cluster.engagement.scoreMedian,
      comments_median: cluster.engagement.commentsMedian,
    },
    app_reviews: {
      reviews_sampled: cluster.appReviews.reviewsSampled,
      appstore_low_star_share: cluster.appReviews.appstoreLowStarShare,
      top_low_star_themes: cluster.appReviews.topLowStarThemes.map((theme) => ({
        theme: theme.theme,
        share_of_low: theme.shareOfLow,
      })),
    },
    existing_solutions: cluster.existingSolutions,
    why_people_still_complain: cluster.whyPeopleStillComplain,
    quotes: cluster.quotes.map((quote) => ({
      quote: quote.quote,
      title: quote.title,
      url: quote.url,
      community: quote.community,
      date: quote.date,
      score: quote.score,
      comments: quote.comments,
    })),
    linked_idea_ids: cluster.linkedIdeaIds,
    related_idea_ids: cluster.relatedIdeaIds,
  };
}

export function methodFromUnknown(value: unknown): PainMethod | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const thresholds = (row.thresholds ?? {}) as Record<string, unknown>;
  const weights = (thresholds.weights ?? {}) as Record<string, unknown>;
  const notes = Array.isArray(row.coverage_notes) ? row.coverage_notes.filter((item): item is string => typeof item === "string") : [];
  if (typeof row.version !== "string" && notes.length === 0) return null;
  return {
    version: typeof row.version === "string" ? row.version : "",
    generated: typeof row.generated === "string" ? row.generated : "",
    doc: typeof row.doc === "string" ? row.doc : "",
    sourceFile: typeof row.source_file === "string" ? row.source_file : "",
    thresholds: {
      volume: Array.isArray(thresholds.volume_est_relevant_mentions_per_100k_posts) ? thresholds.volume_est_relevant_mentions_per_100k_posts.filter((item): item is number => typeof item === "number") : [],
      breadth: Array.isArray(thresholds.breadth_communities) ? thresholds.breadth_communities.filter((item): item is number => typeof item === "number") : [],
      recency: Array.isArray(thresholds.recency_24m_share) ? thresholds.recency_24m_share.filter((item): item is number => typeof item === "number") : [],
      engagement: Array.isArray(thresholds.engagement_engaged_mentions_x_precision_per_100k_posts) ? thresholds.engagement_engaged_mentions_x_precision_per_100k_posts.filter((item): item is number => typeof item === "number") : [],
      weights: {
        volume: num(weights.volume),
        breadth: num(weights.breadth),
        recency: num(weights.recency),
        engagement: num(weights.engagement),
      },
      perCommunityCap: num(thresholds.per_community_cap),
      defaultPrecisionUnaudited: num(thresholds.default_precision_unaudited),
    },
    coverageNotes: notes,
  };
}

export function canonicalMethod(method: PainMethod) {
  return {
    version: method.version,
    generated: method.generated,
    doc: method.doc,
    source_file: method.sourceFile,
    thresholds: {
      volume_est_relevant_mentions_per_100k_posts: method.thresholds.volume,
      breadth_communities: method.thresholds.breadth,
      recency_24m_share: method.thresholds.recency,
      engagement_engaged_mentions_x_precision_per_100k_posts: method.thresholds.engagement,
      weights: method.thresholds.weights,
      per_community_cap: method.thresholds.perCommunityCap,
      default_precision_unaudited: method.thresholds.defaultPrecisionUnaudited,
    },
    coverage_notes: method.coverageNotes,
  };
}

export function canonicalRun4Merge(items: Run4Merge[]) {
  return items.map((item) => ({
    run4_id: item.run4Id,
    title: item.title,
    suggested_scores: item.suggestedScores,
    note: item.note,
  }));
}
