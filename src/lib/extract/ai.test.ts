import { afterEach, describe, expect, it, vi } from "vitest";
import { aiRefineListing } from "./ai";
import { fetchPlayListing } from "./play";

vi.mock("../llm/openrouter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../llm/openrouter")>();
  return { ...actual, callLLM: vi.fn() };
});

import { callLLM } from "../llm/openrouter";

const baseListing = () => ({
  platform: "play" as const,
  appId: "com.test.app",
  storeUrl: "https://play.google.com/store/apps/details?id=com.test.app",
  title: "Test App",
  shortDescription: "Short.",
  description: "Short description here.",
  category: "TOOLS",
  rating: 4.5,
  ratingCount: 1000,
  screenshots: ["https://play-lh.googleusercontent.com/real/1=w526-h296"],
  videoUrl: "https://www.youtube.com/embed/abc",
  developer: "Test Dev",
  price: "Free",
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("aiRefineListing", () => {
  it("merges AI text fields but keeps screenshots/video from base", async () => {
    vi.mocked(callLLM).mockResolvedValueOnce(
      JSON.stringify({
        title: "Test App",
        shortDescription: "A better subtitle with keyword",
        description: "Full AI description ".repeat(60).trim(),
        category: "Productivity",
        developer: "Test Dev Inc",
        price: "Free",
      }),
    );

    const out = await aiRefineListing(baseListing(), "<html>", {
      OPENROUTER_API_KEY: "key",
    });

    expect(out.description.length).toBeGreaterThan(500);
    expect(out.developer).toBe("Test Dev Inc");
    expect(out.screenshots).toEqual(baseListing().screenshots);
    expect(out.videoUrl).toBe(baseListing().videoUrl);
  });

  it("throws on invalid schema", async () => {
    vi.mocked(callLLM).mockResolvedValueOnce(JSON.stringify({ title: 42 }));
    await expect(
      aiRefineListing(baseListing(), "<html>", { OPENROUTER_API_KEY: "key" }),
    ).rejects.toThrow("failed schema validation");
  });
});

describe("fetchPlayListing AI-first", () => {
  const html =
    `<script type="application/ld+json">{"name":"YouTube","description":"Watch.","aggregateRating":{"ratingValue":"4.2","ratingCount":"15000000"},"author":{"name":"Google LLC"}}</script>` +
    `<div class="bARER" data-g-id="description" inert>${"Full description with &amp; entities. ".repeat(30)}</div>` +
    `<img src="https://play-lh.googleusercontent.com/a/aaa=w526-h296" data-screenshot-index="0">` +
    `<button data-trailer-url="https://www.youtube.com/embed/xyz">`;

  it("uses AI fields when key present and AI succeeds", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(html, { status: 200 })));
    vi.mocked(callLLM).mockResolvedValueOnce(
      JSON.stringify({
        title: "YouTube",
        shortDescription: "Watch.",
        description: "AI extracted full description with real bullets.\n\n• Feature one\n• Feature two",
        category: "VIDEO_PLAYERS",
        developer: "Google LLC",
        price: "Free",
      }),
    );

    const out = await fetchPlayListing("com.google.android.youtube", undefined, {
      OPENROUTER_API_KEY: "key",
    });

    expect(out.description).toContain("AI extracted");
    expect(out.developer).toBe("Google LLC");
    expect(out.screenshots).toHaveLength(1);
    expect(out.videoUrl).toBe("https://www.youtube.com/embed/xyz");
  });

  it("falls back to deterministic when AI fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(html, { status: 200 })));
    vi.mocked(callLLM).mockRejectedValue(new Error("no key"));

    const out = await fetchPlayListing("com.google.android.youtube", undefined, {
      OPENROUTER_API_KEY: "key",
    });

    expect(out.developer).toBe("Google LLC");
    expect(out.description).toContain("Full description with & entities");
    expect(out.screenshots).toHaveLength(1);
    expect(out.videoUrl).toBe("https://www.youtube.com/embed/xyz");
  });

  it("skips AI entirely when no key", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(html, { status: 200 })));

    const out = await fetchPlayListing("com.google.android.youtube");

    expect(callLLM).not.toHaveBeenCalled();
    expect(out.description).toContain("Full description with & entities");
    expect(out.developer).toBe("Google LLC");
  });
});
