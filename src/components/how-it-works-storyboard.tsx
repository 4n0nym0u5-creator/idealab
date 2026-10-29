"use client";

import { useEffect, useState } from "react";
import { walkthrough } from "@/lib/hint-tell-explorer";

const PHASES = ["All", "Before the night", "Each round", "End of night", "Next morning", "A week later", "Next game"];

export function HowItWorksStoryboard({ captions }: { captions: Record<string, string> }) {
  const steps = walkthrough.storyboard;
  const [stepId, setStepId] = useState(steps[0].id);
  const [phase, setPhase] = useState("All");
  const index = Math.max(0, steps.findIndex((step) => step.id === stepId));
  const current = steps[index];
  const shown = steps.filter((step) => phase === "All" || step.phase === phase);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (event.key === "ArrowRight") setStepId(steps[Math.min(steps.length - 1, index + 1)].id);
      if (event.key === "ArrowLeft") setStepId(steps[Math.max(0, index - 1)].id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, steps]);

  return (
    <div className="stack">
      <div className="chips" role="tablist" aria-label="Phase">
        {PHASES.map((item) => (
          <button
            key={item}
            type="button"
            className="chip"
            data-on={phase === item}
            onClick={() => {
              setPhase(item);
              const first = steps.find((step) => item === "All" || step.phase === item);
              if (first) setStepId(first.id);
            }}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="chips" aria-label="Steps">
        {shown.map((step) => (
          <button key={step.id} type="button" className="chip" data-on={step.id === current.id} onClick={() => setStepId(step.id)}>
            {step.n}. {step.title}
          </button>
        ))}
      </div>
      <div className="grid-2 walk-split">
        <img src={`/mockups/memory-game/walkthrough/${current.png}`} alt={captions[current.png] ?? current.title} />
        <article className="stack">
          <p className="kicker">Step {current.n} of 15 · {current.phase} · {current.time}</p>
          <h3>{current.title}</h3>
          <p><strong>Player sees.</strong> {current.sees}</p>
          <p><strong>Player does.</strong> {current.does}</p>
          <p><strong>Behind the scenes.</strong> {current.behind}</p>
          <p><strong>How long.</strong> {current.time}</p>
          <p><strong>Why it is intuitive.</strong> {current.why}</p>
          <div className="chips">
            <button type="button" className="btn" disabled={index === 0} onClick={() => setStepId(steps[index - 1].id)}>Previous</button>
            <button type="button" className="btn btn-primary" disabled={index === steps.length - 1} onClick={() => setStepId(steps[index + 1].id)}>Next</button>
          </div>
          <p className="small faint">{current.new ? "New screen for this walkthrough." : `Reused from Run 11: ${current.reused}.`}</p>
        </article>
      </div>
      <details className="rubric">
        <summary><strong>The whole night</strong><span className="small faint">All 15 steps</span></summary>
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Step</th><th>Sees</th><th>Does</th><th>Behind the scenes</th><th>Time</th></tr></thead>
            <tbody>
              {steps.map((step) => (
                <tr key={step.id}><td>{step.n}</td><td>{step.title}</td><td>{step.sees}</td><td>{step.does}</td><td>{step.behind}</td><td>{step.time}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
