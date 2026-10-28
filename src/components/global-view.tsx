"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ClientOnly, useDark } from "./charts";
import research from "../../data/run9_global.json";
import page from "../../data/run9_page.json";

const SCENARIOS = ["low", "base", "high"] as const;
type Scenario = (typeof SCENARIOS)[number];
const YEARS = ["2027", "2028", "2029"] as const;
const FOOTPRINTS = [
  { key: "AU only", label: "AU only", color: "#1e6b4a" },
  { key: "AU+NZ+UK/IE", label: "+ NZ / UK / IE", color: "#a15a32" },
  { key: "All (+US/CA)", label: "+ US / CA", color: "#315f8a" },
] as const;

type YearCell = { net_rev: number; cash_cost: number; hours: number; contrib_cash: number; contrib_incl_time: number; active: number };
type Groups = Record<string, Record<Scenario, Record<string, YearCell>>>;

const groups = research.model_summary.groups as Groups;

function aud(value: number) {
  const sign = value < 0 ? "−" : "";
  return `${sign}A$${Math.abs(Math.round(value)).toLocaleString("en-AU")}`;
}

function payback(months: number | null) {
  if (months == null) return "Not inside 2027–2029";
  if (months === 0) return "At launch";
  return `${months} months`;
}

export function GlobalView() {
  const [scenario, setScenario] = useState<Scenario>("base");
  const markets = research.market_scores;
  const model = research.model_summary.markets;
  const baseAu = groups["AU only"].base["2029"].net_rev;
  const baseWave = groups["AU+NZ+UK/IE"].base["2029"].net_rev;
  const baseAll = groups["All (+US/CA)"].base["2029"].net_rev;
  const cashWave = useMemo(() => YEARS.reduce((sum, year) => sum + groups["AU+NZ+UK/IE"].base[year].cash_cost, 0), []);
  const cashAll = useMemo(() => YEARS.reduce((sum, year) => sum + groups["All (+US/CA)"].base[year].cash_cost, 0), []);
  const launches: Record<string, string> = { AU: "2027", NZ: "Jul 2027", UK: "Feb 2028", IE: "Feb 2028", US: "Mar 2029", CA: "Mar 2029" };

  return (
    <div className="page">
      <header className="stack">
        <p className="kicker">Run 9 · 28 Oct 2026 · not legal or tax advice</p>
        <h1>{research.title}</h1>
        <p className="lede">{page.callout}</p>
        <div className="chips">
          <Link className="chip" href="/life-admin-pass">Life Admin Pass</Link>
          <Link className="chip" href="/portfolio">Roadmap</Link>
          <Link className="chip" href="/playbook">Playbook</Link>
        </div>
      </header>

      <section className="grid-4" id="summary">
        <article className="stat"><b>NZ → UK/IE → CA or NL/DE</b><span>Order, US last</span><p className="small faint">NZ in July 2027, UK and Ireland in February 2028, then Canada or the Netherlands and Germany in 2029. The US only after that.</p></article>
        <article className="stat"><b>{aud(baseAu)} → {aud(baseWave)}</b><span>2029 net, base case</span><p className="small faint">Australia only, then Australia plus NZ, the UK and Ireland. Adding the US and Canada reaches {aud(baseAll)}.</p></article>
        <article className="stat"><b>{aud(0)} → {aud(cashWave)} → {aud(cashAll)}</b><span>Cash cost, 2027–2029, base</span><p className="small faint">Australia, then the NZ/UK/Ireland wave, then the US and Canada. Trademarks, templates, representatives and ad tests. Assumption on what is included.</p></article>
        <article className="stat"><b>{groups["AU only"].base["2029"].hours} → {groups["All (+US/CA)"].base["2029"].hours} h</b><span>Hours in 2029, base</span><p className="small faint">Australia only versus every modelled market. Holiday-date curation is the constraint.</p></article>
      </section>

      <section className="panel stack" id="exec">
        <h2>Executive summary</h2>
        <p>{research.verdict}</p>
        {page.points.map(([title, detail]) => <p key={title}><strong>{title}.</strong> {detail}</p>)}
      </section>

      <section className="panel stack" id="scores">
        <h2>Market scoring</h2>
        <p className="small muted">{page.scoreNote}</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Market</th><th>Score</th><th>Size</th><th>Data</th><th>Pain</th><th>Lang</th><th>Comp</th><th>WTP</th><th>CAC</th><th>Reg</th><th>Households</th><th>Holiday data</th><th>Competition</th><th>Ad cost</th>
              </tr>
            </thead>
            <tbody>
              {markets.map((market) => (
                <tr key={market.code}>
                  <td>{market.name}</td>
                  <td className="num">{market.weighted.toFixed(0)}</td>
                  {(["size", "data", "pain", "lang", "comp", "wtp", "cac", "reg"] as const).map((key) => <td key={key} className="num">{market.scores[key]}</td>)}
                  <td>{market.households}</td>
                  <td>{market.holiday_data}</td>
                  <td>{market.competition}</td>
                  <td>{market.cac}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small">{page.orderNote}</p>
      </section>

      <section className="panel stack" id="model">
        <h2>Revenue and cost scenarios</h2>
        <p className="small">{page.modelCaption}</p>
        <div className="chips">
          {SCENARIOS.map((item) => (
            <button key={item} type="button" className="chip" data-on={scenario === item} onClick={() => setScenario(item)}>{item}</button>
          ))}
        </div>
        <ScenarioCharts scenario={scenario} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Footprint</th><th>Net revenue 2027–29</th><th>Cash cost 2027–29</th><th>Hours 2027 / 28 / 29</th><th>Contribution after time</th></tr></thead>
            <tbody>
              {FOOTPRINTS.map((item) => {
                const net = YEARS.reduce((sum, year) => sum + groups[item.key][scenario][year].net_rev, 0);
                const cost = YEARS.reduce((sum, year) => sum + groups[item.key][scenario][year].cash_cost, 0);
                const contrib = YEARS.reduce((sum, year) => sum + groups[item.key][scenario][year].contrib_incl_time, 0);
                const hours = YEARS.map((year) => groups[item.key][scenario][year].hours).join(" / ");
                return <tr key={item.key}><td>{item.label}</td><td className="num">{aud(net)}</td><td className="num">{aud(cost)}</td><td className="num">{hours}</td><td className="num">{aud(contrib)}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
        <ul className="small">{page.assumptions.slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="panel stack" id="payback">
        <h2>Payback per market</h2>
        <p className="small muted">Launch payback is launch cash divided by first-year monthly net revenue. A blank break-even year means the cumulative cash is still negative at the end of 2029. Figures are from the model, and the reach behind them is an assumption.</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Market</th><th>Launch</th><th>Price</th><th>Net per sale</th><th>Base payback</th><th>Low payback</th><th>High payback</th><th>Base break-even</th><th>Base cumulative after time</th></tr></thead>
            <tbody>
              {(["AU", "NZ", "UK", "IE", "CA", "US"] as const).map((code) => {
                const row = model[code];
                const price = research.model_summary.net_per_sale[code];
                return (
                  <tr key={code}>
                    <td>{code === "AU" ? "Australia" : research.market_scores.find((item) => item.code === code)?.name}</td>
                    <td>{launches[code]}</td>
                    <td>{price.price_local}</td>
                    <td className="num">{aud(price.net_aud)}</td>
                    <td>{payback(row.base.launch_cash_payback_months)}</td>
                    <td>{payback(row.low.launch_cash_payback_months)}</td>
                    <td>{payback(row.high.launch_cash_payback_months)}</td>
                    <td>{row.base.breakeven_cash ?? "—"}{row.base.breakeven_incl_time && row.base.breakeven_incl_time !== row.base.breakeven_cash ? ` (after time ${row.base.breakeven_incl_time})` : ""}</td>
                    <td className="num">{aud(row.base.cum_incl_time_2029)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="small">Paid ads stay a test. Base lifetime value is about {Object.entries(research.paid_ads_check.ltv_base_aud).map(([code, value]) => `${code} ${aud(value)}`).join(", ")}. {research.paid_ads_check.note}</p>
      </section>

      <section className="panel stack" id="localisation">
        <h2>Localisation by product</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Travels?</th><th>What changes</th><th>Data per market</th><th>Who maintains it</th><th>Effort</th></tr></thead>
            <tbody>{page.localisation.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
        {page.localisationNotes.map(([title, detail]) => <p key={title} className="small"><strong>{title}.</strong> {detail}</p>)}
      </section>

      <section className="panel stack" id="legal">
        <h2>Legal, tax and privacy</h2>
        <p className="small muted">Not legal or tax advice. Have a professional check each market before launch.</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Market</th><th>Tax via a merchant of record</th><th>Privacy</th><th>Consumer law</th><th>Trademark, one class</th><th>Entity</th></tr></thead>
            <tbody>{page.legal.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
        {page.legalNotes.map(([title, detail]) => <p key={title} className="small"><strong>{title}.</strong> {detail}</p>)}
      </section>

      <section className="panel stack" id="distribution">
        <h2>Distribution</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Market</th><th>Organic</th><th>Partnerships</th><th>Search hook</th></tr></thead>
            <tbody>{page.distribution.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p className="small">{page.searchNote}</p>
      </section>

      <section className="panel stack" id="scale">
        <h2>The scaling bottleneck</h2>
        <p>Founder hours, mostly holiday-date curation and support, are what grow. Cash does not. In the base case, 2029 hours go from {groups["AU only"].base["2029"].hours} in Australia to {groups["AU+NZ+UK/IE"].base["2029"].hours} with NZ, the UK and Ireland, and {groups["All (+US/CA)"].base["2029"].hours} if the US and Canada are added.</p>
        {page.scale.map(([kind, title, detail]) => <p key={title} className="small"><strong>{kind}: {title}.</strong> {detail}</p>)}
        <h3>A Localisation & Data bot</h3>
        {page.bots.map(([kind, title, detail]) => <p key={title} className="small"><strong>{kind}: {title}.</strong> {detail}</p>)}
      </section>

      <section className="panel stack" id="gates">
        <h2>Gates before expanding</h2>
        <p className="small muted">Measured in Australia. Do not open the next market until these hold.</p>
        <ol>{research.gating_metrics.map((item) => <li key={item}>{item}</li>)}</ol>
        <ol>{page.steps.map(([title, detail]) => <li key={title}><strong>{title}.</strong> {detail}</li>)}</ol>
      </section>

      <section className="panel stack" id="risks">
        <h2>Risks</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Risk</th><th>Impact</th><th>Mitigation</th></tr></thead>
            <tbody>{page.risks.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="panel stack" id="caveats">
        <h2>Caveats</h2>
        <ul>{research.caveats.map((item) => <li key={item}>{item}</li>)}</ul>
        <ul className="small">{page.assumptions.slice(5).map((item) => <li key={item}>{item}</li>)}</ul>
        <h2>Sources</h2>
        <ul className="small">{page.sources.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
      </section>
    </div>
  );
}

function ScenarioCharts({ scenario }: { scenario: Scenario }) {
  const dark = useDark();
  const ink = dark ? "#c9bfb0" : "#5c564c";
  const grid = dark ? "#322f29" : "#ddd4c6";
  const revenue = YEARS.map((year) => {
    const row: Record<string, string | number> = { year };
    for (const item of FOOTPRINTS) row[item.label] = groups[item.key][scenario][year].net_rev;
    return row;
  });
  const cost = YEARS.map((year) => {
    const row: Record<string, string | number> = { year };
    for (const item of FOOTPRINTS) row[item.label] = groups[item.key][scenario][year].cash_cost;
    return row;
  });
  return (
    <>
      <h3>Net revenue, {scenario}</h3>
      <ClientOnly height={280}>
        <div style={{ width: "100%", height: 280 }} aria-label="Net revenue by footprint">
          <ResponsiveContainer>
            <LineChart data={revenue}>
              <CartesianGrid stroke={grid} />
              <XAxis dataKey="year" tick={{ fill: ink, fontSize: 12 }} />
              <YAxis tick={{ fill: ink, fontSize: 11 }} width={64} />
              <Tooltip formatter={(value) => aud(Number(value))} contentStyle={{ background: "var(--elev)", border: "1px solid var(--line)", borderRadius: 12 }} />
              <Legend />
              {FOOTPRINTS.map((item) => <Line key={item.key} type="monotone" dataKey={item.label} stroke={item.color} strokeWidth={2} dot={false} />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ClientOnly>
      <h3>Cash cost, {scenario}</h3>
      <ClientOnly height={280}>
        <div style={{ width: "100%", height: 280 }} aria-label="Cash cost by footprint">
          <ResponsiveContainer>
            <LineChart data={cost}>
              <CartesianGrid stroke={grid} />
              <XAxis dataKey="year" tick={{ fill: ink, fontSize: 12 }} />
              <YAxis tick={{ fill: ink, fontSize: 11 }} width={64} />
              <Tooltip formatter={(value) => aud(Number(value))} contentStyle={{ background: "var(--elev)", border: "1px solid var(--line)", borderRadius: 12 }} />
              <Legend />
              {FOOTPRINTS.map((item) => <Line key={item.key} type="monotone" dataKey={item.label} stroke={item.color} strokeWidth={2} dot={false} />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ClientOnly>
    </>
  );
}
