import Link from "next/link";
import { MockupGallery } from "./mockup-gallery";
import research from "../../data/run11_memorygame.json";

const SHOTS = [
  ["m1_setup_consent.png", "Setup and consent", "Everyone opts in. Play only is allowed, and the recording light stays visible."],
  ["m2_keeper_secret.png", "The Keeper's secret", "One player gets the prompt. The others only see the category."],
  ["m3_hints_scoring.png", "Hints and scoring", "The table gives hints and scores the guess."],
  ["m4_tell_it.png", "Tell it", "The Keeper tells the story. Recording is optional for that round."],
  ["m5_memory_review.png", "Memory review", "The table keeps a card: title, place, and who was there."],
  ["m6_who_said_it.png", "Who said it", "Later rounds reuse stories you already kept."],
  ["t7_tablet_archive.png", "Tablet archive", "The family archive stays in the family's own iCloud."],
  ["p8_box_yearbook.png", "Starter box and yearbook", "A printed deck and a yearbook the family prints themselves."],
] as const;

function aud(value: number) {
  return `A$${Math.round(value).toLocaleString("en-AU")}`;
}

export function MemoryGameView() {
  const verdict = research.verdict;
  const native = research.scores.on_device_native_v1;
  const wedge = research.scores.wedge_v0_web_game;

  return (
    <div className="page">
      <header className="stack">
        <p className="kicker">Run 11 · 29 Oct 2026 · standalone · not part of the Life Admin Pass</p>
        <h1>Hint &amp; Tell</h1>
        <p className="lede">{verdict.headline}</p>
        <p>{verdict.one_liner}</p>
        <div className="chips">
          <Link className="chip" href="/ideas/hint-and-tell-family-memory-game">Idea card</Link>
          <span className="badge">Park</span>
          <span className="badge badge-privacy-b">B · user-owned sync</span>
          <span className="badge">Family: Standalone: Hint &amp; Tell</span>
        </div>
      </header>

      <section className="grid-4">
        <article className="stat"><b>{native.total.toFixed(1)}</b><span>Native rubric</span><p className="small faint">On-device app. Shortlist is about 76.</p></article>
        <article className="stat"><b>{wedge.total.toFixed(1)}</b><span>Web wedge</span><p className="small faint">No recording. Fit {wedge.portfolio_fit.score.toFixed(1)}.</p></article>
        <article className="stat"><b>{native.portfolio_fit.score.toFixed(1)}</b><span>Portfolio fit</span><p className="small faint">Native, privacy class B.</p></article>
        <article className="stat"><b>≤ A$600</b><span>To validate</span><p className="small faint">Experiments before a native build.</p></article>
      </section>

      <section className="panel stack">
        <h2>Why it is parked</h2>
        <ul>{verdict.why.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="panel stack" id="loop">
        <h2>Game loop</h2>
        <p>A round is a guessing game first and an archive second. Recording can stay off and the game still works. Quick is 15 minutes, Trip is 10, and Classic is 40.</p>
        <ol>
          <li>The table opts in. Anyone can choose Play only.</li>
          <li>The Keeper sees a secret prompt. Everyone else sees the category.</li>
          <li>The others give hints. The table scores the guess.</li>
          <li>The Keeper tells the story. A recording, if everyone agreed, stays on the device.</li>
          <li>The table reviews a memory card.</li>
          <li>Later, Who said it and On this day rounds reuse stories the family already kept.</li>
        </ol>
        <ul>{research.churn_and_fun_first.tactics.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="panel stack" id="mockups">
        <h2>Mockups</h2>
        <p className="small muted">Eight screens. Phone frames are 390×844 at 2×, the tablet is 1194×834 at 2×, and the product shot is 1440×900 at 2×. Click a screen to enlarge it. No Disney or Universal names.</p>
        <MockupGallery
          base="/mockups/memory-game"
          shots={SHOTS.map(([file, title, caption]) => ({ file, title, caption }))}
        />
      </section>

      <section className="panel stack">
        <h2>Privacy redesign</h2>
        <p>{research.privacy_redesign.class}</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Layer</th><th>PDF design</th><th>On-device redesign</th></tr></thead>
            <tbody>
              {research.privacy_redesign.architecture.map((row) => (
                <tr key={row.layer}><td>{row.layer}</td><td>{row.pdf}</td><td>{row.redesign}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>Trade-offs</h3>
        {Object.entries(research.privacy_redesign.trade_offs).map(([key, value]) => (
          <p key={key} className="small"><strong>{key.replaceAll("_", " ")}.</strong> {value}</p>
        ))}
        <h3>How the legal risk shrinks</h3>
        <ul>{research.privacy_redesign.legal_risk_shrinks.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="panel stack">
        <h2>Personas</h2>
        {research.personas.map((persona) => (
          <article key={persona.name} className="stack">
            <h3>{persona.rank}. {persona.name}</h3>
            <p className="small">{persona.who} {persona.job}</p>
            <p className="small muted">{persona.evidence} Price: {persona.price_tolerance}. Channel: {persona.channel}.</p>
          </article>
        ))}
      </section>

      <section className="panel stack">
        <h2>Competitors</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Model</th><th>Price</th><th>Gap</th></tr></thead>
            <tbody>
              {research.competitors.map((row) => (
                <tr key={row.name}>
                  <td><a href={row.url}>{row.name}</a></td>
                  <td>{row.model}</td>
                  <td>{row.price}</td>
                  <td>{row.gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel stack">
        <h2>What has to be true</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Assumption</th><th>Experiment</th><th>Pass</th></tr></thead>
            <tbody>
              {research.must_be_true.map((row) => (
                <tr key={row.assumption}><td>{row.assumption}</td><td>{row.experiment}</td><td>{row.pass}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>Experiments E1–E5</h3>
        {research.experiments.map((item) => (
          <p key={item.id} className="small"><strong>{item.id}. {item.name}.</strong> {item.cost_aud} AUD. {item.time}. {item.how}</p>
        ))}
      </section>

      <section className="panel stack">
        <h2>Pricing and revenue</h2>
        <p>{research.pricing.recommendation}</p>
        <p className="small">{research.pricing.why}</p>
        <p className="small">{research.pricing.pdf_plan_comparison}</p>
        <p className="small muted">{research.revenue_scenarios_y1.assumptions}</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Scenario</th><th>Downloads</th><th>Conversion</th><th>Paying families</th><th>Net revenue</th><th>Renewing in year 2</th></tr></thead>
            <tbody>
              {research.revenue_scenarios_y1.rows.map((row) => (
                <tr key={row.scenario}>
                  <td>{row.scenario}</td>
                  <td className="num">{row.downloads_y1.toLocaleString("en-AU")}</td>
                  <td className="num">{(row.paid_conversion * 100).toFixed(0)}%</td>
                  <td className="num">{row.paying_families_y1.toLocaleString("en-AU")}</td>
                  <td className="num">{aud(row.net_revenue_y1_aud)}</td>
                  <td className="num">{row.renewing_families_y2.toLocaleString("en-AU")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel stack">
        <h2>Build path</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Phase</th><th>When</th><th>Cost</th><th>What</th></tr></thead>
            <tbody>
              {research.build_path.solo_vibecoded.map((row) => (
                <tr key={row.phase}><td>{row.phase}</td><td>{row.when}</td><td>A${row.cost_aud}</td><td>{row.what}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small">Solo total to v1: A${research.build_path.solo_total_to_v1_aud}. PDF team plan: {research.build_path.pdf_team_plan_aud}.</p>
        <p className="small">{research.build_path.non_engineer_note}</p>
      </section>

      <section className="panel stack">
        <h2>Names</h2>
        {research.names.map((item) => (
          <p key={item.name} className="small"><strong>{item.name}.</strong> {item.status}. {item.checks}</p>
        ))}
        <p>{research.trademark_note}</p>
      </section>

      <section className="panel stack">
        <h2>Scores</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Variant</th><th>Total</th><th>Portfolio fit</th></tr></thead>
            <tbody>
              <tr><td>On-device native</td><td className="num">{native.total.toFixed(1)}</td><td className="num">{native.portfolio_fit.score.toFixed(1)}</td></tr>
              <tr><td>Web wedge, no recording</td><td className="num">{wedge.total.toFixed(1)}</td><td className="num">{wedge.portfolio_fit.score.toFixed(1)}</td></tr>
              <tr><td>PDF cloud design</td><td className="num">{research.scores.pdf_cloud_design.total.toFixed(1)}</td><td className="num">{research.scores.pdf_cloud_design.portfolio_fit.score.toFixed(1)}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="small">{research.scores.strict_legal_2_reading.note} Total {research.scores.strict_legal_2_reading.total.toFixed(1)}.</p>
        <p className="small">Native scores: {Object.entries(native.scores).map(([key, value]) => `${key} ${value}`).join(", ")}.</p>
      </section>

      <section className="panel stack">
        <h2>Caveats</h2>
        <ul>{research.caveats.map((item) => <li key={item}>{item}</li>)}</ul>
        <h2>Sources</h2>
        <ul className="small">{research.sources.map((href) => <li key={href}><a href={href}>{href.replace(/^https?:\/\//, "")}</a></li>)}</ul>
      </section>
    </div>
  );
}
