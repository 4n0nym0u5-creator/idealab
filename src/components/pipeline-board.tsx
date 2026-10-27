"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setStatusAction } from "@/lib/actions";
import { STATUS_META, type Idea, type Status } from "@/lib/types";
import { StatusBadge } from "./ui";

const GROUPS: { title: string; hint: string; statuses: Status[] }[] = [
  { title: "Active", hint: "What you are actually doing", statuses: ["shortlist", "backlog", "researching", "building", "launched"] },
  { title: "Holding", hint: "Scored, not committed", statuses: ["candidate", "feeder", "parked", "rejected"] },
  { title: "Closed", hint: "Avoid is a choice. Killed is a hard rule.", statuses: ["avoid", "killed"] },
];

export function PipelineBoard({ ideas }: { ideas: Idea[] }) {
  const [rows, setRows] = useState(ideas);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  useEffect(() => setRows(ideas), [ideas]);

  function move(id: string, status: Status) {
    setError("");
    setRows((current) => current.map((idea) => idea.id === id ? { ...idea, status, statusLocked: true } : idea));
    startTransition(async () => {
      try {
        await setStatusAction(id, status, Date.now());
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not move that idea.");
      }
    });
  }

  return (
    <div className="page page-wide">
      <header className="stack">
        <p className="kicker">Pipeline</p>
        <h1>From shortlist to shipped.</h1>
        <p className="lede">Moving a card locks its status, so the next research import will not overwrite building, launched, backlog, researching, parked, rejected, or a manual avoid. Killed stays available as a hard stop.</p>
      </header>
      {error ? <p className="callout danger">{error}</p> : null}
      {GROUPS.map((group) => (
        <section key={group.title} className="stack">
          <div>
            <h2>{group.title}</h2>
            <p className="small faint">{group.hint}</p>
          </div>
          <div className="board">
            {group.statuses.map((status) => {
              const cards = rows.filter((idea) => idea.status === status).sort((a, b) => b.total - a.total);
              return (
                <div
                  key={status}
                  className="column"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const id = event.dataTransfer.getData("text/plain");
                    if (id) move(id, status);
                  }}
                >
                  <header>
                    <StatusBadge status={status} />
                    <span className="faint small">{cards.length}</span>
                  </header>
                  <p className="small faint" style={{ marginTop: 0 }}>{STATUS_META[status].hint}</p>
                  {cards.map((idea) => (
                    <article key={idea.id} className="ticket" draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", idea.id)}>
                      <Link href={`/ideas/${idea.id}`}><strong>{idea.title}</strong></Link>
                      <p>{idea.total.toFixed(1)} · {idea.category}</p>
                      {idea.killFlags.length ? <p>Kill: {idea.killFlags.join("; ")}</p> : null}
                      {idea.avoidFlags.length ? <p>Avoid: {idea.avoidFlags.join("; ")}</p> : null}
                      <label className="small faint">Move
                        <select className="control" value={status} disabled={pending} onChange={(event) => move(idea.id, event.target.value as Status)} aria-label={`Status for ${idea.title}`}>
                          {Object.entries(STATUS_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
                        </select>
                      </label>
                    </article>
                  ))}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
