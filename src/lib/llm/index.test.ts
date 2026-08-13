import { describe, expect, it } from "vitest";
import { deterministicRevise } from "./fallback";
import { reviseListing } from "./index";
import type { ListingData } from "../aso-rules/types";

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
});