"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_ORDER, SECURITY_LEGAL_ADDENDUM, criteriaInOrder, type CriterionKey } from "@/lib/criteria";
import { saveTrackingAction } from "@/lib/actions";
import { buildBrief } from "@/lib/brief";
import { domainOf, formatDate } from "@/lib/format";
import { contribution, workingScores } from "@/lib/scoring";
import { tierLabel } from "@/lib/bundles";
import { monetisationLabel, privacyClassName, privacyLabel } from "@/lib/portfolio";
import { lineupLabel } from "@/lib/run7";
import { STATUS_META, type Idea, type Status } from "@/lib/types";
import type { Weights } from "@/lib/criteria";
import { ScoreRadar } from "./charts";
import { Sparkline } from "./sparkline";
import { CustomerBadge, FlagList, ScoreMeter, StatusBadge, meterColor } from "./ui";

export function IdeaDetail({ idea, weights, neighbors, criteriaOrder }: { idea: Idea; weights: Weights; neighbors: { prev?: { id: string; title: string }; next?: { id: string; title: string } }; criteriaOrder?: string[] }) {
  const criteria = criteriaInOrder(criteriaOrder?.length ? criteriaOrder : DEFAULT_ORDER);
  const scores = workingScores(idea, criteria.map((item) => item.key));
  const brief = buildBrief(idea, weights);
  const [status, setStatus] = useState<Status>(idea.status);
  const [userNotes, setUserNotes] = useState(idea.userNotes);
  const [mvp, setMvp] = useState(idea.mvp);
  const [distribution, setDistribution] = useState(idea.distribution);
  const [risks, setRisks] = useState(idea.risks);
  const [liabilityNotes, setLiabilityNotes] = useState(idea.liabilityNotes);
  const [overrides, setOverrides] = useState<Partial<Record<CriterionKey, number>>>({ ...idea.scoreOverrides });
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  useEffect(() => {
    setStatus(idea.status);
    setUserNotes(idea.userNotes);
    setMvp(idea.mvp);
    setDistribution(idea.distribution);
    setRisks(idea.risks);
    setLiabilityNotes(idea.liabilityNotes);
    setOverrides({ ...idea.scoreOverrides });
  }, [idea]);

  function save(unlock = false) {
    setMessage("");
    startTransition(async () => {
      const result = await saveTrackingAction({
        id: idea.id,
        status: unlock ? undefined : status,
        userNotes,
        mvp,
        distribution,
        risks,
        liabilityNotes,
        scoreOverrides: overrides,
        unlock,
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage(unlock ? "Returned to automatic status." : "Saved.");
      router.refresh();
    });
  }

  return (
    <div className="page">
      <p className="small"><Link href="/ideas">Ideas</Link> · <Link href={`/compare?ids=${idea.id}`}>Compare</Link></p>
      <header className="feature">
        <div className="stack">
          <div className="chips">
            <StatusBadge status={idea.status} />
            <CustomerBadge type={idea.customerType} />
            {brief.security ? <span className="badge badge-security">Cybersecurity · {brief.subtype}</span> : <span className="badge">{idea.category}</span>}
            {idea.secondaryCategories.map((tag) => <span key={tag} className="badge badge-tag">{tag}</span>)}
            {idea.bundleFit ? <Link className={`badge badge-${idea.bundleFit.tier}`} href="/bundles">{tierLabel(idea.bundleFit.tier)} · {idea.bundleFit.module}</Link> : null}
            {idea.tier ? <Link className="badge" href="/portfolio">{idea.tier}</Link> : null}
            {idea.family ? <span className="badge badge-tag">{idea.family}</span> : null}
            {idea.privacyClass ? <span className={privacyClassName(idea.privacyClass)}>{privacyLabel(idea.privacyClass)}</span> : null}
            {idea.portfolioFit ? <span className="badge">Fit {idea.portfolioFit.score.toFixed(1)}</span> : null}
            {idea.portfolioMonetisation ? <span className="badge">{monetisationLabel(idea.portfolioMonetisation.model)}</span> : null}
            {idea.lineupRole ? <Link className="badge" href="/life-admin-pass">{lineupLabel(idea.lineupRole)}</Link> : null}
            <span className="badge">{idea.platform}</span>
            <span className="badge">Seen in run {idea.firstSeenRun}</span>
            <span className="badge">Scored in run {idea.lastScoredRun}</span>
            {idea.statusLocked ? <span className="badge">Status locked</span> : null}
          </div>
          <h1 style={{ fontSize: "clamp(36px, 4vw, 56px)" }}>{idea.title}</h1>
          <p className="lede">{idea.problem}</p>
          <p className="small muted">For {idea.targetUsers}</p>
          <ScoreMeter scores={scores} criteria={criteria} />
        </div>
        <div>
          <div className="score-figure">{idea.total.toFixed(1)}</div>
          <p className="faint small">{idea.rank ? `Live rank ${idea.rank}` : "Outside the live ranking"}{idea.total !== idea.researchTotal ? ` · research total ${idea.researchTotal.toFixed(1)}` : ""}</p>
        </div>
      </header>

      <section className="feature">
        <div className="stack">
          <p className="kicker">AI-buildability for a non-engineer</p>
          <p className="lede">{idea.aibuildReason || "How far a non-engineer can prompt this to a correct, shippable state."}</p>
          {(scores.aibuild ?? 0) >= 4 ? <Link className="btn" href="/ideas?lens=starters">Start here for non-engineers</Link> : null}
        </div>
        <div>
          <div className="score-figure">{scores.aibuild ?? "—"}<span className="small faint">/5</span></div>
          <p className="faint small">Weight {weights.aibuild ?? 0}. A high score means the mistakes are visible and the stack is ordinary web software.</p>
        </div>
      </section>

      {idea.categoryHistory.length || idea.bundleFit ? (
        <section className="panel stack">
          <h2>Category and bundle fit</h2>
          {idea.bundleFit ? <p>{idea.bundleFit.note} <Link href="/bundles">Open the bundle</Link></p> : null}
          {idea.secondaryCategories.length ? <p className="small muted">Also tagged: {idea.secondaryCategories.join(", ")}</p> : null}
          {idea.categoryHistory.length ? (
            <div className="list">
              {idea.categoryHistory.map((event, index) => (
                <div key={`${event.run}-${index}`} className="row">
                  <span className="badge">Run {event.run}</span>
                  <span><strong>{event.from} → {event.to}</strong><div className="small faint">{event.date}{event.note ? ` · ${event.note}` : ""}</div></span>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {brief.security ? (
        <section className="panel stack">
          <h2>Security design rules</h2>
          <p className="small muted">{SECURITY_LEGAL_ADDENDUM.versionNote}</p>
          <ul className="small">{SECURITY_LEGAL_ADDENDUM.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
        </section>
      ) : null}

      {brief.liability.length ? (
        <section className="callout">
          <strong>Liability and soft risk</strong>
          <ul>{brief.liability.map((line) => <li key={line}>{line}</li>)}</ul>
        </section>
      ) : null}

      {idea.killFlags.length ? (
        <section className="callout danger stack">
          <strong>Hard kill flags</strong>
          <FlagList flags={idea.killFlags} tone="killed" />
          <p className="small">Any kill flag forces status to killed, regardless of the total. The idea stays in the database so a later run does not research it again.</p>
        </section>
      ) : null}
      {idea.avoidFlags.length || idea.status === "avoid" ? (
        <section className="callout stack">
          <strong>Avoid</strong>
          <FlagList flags={idea.avoidFlags} tone="avoid" />
          <p className="small">Avoid sits beside killed. It keeps an idea out of the shortlist without calling it illegal. A rescore will not promote it.</p>
        </section>
      ) : null}

      <section className="grid-2">
        <div className="panel">
          <h2>Score shape</h2>
          <ScoreRadar series={[{ name: idea.title, scores, color: "#1e6b4a" }]} criteria={criteria} />
        </div>
        <div className="panel">
          <h2>Points by criterion</h2>
          <div className="bars">
            {criteria.map((criterion) => {
              const points = contribution(scores[criterion.key] ?? 0, weights[criterion.key] ?? 0);
              return (
                <div key={criterion.key} className="bar-row">
                  <span>{criterion.short}</span>
                  <div className="track" title={`${scores[criterion.key] ?? 0}/5 × weight ${weights[criterion.key] ?? 0}`}><span style={{ width: `${(points / Math.max(weights[criterion.key] ?? 0, 1)) * 100}%`, background: meterColor(scores[criterion.key] ?? 0) }} /></div>
                  <span className="num">{points.toFixed(1)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="table-wrap">
        <table>
          <thead>
            <tr><th>Criterion</th><th>Score</th><th>Weight</th><th>Points</th><th>What this score means</th></tr>
          </thead>
          <tbody>
            {criteria.map((criterion) => (
              <tr key={criterion.key}>
                <td>{criterion.label}{criterion.inverted ? <span className="faint"> · inverted</span> : null}{idea.scoreOverrides[criterion.key] !== undefined ? <span className="faint"> · override</span> : null}</td>
                <td className="num">{scores[criterion.key] ?? "—"}</td>
                <td className="num">{weights[criterion.key] ?? 0}</td>
                <td className="num">{contribution(scores[criterion.key] ?? 0, weights[criterion.key] ?? 0).toFixed(1)}</td>
                <td className="small muted">{scores[criterion.key] === undefined ? "Not scored" : criterion.levels[scores[criterion.key]]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid-2">
        <article className="panel stack">
          <h2>Reasoning</h2>
          <p>{brief.reasoning}</p>
        </article>
        <article className="panel stack">
          <h2>Monetisation</h2>
          <p><strong>{brief.monetisation.model}</strong></p>
          <p>{brief.monetisation.price}</p>
          <p className="small muted">{brief.monetisation.reading}</p>
        </article>
        <article className="panel stack">
          <h2>MVP scope</h2>
          {brief.mvp.yours ? <p>{brief.mvp.yours}</p> : null}
          <p className="small muted">{brief.mvp.implied}</p>
        </article>
        <article className="panel stack">
          <h2>Distribution</h2>
          {brief.distribution.yours ? <p>{brief.distribution.yours}</p> : null}
          <p className="small muted">{brief.distribution.implied}</p>
        </article>
      </section>

      <section className="grid-2">
        <article className="panel stack">
          <h2>Risks the scores already show</h2>
          {brief.risks.yours ? <p>{brief.risks.yours}</p> : null}
          {brief.risks.weak.length ? (
            <ul className="small">{brief.risks.weak.map((item) => <li key={item.label}><strong>{item.label} {item.score}/5.</strong> {item.text}</li>)}</ul>
          ) : <p className="small muted">No criterion is at 2 or below.</p>}
        </article>
        <article className="panel stack">
          <h2>Sources</h2>
          {idea.evidence.length ? idea.evidence.map((item) => (
            <p key={item.url} className="small"><a href={item.url} target="_blank" rel="noreferrer">{domainOf(item.url)}</a> — {item.note}</p>
          )) : <p className="small muted">No sources recorded.</p>}
          {idea.competitors.length ? <p className="small muted">Competitors: {idea.competitors.join(", ")}</p> : null}
        </article>
      </section>

      <section className="panel stack">
        <h2>Pain points and evidence</h2>
        <p className="small muted">Complaint frequency is evidence from Run 4. It is not weighted and it does not change the total. The optional complaint-frequency criterion can still hold an integer score if a later run sends one.</p>
        {idea.complaintFrequency != null ? <p><span className="badge badge-evidence">CFS {idea.complaintFrequency.toFixed(2)} · evidence, not scored</span></p> : null}
        {idea.painClusterIds.length ? (
          <div className="stack">
            <p className="small muted">Linked clusters. The first one is the primary cluster, and the CFS above is its maximum.</p>
            {idea.painClusterIds.map((id) => <div key={id}><Link href={`/pain/${id}`}>{id}</Link></div>)}
          </div>
        ) : null}
        {idea.relatedPainClusterIds.length ? <p className="small">Related clusters: {idea.relatedPainClusterIds.map((id) => <Link key={id} href={`/pain/${id}`}>{id}</Link>)}</p> : null}
        {idea.relatedIds.length ? <p className="small">Related ideas: {idea.relatedIds.map((id) => <Link key={id} href={`/ideas/${id}`}>{id}</Link>)}</p> : null}
        {idea.run4Merge.length ? idea.run4Merge.map((item) => <p key={item.run4Id} className="small muted">Folded from {item.run4Id}: {item.note}</p>) : null}
        {idea.portfolioFit ? (
          <div className="stack">
            <h3>Portfolio fit</h3>
            <p className="small muted">Run 6 annotation. This score is not part of the rubric total.</p>
            <p className="small">Fit {idea.portfolioFit.score.toFixed(1)} · rank {idea.portfolioFit.rank} · viability {idea.portfolioFit.viability.toFixed(1)} · opportunity {idea.portfolioFit.opportunity.toFixed(1)} · before privacy {idea.portfolioFit.prePrivacy.toFixed(1)}{idea.roadmapSlot != null ? <> · <Link href="/portfolio">roadmap slot {String(idea.roadmapSlot)}</Link></> : null}</p>
            {idea.portfolioMonetisation ? <p className="small"><strong>{monetisationLabel(idea.portfolioMonetisation.model)}.</strong> {idea.portfolioMonetisation.reasoning}</p> : null}
            {idea.privacyNotes ? <p className="small">{idea.privacyNotes}</p> : null}
            {idea.lineupNote ? <p className="small">{idea.lineupNote} <Link href="/life-admin-pass">Life Admin Pass deep dive</Link>.</p> : null}
            {idea.thirdPartyPersonalDataApi ? <p className="small">Third-party personal-data API: {idea.thirdPartyPersonalDataApi}</p> : null}
          </div>
        ) : null}
        {idea.painPoints.length ? idea.painPoints.map((point) => (
          <article key={point.id} className="stack">
            <strong>{point.label}</strong>
            <p className="small">{point.count} mentions{point.cluster ? ` · ${point.cluster}` : ""}</p>
            {point.quotes.map((quote) => <blockquote key={quote} className="small">{quote}</blockquote>)}
            {point.sources.map((source) => <p key={source.url} className="small"><a href={source.url}>{domainOf(source.url)}</a> — {source.note}</p>)}
          </article>
        )) : idea.painClusterIds.length ? null : <p className="small">No pain clusters are attached to this idea yet.</p>}
      </section>

      <section className="panel stack">
        <h2>Score history</h2>
        {new Set(idea.scoreHistory.map((item) => item.rubricVersion || "1.0")).size > 1 ? (
          <p className="small muted">Totals are kept under the rubric version that produced them. A v1.0 total and a v2.0 total are not the same scale.</p>
        ) : null}
        {[...groupHistory(idea.scoreHistory)].map(([version, items]) => (
          <div key={version} className="stack">
            <p className="kicker">Rubric {version}</p>
            {items.length > 1 ? <Sparkline points={items.map((item) => item.total)} labels={items.map((item) => `R${item.run}`)} /> : null}
            {items.map((item) => (
              <div key={`${item.run}-${item.rubricVersion}`} className="row" style={{ gridTemplateColumns: "88px 1fr auto" }}>
                <span className="num">{item.total.toFixed(1)}</span>
                <span>Run {item.run} · {formatDate(item.date)}{item.note ? ` · ${item.note}` : ""}</span>
                <span className="small faint">{scoreDigits(item.scores)}</span>
              </div>
            ))}
          </div>
        ))}
      </section>

      <section className="panel stack">
        <h2>Tracking</h2>
        <div className="grid-2">
          <label className="field">Status
            <select value={status} onChange={(event) => setStatus(event.target.value as Status)}>
              {Object.entries(STATUS_META).map(([value, meta]) => <option key={value} value={value}>{meta.label} — {meta.hint}</option>)}
            </select>
          </label>
          <label className="field">Your notes
            <textarea value={userNotes} onChange={(event) => setUserNotes(event.target.value)} />
          </label>
          <label className="field">MVP note
            <textarea value={mvp} onChange={(event) => setMvp(event.target.value)} />
          </label>
          <label className="field">Distribution note
            <textarea value={distribution} onChange={(event) => setDistribution(event.target.value)} />
          </label>
          <label className="field">Risk note
            <textarea value={risks} onChange={(event) => setRisks(event.target.value)} />
          </label>
          <label className="field">Liability note
            <textarea value={liabilityNotes} onChange={(event) => setLiabilityNotes(event.target.value)} placeholder="Separate from research notes. Shown in the liability callout." />
          </label>
        </div>
        <details>
          <summary>Manual score overrides</summary>
          <p className="small muted">Overrides change the working total and can move automatic statuses. Research scores and score history stay intact. Export still writes the research scores.</p>
          <div className="filters" style={{ marginTop: 10 }}>
            {criteria.map((criterion) => (
              <label key={criterion.key} className="small">{criterion.short}
                <select
                  className="control"
                  value={overrides[criterion.key] ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setOverrides((current) => {
                      const next = { ...current };
                      if (value === "") delete next[criterion.key];
                      else next[criterion.key] = Number(value);
                      return next;
                    });
                  }}
                >
                  <option value="">Research ({idea.scores[criterion.key]})</option>
                  {[0, 1, 2, 3, 4, 5].map((score) => <option key={score} value={score}>{score}</option>)}
                </select>
              </label>
            ))}
          </div>
        </details>
        <div className="filters">
          <button className="btn btn-primary" type="button" disabled={pending} onClick={() => save(false)}>{pending ? "Saving" : "Save tracking"}</button>
          {idea.statusLocked || idea.status === "avoid" ? <button className="btn" type="button" disabled={pending} onClick={() => save(true)}>Return to automatic status</button> : null}
          {message ? <span className="small muted">{message}</span> : null}
        </div>
      </section>

      <div className="filters">
        {neighbors.prev ? <Link className="btn" href={`/ideas/${neighbors.prev.id}`}>Previous · {neighbors.prev.title}</Link> : null}
        {neighbors.next ? <Link className="btn" href={`/ideas/${neighbors.next.id}`}>Next · {neighbors.next.title}</Link> : null}
      </div>
    </div>
  );
}

function groupHistory(history: Idea["scoreHistory"]) {
  const groups = new Map<string, Idea["scoreHistory"]>();
  for (const item of history) {
    const version = item.rubricVersion || "1.0";
    const list = groups.get(version) ?? [];
    list.push(item);
    groups.set(version, list);
  }
  return groups;
}

function scoreDigits(scores: Record<string, number>) {
  const order: readonly string[] = DEFAULT_ORDER;
  const known = order.filter((key) => scores[key] !== undefined);
  const extra = Object.keys(scores).filter((key) => !known.includes(key));
  return [...known, ...extra].map((key) => scores[key]).join("");
}
