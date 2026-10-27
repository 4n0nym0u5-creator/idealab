"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BUILD,
  CHECKLIST,
  DATA_LOSS,
  DIRECTORY_NOTE,
  DISTRIBUTION,
  DISTRIBUTION_RULES,
  FAMILIES,
  GANTT,
  GLANCE,
  KEY_DECISION,
  LAW,
  LENS,
  NEXT_30,
  NOT_ON_ROADMAP,
  PAYMENT_NOTES,
  PAYMENTS,
  POLICY,
  PRIVACY_PATTERNS,
  QA,
  REVENUE_NOTE,
  RISKS,
  STILL_PI,
  THIRD_PARTY,
  TIME_BUDGET,
} from "@/content/portfolio-strategy";
import { monetisationLabel, privacyClassName, privacyLabel } from "@/lib/portfolio";
import type { Idea, PortfolioStrategy } from "@/lib/types";
import { ScenarioChart } from "./charts";

const SCENARIOS = ["low", "base", "high"] as const;
const MARKS: Record<string, string> = { "2026-12": "Christmas", "2027-05": "SeatPlan", "2027-10": "Pass", "2027-12": "Christmas" };

function aud(value: number) {
  return `A$${Math.round(value).toLocaleString("en-AU")}`;
}

function yearSum(months: string[], values: number[], year: string) {
  return months.reduce((sum, month, index) => sum + (month.startsWith(year) ? (values[index] ?? 0) : 0), 0);
}

