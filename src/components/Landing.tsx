import { useAppStore } from "../store/appStore";

const EXAMPLES = [
  "https://play.google.com/store/apps/details?id=com.duolingo",
  "https://apps.apple.com/app/duolingo-language-lessons/id570060128",
];

export function Landing() {
  const setStep = useAppStore((s) => s.setStep);

  return (
    <div>
      <section className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-16 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">LaunchDesk</p>
        <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
          Your AI app-launch copilot
        </h1>
        <p className="max-w-lg text-lg text-slate-300">
          Paste your App Store or Play Store link. LaunchDesk grades your listing,
          rewrites it with our 28-rule quality gate, and generates a verified promo
          kit — deep links, QR codes and smart banners.
        </p>
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => setStep("analyze")}
            className="rounded-lg bg-cyan-500 px-7 py-3 text-lg font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Analyze my app →
          </button>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((u) => (
              <span key={u} className="rounded-full bg-slate-800 text-xs text-slate-300 px-3 py-1">
                {u}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}