import { useState } from "react";
import { useAppStore } from "../store/appStore";
import type { AsoScore, ListingData } from "../lib/aso-rules/types";

export function Analyze() {
  const { storeUrl, setStoreUrl, applyAnalysis, setLoading, setError, loading, error } =
    useAppStore();

  const [submitting, setSubmitting] = useState<boolean>(false);

  async function run() {
    const url = storeUrl.trim();
    if (!url) {
      setError("Enter a store link first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeUrl: url }),
      });
      const body = (await res.json()) as
        | { listing: ListingData; score: AsoScore }
        | { error: string };
      if (!res.ok || "error" in body) {
        throw new Error("error" in body ? body.error : "Analysis failed");
      }
      applyAnalysis(body.listing, body.score);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">Step 1 · Analyze</p>
        <h2 className="mt-2 text-3xl font-extrabold">Paste your store link</h2>
      </div>

      <label className="flex flex-col gap-2 text-sm text-slate-300">
        App Store or Play Store
        <input
          type="url"
          value={storeUrl}
          onChange={(e) => setStoreUrl(e.target.value)}
          placeholder="https://play.google.com/store/apps/details?id=…"
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-base text-slate-100 outline-none focus:border-cyan-400"
        />
      </label>

      <button
        type="button"
        onClick={run}
        disabled={submitting}
        className="rounded-lg bg-cyan-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
      >
        {submitting ? "Fetching listing…" : "Grade my listing"}
      </button>

      {error && <p className="rounded-lg bg-rose-950/60 px-4 py-3 text-sm text-rose-300">{error}</p>}
    </section>
  );
}