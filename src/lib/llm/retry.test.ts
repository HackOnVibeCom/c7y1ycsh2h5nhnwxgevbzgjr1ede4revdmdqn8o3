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

  it("throws after repeated 500s across all models", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValue(new Response("err", { status: 500 })));
    const mock = vi.mocked(fetch) as ReturnType<typeof vi.fn>;

    await expect(callLLM([], env)).rejects.toThrow("OpenRouter responded 500");
    expect(mock).toHaveBeenCalledTimes(6);
  });

  it("does not retry non-retryable 4xx (but still tries fallback model)", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValue(new Response("unauthorized", { status: 401 })));
    const mock = vi.mocked(fetch) as ReturnType<typeof vi.fn>;

    await expect(callLLM([], env)).rejects.toThrow("OpenRouter responded 401");
    expect(mock).toHaveBeenCalledTimes(2);
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

  it("falls back to the next model after a 402", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response("payment required", { status: 402 }))
      .mockResolvedValueOnce(completion('{"ok":true}')));
    const mock = vi.mocked(fetch) as ReturnType<typeof vi.fn>;

    const out = await callLLM([], env);

    expect(out).toBe('{"ok":true}');
    expect(mock).toHaveBeenCalledTimes(2);
    const bodies = mock.mock.calls.map((c) => JSON.parse(String(c[1]?.body)));
    expect(bodies[0].model).toBe("openrouter/auto");
    expect(bodies[1].model).toBe("poolside/laguna-s-2.1:free");
  });

  it("throws after all models fail with 402", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValue(new Response("payment required", { status: 402 })));
    const mock = vi.mocked(fetch) as ReturnType<typeof vi.fn>;

    await expect(callLLM([], env)).rejects.toThrow("OpenRouter responded 402");
    expect(mock).toHaveBeenCalledTimes(2);
  });
});