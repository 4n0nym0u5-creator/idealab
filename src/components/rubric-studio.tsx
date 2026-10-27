"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ANCHORS, CRITERIA, FEEDER_RULE, KILL_CRITERIA, PORTFOLIO_SHELLS, SECURITY_LEGAL_ADDENDUM, TIE_BREAKERS, type Weights } from "@/lib/criteria";
import { saveWeightsAction } from "@/lib/actions";
import { assignPresentation, normalizeWeights, recompute } from "@/lib/scoring";
import type { Idea, RubricChange } from "@/lib/types";

export function RubricStudio({ ideas, weights, version, changes }: { ideas: Idea[]; weights: Weights; version: string; changes: RubricChange[] }) {
  const [draft, setDraft] = useState<Weights>(weights);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const sum = CRITERIA.reduce((total, criterion) => total + (draft[criterion.key] || 0), 0);
  const dirty = CRITERIA.some((criterion) => draft[criterion.key] !== weights[criterion.key]);

  const preview = useMemo(() => {
    const clones = ideas.map((idea) => structuredClone(idea));
    recompute(clones, draft);
    return assignPresentation(clones);
  }, [ideas, draft]);
  const currentRank = new Map(ideas.map((idea) => [idea.id, idea.rank]));

  function setWeight(key: keyof Weights, value: number) {
    setDraft((current) => ({ ...current, [key]: Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0 }));
  }

  function save() {
    setMessage("");
    startTransition(async () => {
      const result = await saveWeightsAction({ weights: draft, note });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage(`Saved as rubric ${result.version}. Totals and the shortlist were recomputed.`);
      setNote("");
      router.refresh();
    });
  }

  const ranked = preview.filter((idea) => idea.status !== "killed" && idea.status !== "avoid").slice(0, 12);

  return (
    <div className="page">
      <header className="stack">
        <p className="kicker">Rubric {version}</p>
        <h1>Weights you can argue with.</h1>
        <p className="lede">Total = Σ (score ÷ 5 × weight), from 0 to 100. Five is always good for the builder. Inverted criteria are already flipped. Changing a weight recomputes every total. Level definitions stay put, because those are judgment, not arithmetic.</p>
      </header>

      <section className="grid-2">
        <div className="panel stack">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <h2>Weights</h2>
            <strong className={sum === 100 ? "muted" : ""} style={{ color: sum === 100 ? "var(--good)" : "var(--clay)" }}>{sum} / 100</strong>
          </div>
          {CRITERIA.map((criterion) => (
            <label key={criterion.key} className="stack" style={{ gap: 4 }}>
              <span style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{criterion.label}{criterion.inverted ? <span className="faint"> · inverted</span> : null}</span>
                <input className="control" style={{ width: 72 }} type="number" min={0} max={100} value={draft[criterion.key]} onChange={(event) => setWeight(criterion.key, Number(event.target.value))} />
              </span>
              <input type="range" min={0} max={30} value={Math.min(30, draft[criterion.key])} onChange={(event) => setWeight(criterion.key, Number(event.target.value))} aria-label={`${criterion.label} weight`} />
              <span className="track"><span style={{ width: `${draft[criterion.key]}%` }} /></span>
            </label>
          ))}
          <label className="field">Note for the rubric log
            <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Why the weights moved" />
          </label>
          <div className="filters">
            <button className="btn btn-primary" type="button" disabled={pending || sum !== 100 || !dirty} onClick={save}>Save and rescore</button>
            <button className="btn" type="button" onClick={() => setDraft(normalizeWeights(draft))}>Normalize to 100</button>
            <button className="btn btn-ghost" type="button" onClick={() => setDraft(weights)}>Reset</button>
          </div>
          {sum !== 100 ? <p className="small" style={{ color: "var(--clay)" }}>Weights need to sum to 100 before they can be saved.</p> : null}
          {message ? <p className="small muted">{message}</p> : null}
        </div>
        <div className="panel stack">
          <h2>Live ranking</h2>
          <p className="small faint">This preview uses the draft weights. Automatic statuses move with them. Locked pipeline statuses stay put.</p>
          <div className="list">
            {ranked.map((idea) => {
              const before = currentRank.get(idea.id);
              const delta = before && idea.rank ? before - idea.rank : 0;
              return (
                <div key={idea.id} className="row">
                  <span className="num">{idea.rank}</span>
                  <span>
                    <strong>{idea.title}</strong>
                    <div className="small faint">{idea.status}{delta ? ` · ${delta > 0 ? "up" : "down"} ${Math.abs(delta)}` : ""}</div>
                  </span>
                  <span className="num">{idea.total.toFixed(1)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Level definitions</h2>
        {CRITERIA.map((criterion) => (
          <details key={criterion.key} className="rubric">
            <summary>
              <strong>{criterion.label}</strong>
              <span className="faint small">{criterion.question} · weight {weights[criterion.key]}</span>
            </summary>
            <ol className="levels">
              {criterion.levels.map((level, score) => <li key={level}><b>{score}</b><span>{level}</span></li>)}
            </ol>
          </details>
        ))}
      </section>

      <section className="grid-2">
        <article className="callout danger">
          <h2>Hard kill criteria</h2>
          <p className="small">These set status to killed no matter the total. Record the reason in kill flags. A killed idea stays in the file.</p>
          <ol className="small">{KILL_CRITERIA.map((rule) => <li key={rule}>{rule}</li>)}</ol>
        </article>
        <article className="panel stack">
          <h2>Feeder rule and tie-breaks</h2>
          <p className="small">{FEEDER_RULE}</p>
          <ol className="small">{TIE_BREAKERS.map((item) => <li key={item.key}>{item.text}</li>)}</ol>
          <h3>Portfolio shells</h3>
          <ul className="small">{PORTFOLIO_SHELLS.map((shell) => <li key={shell}>{shell}</li>)}</ul>
        </article>
      </section>

      <section className="panel stack">
        <p className="kicker">Run 2 addendum</p>
        <h2>{SECURITY_LEGAL_ADDENDUM.title}</h2>
        <p className="small muted">{SECURITY_LEGAL_ADDENDUM.versionNote}</p>
        <ul className="small">{SECURITY_LEGAL_ADDENDUM.levels.map((level) => <li key={level.score}><strong>{level.score}.</strong> {level.text}</li>)}</ul>
        <ul className="small">{SECURITY_LEGAL_ADDENDUM.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
      </section>

      <section className="panel">
        <h2>Calibration anchors</h2>
        <div className="table-wrap" style={{ border: 0 }}>
          <table>
            <thead>
              <tr><th>Anchor</th>{CRITERIA.map((criterion) => <th key={criterion.key}>{criterion.short}</th>)}</tr>
            </thead>
            <tbody>
              {ANCHORS.map((anchor) => (
                <tr key={anchor.name}>
                  <td><strong>{anchor.name}</strong><div className="small faint">{anchor.note}</div></td>
                  {CRITERIA.map((criterion) => <td key={criterion.key} className="num">{anchor.scores[criterion.key] ?? "—"}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {changes.length ? (
        <section className="panel stack">
          <h2>Weight log</h2>
          {changes.map((change) => (
            <p key={change.id} className="small">Rubric {change.fromVersion} → {change.toVersion}. {change.note}</p>
          ))}
        </section>
      ) : null}
    </div>
  );
}
