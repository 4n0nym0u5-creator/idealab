"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Idea, PainCluster } from "@/lib/types";

const SORTS = ["cfs", "volume", "breadth", "recency", "engagement", "rank"] as const;
type SortKey = (typeof SORTS)[number];

export function PainBrowser({ clusters, ideas }: { clusters: PainCluster[]; ideas: Idea[] }) {
  const titles = useMemo(() => new Map(ideas.map((idea) => [idea.id, idea.title])), [ideas]);
  const [query, setQuery] = useState("");
  const [customer, setCustomer] = useState("");
  const [sort, setSort] = useState<SortKey>("cfs");
  const [minCfs, setMinCfs] = useState(0);
  const customers = [...new Set(clusters.map((cluster) => cluster.customerType).filter(Boolean))].sort();

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = clusters.filter((cluster) => {
      if (customer && cluster.customerType !== customer) return false;
      if (cluster.cfs < minCfs) return false;
      if (!needle) return true;
      const hay = [cluster.id, cluster.statement, cluster.whyPeopleStillComplain, ...cluster.communities.top.map((item) => item.name), ...cluster.linkedIdeaIds].join(" ").toLowerCase();
      return hay.includes(needle);
    });
    const value = (cluster: PainCluster) => {
      if (sort === "volume") return cluster.subscores.volume;
      if (sort === "breadth") return cluster.subscores.breadth;
      if (sort === "recency") return cluster.subscores.recency;
      if (sort === "engagement") return cluster.subscores.engagement;
      if (sort === "rank") return -cluster.rank;
      return cluster.cfs;
    };
    return [...list].sort((a, b) => value(b) - value(a) || a.rank - b.rank);
  }, [clusters, query, customer, sort, minCfs]);

  return (
    <div className="stack">
      <div className="panel stack">
        <div className="filters">
          <input className="control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search statement, community, idea" aria-label="Filter pain clusters" style={{ minWidth: 240, flex: 1 }} />
          <select className="control" value={sort} onChange={(event) => setSort(event.target.value as SortKey)} aria-label="Sort clusters">
            <option value="cfs">Sort by CFS</option>
            <option value="volume">Sort by volume</option>
            <option value="breadth">Sort by breadth</option>
            <option value="recency">Sort by recency</option>
            <option value="engagement">Sort by engagement</option>
            <option value="rank">Sort by rank</option>
          </select>
        </div>
        <div className="chips">
          {customers.map((type) => (
            <button key={type} type="button" className="chip" data-on={customer === type} onClick={() => setCustomer((current) => current === type ? "" : type)}>{type}</button>
          ))}
          <label className="small muted">Minimum CFS {minCfs.toFixed(1)}
            <input type="range" min={0} max={5} step={0.1} value={minCfs} onChange={(event) => setMinCfs(Number(event.target.value))} />
          </label>
        </div>
        <p className="small muted">{rows.length} of {clusters.length} clusters. CFS is evidence. It is not part of the rubric total.</p>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Cluster</th>
              <th>CFS</th>
              <th>Sub-scores</th>
              <th>Communities</th>
              <th>Recency</th>
              <th>Linked ideas</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((cluster) => (
              <tr key={cluster.id}>
                <td className="num">{cluster.rank}</td>
                <td>
                  <Link href={`/pain/${cluster.id}`}><strong>{cluster.statement}</strong></Link>
                  <div className="small faint">{cluster.id}</div>
                  {cluster.quotes[0] ? (
                    <p className="small">“{cluster.quotes[0].quote.slice(0, 180)}{cluster.quotes[0].quote.length > 180 ? "…" : ""}” <a href={cluster.quotes[0].url}>{cluster.quotes[0].community || "source"}</a></p>
                  ) : <p className="small faint">No verbatim quote stored.</p>}
                </td>
                <td className="num">{cluster.cfs.toFixed(2)}</td>
                <td><SubscoreBars cluster={cluster} /></td>
                <td className="small">{cluster.communities.count} communities · {cluster.communities.sourceTypes} sources<div className="faint">{cluster.communities.top.slice(0, 3).map((item) => item.name).join(", ")}</div></td>
                <td className="num">{Math.round(cluster.recency24mShare * 100)}%</td>
                <td className="small">{cluster.linkedIdeaIds.map((id) => <div key={id}><Link href={`/ideas/${id}`}>{titles.get(id) ?? id}</Link></div>)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SubscoreBars({ cluster }: { cluster: PainCluster }) {
  const bars = [
    ["Vol", cluster.subscores.volume],
    ["Breadth", cluster.subscores.breadth],
    ["Recency", cluster.subscores.recency],
    ["Engage", cluster.subscores.engagement],
  ] as const;
  return (
    <div className="stack" style={{ minWidth: 140 }}>
      {bars.map(([label, score]) => (
        <div key={label} className="small" style={{ display: "grid", gridTemplateColumns: "64px 1fr 16px", gap: 6, alignItems: "center" }}>
          <span className="faint">{label}</span>
          <span className="cfs-bar" aria-hidden><span style={{ width: `${(score / 5) * 100}%` }} /></span>
          <span className="num">{score}</span>
        </div>
      ))}
    </div>
  );
}
