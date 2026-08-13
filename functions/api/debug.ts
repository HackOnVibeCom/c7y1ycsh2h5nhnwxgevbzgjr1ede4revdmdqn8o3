import type { Env } from "../_lib/env";

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method !== "POST") {
    return Response.json({ error: "POST only" }, { status: 405 });
  }
  let body: { message?: string };
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const key = context.env.OPENROUTER_API_KEY;
  const model = context.env.OPENROUTER_MODEL ?? "openrouter/auto";
  const message = body.message ?? "say hello";

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "X-Title": "LaunchDesk-debug",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: message }],
        max_tokens: 50,
      }),
    });
    const text = await res.text();
    return Response.json({
      hasKey: Boolean(key),
      model,
      status: res.status,
      statusText: res.statusText,
      bodyPreview: text.slice(0, 600),
    });
  } catch (err) {
    return Response.json({
      hasKey: Boolean(key),
      model,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};