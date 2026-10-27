"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DEFAULT_ORDER, criteriaInOrder } from "@/lib/criteria";
import { liabilitySentences } from "@/lib/format";
import { workingScores } from "@/lib/scoring";
import type { Idea } from "@/lib/types";
import { ScoreRadar, SERIES_COLORS } from "./charts";
import { tierLabel } from "@/lib/bundles";
import { CustomerBadge, StatusBadge } from "./ui";

export function CompareView({ ideas, initialIds, criteriaOrder }: { ideas: Idea[]; initialIds: string[]; criteriaOrder?: string[] }) {
  const criteria = criteriaInOrder(criteriaOrder?.length ? criteriaOrder : DEFAULT_ORDER);
  const [ids, setIds] = useState<string[]>(initialIds.slice(0, 4));
  const [query, setQuery] = useState("");
  const selected = ids.map((id) => ideas.find((idea) => idea.id === id)).filter((idea): idea is Idea => Boolean(idea));
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ideas.filter((idea) => !ids.includes(idea.id) && (!needle || `${idea.title} ${idea.category}`.toLowerCase().includes(needle))).slice(0, 8);
  }, [ideas, ids, query]);

  function add(id: string) {
    setIds((current) => current.includes(id) || current.length >= 4 ? current : [...current, id]);
  }
  function remove(id: string) {
    setIds((current) => current.filter((item) => item !== id));
  }

  return (
    <div className="page page-wide">
      <header className="stack">
        <p className="kicker">Compare</p>
        <h1>Two to four ideas, side by side.</h1>
        <p className="lede">The highest score in a row is marked. Five is always the better outcome, including legal safety, build effort and maintenance.</p>
      </header>
      <div className="panel stack">
        <input className="control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find an idea to add" aria-label="Find an idea" />
        <div className="chips">
          {matches.map((idea) => (
            <button key={idea.id} className="chip" type="button" onClick={() => add(idea.id)} disabled={ids.length >= 4}>{idea.title}</button>
          ))}
        </div>
        <div className="chips">
          {selected.map((idea) => <button key={idea.id} className="chip" type="button" data-on="true" onClick={() => remove(idea.id)}>{idea.title} ×</button>)}
        </div>
      </div>
      {selected.length < 2 ? <p className="muted">Choose at least two ideas.</p> : (
        <>
          <div className="panel">
            <ScoreRadar criteria={criteria} series={selected.map((idea, index) => ({ name: idea.title, scores: workingScores(idea), color: SERIES_COLORS[index % SERIES_COLORS.length] }))} />
          </div>
          <div className="table-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Field</th>
                  {selected.map((idea) => <th key={idea.id}><Link href={`/ideas/${idea.id}`}>{idea.title}</Link></th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total</td>
                  {selected.map((idea) => <td key={idea.id} className={best(selected.map((item) => item.total), idea.total) ? "best num" : "num"}>{idea.total.toFixed(1)}</td>)}
                </tr>
                <tr>
                  <td>Status</td>
                  {selected.map((idea) => <td key={idea.id}><StatusBadge status={idea.status} /></td>)}
                </tr>
                <tr>
                  <td>Customer</td>
                  {selected.map((idea) => <td key={idea.id}><CustomerBadge type={idea.customerType} /></td>)}
                </tr>
                <tr>
                  <td>AI-buildability</td>
                  {selected.map((idea) => <td key={idea.id} className="small">{workingScores(idea).aibuild ?? "—"}/5{idea.aibuildReason ? ` — ${idea.aibuildReason}` : ""}</td>)}
                </tr>
                <tr>
                  <td>Category</td>
                  {selected.map((idea) => <td key={idea.id}>{idea.category}{idea.secondaryCategories.length ? <div className="small faint">{idea.secondaryCategories.join(", ")}</div> : null}</td>)}
                </tr>
                <tr>
                  <td>Complaint frequency <span className="faint">evidence, not scored</span></td>
                  {selected.map((idea) => <td key={idea.id}>{idea.complaintFrequency == null ? "—" : idea.complaintFrequency.toFixed(2)}</td>)}
                </tr>
                <tr>
                  <td>Portfolio fit <span className="faint">not scored</span></td>
                  {selected.map((idea) => <td key={idea.id}>{idea.portfolioFit ? idea.portfolioFit.score.toFixed(1) : "—"}{idea.tier ? ` · ${idea.tier}` : ""}</td>)}
                </tr>
                <tr>
                  <td>Privacy</td>
                  {selected.map((idea) => <td key={idea.id}>{idea.privacyClass === "C-disq" ? "needs server-held personal data" : (idea.privacyClass || "—")}</td>)}
                </tr>
                <tr>
                  <td>Bundle fit</td>
                  {selected.map((idea) => <td key={idea.id}>{idea.bundleFit ? `${tierLabel(idea.bundleFit.tier)} · ${idea.bundleFit.module}` : "—"}</td>)}
                </tr>
                <tr>
                  <td>Price</td>
                  {selected.map((idea) => <td key={idea.id}>{idea.priceHypothesis}</td>)}
                </tr>
                {criteria.map((criterion) => (
                  <tr key={criterion.key}>
                    <td>{criterion.label}</td>
                    {selected.map((idea) => {
                      const score = workingScores(idea)[criterion.key] ?? 0;
                      const values = selected.map((item) => workingScores(item)[criterion.key] ?? 0);
                      return <td key={idea.id} className={best(values, score) ? "best num" : "num"}>{score}</td>;
                    })}
                  </tr>
                ))}
                <tr>
                  <td>Monetisation</td>
                  {selected.map((idea) => <td key={idea.id} className="small">{idea.monetisation}</td>)}
                </tr>
                <tr>
                  <td>Problem</td>
                  {selected.map((idea) => <td key={idea.id} className="small">{idea.problem}</td>)}
                </tr>
                <tr>
                  <td>Liability</td>
                  {selected.map((idea) => <td key={idea.id} className="small">{liabilitySentences(idea.notes, idea.liabilityNotes).slice(0, 2).join(" ") || "—"}</td>)}
                </tr>
                <tr>
                  <td>Flags</td>
                  {selected.map((idea) => <td key={idea.id} className="small">{[...idea.killFlags.map((flag) => `Kill: ${flag}`), ...idea.avoidFlags.map((flag) => `Avoid: ${flag}`)].join("; ") || "—"}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function best(values: number[], value: number) {
  return value === Math.max(...values) && values.filter((item) => item === value).length === 1;
}
