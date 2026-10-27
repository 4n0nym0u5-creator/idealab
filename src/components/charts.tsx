"use client";

import { useEffect, useState } from "react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { DEFAULT_ORDER, criteriaInOrder, type Criterion, type Scores } from "@/lib/criteria";

export function useDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const update = () => setDark(root.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

export function ClientOnly({ children, height = 280 }: { children: React.ReactNode; height?: number }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <div style={{ height }} className="panel" />;
  return <>{children}</>;
}

export function ScoreRadar({ series, criteria }: { series: { name: string; scores: Scores; color: string }[]; criteria?: Criterion[] }) {
  const dark = useDark();
  const items = criteria ?? criteriaInOrder(DEFAULT_ORDER);
  const data = items.map((criterion) => {
    const row: Record<string, string | number> = { label: criterion.short };
    for (const entry of series) row[entry.name] = entry.scores[criterion.key] ?? 0;
    return row;
  });
  return (
    <ClientOnly height={320}>
      <div style={{ width: "100%", height: 320 }} aria-label="Criterion radar">
        <ResponsiveContainer>
          <RadarChart data={data} outerRadius="68%">
            <PolarGrid stroke={dark ? "#322f29" : "#ddd4c6"} />
            <PolarAngleAxis dataKey="label" tick={{ fill: dark ? "#c3baad" : "#5e574e", fontSize: 11 }} />
            <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
            {series.map((entry) => (
              <Radar key={entry.name} name={entry.name} dataKey={entry.name} stroke={entry.color} fill={entry.color} fillOpacity={0.18} />
            ))}
            <Tooltip contentStyle={{ background: "var(--elev)", border: "1px solid var(--line)", borderRadius: 12 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </ClientOnly>
  );
}

export function DistributionChart({ bins }: { bins: { label: string; count: number }[] }) {
  const dark = useDark();
  return (
    <ClientOnly height={220}>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={bins}>
            <CartesianGrid vertical={false} stroke={dark ? "#322f29" : "#ddd4c6"} />
            <XAxis dataKey="label" tick={{ fill: dark ? "#8d867b" : "#8a8175", fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fill: dark ? "#8d867b" : "#8a8175", fontSize: 11 }} width={28} />
            <Tooltip contentStyle={{ background: "var(--elev)", border: "1px solid var(--line)", borderRadius: 12 }} />
            <Bar dataKey="count" fill={dark ? "#8fd4b0" : "#1e6b4a"} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ClientOnly>
  );
}

export function RevenueChart({ points }: { points: { month: number; revenue: number; paid: number }[] }) {
  const dark = useDark();
  return (
    <ClientOnly height={280}>
      <div style={{ width: "100%", height: 280 }} aria-label="Revenue scenario">
        <ResponsiveContainer>
          <LineChart data={points}>
            <CartesianGrid stroke={dark ? "#322f29" : "#ddd4c6"} />
            <XAxis dataKey="month" tick={{ fill: dark ? "#8d867b" : "#8a8175", fontSize: 11 }} />
            <YAxis tick={{ fill: dark ? "#8d867b" : "#8a8175", fontSize: 11 }} width={48} />
            <Tooltip contentStyle={{ background: "var(--elev)", border: "1px solid var(--line)", borderRadius: 12 }} />
            <Line type="monotone" dataKey="revenue" name="Net revenue so far (A$)" stroke={dark ? "#8fd4b0" : "#1e6b4a"} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ClientOnly>
  );
}

export const SERIES_COLORS = ["#1e6b4a", "#a15a32", "#315f8a", "#9a7420"];

export function ScenarioChart({ points }: { points: { month: string; net: number; cumulative: number; mark?: string }[] }) {
  const dark = useDark();
  const ink = dark ? "#8fd4b0" : "#1e6b4a";
  const clay = dark ? "#e0b089" : "#a15a32";
  return (
    <ClientOnly height={300}>
      <div style={{ width: "100%", height: 300 }} aria-label="Portfolio revenue scenario">
        <ResponsiveContainer>
          <LineChart data={points}>
            <CartesianGrid stroke={dark ? "#322f29" : "#ddd4c6"} />
            <XAxis dataKey="month" tick={{ fill: dark ? "#8d867b" : "#8a8175", fontSize: 11 }} />
            <YAxis yAxisId="net" tick={{ fill: dark ? "#8d867b" : "#8a8175", fontSize: 11 }} width={52} />
            <YAxis yAxisId="cumulative" orientation="right" tick={{ fill: dark ? "#8d867b" : "#8a8175", fontSize: 11 }} width={56} />
            <Tooltip contentStyle={{ background: "var(--elev)", border: "1px solid var(--line)", borderRadius: 12 }} />
            {points.filter((point) => point.mark).map((point) => (
              <ReferenceLine key={point.month} x={point.month} stroke={dark ? "#5c564c" : "#c9bfb0"} label={{ value: point.mark, fill: dark ? "#c9bfb0" : "#5c564c", fontSize: 11 }} />
            ))}
            <Line yAxisId="net" type="monotone" dataKey="net" name="Net revenue per month (A$)" stroke={ink} strokeWidth={2} dot={false} />
            <Line yAxisId="cumulative" type="monotone" dataKey="cumulative" name="Cumulative net (A$)" stroke={clay} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ClientOnly>
  );
}
