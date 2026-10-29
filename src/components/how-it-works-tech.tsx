"use client";

import { useState } from "react";
import { walkthrough } from "@/lib/hint-tell-explorer";

export function HowItWorksTech() {
  const [id, setId] = useState("stt");
  const component = walkthrough.components.find((item) => item.id === id) ?? walkthrough.components[0];

  return (
    <div className="stack">
      <label className="field">
        Component
        <select className="control" value={component.id} onChange={(event) => setId(event.target.value)}>
          {walkthrough.components.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <h3>{component.name}</h3>
      <p>{component.what}</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Option</th><th>Pros</th><th>Cons</th><th>Source</th></tr></thead>
          <tbody>
            {component.options.map((option) => (
              <tr key={option.o}>
                <td>{option.o}</td>
                <td>{option.pro}</td>
                <td className={option.con.startsWith("DISQ") || option.con.startsWith("BREAKS") ? "bad-cell" : undefined}>{option.con}</td>
                <td>{option.src ? <a href={option.src}>Source</a> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p><strong>Our pick.</strong> {component.pick}</p>
      <p><strong>Device requirements.</strong> {component.device}</p>
      <p><strong>Caveat.</strong> {component.caveat}</p>
      {"benchmarks" in component && component.benchmarks ? (
        <>
          <h3>Published word-error rates</h3>
          <p className="small faint">Lower is better. These figures are quoted from the sources.</p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Engine</th><th>WER</th><th>Test</th></tr></thead>
              <tbody>
                {component.benchmarks.map((row) => (
                  <tr key={row.join("|")}><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="callout">
            <strong>Read speech, not dinner tables.</strong>
            <p>These are vendor or blog tests on clean read speech. Accuracy with kids, accents, cross-talk and clatter will be lower. Audio is always kept and the transcript is editable. Experiment E3 measures real error rates.</p>
          </div>
        </>
      ) : null}
    </div>
  );
}
