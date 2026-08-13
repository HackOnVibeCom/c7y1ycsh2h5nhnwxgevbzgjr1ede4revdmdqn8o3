import { useEffect } from "react";
import { Landing } from "./components/Landing";
import { Analyze } from "./components/Analyze";
import { Result } from "./components/Result";
import { Revise } from "./components/Revise";
import { PromoKit } from "./components/PromoKit";
import { useAppStore } from "./store/appStore";

export function App() {
  const step = useAppStore((s) => s.step);
  const setStep = useAppStore((s) => s.setStep);
  const reset = useAppStore((s) => s.reset);

  useEffect(() => {
    if (window.location.pathname === "/") {
      setStep("landing");
    }
  }, [setStep]);

  return (
    <div className="min-h-screen">
      <nav className="border-b border-slate-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={() => setStep("landing")}
            className="font-extrabold tracking-tight"
          >
            Launch<span className="text-cyan-400">Desk</span>
          </button>
          <div className="flex items-center gap-4">
            <Steps current={step} />
            {step !== "landing" && (
              <button
                type="button"
                onClick={() => reset()}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-300"
              >
                Start over
              </button>
            )}
          </div>
        </div>
      </nav>

      {step === "landing" && <Landing />}
      {step === "analyze" && <Analyze />}
      {step === "result" && <Result />}
      {step === "revise" && <Revise />}
      {step === "launch" && <PromoKit />}
    </div>
  );
}

const ORDER = ["landing", "analyze", "result", "revise", "launch"] as const;

function Steps({ current }: { current: string }) {
  return (
    <ol className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
      {ORDER.map((s) => {
        const idx = ORDER.indexOf(s as (typeof ORDER)[number]);
        const cur = ORDER.indexOf(current as (typeof ORDER)[number]);
        const active = cur >= idx;
        return (
          <li key={s} className="flex items-center gap-2">
            {idx !== 0 && <span className="text-slate-700">/</span>}
            <span className={active ? "font-semibold text-cyan-400" : ""}>
              {idx + 1}.{capitalize(s)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}