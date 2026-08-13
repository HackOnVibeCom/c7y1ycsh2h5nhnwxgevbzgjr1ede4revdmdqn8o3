import { useState } from "react";

type ApiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

export function App() {
  const [api, setApi] = useState<ApiState>({ status: "idle" });

  async function checkHealth() {
    setApi({ status: "loading" });
    try {
      const res = await fetch("/api/health");
      const body = (await res.json()) as { ok: boolean };
      setApi({
        status: "ok",
        message: body.ok ? "Backend functions live ✅" : "Unexpected response",
      });
    } catch (err) {
      setApi({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">
        LaunchDesk
      </p>
      <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
        AI App Launch Copilot
      </h1>
      <p className="max-w-lg text-lg text-slate-300">
        Paste your App Store or Play Store link and get a graded ASO report plus
        a validated AI launch kit. Scaffold phase.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={checkHealth}
          className="rounded-lg bg-cyan-500 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          Test backend
        </button>
        <span className="text-sm text-slate-400">
          {api.status === "idle" && "ready"}
          {api.status === "loading" && "checking…"}
          {api.status === "ok" && api.message}
          {api.status === "error" && api.message}
        </span>
      </div>
    </main>
  );
}