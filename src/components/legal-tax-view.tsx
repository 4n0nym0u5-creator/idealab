import Link from "next/link";
import guide from "../../data/run10_legal_tax.json";
import page from "../../data/run10_page.json";

function sourceLabel(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
}

export function LegalTaxView() {
  return (
    <div className="page">
      <header className="stack">
        <p className="kicker">Run 10 · 28 Oct 2026 · Australia</p>
        <h1>{guide.title}</h1>
        <div className="callout danger stack">
          <strong>General information, not legal or tax advice.</strong>
          <p>{guide.disclaimer} This summarises sources as at 28 Oct 2026 (AEDT). Laws, rates and thresholds change. Have a registered tax agent and a lawyer check your employment contract and your merchant-of-record agreement before you rely on it.</p>
        </div>
        <div className="chips">
          <Link className="chip" href="/life-admin-pass">Life Admin Pass</Link>
          <Link className="chip" href="/portfolio">Roadmap</Link>
          <Link className="chip" href="/playbook">Playbook</Link>
          <Link className="chip" href="/global">Global expansion</Link>
        </div>
      </header>

      <section className="grid-3" id="summary">
        {page.metrics.map((metric) => (
          <article key={metric.label} className="stat">
            <b>{metric.value}</b>
            <span>{metric.label}</span>
            <p className="small faint">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="panel stack" id="exec">
        <h2>Executive summary</h2>
        <p><strong>ABN.</strong> {guide.answers.abn}</p>
        <p><strong>GST.</strong> {guide.answers.gst}</p>
        <p><strong>Structure.</strong> {guide.answers.structure}</p>
        <h3>Five actions this week</h3>
        <ol>{page.week.map((item) => <li key={item}>{item}</li>)}</ol>
        <div className="callout danger stack">
          <strong>Three surprises</strong>
          <p>{page.surprisesIntro}</p>
        </div>
      </section>

      <section className="panel stack" id="timeline">
        <h2>Timeline checklist</h2>
        <p className="small muted">Costs marked assumption or indicative are not official fees.</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>When</th><th>What to do</th><th>Cost</th><th>Priority</th></tr></thead>
            <tbody>{page.timeline.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </section>

      {page.sections.map((section) => (
        <section key={section.id} className="panel stack" id={section.id}>
          <h2>{section.heading}</h2>
          {"rows" in section && section.rows ? section.rows.map((row) => (
            <p key={row[1]}><strong>{row[0]}. {row[1]}.</strong> {row[2]}</p>
          )) : null}
          {"table" in section && section.table ? (
            <div className="table-wrap">
              <table>
                <thead><tr>{section.table.columns.map((column) => <th key={column || "item"}>{column || "Item"}</th>)}</tr></thead>
                <tbody>{section.table.rows.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
              </table>
            </div>
          ) : null}
          {"notes" in section && section.notes ? section.notes.map((note) => (
            <p key={note[0]} className="small"><strong>{note[0]}.</strong> {note[1]}</p>
          )) : null}
        </section>
      ))}

      <section className="panel stack" id="job">
        <h2>Your employment contract</h2>
        <div className="callout danger stack">
          <strong>Check this before you ship.</strong>
          <p>{page.job}</p>
        </div>
      </section>

      <section className="panel stack" id="costs">
        <h2>Costs</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Item</th><th>Cost</th><th>Source</th><th>Status</th></tr></thead>
            <tbody>{page.costs.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p className="small">{page.costsNote}</p>
      </section>

      <section className="panel stack" id="risks">
        <h2>Surprises and high-risk items</h2>
        <ul>{guide.surprises_high_risk.map((item) => <li key={item}>{item}</li>)}</ul>
        <h3>Verified rates and rules</h3>
        <ul className="small">{guide.key_facts_verified.map((item) => <li key={item}>{item}</li>)}</ul>
        <h2>Unsettled law</h2>
        {page.unsettledDetail.map(([title, detail]) => <p key={title} className="small"><strong>{title}.</strong> {detail}</p>)}
        <ul>{guide.unsettled_law.map((item) => <li key={item}>{item}</li>)}</ul>
        <h3>Not verified this run</h3>
        <ul className="small">{guide.not_verified.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="panel stack" id="ask">
        <h2>Questions to ask your accountant</h2>
        <ol>{page.questions.map((item) => <li key={item}>{item}</li>)}</ol>
      </section>

      <section className="panel stack" id="sources">
        <h2>Sources</h2>
        <p className="small">{guide.source_notes}</p>
        <ul className="small">
          {guide.sources.map((href) => <li key={href}><a href={href}>{sourceLabel(href)}</a></li>)}
        </ul>
      </section>
    </div>
  );
}
