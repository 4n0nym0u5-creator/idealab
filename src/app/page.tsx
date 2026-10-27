import Link from "next/link";
import { DistributionChart } from "@/components/charts";
import { withPortfolio } from "@/components/gate";
import { CustomerBadge, ScoreMeter, StatusBadge } from "@/components/ui";
import { criteriaInOrder } from "@/lib/criteria";
import { formatDate } from "@/lib/format";
import { workingScores } from "@/lib/scoring";
import { RUN_ONE_FOCUS, THEMES, securitySubtype } from "@/lib/themes";
import type { Idea, Status } from "@/lib/types";

export default async function DashboardPage() {
  return withPortfolio((portfolio) => {
    const ideas = portfolio.ideas;
    const live = ideas.filter((idea) => idea.status !== "killed" && idea.status !== "avoid");
    const killed = ideas.filter((idea) => idea.status === "killed");
    const avoided = ideas.filter((idea) => idea.status === "avoid");
    const security = ideas.filter((idea) => idea.themeId === "security");
    const lead = live.find((idea) => idea.rank === 1) ?? live[0];
    const mean = live.length ? live.reduce((sum, idea) => sum + idea.total, 0) / live.length : 0;
    const counts = countBy(ideas, (idea) => idea.status);
    const bins = histogram(ideas.map((idea) => idea.total));
    const themes = THEMES.map((theme) => {
      const group = ideas.filter((idea) => idea.themeId === theme.id);
      const active = group.filter((idea) => idea.status !== "killed" && idea.status !== "avoid");
      const average = active.length ? active.reduce((sum, idea) => sum + idea.total, 0) / active.length : 0;
      return { ...theme, count: group.length, average, killed: group.filter((idea) => idea.status === "killed").length };
    }).filter((theme) => theme.count > 0);
    const close = closeCalls(live);
    const subtypes = new Map<string, number>();
    for (const idea of security) subtypes.set(securitySubtype(idea.category), (subtypes.get(securitySubtype(idea.category)) ?? 0) + 1);

    return (
      <div className="page">
        <header className="stack">
          <p className="kicker">Portfolio overview</p>
          <h1>A lab for small, low-risk products.</h1>
          <p className="lede">
            {ideas.length} scored ideas across {portfolio.runs.length} research runs. Rubric {portfolio.settings.rubricVersion} scores AI-buildability for a non-engineer.
            Shortlist is the top 10 automatic candidates. Run 3 is the consumer sweep.
          </p>
        </header>

        <section className="stats" aria-label="Portfolio counts">
          <Stat value={String(ideas.length)} label="Ideas" />
          <Stat value={String(counts.shortlist ?? 0)} label="Shortlist" />
          <Stat value={String(counts.feeder ?? 0)} label="Feeders" />
          <Stat value={String(ideas.filter((idea) => idea.customerType === "consumer").length)} label="Consumer" />
          <Stat value={String(security.length)} label="Security" />
          <Stat value={String(killed.length)} label="Killed" />
          <Stat value={mean.toFixed(1)} label="Live average" />
        </section>

        {lead ? (
          <section className="feature">
            <div className="stack">
              <p className="kicker">Highest ranked live idea</p>
              <h2>{lead.title}</h2>
              <p className="lede">{lead.problem}</p>
              <ScoreMeter scores={workingScores(lead)} criteria={criteriaInOrder(portfolio.settings.criteriaOrder)} />
              <div className="chips">
                <StatusBadge status={lead.status} />
                <CustomerBadge type={lead.customerType} />
                <span className="badge">AI {workingScores(lead).aibuild ?? "—"}/5</span>
                <span className="badge">{lead.category}</span>
                <span className="badge">{lead.platform}</span>
              </div>
              <Link className="btn btn-primary" href={`/ideas/${lead.id}`}>Open the brief</Link>
            </div>
            <div>
              <div className="score-figure">{lead.total.toFixed(1)}</div>
              <p className="faint small">Rank {lead.rank} of {live.length} live ideas. Tie-breaks are distribution, legal safety, then build speed.</p>
            </div>
          </section>
        ) : null}

        <section className="panel stack">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <h2>Start here for non-engineers</h2>
            <Link href="/ideas?lens=starters">Open the full view</Link>
          </div>
          <p className="small muted">Sorted by AI-buildability, then total. These are live ideas a non-engineer can prompt into a shippable product.</p>
          <div className="chips">
            <Link className="chip" href="/ideas?customer=consumer">Consumer · {ideas.filter((idea) => idea.customerType === "consumer").length}</Link>
            <Link className="chip" href="/ideas?customer=business">Business · {ideas.filter((idea) => idea.customerType === "business").length}</Link>
            <Link className="chip" href="/ideas?customer=both">Both · {ideas.filter((idea) => idea.customerType === "both").length}</Link>
          </div>
          <div className="list">
            {starters(live).map((idea) => (
              <div key={idea.id} className="row">
                <span className="num">{workingScores(idea).aibuild ?? "—"}/5</span>
                <span>
                  <Link href={`/ideas/${idea.id}`}><strong>{idea.title}</strong></Link>
                  <div className="small faint">{idea.aibuildReason}</div>
                </span>
                <CustomerBadge type={idea.customerType} />
                <span className="num">{idea.total.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid-2">
          <div className="panel stack">
            <h2>Score distribution</h2>
            <p className="small faint">Count of ideas by total, including killed and avoid. Source: the current rubric weights.</p>
            <DistributionChart bins={bins} />
          </div>
          <div className="panel stack">
            <h2>Live, avoid, killed</h2>
            <div className="split" aria-hidden>
              <span style={{ width: pct(live.length, ideas.length), background: "var(--good)" }} />
              <span style={{ width: pct(avoided.length, ideas.length), background: "var(--clay)" }} />
              <span style={{ width: pct(killed.length, ideas.length), background: "var(--bad)" }} />
            </div>
            <p className="small muted">{live.length} live · {avoided.length} avoid · {killed.length} killed</p>
            <div className="chips">
              {(Object.keys(counts) as Status[]).map((status) => (
                <Link key={status} href={`/ideas?status=${status}`} className="badge">{status} {counts[status]}</Link>
              ))}
            </div>
            {close.length ? (
              <div>
                <h3>Close calls</h3>
                <p className="small faint">Live ideas within 2 points. The rubric breaks those ties on distribution, then legal, then build.</p>
                <ul className="small">
                  {close.map((pair) => (
                    <li key={pair}>{pair}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>

        <section className="panel stack">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <p className="kicker">Run 2</p>
              <h2>Cybersecurity</h2>
            </div>
            <Link className="btn" href="/ideas?theme=security">Browse the theme</Link>
          </div>
          <p className="muted">{security.length} ideas · {security.filter((idea) => idea.status === "shortlist").length} on the shortlist · {security.filter((idea) => idea.status === "feeder").length} feeders · {security.filter((idea) => idea.status === "killed").length} hard kills.</p>
          <div className="chips">
            {[...subtypes.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => (
              <span key={name} className="badge badge-security">{name} · {count}</span>
            ))}
          </div>
          <p className="small muted">Hard kills stay on file: {security.filter((idea) => idea.status === "killed").map((idea) => idea.title).join(", ") || "none"}.</p>
          <div className="list">
            {security.filter((idea) => idea.status !== "killed").sort((a, b) => b.total - a.total).slice(0, 5).map((idea) => (
              <Link key={idea.id} href={`/ideas/${idea.id}`} className="row">
                <span className="num">{idea.total.toFixed(1)}</span>
                <span>
                  <strong>{idea.title}</strong>
                  <span className="faint small"> · {securitySubtype(idea.category)}</span>
                </span>
                <StatusBadge status={idea.status} />
              </Link>
            ))}
          </div>
        </section>

        <section className="grid-2">
          <div className="panel">
            <h2>Top of the portfolio</h2>
            <div className="list">
              {live.slice(0, 8).map((idea) => (
                <Link key={idea.id} href={`/ideas/${idea.id}`} className="row">
                  <span className="num">{idea.rank}</span>
                  <span>
                    <strong>{idea.title}</strong>
                    <div className="small faint">{idea.category}</div>
                  </span>
                  <span className="num">{idea.total.toFixed(1)}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="stack">
            <div className="panel">
              <h2>Focus themes</h2>
              <div className="stack">
                {themes.map((theme) => (
                  <Link key={theme.id} href={`/ideas?theme=${theme.id}`} className="row" style={{ gridTemplateColumns: "1fr auto" }}>
                    <span>
                      <strong>{theme.name}</strong>
                      <div className="small faint">{theme.blurb}</div>
                    </span>
                    <span className="num">{theme.count}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="panel">
              <h2>Run history</h2>
              <div className="stack">
                {portfolio.runs.map((run) => (
                  <div key={run.runNumber}>
                    <strong>Run {run.runNumber}</strong>
                    <span className="faint"> · {formatDate(run.date)} · +{run.ideasAdded} / {run.ideasRescored} rescored{run.rubricVersion ? ` · rubric ${run.rubricVersion}` : ""}</span>
                    <p className="small muted">{run.focus || (run.runNumber === 1 ? RUN_ONE_FOCUS : run.notes)}</p>
                  </div>
                ))}
              </div>
              <Link className="btn" href="/runs" style={{ marginTop: 12 }}>Open the run log</Link>
            </div>
          </div>
        </section>
      </div>
    );
  });
}

function starters(live: Idea[]) {
  return [...live]
    .filter((idea) => (workingScores(idea).aibuild ?? 0) >= 4)
    .sort((a, b) => (workingScores(b).aibuild ?? 0) - (workingScores(a).aibuild ?? 0) || b.total - a.total)
    .slice(0, 5);
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="stat"><b>{value}</b><span>{label}</span></div>;
}

function pct(part: number, total: number) {
  if (!total) return "0%";
  return `${(part / total) * 100}%`;
}

function countBy(ideas: Idea[], key: (idea: Idea) => string) {
  const counts: Record<string, number> = {};
  for (const idea of ideas) {
    const name = key(idea);
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

function histogram(totals: number[]) {
  const start = 35;
  const size = 5;
  const bins: { label: string; count: number }[] = [];
  for (let edge = start; edge < 90; edge += size) bins.push({ label: `${edge}`, count: 0 });
  for (const total of totals) {
    const index = Math.min(bins.length - 1, Math.max(0, Math.floor((total - start) / size)));
    bins[index].count += 1;
  }
  return bins.filter((bin) => bin.count > 0);
}

function closeCalls(live: Idea[]) {
  const ordered = [...live].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
  const pairs: string[] = [];
  for (let index = 0; index < ordered.length - 1 && pairs.length < 4; index += 1) {
    const gap = Math.abs(ordered[index].total - ordered[index + 1].total);
    if (gap <= 2 && gap > 0) pairs.push(`${ordered[index].title} ${ordered[index].total.toFixed(1)} and ${ordered[index + 1].title} ${ordered[index + 1].total.toFixed(1)}`);
  }
  return pairs;
}
