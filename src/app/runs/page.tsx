import Link from "next/link";
import { withPortfolio } from "@/components/gate";
import { formatDate } from "@/lib/format";
import { RUN_ONE_FOCUS } from "@/lib/themes";

export const metadata = { title: "Runs" };

export default async function RunsPage() {
  return withPortfolio((portfolio) => (
    <div className="page">
      <header className="stack">
        <p className="kicker">Research log</p>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h1>Runs</h1>
          <Link className="btn btn-primary" href="/runs/import">Import a run</Link>
        </div>
        <p className="lede">Each run is a sweep of sources. New ids are added. An existing id, even a partial record with only scores and notes, is re-scored and appended to score history.</p>
      </header>
      {portfolio.runs.map((run) => {
        const added = portfolio.ideas.filter((idea) => idea.firstSeenRun === run.runNumber);
        const rescored = portfolio.ideas.filter((idea) => idea.lastScoredRun === run.runNumber && idea.firstSeenRun !== run.runNumber);
        return (
          <article key={run.runNumber} className="panel stack">
            <p className="kicker">Run {run.runNumber} · {formatDate(run.date)}</p>
            <h2>{run.focus || (run.runNumber === 1 ? "Baseline sweep" : `Run ${run.runNumber}`)}</h2>
            <p className="muted">{run.focus || (run.runNumber === 1 ? RUN_ONE_FOCUS : "")}</p>
            <p className="small">{run.author} · {run.ideasAdded} added · {run.ideasRescored} re-scored{run.rubricVersion ? ` · rubric ${run.rubricVersion}` : ""}</p>
            <p>{run.notes}</p>
            <div className="chips">{run.sourcesSwept.map((source) => <span key={source} className="badge">{source}</span>)}</div>
            <p className="small">
              <Link href={`/ideas?run=${run.runNumber}`}>{added.length} ideas first seen in this run</Link>
              {rescored.length ? ` · Re-scored: ${rescored.map((idea) => idea.title).join(", ")}` : ""}
              {run.runNumber === 4 ? <> · <Link href="/pain">Pain clusters</Link></> : null}
            </p>
          </article>
        );
      })}
    </div>
  ));
}
