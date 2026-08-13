import { useState } from "react";
import { useAppStore } from "../store/appStore";
import type { AsoScore, ListingData } from "../lib/aso-rules/types";
import { ScoreDial } from "./ScoreDial";

interface ReviseResponse {
  before: AsoScore;
  after: AsoScore;
  revised: ListingData;
  source: "ai" | "fallback";
  note: string;
}

export function Revise() {
  const {
    listing,
    score,
    addRevision,
    setStep,
    setLoading,
    setError,
    error,
  } = useAppStore();
  const [working, setWorking] = useState<boolean>(false);
  const [result, setResult] = useState<ReviseResponse | null>(null);

  if (!listing) return null;

  async function run() {
    setWorking(true);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetScore: 90, listing }),
      });
      const body = (await res.json()) as ReviseResponse | { error: string };
      if (!res.ok || "error" in body) {
        throw new Error("error" in body ? body.error : "Revision failed");
      }
      setResult(body);
      addRevision({
        id: Math.random().toString(36).slice(2),
        listing: body.revised,
        score: body.after,
        source: body.source,
        note: body.note,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revision failed");
    } finally {
      setWorking(false);
      setLoading(false);
    }
  }

  const sourceLabel =
    result?.source === "ai"
      ? "Real AI (OpenRouter)"
      : result?.source === "fallback"
        ? "Deterministic engine"
        : "";

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">Step 3 · Revise</p>
          <h2 className="mt-2 text-3xl font-extrabold">AI rewrite loop</h2>
        </div>
        <div className="flex items-center gap-2">
          {score && result ? (
            <>
              <span className="text-sm font-semibold text-slate-400">before {result.before.total}</span>
              <span className="text-slate-500">→</span>
            </>
          ) : null}
          {result ? <ScoreDial score={result.after} /> : score ? <ScoreDial score={score} /> : <span className="text-sm text-slate-500">no score yet</span>}
        </div>
      </div>

      {!result && (
        <p className="text-slate-300">
          We&apos;ll rewrite the listing so it clears our 28-rule quality gate. Uses OpenRouter when a key is
          available, otherwise the deterministic engine — so the demo never breaks.
        </p>
      )}

      <button
        type="button"
        onClick={run}
        disabled={working}
        className="rounded-lg bg-cyan-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
      >
        {working ? "Rewriting…" : "Generate optimized listing"}
      </button>

      {error && <p className="rounded-lg bg-rose-950/60 px-4 py-3 text-sm text-rose-300">{error}</p>}

      {result && score && (
        <div className="flex flex-col gap-4">
          <span className="w-fit rounded-full bg-cyan-900/50 px-3 py-1 text-xs font-bold text-cyan-300">
            {sourceLabel} · +{Math.max(0, result.after.total - result.before.total)} pts from {result.before.total}
          </span>
          <p className="text-sm text-slate-300">{result.note}</p>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="mb-2 font-bold text-cyan-400">Optimized title</h3>
            <p className="text-lg font-semibold text-slate-100">{result.revised.title}</p>
            {result.revised.subtitle && <p className="text-sm text-slate-400">{result.revised.subtitle}</p>}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="mb-2 font-bold text-cyan-400">Optimized description</h3>
            <pre className="whitespace-pre-wrap text-sm text-slate-300">{result.revised.description}</pre>
          </div>

          <button
            type="button"
            onClick={() => setStep("launch")}
            className="rounded-lg bg-emerald-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Generate promo kit →
          </button>
        </div>
      )}
    </section>
  );
}