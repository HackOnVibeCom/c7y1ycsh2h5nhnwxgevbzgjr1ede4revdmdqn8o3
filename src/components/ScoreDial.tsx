import type { AsoScore } from "../lib/aso-rules/types";

const COLORS: Record<AsoScore["grade"], string> = {
  A: "#22c55e",
  B: "#84cc16",
  C: "#f59e0b",
  D: "#f97316",
  F: "#ef4444",
};

export function ScoreDial({ score }: { score: AsoScore }) {
  const color = COLORS[score.grade];
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (score.total / 100) * c;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 120 120" width="120" height="120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1e1b4b" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="text-left">
        <span className="text-5xl font-extrabold" style={{ color }}>
          {score.total}
        </span>
        <span className="text-2xl text-slate-400">/{score.grade}</span>
      </div>
    </div>
  );
}