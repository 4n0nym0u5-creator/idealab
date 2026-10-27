import Link from "next/link";
import { notFound } from "next/navigation";
import { SubscoreBars } from "@/components/pain-browser";
import { withPortfolio } from "@/components/gate";
import { formatDate } from "@/lib/format";

export default async function PainClusterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withPortfolio((portfolio) => {
    const cluster = portfolio.painClusters.find((item) => item.id === id);
    if (!cluster) notFound();
    const titles = new Map(portfolio.ideas.map((idea) => [idea.id, idea.title]));
    return (
      <div className="page">
        <p className="small"><Link href="/pain">Pain points</Link></p>
        <header className="feature">
          <div className="stack">
            <p className="kicker">Rank {cluster.rank} · {cluster.customerType || "unspecified"} · evidence, not scored</p>
            <h1>{cluster.statement}</h1>
            <p className="lede">{cluster.whyPeopleStillComplain}</p>
            <p className="small muted">{cluster.communities.count} communities · {cluster.communities.sourceTypes} source types · {Math.round(cluster.recency24mShare * 100)}% of mentions in the last 24 months</p>
          </div>
          <div>
            <div className="score-figure">{cluster.cfs.toFixed(2)}</div>
            <p className="faint small">CFS 1.0. Relative to this corpus.</p>
          </div>
        </header>
        <section className="grid-2">
          <article className="panel stack">
            <h2>Sub-scores</h2>
            <SubscoreBars cluster={cluster} />
            <p className="small">Volume {cluster.counts.estRelevantMentions.toFixed(1)} estimated relevant mentions ({cluster.counts.estRelevantPer100k.toFixed(1)} per 100k posts). Raw mentions {cluster.counts.mentions}, capped {cluster.counts.mentionsCapped}. Precision used {cluster.counts.precisionUsed}{cluster.counts.precisionAudit ? ` (${cluster.counts.precisionAudit.relevant}/${cluster.counts.precisionAudit.sampled} audited)` : ""}.</p>
          </article>
          <article className="panel stack">
            <h2>Where it showed up</h2>
            <div className="chips">{cluster.communities.top.map((item) => <span key={item.name} className="badge">{item.name} · {item.mentions}</span>)}</div>
            <p className="small">Engaged mentions {cluster.engagement.engagedMentions}. Score sum {cluster.engagement.scoreSum}, comments sum {cluster.engagement.commentsSum}.</p>
            {cluster.appReviews.topLowStarThemes.length ? (
              <p className="small">App-review themes: {cluster.appReviews.topLowStarThemes.map((theme) => `${theme.theme.replaceAll("_", " ")} ${Math.round(theme.shareOfLow * 100)}%`).join(", ")}.</p>
            ) : null}
            {cluster.existingSolutions.length ? <p className="small">Existing solutions: {cluster.existingSolutions.join(", ")}.</p> : null}
          </article>
        </section>
        <section className="panel stack">
          <h2>Linked ideas</h2>
          <IdeaLinks ids={cluster.linkedIdeaIds} titles={titles} />
          {cluster.relatedIdeaIds.length ? (
            <>
              <h3>Related</h3>
              <IdeaLinks ids={cluster.relatedIdeaIds} titles={titles} />
            </>
          ) : null}
        </section>
        <section className="panel stack">
          <h2>Quotes</h2>
          {cluster.quotes.length ? cluster.quotes.map((quote) => (
            <blockquote key={quote.url} className="stack">
              <p>{quote.quote}</p>
              <p className="small"><a href={quote.url}>{quote.title || quote.url}</a>{quote.community ? ` · ${quote.community}` : ""}{quote.date ? ` · ${formatDate(quote.date)}` : ""}{quote.score != null ? ` · score ${quote.score}` : ""}{quote.comments != null ? ` · ${quote.comments} comments` : ""}</p>
            </blockquote>
          )) : <p className="small muted">This cluster has counts and no stored verbatim quote.</p>}
        </section>
      </div>
    );
  });
}

function IdeaLinks({ ids, titles }: { ids: string[]; titles: Map<string, string> }) {
  return (
    <div className="list">
      {ids.map((id) => (
        <div key={id} className="row"><Link href={`/ideas/${id}`}>{titles.get(id) ?? id}</Link></div>
      ))}
    </div>
  );
}
