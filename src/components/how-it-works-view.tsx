import Link from "next/link";
import { HowItWorksExplorer } from "./how-it-works-explorer";
import { HowItWorksStoryboard } from "./how-it-works-storyboard";
import { HowItWorksTech } from "./how-it-works-tech";
import { walkthrough } from "@/lib/hint-tell-explorer";

const rulesCaption = walkthrough.mockups.find((item) => item.file === "g_rules_card.png")?.caption ?? "Rules on one card";
const flowCaption = walkthrough.mockups.find((item) => item.file === "g_dataflow.png")?.caption ?? "Data flow";
const captions = Object.fromEntries(walkthrough.mockups.map((item) => [item.file, item.caption]));
const family = walkthrough.family.map((person) => `${person.name} ${person.age}`).join(", ");

export function HowItWorksView() {
  const intuitive = walkthrough.intuitiveness;
  return (
    <div className="page">
      <header className="stack">
        <p className="kicker">Run 11b · companion to the Memory Game page</p>
        <h1>Hint &amp; Tell: how it works</h1>
        <p className="lede">A screen-by-screen walk through one family&apos;s game night, plus the technology behind it and an explorer for the build decisions.</p>
        <p><Link href="/memory-game">← Back to Memory Game</Link></p>
        <p className="small faint">The family ({family}) is fictional. Timings and learn-times are design targets, not measurements.</p>
      </header>

      <section className="grid-4">
        <article className="stat"><b>15</b><span>Screens</span><p className="small faint">From unbox to the next game.</p></article>
        <article className="stat"><b>&lt; 2 min</b><span>To learn</span><p className="small faint">Design target.</p></article>
        <article className="stat"><b>1</b><span>Phone</span><p className="small faint">Passed around the table.</p></article>
        <article className="stat"><b>0</b><span>Bytes on our servers</span><p className="small faint">Nothing about the family.</p></article>
      </section>

      <section className="panel stack" id="story">
        <h2>Game night, screen by screen</h2>
        <p>Christmas night with the family of five, then the following week. Use the arrow keys to move between steps.</p>
        <HowItWorksStoryboard captions={captions} />
      </section>

      <section className="panel stack" id="rules">
        <h2>Rules on one card</h2>
        <p>Design target: a newcomer learns it in under 2 minutes, or 30 seconds mid-game.</p>
        <img className="diagram" src="/mockups/memory-game/walkthrough/g_rules_card.png" alt={rulesCaption} />
        <div className="chips" aria-label="Scoring">
          {walkthrough.rules_card.scoring.map((item) => <span key={item} className="chip">{item}</span>)}
        </div>
        <p><strong>Safety.</strong> {walkthrough.rules_card.safety.join(" · ")}</p>
        <div className="grid-2">
          <div className="stack">
            <h3>Scoring example</h3>
            <p className="small faint">{walkthrough.scoring_example.note}. Design target.</p>
            <div className="table-wrap">
              <table>
                <thead><tr>{walkthrough.scoring_example.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
                <tbody>
                  {walkthrough.scoring_example.rows.map((row) => (
                    <tr key={row.join("|")}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="stack">
            <h3>Time to learn</h3>
            <p className="small faint">{walkthrough.time_to_learn.status}.</p>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Milestone</th><th>Target</th><th>Covers</th></tr></thead>
                <tbody>
                  {walkthrough.time_to_learn.rows.map((row) => (
                    <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="panel stack" id="intuitive">
        <h2>How intuitive is it?</h2>
        <div className="grid-3">
          {intuitive.principles.map((item) => (
            <article key={item.t} className="idea-card">
              <strong>{item.t}</strong>
              <p>{item.d}</p>
            </article>
          ))}
        </div>
        <div className="grid-2">
          {intuitive.personas.map((persona) => (
            <article key={persona.who} className="stack">
              <h3>{persona.who}</h3>
              <ol>{persona.exp.map((item) => <li key={item}>{item}</li>)}</ol>
            </article>
          ))}
        </div>
        <h3>Friction and the design fix</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Friction</th><th>Design fix</th></tr></thead>
            <tbody>
              {intuitive.friction.map((row) => (
                <tr key={row.f}><td>{row.f}</td><td>{row.fix}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <details className="rubric">
          <summary><strong>Cognitive walkthrough</strong></summary>
          <p>{intuitive.cognitive_walkthrough.method}</p>
          <ul>{intuitive.cognitive_walkthrough.flags.map((item) => <li key={item}>{item}</li>)}</ul>
        </details>
        <details className="rubric">
          <summary><strong>5-family test plan</strong></summary>
          <p><strong>Who.</strong> {intuitive.test_plan.mix}</p>
          <p><strong>Format.</strong> {intuitive.test_plan.format}</p>
          <p><strong>Success.</strong> {intuitive.test_plan.success}</p>
          <p><strong>Ethics.</strong> {intuitive.test_plan.ethics}</p>
          <ul>{intuitive.test_plan.measures.map((item) => <li key={item}>{item}</li>)}</ul>
        </details>
      </section>

      <section className="panel stack" id="flow">
        <h2>Where the data goes</h2>
        <p>Everything about the family stays on the device or in their own Apple account. Our servers hold nothing about them.</p>
        <img className="diagram" src="/mockups/memory-game/walkthrough/g_dataflow.png" alt={flowCaption} />
        <div className="grid-3">
          <article className="idea-card">
            <strong>On the device</strong>
            <ul>{walkthrough.dataflow.device.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article className="idea-card">
            <strong>Family&apos;s own iCloud</strong>
            <ul>{walkthrough.dataflow.user_cloud.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article className="idea-card">
            <strong>Our servers: nothing about the family</strong>
            <ul>{walkthrough.dataflow.our_servers.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
        </div>
      </section>

      <section className="panel stack" id="tech">
        <h2>Technology</h2>
        <p>Each part lists the options, our pick, the device requirement and the caveat. Figures are quoted from the sources.</p>
        <HowItWorksTech />
      </section>

      <section className="panel stack" id="explorer">
        <h2>Decision explorer</h2>
        <p>Change a decision and see the product, cost, effort, privacy class and Run 11 rubric score. The recommended path is 57.6 / 48.5 / B. Web with no recording is 67.2 / 66.1 / A.</p>
        <HowItWorksExplorer />
      </section>

      <section className="panel stack" id="path">
        <h2>Recommended path</h2>
        <ol>{walkthrough.explorer.path.map((step) => <li key={step}>{step}</li>)}</ol>
        <p>The web wedge with no recording still scores highest on the rubric ({walkthrough.explorer.web_result.total}, fit {walkthrough.explorer.web_result.fit}, privacy {walkthrough.explorer.web_result.privacy}). It is the cheap test of the game loop. Native iOS ({walkthrough.explorer.recommended_result.total}, fit {walkthrough.explorer.recommended_result.fit}, privacy {walkthrough.explorer.recommended_result.privacy}) is where the memory archive becomes possible.</p>
        <h3>Caveats</h3>
        <ul>{walkthrough.caveats.map((item) => <li key={item}>{item}</li>)}</ul>
        <h3>Sources</h3>
        <ul className="small">{walkthrough.sources.map((href) => <li key={href}><a href={href}>{href.replace(/^https?:\/\//, "")}</a></li>)}</ul>
      </section>
    </div>
  );
}
