"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LayoutGrid, Table2 } from "lucide-react";
import { DEFAULT_ORDER, criteriaInOrder, type CriterionKey } from "@/lib/criteria";
import { cn } from "@/lib/format";
import { statusRank, workingScores } from "@/lib/scoring";
import { THEMES } from "@/lib/themes";
import { BUNDLE_TIERS, STATUS_META, type Idea, type Status } from "@/lib/types";
import { tierLabel } from "@/lib/bundles";
import { monetisationLabel, privacyClassName, privacyLabel } from "@/lib/portfolio";
import { CustomerBadge, ScoreMeter, StatusBadge } from "./ui";

const COMPARE_KEY = "idealab-compare";

export function IdeasExplorer({ ideas, initialQuery, initialStatus, initialTheme, initialRun, initialCustomer, initialLens, initialCategory, initialTier, initialEvidence, initialFitTier, initialFamily, initialPrivacy, initialModel, criteriaOrder }: { ideas: Idea[]; initialQuery?: string; initialStatus?: string; initialTheme?: string; initialRun?: string; initialCustomer?: string; initialLens?: string; initialCategory?: string; initialTier?: string; initialEvidence?: string; initialFitTier?: string; initialFamily?: string; initialPrivacy?: string; initialModel?: string; criteriaOrder?: string[] }) {
  const criteria = criteriaInOrder(criteriaOrder?.length ? criteriaOrder : DEFAULT_ORDER);
  const [query, setQuery] = useState(initialQuery ?? "");
  const [statuses, setStatuses] = useState<string[]>(initialStatus ? [initialStatus] : []);
  const [customer, setCustomer] = useState(initialCustomer ?? "");
  const [lens, setLens] = useState(initialLens ?? "");
  const [category, setCategory] = useState(initialCategory ?? "");
  const [tier, setTier] = useState(initialTier ?? "");
  const [evidenceOnly, setEvidenceOnly] = useState(initialEvidence === "1");
  const [fitTier, setFitTier] = useState(initialFitTier ?? "");
  const [family, setFamily] = useState(initialFamily ?? "");
  const [privacy, setPrivacy] = useState(initialPrivacy ?? "");
  const [model, setModel] = useState(initialModel ?? "");
  const [theme, setTheme] = useState(initialTheme ?? "");
  const [run, setRun] = useState(initialRun ?? "");
  const [minScore, setMinScore] = useState(0);
  const [criterion, setCriterion] = useState<CriterionKey | "">("");
  const [criterionMin, setCriterionMin] = useState(4);
  const [sort, setSort] = useState(initialLens === "starters" ? "starters" : "rank");
  const [view, setView] = useState<"cards" | "table">("table");
  const [picked, setPicked] = useState<string[]>([]);

  const categories = useMemo(() => [...new Set(ideas.map((idea) => idea.category))].sort(), [ideas]);
  const families = useMemo(() => [...new Set(ideas.map((idea) => idea.family).filter(Boolean))].sort(), [ideas]);
  const fitTiers = useMemo(() => [...new Set(ideas.map((idea) => idea.tier).filter(Boolean))], [ideas]);
  const runs = useMemo(() => [...new Set(ideas.flatMap((idea) => [idea.firstSeenRun, idea.lastScoredRun]))].sort((a, b) => a - b), [ideas]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = ideas.filter((idea) => {
      if (statuses.length && !statuses.includes(idea.status)) return false;
      if (customer && idea.customerType !== customer) return false;
      if (lens === "starters" && (idea.status === "killed" || idea.status === "avoid")) return false;
      if (category && idea.category !== category && !idea.secondaryCategories.includes(category)) return false;
      if (tier && idea.bundleFit?.tier !== tier) return false;
      if (fitTier && idea.tier !== fitTier) return false;
      if (family && idea.family !== family) return false;
      if (privacy && idea.privacyClass !== privacy) return false;
      if (model && idea.portfolioMonetisation?.model !== model) return false;
      if (evidenceOnly && idea.complaintFrequency == null) return false;
      if (theme && idea.themeId !== theme) return false;
      if (idea.total < minScore) return false;
      if (run) {
        const number = Number(run);
        const touched = idea.firstSeenRun === number || idea.lastScoredRun === number || idea.scoreHistory.some((item) => item.run === number);
        if (!touched) return false;
      }
      if (criterion && workingScores(idea)[criterion] < criterionMin) return false;
      if (needle) {
        const hay = [idea.title, idea.id, idea.problem, idea.category, idea.platform, idea.notes, idea.targetUsers, idea.monetisation, idea.liabilityNotes, idea.customerType, idea.aibuildReason, idea.bundleFit?.module, idea.bundleFit?.tier, idea.tier, idea.family, idea.privacyClass, idea.portfolioMonetisation?.model, ...idea.secondaryCategories, ...idea.mergedIds, ...idea.painClusterIds, ...idea.competitors, ...idea.killFlags, ...idea.avoidFlags].join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    const scoresOf = (idea: Idea) => workingScores(idea);
    rows.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "category") return a.category.localeCompare(b.category) || b.total - a.total;
      if (sort === "status") return statusRank(a.status) - statusRank(b.status) || b.total - a.total;
      if (sort === "total") return b.total - a.total;
      if (sort === "starters") return (scoresOf(b).aibuild ?? 0) - (scoresOf(a).aibuild ?? 0) || b.total - a.total;
      if (sort === "seen") return b.firstSeenRun - a.firstSeenRun || b.total - a.total;
      if (sort === "complaints") return (b.complaintFrequency ?? -1) - (a.complaintFrequency ?? -1) || b.total - a.total;
      if (sort === "fit") return (b.portfolioFit?.score ?? -1) - (a.portfolioFit?.score ?? -1) || b.total - a.total;
      if (criteria.some((item) => item.key === sort)) {
        const key = sort as CriterionKey;
        return scoresOf(b)[key] - scoresOf(a)[key] || b.total - a.total;
      }
      return (a.rank ?? 999) - (b.rank ?? 999) || b.total - a.total;
    });
    return rows;
  }, [ideas, query, statuses, customer, lens, category, tier, fitTier, family, privacy, model, evidenceOnly, theme, run, minScore, criterion, criterionMin, sort, criteria]);

  function toggleStatus(status: string) {
    setStatuses((current) => current.includes(status) ? current.filter((item) => item !== status) : [...current, status]);
  }

  function togglePick(id: string) {
    setPicked((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id].slice(0, 4);
      localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <div className="page page-wide">
      <header className="stack">
        <p className="kicker">Ideas</p>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <h1>Explorer</h1>
          <div className="chips">
            <button className="icon-btn" type="button" aria-label="Card view" onClick={() => setView("cards")}><LayoutGrid size={16} /></button>
            <button className="icon-btn" type="button" aria-label="Table view" onClick={() => setView("table")}><Table2 size={16} /></button>
          </div>
        </div>
        <p className="lede">{filtered.length} of {ideas.length} ideas. Filter by customer, bundle tier, category, or the run that last scored them.</p>
      </header>
      {lens === "starters" ? (
        <section className="callout stack">
          <strong>Start here for non-engineers</strong>
          <p className="small">Live ideas sorted by AI-buildability, then total. A 4 or 5 means a non-engineer can prompt the product to a shippable state and see when it is wrong.</p>
          <button className="btn" type="button" onClick={() => { setLens(""); setSort("rank"); }}>Show every idea</button>
        </section>
      ) : (
        <p className="small"><button className="btn" type="button" onClick={() => { setLens("starters"); setSort("starters"); setStatuses([]); }}>Start here for non-engineers</button></p>
      )}

      <div className="panel stack">
        <div className="filters">
          <input className="control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, problem, notes, competitor" aria-label="Filter ideas" style={{ minWidth: 240, flex: 1 }} />
          <select className="control" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Category">
            <option value="">All categories</option>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="control" value={theme} onChange={(event) => setTheme(event.target.value)} aria-label="Theme">
            <option value="">All themes</option>
            {THEMES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select className="control" value={run} onChange={(event) => setRun(event.target.value)} aria-label="Run">
            <option value="">Any run</option>
            {runs.map((item) => <option key={item} value={item}>Run {item}</option>)}
          </select>
          <select className="control" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort">
            <option value="rank">Sort by rank</option>
            <option value="total">Sort by total</option>
            <option value="starters">Sort by AI-buildability</option>
            <option value="title">Sort by title</option>
            <option value="category">Sort by category</option>
            <option value="status">Sort by status</option>
            <option value="seen">Sort by first seen</option>
            <option value="complaints">Sort by complaint frequency (evidence, not scored)</option>
            <option value="fit">Sort by portfolio fit</option>
            {criteria.map((item) => <option key={item.key} value={item.key}>Sort by {item.short}</option>)}
          </select>
        </div>
        <div className="chips">
          {Object.entries(STATUS_META).map(([status, meta]) => (
            <button key={status} type="button" className="chip" data-on={statuses.includes(status)} onClick={() => toggleStatus(status)}>{meta.label}</button>
          ))}
          {["consumer", "business", "both"].map((type) => (
            <button key={type} type="button" className="chip" data-on={customer === type} onClick={() => setCustomer((current) => current === type ? "" : type)}>{type === "both" ? "Consumer and business" : type[0].toUpperCase() + type.slice(1)}</button>
          ))}
          {BUNDLE_TIERS.map((item) => (
            <button key={item} type="button" className="chip" data-on={tier === item} onClick={() => setTier((current) => current === item ? "" : item)}>{tierLabel(item)}</button>
          ))}
          <button type="button" className="chip" data-on={evidenceOnly} onClick={() => setEvidenceOnly((current) => !current)}>Complaint evidence, not scored</button>
          {fitTiers.map((item) => (
            <button key={item} type="button" className="chip" data-on={fitTier === item} onClick={() => setFitTier((current) => current === item ? "" : item)}>{item}</button>
          ))}
          {["A", "B", "C-redesign", "C-disq"].map((item) => (
            <button key={item} type="button" className="chip" data-on={privacy === item} onClick={() => setPrivacy((current) => current === item ? "" : item)}>{privacyLabel(item)}</button>
          ))}
          {["one-time", "subscription", "both"].map((item) => (
            <button key={item} type="button" className="chip" data-on={model === item} onClick={() => setModel((current) => current === item ? "" : item)}>{monetisationLabel(item)}</button>
          ))}
        </div>
        <div className="filters">
          <select className="control" value={family} onChange={(event) => setFamily(event.target.value)} aria-label="Family">
            <option value="">All families</option>
            {families.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className="filters">
          <label className="small muted">Minimum total {minScore}
            <input type="range" min={0} max={100} value={minScore} onChange={(event) => setMinScore(Number(event.target.value))} />
          </label>
          <select className="control" value={criterion} onChange={(event) => setCriterion(event.target.value as CriterionKey | "")} aria-label="Criterion filter">
            <option value="">Any criterion</option>
            {criteria.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
          {criterion ? (
            <label className="small muted">At least {criterionMin}
              <input type="range" min={0} max={5} value={criterionMin} onChange={(event) => setCriterionMin(Number(event.target.value))} />
            </label>
          ) : null}
          <button className="btn btn-ghost" type="button" onClick={() => { setQuery(""); setStatuses([]); setCustomer(""); setLens(""); setCategory(""); setTier(""); setEvidenceOnly(false); setTheme(""); setRun(""); setMinScore(0); setCriterion(""); setSort("rank"); }}>Clear</button>
        </div>
      </div>

      {view === "cards" ? (
        <div className="cards">
          {filtered.map((idea) => (
            <article key={idea.id} className="idea-card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span className="score-figure" style={{ fontSize: 36 }}>{idea.total.toFixed(1)}</span>
                <label className="small faint"><input type="checkbox" checked={picked.includes(idea.id)} onChange={() => togglePick(idea.id)} /> Compare</label>
              </div>
              <Link href={`/ideas/${idea.id}`}><strong>{idea.title}</strong></Link>
              <p>{idea.problem}</p>
              <ScoreMeter scores={workingScores(idea)} criteria={criteria} />
              <div className="chips">
                <StatusBadge status={idea.status} />
                <CustomerBadge type={idea.customerType} />
                <span className="badge">AI {workingScores(idea).aibuild ?? "—"}/5</span>
                <span className="badge">{idea.category}</span>
                {idea.secondaryCategories.map((tag) => <span key={tag} className="badge badge-tag">{tag}</span>)}
                {idea.bundleFit ? <span className={`badge badge-${idea.bundleFit.tier}`}>{tierLabel(idea.bundleFit.tier)}</span> : null}
                {idea.tier ? <span className="badge">{idea.tier}</span> : null}
                {idea.family ? <span className="badge badge-tag">{idea.family}</span> : null}
                {idea.privacyClass ? <span className={privacyClassName(idea.privacyClass)}>{privacyLabel(idea.privacyClass)}</span> : null}
                {idea.portfolioMonetisation ? <span className="badge">{monetisationLabel(idea.portfolioMonetisation.model)}</span> : null}
                {idea.portfolioFit ? <span className="badge">Fit {idea.portfolioFit.score.toFixed(1)}</span> : null}
                {idea.complaintFrequency != null ? <span className="badge badge-evidence">CFS {idea.complaintFrequency.toFixed(2)} · evidence</span> : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Rank</th>
                <th>Idea</th>
                <th>Category</th>
                <th>Bundle</th>
                <th>Tier</th>
                <th>Privacy</th>
                <th>Fit</th>
                <th>CFS <span className="faint">evidence</span></th>
                <th>Status</th>
                <th>Customer</th>
                <th>AI</th>
                <th>Total</th>
                <th>Profile</th>
                <th>Legal</th>
                <th>Distro</th>
                <th>Build</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((idea) => {
                const scores = workingScores(idea);
                return (
                  <tr key={idea.id} className={cn("clickable", idea.status === "killed" && "faint")}>
                    <td><input type="checkbox" aria-label={`Compare ${idea.title}`} checked={picked.includes(idea.id)} onChange={() => togglePick(idea.id)} /></td>
                    <td className="num">{idea.rank ?? "—"}</td>
                    <td><Link href={`/ideas/${idea.id}`}><strong>{idea.title}</strong></Link><div className="small faint">{idea.platform}</div></td>
                    <td>{idea.category}{idea.secondaryCategories.length ? <div className="small faint">{idea.secondaryCategories.join(", ")}</div> : null}</td>
                    <td>{idea.bundleFit ? <span className={`badge badge-${idea.bundleFit.tier}`}>{tierLabel(idea.bundleFit.tier)}</span> : "—"}</td>
                    <td>{idea.tier || "—"}{idea.family ? <div className="small faint">{idea.family}</div> : null}</td>
                    <td>{idea.privacyClass ? <span className={privacyClassName(idea.privacyClass)}>{privacyLabel(idea.privacyClass)}</span> : "—"}</td>
                    <td className="num">{idea.portfolioFit ? idea.portfolioFit.score.toFixed(1) : "—"}</td>
                    <td className="num">{idea.complaintFrequency == null ? "—" : idea.complaintFrequency.toFixed(2)}</td>
                    <td><StatusBadge status={idea.status as Status} /></td>
                    <td><CustomerBadge type={idea.customerType} /></td>
                    <td className="num">{scores.aibuild ?? "—"}</td>
                    <td className="num">{idea.total.toFixed(1)}</td>
                    <td style={{ minWidth: 120 }}><ScoreMeter scores={scores} criteria={criteria} /></td>
                    <td className="num">{scores.legal}</td>
                    <td className="num">{scores.distro}</td>
                    <td className="num">{scores.build}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {!filtered.length ? <p className="muted">Nothing matches these filters.</p> : null}
      {picked.length ? (
        <div className="tray">
          <span>{picked.length} selected for comparison</span>
          <div className="chips">
            <button className="btn" type="button" onClick={() => { setPicked([]); localStorage.removeItem(COMPARE_KEY); }}>Clear</button>
            <Link className="btn btn-primary" href={`/compare?ids=${picked.join(",")}`}>Compare</Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