export function PortfolioView({ strategy, ideas }: { strategy: PortfolioStrategy; ideas: Idea[] }) {
  const ranked = useMemo(() => ideas.filter((idea) => idea.portfolioFit), [ideas]);
  const [tier, setTier] = useState("All");
  const [family, setFamily] = useState("All");
  const [privacy, setPrivacy] = useState("All");
  const [model, setModel] = useState("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"fit" | "viability" | "opportunity" | "total">("fit");
  const [scenario, setScenario] = useState<(typeof SCENARIOS)[number]>("base");

  const tiers = ["All", ...new Set(ranked.map((idea) => idea.tier).filter(Boolean))];
  const families = ["All", ...new Set(ranked.map((idea) => idea.family).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const classes = ["All", "A", "B", "C-redesign", "C-disq"];
  const models = ["All", "one-time", "subscription", "both"];

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = ranked.filter((idea) => {
      if (tier !== "All" && idea.tier !== tier) return false;
      if (family !== "All" && idea.family !== family) return false;
      if (privacy !== "All" && idea.privacyClass !== privacy) return false;
      if (model !== "All" && idea.portfolioMonetisation?.model !== model) return false;
      if (needle && !`${idea.title} ${idea.id}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    rows.sort((a, b) => {
      const fit = (idea: Idea) => idea.portfolioFit?.score ?? -1;
      const left = sort === "fit" ? fit(a) : sort === "viability" ? (a.portfolioFit?.viability ?? -1) : sort === "opportunity" ? (a.portfolioFit?.opportunity ?? -1) : a.researchTotal;
      const right = sort === "fit" ? fit(b) : sort === "viability" ? (b.portfolioFit?.viability ?? -1) : sort === "opportunity" ? (b.portfolioFit?.opportunity ?? -1) : b.researchTotal;
      return right - left || fit(b) - fit(a);
    });
    return rows;
  }, [ranked, tier, family, privacy, model, query, sort]);

  const classA = ranked.filter((idea) => idea.privacyClass === "A").length;
  const classB = ranked.filter((idea) => idea.privacyClass === "B").length;
  const months = strategy.scenarios.months;
  const monthly = strategy.scenarios.monthlyNetAud[scenario] ?? [];
  const cumulative = strategy.scenarios.cumulativeNetAud[scenario] ?? [];
  const points = months.map((month, index) => ({ month, net: monthly[index] ?? 0, cumulative: cumulative[index] ?? 0, mark: MARKS[month] }));
  const byId = new Map(ideas.map((idea) => [idea.id, idea]));

  return (
    <div className="page">
      <header className="stack">
        <p className="kicker">Run 6 · portfolio lens PL 1.0 · 27 Oct 2026</p>
        <h1>Portfolio strategy</h1>
        <p className="lede">{GLANCE}</p>
      </header>

      <section className="grid-4" id="glance">
        <article className="stat"><b>{ranked.length}</b><span>Live ideas re-ranked</span></article>
        <article className="stat"><b>{classA} + {classB}</b><span>Class A + B</span></article>
        <article className="stat"><b>{strategy.disqualified.length}</b><span>Disqualified · {strategy.redesign.length} redesign</span></article>
        <article className="stat"><b>{strategy.roadmap.length}</b><span>Roadmap apps, Nov 2026–Apr 2028</span></article>
      </section>

      <section className="callout stack">
        <strong>Key decision</strong>
        <p>{KEY_DECISION}</p>
      </section>

      <section className="panel stack" id="rank">
        <h2>Portfolio-fit ranking</h2>
        <p className="small muted">Fit = 100 × √(viability × opportunity) × privacy factor × audience factor. Rubric totals are the unchanged v2.0 scores. Disqualified ideas are marked “needs server-held personal data”.</p>
        <div className="chips">
          {tiers.map((item) => <button key={item} type="button" className="chip" data-on={tier === item} onClick={() => setTier(item)}>{item}{item === "All" ? ` · ${ranked.length}` : ` · ${ranked.filter((idea) => idea.tier === item).length}`}</button>)}
        </div>
        <div className="filters">
          <label className="field"><span>Search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Idea title" /></label>
          <label className="field"><span>Family</span>
            <select value={family} onChange={(event) => setFamily(event.target.value)}>{families.map((item) => <option key={item}>{item}</option>)}</select>
          </label>
          <label className="field"><span>Privacy class</span>
            <select value={privacy} onChange={(event) => setPrivacy(event.target.value)}>
              {classes.map((item) => <option key={item} value={item}>{item === "All" ? "All" : privacyLabel(item)}</option>)}
            </select>
          </label>
          <label className="field"><span>Monetisation</span>
            <select value={model} onChange={(event) => setModel(event.target.value)}>
              {models.map((item) => <option key={item} value={item}>{item === "All" ? "All" : monetisationLabel(item)}</option>)}
            </select>
          </label>
          <label className="field"><span>Sort</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
              <option value="fit">Portfolio fit</option>
              <option value="viability">Viability</option>
              <option value="opportunity">Opportunity</option>
              <option value="total">Rubric total</option>
            </select>
          </label>
        </div>
        <p className="small faint">Showing {shown.length} of {ranked.length} annotated ideas.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Idea</th><th>Tier</th><th>Family</th><th>Privacy</th><th>Monetisation</th><th>Fit</th><th>V</th><th>O</th><th>Rubric</th><th>Slot</th></tr>
            </thead>
            <tbody>
              {shown.map((idea) => (
                <tr key={idea.id}>
                  <td><Link href={`/ideas/${idea.id}`}>{idea.title}</Link></td>
                  <td>{idea.tier || "—"}</td>
                  <td>{idea.family || "—"}</td>
                  <td><span className={privacyClassName(idea.privacyClass)}>{privacyLabel(idea.privacyClass)}</span></td>
                  <td>{idea.portfolioMonetisation ? monetisationLabel(idea.portfolioMonetisation.model) : "—"}</td>
                  <td className="num">{idea.portfolioFit?.score.toFixed(1)}</td>
                  <td className="num">{idea.portfolioFit?.viability.toFixed(0)}</td>
                  <td className="num">{idea.portfolioFit?.opportunity.toFixed(0)}</td>
                  <td className="num">{idea.researchTotal.toFixed(1)}</td>
                  <td>{idea.roadmapSlot ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel stack" id="lens">
        <h2>How the lens works</h2>
        <p><strong>Fit = 100 × √(V × O) × privacy × audience</strong></p>
        <p className="small">{strategy.lens.formula}</p>
        {LENS.map(([label, value]) => <p key={label} className="small"><strong>{label}.</strong> {value}</p>)}
        {strategy.lens.rubricTotalsUnchanged ? <p className="small muted">Rubric totals are unchanged. Portfolio fit is not a rubric score.</p> : null}
      </section>

      <section className="grid-2" id="disq">
        <article className="panel stack">
          <h2>Disqualified</h2>
          <p className="small muted">These ideas fail the no-private-data rule because their core value depends on a server holding someone’s personal data. They are parked, and their rubric scores are kept.</p>
          {strategy.disqualified.map((item) => (
            <p key={item.id} className="small"><Link href={`/ideas/${item.id}`}><strong>{item.title}</strong></Link> <span className="badge badge-disq">needs server-held personal data</span><br />{item.reason}</p>
          ))}
        </article>
        <article className="panel stack">
          <h2>Redesign required</h2>
          <p className="small muted">These ideas need a redesign before they qualify. Most become organiser-only local tools, or use an end-to-end-encrypted share link.</p>
          {strategy.redesign.map((item) => (
            <p key={item.id} className="small"><Link href={`/ideas/${item.id}`}><strong>{item.title}</strong></Link> <span className="badge badge-privacy-c">C · redesign required</span><br />{item.path}</p>
          ))}
        </article>
      </section>
      <p className="small muted">{THIRD_PARTY}</p>

      <section className="panel stack" id="roadmap">
        <h2>Eight-app roadmap</h2>
        <p className="small muted">Nov 2026 to Apr 2028. Prices are AUD and GST-inclusive (the merchant of record remits GST). Launch prices are introductory.</p>
        <div className="timeline">
          {strategy.roadmap.map((slot) => (
            <article key={slot.id} className="timeline-item">
              <p className="kicker">Slot {slot.slot} · {slot.model} · {slot.weeks}</p>
              <h3><Link href={`/ideas/${slot.id}`}>{slot.name}</Link></h3>
              <p>{slot.price}</p>
              <p className="small muted">Launch {slot.launch}. Start {slot.start}.</p>
            </article>
          ))}
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>App</th><th>Q4 26</th><th>Q1 27</th><th>Q2 27</th><th>Q3 27</th><th>Q4 27</th><th>Q1 28</th><th>Q2 28</th></tr></thead>
            <tbody>
              {GANTT.map((row) => (
                <tr key={row[0]}>{row.map((cell, index) => <td key={index} className={cell === "Launch" ? "best" : cell === "Build" ? "mark" : undefined}>{cell || "—"}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted">Each build happens in the quarter before a demand peak: Christmas, the New Year reset, Term 1, spring weddings and spring planting.</p>
        <h3>Why this order</h3>
        {strategy.roadmap.map((slot) => (
          <article key={slot.slot} className="stack">
            <p><strong>{slot.slot}. {slot.name}</strong></p>
            <p className="small">{slot.why}</p>
            <p className="small"><strong>Success.</strong> {slot.metrics}</p>
            <p className="small"><strong>Kill.</strong> {slot.kill}</p>
          </article>
        ))}
        <p className="small muted">{NOT_ON_ROADMAP}</p>
      </section>

      <section className="panel stack" id="families">
        <h2>App families</h2>
        <p className="small muted">Apps in one family share code, buyers and channels, so each launch makes the next one cheaper.</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Family</th><th>Roadmap apps</th><th>Ideas that reuse the code</th><th>Shared code</th><th>Audience and channels</th></tr></thead>
            <tbody>{FAMILIES.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={index}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p className="small">{DIRECTORY_NOTE}</p>
        {Object.entries(strategy.families).map(([name, ids]) => (
          <p key={name} className="small">
            <strong>{name} · {ids.length}.</strong>{" "}
            {ids.slice(0, 8).map((id, index) => <span key={id}>{index ? ", " : ""}<Link href={`/ideas/${id}`}>{byId.get(id)?.title || id}</Link></span>)}
            {ids.length > 8 ? ` and ${ids.length - 8} more` : ""}
          </p>
        ))}
      </section>

      <section className="panel stack" id="distribution">
        <h2>Distribution</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>App</th><th>Primary channel</th><th>Free lead magnet</th><th>Communities</th><th>Visual</th><th>Partners</th></tr></thead>
            <tbody>{DISTRIBUTION.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={index}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
        {DISTRIBUTION_RULES.map(([label, value]) => <p key={label} className="small"><strong>{label}.</strong> {value}</p>)}
        <h3>Weekly time budget</h3>
        <p className="small muted">For a solo non-engineer with about 10 hours a week.</p>
        <table>
          <thead><tr><th>Activity</th><th>Hours / week</th><th>What it looks like</th></tr></thead>
          <tbody>{TIME_BUDGET.map((row) => <tr key={row[0]}><td>{row[0]}</td><td className="num">{row[1]}</td><td>{row[2]}</td></tr>)}</tbody>
        </table>
      </section>

      <section className="panel stack" id="build">
        <h2>Build strategy</h2>
        <p className="small muted">Static PWA → the user’s device (IndexedDB and OPFS) → an export file → the user’s own cloud, optionally. Checkout, GST and licence keys stay with a merchant of record. Analytics are cookieless page counts.</p>
        {BUILD.map(([label, value]) => <p key={label} className="small"><strong>{label}.</strong> {value}</p>)}
        <h3>Payments</h3>
        <p className="small muted">Fees checked 27 Oct 2026. Prices in USD unless shown. Third-party summaries are marked in the row.</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Option</th><th>Fees</th><th>Tax / GST</th><th>Licence keys</th><th>Personal data you end up with</th><th>Verdict</th></tr></thead>
            <tbody>{PAYMENTS.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={index} className={cell === "Breaks the no-server rule" ? "bad-cell" : undefined}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
        {PAYMENT_NOTES.map(([label, value]) => <p key={label} className="small"><strong>{label}.</strong> {value}</p>)}
        <h3>Testing, maintenance and scope</h3>
        {QA.map(([label, value]) => <p key={label} className="small"><strong>{label}.</strong> {value}</p>)}
      </section>

      <section className="panel stack" id="privacy">
        <h2>Privacy strategy</h2>
        <p className="small muted">Not legal advice. Status as of 27 Oct 2026 (AEDT).</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Pattern</th><th>How</th><th>Use for</th></tr></thead>
            <tbody>{PRIVACY_PATTERNS.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={index}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <h3>What still counts as personal information</h3>
        {STILL_PI.map(([label, value]) => <p key={label} className="small"><strong>{label}.</strong> {value}</p>)}
        <h3>Australian Privacy Act and GDPR</h3>
        {LAW.map(([label, value]) => <p key={label} className="small"><strong>{label}.</strong> {value}</p>)}
        <h3>Data loss on local-only apps</h3>
        <ol className="small">{DATA_LOSS.map((item) => <li key={item}>{item}</li>)}</ol>
        <h3>Privacy policy outline</h3>
        <ol className="small">{POLICY.map((item) => <li key={item}>{item}</li>)}</ol>
        <table>
          <thead><tr><th>Check</th><th>Pass when</th></tr></thead>
          <tbody>{CHECKLIST.map((row) => <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td></tr>)}</tbody>
        </table>
      </section>

      <section className="panel stack" id="revenue">
        <h2>Revenue scenarios</h2>
        <p className="small">{REVENUE_NOTE}</p>
        <div className="chips">
          {SCENARIOS.map((item) => <button key={item} type="button" className="chip" data-on={scenario === item} onClick={() => setScenario(item)}>{item}</button>)}
        </div>
        <ScenarioChart points={points} />
        <table>
          <thead><tr><th>Scenario</th><th>Net in Apr 2028 (month)</th><th>Net Jan–Dec 2027</th><th>Cumulative Nov 2026–Apr 2028</th></tr></thead>
          <tbody>
            {SCENARIOS.map((item) => {
              const series = strategy.scenarios.monthlyNetAud[item] ?? [];
              const running = strategy.scenarios.cumulativeNetAud[item] ?? [];
              return (
                <tr key={item}>
                  <td>{item}</td>
                  <td className="num">{aud(series.at(-1) ?? 0)}</td>
                  <td className="num">{aud(yearSum(months, series, "2027"))}</td>
                  <td className="num">{aud(running.at(-1) ?? 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="table-wrap">
          <table>
            <thead><tr><th>App</th><th>Launch</th><th>Price</th><th>Billing</th><th>Visitors / month at maturity, low / base / high (ASSUMPTION)</th><th>Visitor to paid (ASSUMPTION)</th></tr></thead>
            <tbody>
              {strategy.scenarios.apps.map((app) => (
                <tr key={app.name}>
                  <td>{app.name}</td>
                  <td>{app.launch}</td>
                  <td>A${app.priceAud}</td>
                  <td>{app.kind}</td>
                  <td>{app.visitors.join(" / ")}</td>
                  <td>{app.conversion.map((value) => `${(value * 100).toFixed(1)}%`).join(" / ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ol className="small">{strategy.scenarios.assumptions.map((item) => <li key={item}>{item}</li>)}</ol>
      </section>

      <section className="panel stack" id="risks">
        <h2>Risks</h2>
        {RISKS.map(([level, title, detail]) => <p key={title} className="small"><span className={level === "High" ? "badge badge-disq" : level === "Resolved here" ? "badge badge-privacy-a" : "badge"}>{level}</span> <strong>{title}.</strong> {detail}</p>)}
      </section>

      <section className="panel stack" id="next">
        <h2>Next 30 days</h2>
        <p className="small muted">27 Oct to 26 Nov 2026 (AEDT).</p>
        <ol>{NEXT_30.map(([title, detail]) => <li key={title}><strong>{title}.</strong> <span className="small">{detail}</span></li>)}</ol>
      </section>
    </div>
  );
}
