"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { commitImportAction, previewImportAction } from "@/lib/actions";
import type { IdeaChange, ImportReport } from "@/lib/merge";
import { StatusBadge } from "./ui";

export function ImportFlow() {
  const [text, setText] = useState("");
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onFile(file: File | undefined) {
    if (!file) return;
    file.text().then((value) => { setText(value); setReport(null); setError(""); setDone(""); });
  }

  function preview() {
    setError("");
    setDone("");
    startTransition(async () => {
      const result = await previewImportAction(text);
      if (!result.ok) {
        setReport(null);
        setError(result.error);
        return;
      }
      setReport(result.report);
    });
  }

  function commit() {
    setError("");
    startTransition(async () => {
      const result = await commitImportAction(text);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(`Merged run ${result.report.runNumber}. Backup: ${result.backupPath}`);
      setReport(result.report);
      router.refresh();
    });
  }

  return (
    <div className="page">
      <header className="stack">
        <p className="kicker"><Link href="/runs">Runs</Link></p>
        <h1>Import a research run</h1>
        <p className="lede">
          Drop a run file shaped like <code>data/run2.json</code>: a <code>run</code> object plus <code>ideas</code>.
          A new idea needs the full record. An existing id can be a partial update with only scores, evidence and notes.
          Ideas are deduped by id, and every touch adds a score-history point.
        </p>
      </header>
      <div className="drop stack" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); onFile(event.dataTransfer.files[0]); }}>
        <input type="file" accept="application/json,.json" aria-label="Run JSON file" onChange={(event) => onFile(event.target.files?.[0])} />
        <textarea value={text} onChange={(event) => { setText(event.target.value); setReport(null); }} placeholder='{"run":{"run_number":3,"date":"2026-11-01","author":"You","focus":"","sources_swept":[],"notes":""},"ideas":[{"id":"saas-bulk-exporter-pattern","scores":{"legal":4,"pain":4,"breadth":3,"wtp":4,"recurring":4,"build":4,"maint":3,"distro":5,"compete":4,"defend":2,"synergy":5,"platform":2},"notes":"R3: partial rescore."}]}' aria-label="Run JSON" />
        <div className="filters">
          <button className="btn btn-primary" type="button" disabled={pending || text.trim().length < 2} onClick={preview}>Preview merge</button>
          <a className="btn" href="/api/export">Download a backup first</a>
        </div>
        {error ? <p className="callout danger">{error}</p> : null}
        {done ? <p className="small">{done} <Link href="/runs">View the log</Link></p> : null}
      </div>
      {report ? (
        <section className="stack">
          <div className="panel stack">
            <h2>Run {report.runNumber} · {report.date}</h2>
            <p>{report.focus || report.notes}</p>
            <p className="small muted">{report.author} · {report.added.length} new · {report.updated.length} updates · {report.duplicates.length} duplicates · {report.totalAfter} ideas after merge. Duplicates still get a history point, matching the research merge.</p>
            <div className="chips">{report.sources.map((source) => <span key={source} className="badge">{source}</span>)}</div>
          </div>
          <ChangeList title="Additions" rows={report.added} />
          <ChangeList title="Updates" rows={report.updated} />
          <ChangeList title="Duplicates" rows={report.duplicates} />
          <div className="grid-2">
            <div className="panel">
              <h3>Entering the shortlist</h3>
              {report.shortlistEntered.length ? report.shortlistEntered.map((idea) => <p key={idea.id}>{idea.title}</p>) : <p className="small muted">No change.</p>}
            </div>
            <div className="panel">
              <h3>Leaving the shortlist</h3>
              {report.shortlistLeft.length ? report.shortlistLeft.map((idea) => <p key={idea.id}>{idea.title}</p>) : <p className="small muted">No change.</p>}
            </div>
          </div>
          <button className="btn btn-primary" type="button" disabled={pending} onClick={commit}>Merge into the database</button>
        </section>
      ) : null}
    </div>
  );
}

function ChangeList({ title, rows }: { title: string; rows: IdeaChange[] }) {
  if (!rows.length) return null;
  return (
    <div className="panel stack">
      <h3>{title}</h3>
      {rows.map((row) => (
        <article key={row.id} className="stack" style={{ gap: 4, borderTop: "1px solid var(--line)", paddingTop: 8 }}>
          <div className="chips">
            <strong>{row.title || row.id}</strong>
            <StatusBadge status={row.status} />
            {row.partial ? <span className="badge">Partial update</span> : null}
            <span className="num">{row.previousTotal != null ? `${row.previousTotal.toFixed(1)} → ` : ""}{row.total.toFixed(1)}</span>
          </div>
          {row.scoreDiffs.length ? <p className="small">{row.scoreDiffs.map((diff) => `${diff.key} ${diff.from}→${diff.to}`).join(" · ")}</p> : null}
          {row.evidenceAdded.length ? <p className="small muted">Evidence: {row.evidenceAdded.length} new or revised</p> : null}
          {row.notesChanged ? <p className="small muted">Notes replaced</p> : null}
          {row.competitorsAdded.length ? <p className="small muted">Competitors added: {row.competitorsAdded.join(", ")}</p> : null}
          {row.killFlagsAdded.length ? <p className="small">Kill flags: {row.killFlagsAdded.join(", ")}</p> : null}
          {row.avoidFlagsAdded.length ? <p className="small">Avoid flags: {row.avoidFlagsAdded.join(", ")}</p> : null}
        </article>
      ))}
    </div>
  );
}
