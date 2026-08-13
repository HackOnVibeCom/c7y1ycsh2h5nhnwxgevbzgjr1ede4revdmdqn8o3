import { useAppStore } from "../store/appStore";
import { ScoreDial } from "./ScoreDial";

export function Result() {
  const { score, setStep } = useAppStore();
  if (!score) return null;

  const failed = score.results.filter((r) => r.status === "fail");
  const passed = score.results.filter((r) => r.status === "pass");

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">Step 2 · Results</p>
          <h2 className="mt-2 text-3xl font-extrabold">Your listing score</h2>
        </div>
        <ScoreDial score={score} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="mb-3 font-bold text-emerald-400">Passing ({passed.length})</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            {passed.map((r) => (
              <li key={r.id} className="flex justify-between gap-2">
                <span>{r.label}</span>
                <span className="text-emerald-400">{r.max}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-rose-900/60 bg-rose-950/30 p-5">
          <h3 className="mb-3 font-bold text-rose-400">Needs work ({failed.length})</h3>
          <ul className="space-y-3 text-sm">
            {failed.map((r) => (
              <li key={r.id}>
                <div className="flex justify-between gap-2 font-semibold text-slate-100">
                  <span>{r.label}</span>
                  <span className="text-rose-400">−{r.max}</span>
                </div>
                <p className="text-xs text-slate-400">{r.hint}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setStep("revise")}
        className="rounded-lg bg-cyan-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-cyan-400"
      >
        Let AI rewrite it →
      </button>
    </section>
  );
}