import Link from "next/link";
import { PainBrowser } from "@/components/pain-browser";
import { withPortfolio } from "@/components/gate";
import type { PainCluster, PainMethod } from "@/lib/types";

export const metadata = { title: "Pain points" };

export default async function PainPage() {
  return withPortfolio((portfolio) => {
    const highest = portfolio.painClusters.reduce((max, cluster) => Math.max(max, cluster.cfs), 0);
    return (
      <div className="page page-wide">
        <header className="stack">
          <p className="kicker">Run 4 · CFS 1.0 · evidence, not scored</p>
          <h1>Pain points</h1>
          <p className="lede">
            {portfolio.painClusters.length} complaint clusters from forum posts. Complaint frequency guides the pain score and breaks display ties. It is not a weighted criterion, and the rubric stays at {portfolio.settings.rubricVersion}.
          </p>
        </header>
        <MethodNotes method={portfolio.settings.painMethod} highest={highest} count={portfolio.painClusters.length} />
        {portfolio.painClusters.length ? <PainBrowser clusters={portfolio.painClusters} ideas={portfolio.ideas} /> : <p>No pain clusters have been imported yet.</p>}
        <p className="small"><Link href="/runs">Research log</Link></p>
      </div>
    );
  });
}

function MethodNotes({ method, highest, count }: { method: PainMethod | null; highest: number; count: number }) {
  return (
    <section className="panel stack">
      <h2>Method and caveats</h2>
      <ul>
        <li>No cluster reached widespread. The highest CFS in this set of {count} is {highest.toFixed(2)}, and widespread would be 4 or 5.</li>
        <li>Scores are relative to this corpus. They are not a census of demand, and a low CFS can mean the topic was not covered.</li>
        <li>Posts only. Reddit comments were not mined, so a long argument under one post counts once.</li>
        <li>Whirlpool and Quora returned 403 to automated fetches. ProductReview.com.au was not mined.</li>
      </ul>
      {method ? (
        <>
          <p className="small muted">{method.version}{method.generated ? ` · generated ${method.generated}` : ""}. Weights: volume {method.thresholds.weights.volume}, breadth {method.thresholds.weights.breadth}, recency {method.thresholds.weights.recency}, engagement {method.thresholds.weights.engagement}. Per-community cap {method.thresholds.perCommunityCap}. Unaudited precision {method.thresholds.defaultPrecisionUnaudited}.</p>
          <ul className="small">{method.coverageNotes.map((note) => <li key={note}>{note}</li>)}</ul>
        </>
      ) : null}
    </section>
  );
}
