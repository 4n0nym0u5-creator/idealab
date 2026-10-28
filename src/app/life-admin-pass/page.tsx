import Link from "next/link";
import { withPortfolio } from "@/components/gate";
import { MockupGallery } from "@/components/mockup-gallery";
import { RUN7 } from "@/lib/run7";
import type { Idea } from "@/lib/types";

export const metadata = { title: "Life Admin Pass" };

function IdeaLinks({ ids, ideas }: { ids: string[]; ideas: Map<string, Idea> }) {
  return (
    <span>
      {ids.map((id, index) => {
        const idea = ideas.get(id);
        return (
          <span key={id}>
            {index ? ", " : ""}
            <Link href={`/ideas/${id}`}>{idea?.title || id}</Link>
            {idea ? <span className="faint"> ({idea.researchTotal.toFixed(1)})</span> : null}
          </span>
        );
      })}
    </span>
  );
}

export default async function LifeAdminPassPage() {
  return withPortfolio((portfolio) => {
    const ideas = new Map(portfolio.ideas.map((idea) => [idea.id, idea]));
    const writeup = RUN7.writeup;
    return (
      <div className="page">
        <header className="stack">
          <p className="kicker">Run 7 · 28 Oct 2026 · device-only · A$29/yr per household</p>
          <h1>Life Admin Pass</h1>
          <p className="lede">{writeup.summary}</p>
          <p className="small"><Link href="/playbook">Grok Bot operating playbook</Link> · <Link href="/global">Global expansion</Link> · who runs the Pass, and whether it leaves Australia.</p>
        </header>

        <section className="grid-4" id="summary">
          {writeup.metrics.map((metric) => (
            <article key={metric.label} className="stat">
              <b>{metric.value}</b>
              <span>{metric.label}</span>
              <p className="small faint">{metric.detail}</p>
            </article>
          ))}
        </section>

        <section className="callout stack">
          <strong>Why the Default Parent is the buyer</strong>
          <p>{writeup.why_dominant}</p>
        </section>

        <section className="panel stack">
          <h2>Final lineup</h2>
          <p>{writeup.lineup_sentence} Data stays on the device: no accounts, no Supabase, no reminder emails. Reminders are <code>.ics</code> alarms, and a licence key is checked from the browser against a merchant of record.</p>
          <div className="list">
            {RUN7.lineup.products.map((product) => (
              <div key={product.name} className="row">
                <span className="badge">{product.role}</span>
                <span>
                  <strong>{product.name}</strong>
                  <div className="small faint">{product.hero}</div>
                </span>
                <span className="badge">{product.class}</span>
              </div>
            ))}
          </div>
          <p className="small muted">The free hub inside every app is {RUN7.lineup.hub.name}: {RUN7.lineup.hub.role}.</p>
        </section>

        <section className="panel stack" id="must">
          <h2>Five things that must be true</h2>
          <ol>
            {writeup.irresistibility.map((item) => (
              <li key={item.title}><strong>{item.title}.</strong> <span className="small">{item.detail}</span></li>
            ))}
          </ol>
        </section>

        <section className="panel stack" id="personas">
          <h2>Personas</h2>
          <p className="small muted">Sizes are households or people from ABS and Finder, not buyers. Scores are judgement, from 0 to 5, labelled as such. Willingness to pay is the WTP column.</p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Persona</th><th>Size</th><th>Pain</th><th>Willingness to pay</th><th>Reach</th><th>Verdict</th></tr></thead>
              <tbody>
                {writeup.persona_rows.map((row) => (
                  <tr key={row.name}><td>{row.name}</td><td className="num">{row.size}</td><td className="num">{row.pain}</td><td className="num">{row.wtp}</td><td className="num">{row.reach}</td><td>{row.verdict}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          {RUN7.personas.map((persona, index) => (
            <article key={persona.name} className="stack">
              <h3>{persona.rank}. {persona.name}</h3>
              <p className="small">{writeup.persona_detail[index]}</p>
              <p className="small"><strong>Who.</strong> {persona.who}</p>
              <p className="small"><strong>Size.</strong> {persona.size}</p>
              <p className="small"><strong>Channels.</strong> {persona.channels.join(" · ")}</p>
            </article>
          ))}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Persona</th><th>Where to reach them</th></tr></thead>
              <tbody>{writeup.channels.map((row) => <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="panel stack" id="products">
          <h2>Product by product</h2>
          <p className="small muted">Reddit pages block a direct fetch, so Reddit evidence is a thread title or a quote captured in Run 4. Assumptions are labelled in the source line.</p>
          {writeup.products.map((product) => (
            <article key={product.name} className="stack">
              <h3>{product.name}</h3>
              <p className="small"><span className="badge">{product.role}</span> <span className="badge">{product.privacy}</span></p>
              <p><strong>Who it is for.</strong> {product.audience}</p>
              <p className="small"><strong>Existing ideas.</strong> <IdeaLinks ids={product.ideas} ideas={ideas} /></p>
              <h4>Frustrations with what exists</h4>
              {product.frustrations.map((item) => (
                <blockquote key={item.quote} className="quote">
                  <p>“{item.quote}”</p>
                  <p className="small"><a href={item.href} target="_blank" rel="noreferrer">{item.source}</a></p>
                </blockquote>
              ))}
              <p><strong>Why ours is the better job.</strong> {product.why_superior}</p>
            </article>
          ))}
          <p className="small muted">Do not build bank linking, inbox scanning, or a merged family calendar. Each needs a server to hold private data.</p>
        </section>

        <section className="panel stack" id="swaps">
          <h2>Swaps</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Change</th><th>What</th><th>Becomes</th><th>Why</th></tr></thead>
              <tbody>
                {writeup.swaps.map((swap) => (
                  <tr key={swap.what}><td>{swap.change}</td><td>{swap.what}</td><td>{swap.becomes}</td><td>{swap.why}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel stack" id="irresist">
          <h2>What would make it irresistible</h2>
          <p><strong>The whole bundle.</strong> {writeup.principles.whole}</p>
          <p><strong>Each product.</strong> {writeup.principles.per_product}</p>
          <p className="small">{writeup.principles.design}</p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Persona</th><th>The hook</th><th>The design must</th><th>The deal-breaker</th></tr></thead>
              <tbody>
                {writeup.hooks.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel stack" id="synergies">
          <h2>Synergies</h2>
          <ol>{writeup.synergies.map((item) => <li key={item}>{item}</li>)}</ol>
          <h2>Pricing and packaging</h2>
          <p className="small muted">Standalone prices for Radar and the Handbook are assumptions. HolidayPlanner and GiftLedger prices come from the Run 6 roadmap. The Pass price is A$29/yr per household.</p>
          {writeup.pricing_notes.map(([label, value]) => <p key={label} className="small"><strong>{label}.</strong> {value}</p>)}
          <p className="small">{writeup.not_advice}</p>
        </section>

        <section className="panel stack" id="mockups">
          <h2>Mockups</h2>
          <p className="small muted">Six phone screens and two desktop screens, exported at 2×. Every figure is sample data. Dates are illustrative, not official term dates. Click a screen to enlarge it.</p>
          <MockupGallery shots={RUN7.mockup_files} />
        </section>

        <section className="panel stack" id="caveats">
          <h2>Caveats</h2>
          <ul>{RUN7.caveats.map((item) => <li key={item}>{item}</li>)}</ul>
          <h2>Sources</h2>
          <ul className="small">
            {Object.entries(RUN7.sources).map(([key, href]) => (
              <li key={key}><a href={href} target="_blank" rel="noreferrer">{key.replaceAll("_", " ")}</a></li>
            ))}
          </ul>
          <h3>Facts behind the page</h3>
          <ul className="small">
            {RUN7.key_facts.map((fact) => (
              <li key={fact.fact}>
                {fact.fact}{" "}
                {(Array.isArray(fact.src) ? fact.src : [fact.src]).map((key, index) => (
                  <span key={key}>{index ? " · " : ""}<a href={RUN7.sources[key as keyof typeof RUN7.sources]} target="_blank" rel="noreferrer">{key}</a></span>
                ))}
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  });
}
