"use client";

import Link from "next/link";
import { useState } from "react";
import playbook from "../../data/run8_botplaybook.json";

type Bot = (typeof playbook.bots)[number];

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "true");
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button type="button" className="btn" onClick={copy}>{copied ? "Copied" : label}</button>
  );
}

function OrgChart() {
  const reports = ["Builder", "Support & QA", "Growth (incl. Ads)", "Partnerships & Distribution", "Finance & Admin"];
  return (
    <div className="org" aria-label="Organisation chart">
      <div className="org-box org-ceo">You: CEO and sole approver</div>
      <p className="org-edge">weekly briefing / approvals</p>
      <div className="org-mid">
        <div className="org-box">SideHustle: Strategy & Research</div>
        <p className="org-edge">monthly portfolio memo</p>
        <div className="org-box org-cos">Chief of Staff (orchestrator)</div>
      </div>
      <p className="org-edge">priorities, one owner per task</p>
      <div className="org-row">
        {reports.map((name) => <div key={name} className="org-box">{name}</div>)}
      </div>
      <ul className="small">
        <li>Support & QA sends a bug report file to Builder.</li>
        <li>Builder sends release notes to Support & QA and Growth.</li>
        <li>Growth sends launch dates and SEO asks to Builder.</li>
        <li>Partnerships sends partner asks and store listing copy to Growth.</li>
        <li>Finance & Admin sends spend vs cap to Growth.</li>
        <li>Support & QA sends the refund queue to Finance & Admin.</li>
        <li>Growth, Partnerships, Support & QA, Builder and Finance & Admin send drafts and approval cards back to you.</li>
      </ul>
    </div>
  );
}

function BotCard({ bot }: { bot: Bot }) {
  return (
    <article className="stack">
      <div className="chips">
        <span className="badge">{bot.hire}</span>
      </div>
      <p><strong>Mission.</strong> {bot.mission}</p>
      <p><strong>Owns.</strong> {bot.owns}</p>
      <p><strong>Connectors.</strong> {bot.connectors}</p>
      <div>
        <strong>Routines.</strong>
        <ol className="small">{bot.routines.map((item) => <li key={item}>{item}</li>)}</ol>
      </div>
      <p><strong>Skills.</strong> {bot.skills}</p>
      <p><strong>Outputs.</strong> {bot.outputs}</p>
      <p><strong>Approvals.</strong> {bot.approvals}</p>
      <p><strong>KPIs.</strong> {bot.kpis}</p>
      <div className="callout stack">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <strong>Starter instructions</strong>
          <CopyButton text={bot.starter} label="Copy starter" />
        </div>
        <p className="small">{bot.starter}</p>
      </div>
    </article>
  );
}

