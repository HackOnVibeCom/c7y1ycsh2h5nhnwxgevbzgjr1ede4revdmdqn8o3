import { afterEach, describe, expect, it, vi } from "vitest";
import { callLLM } from "./openrouter";

const env = { OPENROUTER_API_KEY: "sk-test" };

function completion(content: string): Response {
  return new Response(
    JSON.stringify({ choices: [{ message: { content } }] }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("callLLM retry", () => {
  it("succeeds on retry after a 429", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response("rate limited", { status: 429 }))
      .mockResolvedValueOnce(completion('{"ok":true}')));
    const mock = vi.mocked(fetch) as ReturnType<typeof vi.fn>;

    const out = await callLLM([], env);

    expect(out).toBe('{"ok":true}');
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it("succeeds after retrying a 500 then a success", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response("err", { status: 500 }))
      .mockResolvedValueOnce(completion('{"ok":true}')));
    const mock = vi.mocked(fetch) as ReturnType<typeof vi.fn>;

    const out = await callLLM([], env);

    expect(out).toBe('{"ok":true}');
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it("throws after repeated 500s", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValue(new Response("err", { status: 500 })));
    const mock = vi.mocked(fetch) as ReturnType<typeof vi.fn>;

    await expect(callLLM([], env)).rejects.toThrow("OpenRouter responded 500");
    expect(mock).toHaveBeenCalledTimes(3);
  });

  it("does not retry non-retryable 4xx", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValue(new Response("unauthorized", { status: 401 })));
    const mock = vi.mocked(fetch) as ReturnType<typeof vi.fn>;

    await expect(callLLM([], env)).rejects.toThrow("OpenRouter responded 401");
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it("retries a network error and succeeds", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(completion('{"ok":true}')));
    const mock = vi.mocked(fetch) as ReturnType<typeof vi.fn>;

    const out = await callLLM([], env);

    expect(out).toBe('{"ok":true}');
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it("throws without a key", async () => {
    await expect(callLLM([], {})).rejects.toThrow("OPENROUTER_API_KEY is not configured");
  });
});