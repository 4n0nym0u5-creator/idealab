"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { tierLabel } from "@/lib/bundles";
import { criteriaInOrder } from "@/lib/criteria";
import type { BundleRecord, Idea } from "@/lib/types";
import { RevenueChart } from "./charts";
import { CustomerBadge, StatusBadge } from "./ui";

const SCENARIOS = ["low", "base", "high"] as const;

export function BundleView({ bundle, ideas }: { bundle: BundleRecord; ideas: Idea[] }) {
  const [scenario, setScenario] = useState<(typeof SCENARIOS)[number]>("base");
  const byId = useMemo(() => new Map(ideas.map((idea) => [idea.id, idea])), [ideas]);
  const members = bundle.members.map((id) => byId.get(id)).filter((idea): idea is Idea => Boolean(idea));
  const feeders = bundle.feeders.map((id) => byId.get(id)).filter((idea): idea is Idea => Boolean(idea));
  const modules = new Map<string, Idea[]>();
  for (const idea of members) {
    const name = idea.bundleFit?.module || "Unassigned";
    const list = modules.get(name) ?? [];
    list.push(idea);
    modules.set(name, list);
  }
  const chosen = bundle.revenueScenarios[scenario];
  const criteria = criteriaInOrder(Object.keys(bundle.scores));
  const risks = criteria.filter((criterion) => (bundle.scores[criterion.key] ?? 5) <= 3 && bundle.scoreReasons[criterion.key]);

  return (
    <div className="page">
      <header className="stack">
        <p className="kicker">Bundle · scored as one product · not on the idea shortlist</p>
        <h1>{bundle.title}</h1>
        <p className="lede">Device-only household pass. No accounts, no Supabase, and no reminder emails. Dates stay in local storage on the household’s device. Reminders are .ics files with alarms that their own calendar fires. A licence key is checked from the browser against a merchant of record. A$29/yr per household (launch A$19 for people who already bought a module). Includes GiftLedger and HolidayPlanner; standalone buyers get credit.</p>
        <p className="small muted">{bundle.notes}</p>
        <div className="chips">
          <CustomerBadge type={bundle.customerType} />
          <span className="badge">{bundle.category}</span>
          <span className="badge">Run {bundle.firstSeenRun}</span>
        </div>
      </header>

      <section className="feature">
        <div className="stack">
          <p className="kicker">Rubric v2.0 total</p>
          <p>A$29/yr per household. Launch A$19 for existing buyers. Licence keys via a merchant of record.</p>
          <p className="small muted">{members.length} member ideas · {feeders.length} free feeders · {bundle.launchModules.length} launch modules</p>
        </div>
        <div>
          <div className="score-figure">{bundle.total.toFixed(1)}</div>
          <p className="faint small">Same 13 criteria as an idea. The score is the shared platform, not the easiest module.</p>
        </div>
      </section>

      <section className="panel stack">
        <h2>Run 7 lineup</h2>
        <p className="small">HolidayPlanner AU (anchor), Renewal Radar (renewals, subscriptions, warranties and ID expiry, with the bills calendar folded in), GiftLedger, and Household Handbook. Moving Mode ships in v1.1 on the existing moving checklist. The full family calendar is dropped. The chore ledger was considered and not added. The design stays device-only: local storage, .ics alarms, licence keys via a merchant of record, A$29/yr per household.</p>
        <p><Link href="/life-admin-pass">Life Admin Pass deep dive</Link></p>
      </section>

      <section className="panel stack">
        <h2>Run 5 modules</h2>
        <p className="small muted">These five modules are the scored Run 5 plan. Run 7 supersedes the lineup. The rubric total is still the Run 5 score.</p>
        <ol>
          {bundle.launchModules.map((module) => <li key={module}>{module}</li>)}
        </ol>
        <div className="list">
          {members.filter((idea) => idea.bundleFit?.tier === "launch").map((idea) => (
            <div key={idea.id} className="row">
              <span className="badge badge-launch">Launch</span>
              <span><Link href={`/ideas/${idea.id}`}><strong>{idea.title}</strong></Link><div className="small faint">{idea.bundleFit?.module} · {idea.bundleFit?.note}</div></span>
              <span className="num">{idea.total.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel stack">
        <h2>Modules</h2>
        {[...modules.entries()].map(([name, group]) => (
          <article key={name} className="stack">
            <h3>{name}</h3>
            <div className="list">
              {group.map((idea) => (
                <div key={idea.id} className="row">
                  <span className={`badge badge-${idea.bundleFit?.tier || "later"}`}>{tierLabel(idea.bundleFit?.tier || "")}</span>
                  <span>
                    <Link href={`/ideas/${idea.id}`}><strong>{idea.title}</strong></Link>
                    <div className="small faint">{idea.bundleFit?.note}</div>
                  </span>
                  <StatusBadge status={idea.status} />
                  <span className="num">{idea.total.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="grid-2">
        <article className="panel stack">
          <h2>Pricing</h2>
          <p className="small">Current design (Run 6): local storage, .ics alarms, merchant-of-record licence keys. A$29/yr per household, launch A$19 for existing buyers.</p>
          <table>
            <tbody>
              <tr><td>Current price</td><td>A$29/yr per household (launch A$19 for existing buyers)</td></tr>
              <tr><td>Superseded Run 5 price</td><td>{bundle.price.recommended}</td></tr>
              <tr><td>Later tier</td><td>{bundle.price.laterTier || "—"}</td></tr>
              <tr><td>Rejected</td><td>{bundle.price.rejected || "—"}</td></tr>
              {bundle.netPerAud != null ? <tr><td>Superseded Run 5 net</td><td>A${bundle.netPerAud.toFixed(2)} after Stripe AU fees. Stripe direct breaks the no-server rule, so the current plan uses a merchant of record.</td></tr> : null}
            </tbody>
          </table>
          {Object.keys(bundle.priceBreakeven).length ? (
            <table>
              <thead><tr><th>Price</th><th>Net / sub</th><th>Subs for A$10k</th><th>Subs for A$50k</th></tr></thead>
              <tbody>
                {Object.entries(bundle.priceBreakeven).map(([price, row]) => (
                  <tr key={price}><td>A${price}</td><td className="num">{row.netPerSub.toFixed(2)}</td><td className="num">{row.subsFor10k}</td><td className="num">{row.subsFor50k}</td></tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </article>
        <article className="panel stack">
          <h2>Risks</h2>
          <ul className="small">
            {risks.map((criterion) => <li key={criterion.key}><strong>{criterion.label} {bundle.scores[criterion.key]}/5.</strong> {bundle.scoreReasons[criterion.key]}</li>)}
            {bundle.price.rejected ? <li><strong>Pricing.</strong> Rejected: {bundle.price.rejected}</li> : null}
            {bundle.revenueScenarios.low && bundle.revenueScenarios.low.year3ProfitBeforeTaxAndTime < 0 ? <li><strong>Low scenario.</strong> Year-3 profit before tax and time is A${bundle.revenueScenarios.low.year3ProfitBeforeTaxAndTime.toFixed(0)}.</li> : null}
          </ul>
          <p className="small muted">Dates, not documents. Store an expiry and a nickname, never an ID number or a scan. No tax, insurance, or energy-plan advice.</p>
          <p className="small">Superseded Run 5 design: accounts, a shared database (Supabase), and reminder email. The rubric total {bundle.total.toFixed(1)} is still that Run 5 score. Run 6 did not rescore the bundle. The old design stays here as history because it stores private household data on a server, which the portfolio rule does not allow.</p>
        </article>
      </section>

      {chosen ? (
        <section className="panel stack">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <h2>Run 5 revenue scenarios, superseded</h2>
            <div className="chips">
              {SCENARIOS.map((name) => (
                <button key={name} type="button" className="chip" data-on={scenario === name} onClick={() => setScenario(name)}>{name}</button>
              ))}
            </div>
          </div>
          <p className="small muted">Cumulative net revenue in Australian dollars. Visitors, conversion and renewal are scenario assumptions, not measured demand.</p>
          <div className="stats">
            <Stat value={`A$${Math.round(chosen.yearNetRevenueAud[0] ?? 0).toLocaleString()}`} label="Year 1 net" />
            <Stat value={`A$${Math.round(chosen.yearNetRevenueAud[2] ?? 0).toLocaleString()}`} label="Year 3 net" />
            <Stat value={String(chosen.activePaidM36)} label="Paid households, month 36" />
            <Stat value={`A$${chosen.ltvNetAud.toFixed(1)}`} label="Net LTV" />
          </div>
          <RevenueChart points={chosen.monthly.map((month) => ({ month: month.month, revenue: month.netRevenueCum, paid: month.activePaid }))} />
          <ul className="small">
            {Object.entries(chosen.assumptions).map(([key, value]) => (
              <li key={key}><strong>{key} {value}</strong>{bundle.assumptionLabels[key] ? ` — ${bundle.assumptionLabels[key]}` : ""}</li>
            ))}
            {Object.entries(bundle.assumptionLabels).filter(([key]) => chosen.assumptions[key] === undefined).map(([key, text]) => (
              <li key={key}><strong>{key}.</strong> {text}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {feeders.length ? (
        <section className="panel stack">
          <h2>Free feeders</h2>
          <div className="list">
            {feeders.map((idea) => (
              <div key={idea.id} className="row">
                <span className="badge badge-feeder">Feeder</span>
                <Link href={`/ideas/${idea.id}`}>{idea.title}</Link>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {bundle.evidence.length ? (
        <section className="panel stack">
          <h2>Pricing evidence</h2>
          {bundle.evidence.map((item) => <p key={item.url} className="small"><a href={item.url}>{item.url.replace(/^https?:\/\//, "")}</a> — {item.note}</p>)}
        </section>
      ) : null}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="stat"><b>{value}</b><span>{label}</span></div>;
}