export function PlaybookView() {
  const [botId, setBotId] = useState(playbook.bots[0].id);
  const bot = playbook.bots.find((item) => item.id === botId) ?? playbook.bots[0];

  return (
    <div className="page">
      <header className="stack">
        <p className="kicker">Run 8 · 28 Oct 2026 · Life Admin Pass</p>
        <h1>{playbook.title}</h1>
        <p className="lede">{playbook.prepared}</p>
        <div className="chips">
          {playbook.related.map((item) => <Link key={item.href} className="chip" href={item.href}>{item.label}</Link>)}
          <Link className="chip" href="/global">Global expansion</Link>
        </div>
      </header>

      <section className="grid-4" id="summary">
        {playbook.metrics.map((metric) => (
          <article key={metric.label} className="stat">
            <b>{metric.value}</b>
            <span>{metric.label}</span>
            <p className="small faint">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="panel stack" id="exec">
        <h2>Executive summary</h2>
        <p>{playbook.summary}</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Bot</th><th>Owns</th><th>Hire in</th></tr></thead>
            <tbody>
              {playbook.lineup.map((row) => (
                <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>Why these merges</h3>
        <ul>{playbook.merges.map((item) => <li key={item}>{item}</li>)}</ul>
        <h3>Why not more</h3>
        <ol>{playbook.whyNotMore.map((item) => <li key={item}>{item}</li>)}</ol>
        <p className="small">Plans and billing: <a href="https://cursor.com/help/grok-bot/plans">cursor.com/help/grok-bot/plans</a>. Group chats: <a href="https://cursor.com/docs/grok-bot/work">Work with Grok Bot</a>.</p>
        <h3>Bots to add later</h3>
        <ul>{playbook.addLater.map((item) => <li key={item}>{item}</li>)}</ul>
        <h3>First 30 days</h3>
        <p className="small muted">28 Oct to 26 Nov 2026, aligned with the GiftLedger launch on 20 Nov.</p>
        <ol>{playbook.first30.map(([title, detail]) => <li key={title}><strong>{title}.</strong> {detail}</li>)}</ol>
      </section>

      <section className="panel stack" id="org">
        <h2>Org chart</h2>
        <p className="small muted">You sit at the top as CEO and the only approver. Chief of Staff routes work. The other Bots send drafts back to you.</p>
        <OrgChart />
        <h3>Handoffs</h3>
        {playbook.handoffs.map(([title, detail]) => <p key={title} className="small"><strong>{title}.</strong> {detail}</p>)}
        <p className="small">Source: <a href="https://cursor.com/docs/grok-bot/work">Work with Grok Bot</a>.</p>
        <h3>Shared folder</h3>
        <p className="small muted">Chief of Staff creates this in Phase 0.</p>
        <pre className="folder">{playbook.folder}</pre>
        <details>
          <summary>Mermaid source</summary>
          <pre className="folder">{playbook.mermaid}</pre>
        </details>
      </section>

      <section className="panel stack" id="bots">
        <h2>Bot cards</h2>
        <p className="small"><strong>Privacy line every persona includes.</strong> {playbook.privacyLine}</p>
        <p className="small"><strong>Send line every persona includes.</strong> {playbook.sendLine}</p>
        <div className="chips" role="tablist" aria-label="Bots">
          {playbook.bots.map((item) => (
            <button key={item.id} type="button" className="chip" role="tab" aria-selected={item.id === bot.id} data-on={item.id === bot.id} onClick={() => setBotId(item.id)}>{item.name}</button>
          ))}
        </div>
        <BotCard bot={bot} />
      </section>

      <section className="panel stack" id="cadence">
        <h2>Operating cadence</h2>
        <p className="small muted">Times are AEDT.</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>When</th><th>Who</th><th>What</th><th>Where it lands</th></tr></thead>
            <tbody>{playbook.cadence.map((row) => <tr key={row[0] + row[1]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p>{playbook.timeBudget}</p>
        <h3>Coordination rules</h3>
        <ol>{playbook.coordination.map((item) => <li key={item}>{item}</li>)}</ol>
      </section>

      <section className="panel stack" id="guardrails">
        <h2>Guardrails</h2>
        <ol>
          {playbook.guardrails.map(([title, detail]) => <li key={title}><strong>{title}.</strong> {detail}</li>)}
        </ol>
        <p className="small">
          <a href="https://cursor.com/help/grok-bot/agent-email">Agent email</a>
          {" · "}
          <a href="https://cursor.com/help/grok-bot/approvals">Approvals</a>
          {" · "}
          <a href="https://genai.owasp.org/llmrisk/llm062025-excessive-agency/">OWASP LLM06</a>
          {" · "}
          <a href="https://www.acma.gov.au/avoid-sending-spam">ACMA Spam Act</a>
          {" · "}
          <a href="https://www.accc.gov.au/consumers/problem-with-a-product-or-service-you-bought/repair-replace-refund-cancel">ACCC refunds</a>
        </p>
      </section>

      <section className="panel stack" id="rollout">
        <h2>Phased rollout</h2>
        <h3>Phase 0: setup, 28 Oct to 3 Nov 2026</h3>
        <ol>{playbook.phase0.map(([title, detail]) => <li key={title}><strong>{title}.</strong> {detail}</li>)}</ol>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Phase</th><th>Window</th><th>Who is hired</th><th>Milestones</th></tr></thead>
            <tbody>{playbook.phases.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="panel stack" id="costs">
        <h2>Costs and tools</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Item</th><th>Price found</th><th>Notes</th><th>Source</th></tr></thead>
            <tbody>
              {playbook.costs.map((row) => (
                <tr key={row[0]}>
                  <td>{row[0]}</td>
                  <td>{row[1]}</td>
                  <td>{row[2]}</td>
                  <td><a href={row[3]}>{row[3].replace(/^https?:\/\//, "")}</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p><strong>Ads reality check.</strong> {playbook.adsCheck}</p>
        <p><strong>Channel reach.</strong> {playbook.channelFacts}</p>
        <p><strong>Finance facts.</strong> {playbook.financeFacts}</p>
      </section>

      <section className="panel stack" id="risks">
        <h2>Risks</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Risk</th><th>What it looks like</th><th>Mitigation</th></tr></thead>
            <tbody>{playbook.risks.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="panel stack" id="prompts">
        <h2>Appendix: routine prompts</h2>
        <p className="small muted">Send each prompt to the owning Bot. It creates the routine. Then open it and press Test. A test does real work.</p>
        {playbook.routines.map(([number, title, prompt]) => (
          <article key={number} className="stack">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <h3>{number}. {title}</h3>
              <CopyButton text={prompt} label="Copy prompt" />
            </div>
            <p className="small">{prompt}</p>
          </article>
        ))}
      </section>

      <section className="panel stack" id="raci">
        <h2>Appendix: RACI</h2>
        <p className="small muted">R does the work. A is accountable and approves. C is consulted. I is informed.</p>
        <div className="table-wrap">
          <table>
            <thead><tr>{playbook.raciHeaders.map((header) => <th key={header}>{header}</th>)}</tr></thead>
            <tbody>
              {playbook.raci.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={playbook.raciHeaders[index]}>{cell}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel stack" id="verify">
        <h2>Verify in the app</h2>
        <p className="small muted">These capabilities were not confirmed in the app UI notes. Check them before you rely on them.</p>
        <ol>{playbook.verify.map((item) => <li key={item}>{item}</li>)}</ol>
      </section>

      <section className="panel stack" id="sources">
        <h2>Sources</h2>
        <ul className="small">
          {playbook.sources.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}
        </ul>
        <p className="small muted">The full plan is stored in the repo as data/run8_botplaybook.md.</p>
      </section>
    </div>
  );
}
