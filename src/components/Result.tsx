import { useAppStore } from "../store/appStore";
import { ScoreDial } from "./ScoreDial";

interface RoadmapItem {
  label: string;
  title: string;
  detail: string;
}

const ROADMAP = new Map<"apple" | "play", RoadmapItem[]>([
  [
    "play",
    [
      {
        label: "30-day sprint",
        title: "Lift the description",
        detail: "Plug the rewritten bullets + CTA from Step 3 into Play Console, resubmit, and monitor your quality-gate score crossing into A.",
      },
      {
        label: "60-day sprint",
        title: "Title & keyword experiments",
        detail: "Run an A/B test of the recomputed title keywords with Store Listing Experiments to raise your category ranking.",
      },
      {
        label: "90-day sprint",
        title: "Scale every release",
        detail: "Re-run LaunchDesk on each new build so release notes and screenshots stay on-gate before you press publish.",
      },
    ],
  ],
  [
    "apple",
    [
      {
        label: "30-day sprint",
        title: "Lift the description",
        detail: "Plug the rewritten promo text + CTA from Step 3 into App Store Connect, submit for review, and watch the gate climb to A.",
      },
      {
        label: "60-day sprint",
        title: "Keywords field optimizations",
        detail: "Refresh App Store Connect Keywords with the recomputed terms to improve search result coverage.",
      },
      {
        label: "90-day sprint",
        title: "Scale every release",
        detail: "Add screenshots + a demo video, then keep re-running LaunchDesk on each build so the listing never regresses.",
      },
    ],
  ],
]);

export function Result() {
  const { score, listing, setStep } = useAppStore();
  if (!score || !listing) return null;

  const failed = score.results.filter((r) => r.status === "fail");
  const passed = score.results.filter((r) => r.status === "pass");

  const failedRanked = [...failed].sort((a, b) => b.max - a.max).slice(0, 5);
  const roadmap = ROADMAP.get(listing.platform) ?? [];

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

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="mb-3 font-bold text-cyan-400">Top 5 fixes to prioritize</h3>
        <ol className="space-y-2">
          {failedRanked.length === 0 ? (
            <li className="text-sm text-emerald-400">Nothing failing — you are ready to ship.</li>
          ) : (
            failedRanked.map((r, i) => (
              <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-300">
                    {i + 1}
                  </span>
                  <span className="text-slate-200">{r.label}</span>
                </span>
                <span className="shrink-0 text-xs text-rose-400">+{r.max} pts</span>
              </li>
            ))
          )}
        </ol>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-4 flex items-baseline justify-between gap-2">
          <h3 className="font-bold text-cyan-400">Launch roadmap</h3>
          <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Simulasi
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {roadmap.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-slate-800 bg-slate-950/60 p-4"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-500">
                {item.label}
              </p>
              <h4 className="mt-2 text-sm font-bold text-slate-100">{item.title}</h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.detail}</p>
            </div>
          ))}
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