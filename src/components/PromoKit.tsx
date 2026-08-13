import { useEffect, useState } from "react";
import { useAppStore } from "../store/appStore";

interface KitResponse {
  deepLink: string;
  qrCodeUrl: string;
  smartBanner: string;
  publishPayload: {
    x: string;
    linkedin: string;
    reddit: string;
    telegram: string;
  };
}

type Tab = "deepLink" | "qr" | "smartBanner" | "publish";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "deepLink", label: "Deep link" },
  { id: "qr", label: "QR code" },
  { id: "smartBanner", label: "Smart banner" },
  { id: "publish", label: "Publish payload" },
];

export function PromoKit() {
  const { listing, setStep, setError } = useAppStore();
  const [kit, setKit] = useState<KitResponse | null>(null);
  const [tab, setTab] = useState<Tab>("deepLink");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!listing) return;
    fetch("/api/kit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing }),
    })
      .then((r) => r.json())
      .then((body) => {
        if ("deepLink" in body) setKit(body as KitResponse);
      })
      .catch(() => setError("Could not build promo kit"));
  }, [listing, setError]);

  if (!listing) return null;

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("Clipboard not available");
    }
  }

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">Step 4 · Launch</p>
        <h2 className="mt-2 text-3xl font-extrabold">Promo kit</h2>
        <p className="mt-2 text-slate-300">
          Practical code integrations to put in front of installs for <b>{kit?.deepLink ? listing.title : ""}</b>.
        </p>
      </div>

      {!kit && <p className="text-slate-400">Building your promo kit…</p>}

      {kit && (
        <>
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                  tab === t.id
                    ? "bg-cyan-500 text-slate-950"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            {tab === "deepLink" && <CodeBlock label={kit.deepLink} copy={() => copy(kit.deepLink, "deeplink")} copied={copied === "deeplink"} text={kit.deepLink} />}

            {tab === "qr" && (
              <div className="flex flex-col items-center gap-4">
                <img src={kit.qrCodeUrl} alt="App deep-link QR code" width="220" height="220" className="rounded-lg" />
                <p className="text-sm text-slate-400">Scan to open {listing.title} with the custom scheme.</p>
              </div>
            )}

            {tab === "smartBanner" && <CodeBlock label="Smart banner snippet" copy={() => copy(kit.smartBanner, "banner")} copied={copied === "banner"} text={kit.smartBanner} mono />}

            {tab === "publish" && (
              <div className="flex flex-col gap-4">
                <CodeBlock label="X (Twitter)" copy={() => copy(kit.publishPayload.x, "x")} copied={copied === "x"} text={kit.publishPayload.x} />
                <CodeBlock label="LinkedIn" copy={() => copy(kit.publishPayload.linkedin, "li")} copied={copied === "li"} text={kit.publishPayload.linkedin} />
                <CodeBlock label="Reddit" copy={() => copy(kit.publishPayload.reddit, "reddit")} copied={copied === "reddit"} text={kit.publishPayload.reddit} />
                <CodeBlock label="Telegram" copy={() => copy(kit.publishPayload.telegram, "tg")} copied={copied === "tg"} text={kit.publishPayload.telegram} />
                <button
                  type="button"
                  onClick={() => setStep("landing")}
                  className="mt-2 w-fit rounded-lg bg-slate-700 px-5 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-600"
                >
                  Analyze another app
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function CodeBlock({
  label,
  text,
  copy,
  copied,
  mono = false,
}: {
  label: string;
  text: string;
  copy: () => void;
  copied: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-200">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="rounded-md bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-100 hover:bg-slate-600"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className={`whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-sm text-slate-300 ${mono ? "" : ""}`}>
        {text}
      </pre>
    </div>
  );
}