"use client";

import { useMemo, useState } from "react";
import { CRITERION_LABELS, evaluate, RECOMMENDED, walkthrough, type Choice } from "@/lib/hint-tell-explorer";

const WEIGHTS = walkthrough.rubric_weights;

export function HowItWorksExplorer() {
  const [choice, setChoice] = useState<Choice>({ ...RECOMMENDED });
  const result = useMemo(() => evaluate(choice), [choice]);
  const recommended = useMemo(() => evaluate(RECOMMENDED), []);
  const isRecommended = (Object.keys(RECOMMENDED) as (keyof Choice)[]).every((key) => choice[key] === RECOMMENDED[key]);
  const platform = walkthrough.decisions.find((item) => item.id === "platform") as { why?: Record<string, string> } | undefined;
  const reasoning = platform?.why?.[choice.platform] ?? "";

  return (
    <div className="stack">
      <div className="choice-grid">
        {walkthrough.decisions.map((decision) => (
          <label key={decision.id} className="field">
            {decision.q}
            <select
              className="control"
              value={choice[decision.id as keyof Choice]}
              onChange={(event) => setChoice({ ...choice, [decision.id]: event.target.value })}
            >
              {decision.options.map((option) => <option key={option.v} value={option.v}>{option.label}</option>)}
            </select>
          </label>
        ))}
        <div className="field">
          <span>Path</span>
          <button type="button" className="btn" onClick={() => setChoice({ ...RECOMMENDED })}>Reset to recommended</button>
        </div>
      </div>
      <section className="grid-4">
        <article className="stat">
          <b>{result.privacy === "C-disq" ? "Disqualified" : result.total.toFixed(1)}</b>
          <span>Rubric total</span>
          <p className="small faint">Recommended {recommended.total.toFixed(1)}</p>
        </article>
        <article className="stat">
          <b>{result.fit.toFixed(1)}</b>
          <span>Portfolio fit</span>
          <p className="small faint">Recommended {recommended.fit.toFixed(1)}</p>
        </article>
        <article className="stat">
          <b>{result.privacy === "C-disq" ? "Disqualified" : result.privacy}</b>
          <span>Privacy class</span>
        </article>
        <article className="stat">
          <b aria-label={`${result.effort} of 8`}>{"●".repeat(result.effort)}{"○".repeat(Math.max(0, 8 - result.effort))}</b>
          <span>Build effort</span>
          <p className="small faint">Relative, out of 8</p>
        </article>
      </section>
      <p className={result.privacy === "C-disq" ? "callout danger" : "callout good"}>
        {result.privacy === "C-disq" ? "Disqualified. Cloud speech plus recording sends family voices to a third-party server." : isRecommended ? "This is the recommended v1 path." : "Custom path."}
      </p>
      <div className="grid-2">
        <div className="stack">
          <h3>What the product becomes</h3>
          <ul>{result.product.map((item) => <li key={item}>{item}</li>)}</ul>
          <p><strong>Cost.</strong> {result.cost}</p>
          {reasoning ? <p><strong>Platform.</strong> {reasoning}</p> : null}
        </div>
        <div className="stack">
          <h3>Consequences</h3>
          {result.notes.length ? result.notes.map((note) => (
            <p key={note} className={note.startsWith("DISQ") ? "callout danger" : "callout"}>{note}</p>
          )) : <p className="callout good">No extra risks beyond the base path.</p>}
        </div>
      </div>
      <details className="rubric">
        <summary><strong>Criterion scores</strong><span className="small faint">{walkthrough.explorer.note}</span></summary>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Criterion</th><th>Weight</th><th>Score</th><th>Recommended</th></tr></thead>
            <tbody>
              {Object.keys(WEIGHTS).map((key) => (
                <tr key={key}>
                  <td>{CRITERION_LABELS[key]}</td>
                  <td className="num">{WEIGHTS[key as keyof typeof WEIGHTS]}</td>
                  <td className="num">{result.scores[key]}</td>
                  <td className="num">{recommended.scores[key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
