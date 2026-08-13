import { beforeEach, describe, expect, it, vi } from "vitest";
import { deterministicRevise } from "./fallback";
import { reviseListing } from "./index";
import { callLLM } from "./openrouter";
import { score } from "../aso-rules/scorer";
import type { ListingData } from "../aso-rules/types";

vi.mock("./openrouter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./openrouter")>();
  return {
    ...actual,
    callLLM: vi.fn().mockRejectedValue(new Error("no key")),
  };
});

function listing(overrides: Partial<ListingData> = {}): ListingData {
  return {
    platform: "apple",
    appId: "123",
    storeUrl: "https://apps.apple.com/app/id123",
    title: "BEST FREE HABIT TRACKER 2026",
    subtitle: "",
    description: "Habit tracker for building routines.",
    keywords: "",
    category: "Health & Fitness",
    screenshots: [],
    developer: "Acme",
    ...overrides,
  };
}

function mergeFields(before: ListingData, revised: {
  title: string;
  subtitle: string;
  shortDescription: string;
  description: string;
  keywords: string;
  category: string;
  developer: string;
  price: string;
}): ListingData {
  return {
    ...before,
    title: revised.title,
    subtitle: revised.subtitle,
    shortDescription: revised.shortDescription,
    description: revised.description,
    keywords: revised.keywords,
    category: revised.category,
    developer: revised.developer,
    price: revised.price,
  };
}

function aiJson(patch: Partial<{
  title: string;
  subtitle: string;
  shortDescription: string;
  description: string;
  keywords: string;
  category: string;
  developer: string;
  price: string;
  note: string;
}>): string {
  return JSON.stringify({
    title: "Habit Tracker",
    subtitle: "Daily routines",
    shortDescription: "Build habits daily",
    description:
      "Habit tracker helps you build routines with streaks and reminders. Download now and start your first habit today.",
    keywords: "habit tracker routines",
    category: "Health & Fitness",
    developer: "Acme",
    price: "Free",
    note: "rewritten",
    ...patch,
  });
}

describe("deterministicRevise", () => {
  it("cleans filler words from title", () => {
    const out = deterministicRevise(listing());
    expect(out.title).toBe("HABIT TRACKER");
    expect(out.title.length).toBeLessThanOrEqual(30);
  });

  it("appends a CTA to a description without one", () => {
    const out = deterministicRevise(listing());
    expect(out.description).toMatch(/download/i);
  });

  it("builds keywords from title when empty", () => {
    const out = deterministicRevise(listing());
    expect(out.keywords.length).toBeGreaterThan(0);
  });

  it("never throws and returns a note", () => {
    const out = deterministicRevise(listing({ description: "" }));
    expect(out.note.length).toBeGreaterThan(0);
  });
});

describe("reviseListing", () => {
  beforeEach(() => {
    vi.mocked(callLLM).mockReset();
    vi.mocked(callLLM).mockRejectedValue(new Error("no key"));
  });

  it("falls back to deterministic when no API key", async () => {
    const env = { OPENROUTER_API_KEY: "" };
    const result = await reviseListing(
      { listing: listing(), targetScore: 90 },
      env,
    );
    expect(result.source).toBe("fallback");
    expect(result.listing.title.length).toBeLessThanOrEqual(30);
  });

  it("returns a valid score object", async () => {
    const env = { OPENROUTER_API_KEY: "" };
    const result = await reviseListing(
      { listing: listing(), targetScore: 90 },
      env,
    );
    expect(result.score.total).toBeGreaterThanOrEqual(0);
    expect(result.score.total).toBeLessThanOrEqual(100);
    expect(["A", "B", "C", "D", "F"]).toContain(result.score.grade);
  });

  it("uses AI result whenever the LLM succeeds (strict AI)", async () => {
    const env = { OPENROUTER_API_KEY: "key" };
    const base = listing();
    const good = JSON.parse(aiJson({
      description:
        "Habit tracker helps you build daily routines with streaks and reminders. Track water, workouts and sleep. Download now and start your first habit today. Join thousands of users improving one habit at a time with friendly reminders and weekly reports.",
    }));
    vi.mocked(callLLM).mockResolvedValueOnce(JSON.stringify(good));

    const result = await reviseListing({ listing: base, targetScore: 90 }, env);

    const aiListing = mergeFields(base, good);
    const aiScore = score(aiListing);

    expect(result.source).toBe("ai");
    expect(result.score.total).toBe(aiScore.total);
  });

  it("still uses the AI result even when it loses to fallback (strict AI)", async () => {
    const env = { OPENROUTER_API_KEY: "key" };
    const strong = listing({
      title: "Habit Tracker",
      subtitle: "Daily routines",
      description:
        "Habit tracker helps you build daily routines with streaks and reminders. Track water, workouts and sleep. Download now and start your first habit today. Join thousands of users improving one habit at a time with friendly reminders and weekly reports.",
      keywords: "habit tracker routines",
    });
    const weakAi = JSON.parse(aiJson({
      title: "HT",
      description: "short",
      keywords: "",
      subtitle: "",
    }));

    vi.mocked(callLLM).mockResolvedValueOnce(JSON.stringify(weakAi));

    const result = await reviseListing({ listing: strong, targetScore: 90 }, env);

    expect(result.source).toBe("ai");
  });

  it("still uses the AI result even when it loses to before (strict AI)", async () => {
    const env = { OPENROUTER_API_KEY: "key" };
    const base = listing();
    const weakAi = JSON.parse(aiJson({
      title: "HT",
      description: "short",
      keywords: "",
    }));

    vi.mocked(callLLM).mockResolvedValueOnce(JSON.stringify(weakAi));

    const result = await reviseListing({ listing: base, targetScore: 90 }, env);

    expect(result.source).toBe("ai");
  });
});
