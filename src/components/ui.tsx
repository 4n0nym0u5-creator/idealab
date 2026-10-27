import Link from "next/link";
import { CRITERIA_BY_KEY, DEFAULT_ORDER, criteriaInOrder, type Criterion, type CriterionKey, type Scores } from "@/lib/criteria";
import { cn } from "@/lib/format";
import { STATUS_META, type Status } from "@/lib/types";

export function StatusBadge({ status }: { status: Status | string }) {
  const meta = STATUS_META[status as Status];
  return <span className={cn("badge", `badge-${status}`)}>{meta?.label ?? status}</span>;
}

export function CustomerBadge({ type }: { type: string }) {
  if (type !== "consumer" && type !== "business" && type !== "both") return null;
  const label = type === "both" ? "Consumer and business" : type === "business" ? "Business" : "Consumer";
  return <span className={cn("badge", `badge-${type}`)}>{label}</span>;
}

export function ScoreMeter({ scores, criteria, title }: { scores: Scores; criteria?: Criterion[]; title?: string }) {
  const items = criteria ?? criteriaInOrder(DEFAULT_ORDER);
  return (
    <div className="meter" title={title ?? `${items.length} criteria`} aria-hidden>
      {items.map((criterion) => {
        const score = scores[criterion.key] ?? 0;
        return <i key={criterion.key} style={{ background: meterColor(score), opacity: 0.35 + (score / 5) * 0.65 }} />;
      })}
    </div>
  );
}

export function meterColor(score: number): string {
  if (score <= 1) return "var(--bad)";
  if (score === 2) return "var(--clay)";
  if (score === 3) return "var(--mid)";
  return "var(--good)";
}

export function ScoreReadout({ value, label }: { value: number; label?: string }) {
  return (
    <div>
      {label ? <p className="kicker">{label}</p> : null}
      <div className="score-figure" style={{ fontSize: 42 }}>{value.toFixed(1)}</div>
    </div>
  );
}

export function FlagList({ flags, tone }: { flags: string[]; tone: "killed" | "avoid" }) {
  if (!flags.length) return null;
  return (
    <div className="chips" aria-label={tone === "killed" ? "Kill flags" : "Avoid flags"}>
      {flags.map((flag) => (
        <span key={flag} className={cn("badge", tone === "killed" ? "badge-killed" : "badge-avoid")}>
          {tone === "killed" ? "Kill" : "Avoid"} · {flag}
        </span>
      ))}
    </div>
  );
}

export function CriterionLabel({ criterion }: { criterion: CriterionKey }) {
  return CRITERIA_BY_KEY[criterion]?.short ?? criterion;
}

export function EmptyState({ title, body, href, action }: { title: string; body: string; href?: string; action?: string }) {
  return (
    <div className="panel stack">
      <h2>{title}</h2>
      <p className="muted">{body}</p>
      {href && action ? <Link className="btn btn-primary" href={href}>{action}</Link> : null}
    </div>
  );
}
