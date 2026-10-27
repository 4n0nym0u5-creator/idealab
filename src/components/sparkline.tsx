export function Sparkline({ points, labels }: { points: number[]; labels: string[] }) {
  if (points.length < 2) return null;
  const min = Math.min(...points) - 1;
  const max = Math.max(...points) + 1;
  const width = 320;
  const height = 88;
  const coords = points.map((point, index) => {
    const x = 8 + (index / (points.length - 1)) * (width - 16);
    const y = height - 16 - ((point - min) / (max - min)) * (height - 28);
    return { x, y, point };
  });
  const d = coords.map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x},${coord.y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Score history" className="w-full">
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" />
      {coords.map((coord, index) => (
        <g key={labels[index]}>
          <circle cx={coord.x} cy={coord.y} r="3.5" fill="var(--accent)" />
          <text x={coord.x} y={height - 2} textAnchor="middle" fontSize="10" fill="var(--faint)">{labels[index]}</text>
          <text x={coord.x} y={coord.y - 8} textAnchor="middle" fontSize="11" fill="var(--ink)">{coord.point.toFixed(1)}</text>
        </g>
      ))}
    </svg>
  );
}
