import { describe, expect, it } from "vitest";
import { score, gradeFromScore } from "./scorer";
import { RULES, rulesCount } from "./rules";
import type { ListingData } from "./types";

function listing(overrides: Partial<ListingData> = {}): ListingData {
  return {
    platform: "apple",
    appId: "12345",
    storeUrl: "https://apps.apple.com/app/id12345",
    title: "Habit Tracker",
    subtitle: "Build better habits daily",
    description:
      "Habit Tracker helps you build better habits with streaks and reminders. \n\n• Daily streaks\n• Smart reminders\n• Progress charts\n\nDownload now and build a better routine today.",
    keywords: "habits streak reminder daily tracker",
    category: "Health & Fitness",
    genres: ["Health & Fitness", "Lifestyle"],
    rating: 4.6,
    ratingCount: 500,
    screenshots: ["a.png", "b.png", "c.png", "d.png", "e.png"],
    iconUrl: "icon.png",
    videoUrl: "https://example.com/preview.mp4",
    developer: "Acme Inc",
    price: "Free",
    version: "1.0.0",
    ...overrides,
  };
}

describe("rules engine", () => {
  it("has exactly 28 rules", () => {
    expect(rulesCount()).toBe(28);
    expect(RULES).toHaveLength(28);
  });

  it("all rules have unique ids", () => {
    const ids = RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("good listing scores high (A)", () => {
    const s = score(listing());
    expect(s.total).toBeGreaterThanOrEqual(90);
    expect(s.grade).toBe("A");
  });

  it("empty listing scores low", () => {
    const s = score(
      listing({
        title: "",
        subtitle: "",
        description: "",
        keywords: undefined,
        screenshots: [],
        iconUrl: undefined,
        videoUrl: undefined,
        rating: 0,
        ratingCount: 0,
        developer: "",
        category: "",
        genres: [],
        shortDescription: "",
      }),
    );
    expect(s.total).toBeLessThanOrEqual(20);
  });

  it("failing rules carry hints", () => {
    const bad = listing({ screenshots: [], videoUrl: undefined, keywords: undefined, rating: 2, ratingCount: 5 });
    const s = score(bad);
    const fails = s.results.filter((r) => r.status === "fail");
    expect(fails.length).toBeGreaterThan(0);
    for (const f of fails) {
      expect(f.hint.length).toBeGreaterThan(10);
    }
  });

  it("skip rules are excluded from denominator", () => {
    const s = score(listing({ platform: "play" }));
    const skips = s.results.filter((r) => r.status === "skip");
    expect(skips.length).toBeGreaterThan(0);
    const applicable = s.results.filter((r) => r.status !== "skip");
    const max = applicable.reduce((sum, r) => sum + r.max, 0);
    expect(max).toBeGreaterThan(0);
  });
});

describe("gradeFromScore", () => {
  it("maps bands correctly", () => {
    expect(gradeFromScore(95)).toBe("A");
    expect(gradeFromScore(80)).toBe("B");
    expect(gradeFromScore(70)).toBe("C");
    expect(gradeFromScore(50)).toBe("D");
    expect(gradeFromScore(10)).toBe("F");
  });
});