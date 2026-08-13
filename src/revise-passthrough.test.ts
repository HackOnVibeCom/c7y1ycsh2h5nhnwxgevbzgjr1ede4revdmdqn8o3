import { describe, expect, it } from "vitest";
import { ListingPatch, toListingData } from "../functions/api/revise";
import { score } from "./lib/aso-rules/scorer";
import type { ListingData } from "./lib/aso-rules/types";

const FULL: ListingData = {
  platform: "play",
  appId: "com.riotgames.league.teamfighttactics",
  storeUrl: "https://play.google.com/store/apps/details?id=com.riotgames.league.teamfighttactics",
  title: "TFT: Teamfight Tactics",
  description:
    "TFT is a strategy auto battler. Compete in 8-player battles. Collect champions, draft items, and be the last one standing. Set 12 is out now with new traits and augments.",
  keywords: "auto battler strategy",
  category: "Game",
  genres: ["Strategy"],
  developer: "Riot Games, Inc",
  price: "Free",
  screenshots: ["a.png", "b.png", "c.png", "d.png", "e.png"],
  iconUrl: "https://example.com/icon.png",
  videoUrl: "https://example.com/preview.mp4",
  rating: 4.5,
  ratingCount: 759659,
};

describe("revise passthrough keeps scoring data", () => {
  it("before score equals original analyze score (no field stripping)", () => {
    const parsed = ListingPatch.parse(FULL);
    const rebuilt = toListingData(parsed);
    expect(score(rebuilt).total).toBe(score(FULL).total);
    expect(score(rebuilt).grade).toBe(score(FULL).grade);
  });

  it("keeps visual/social fields on passthrough", () => {
    const parsed = ListingPatch.parse(FULL);
    const rebuilt = toListingData(parsed);
    expect(rebuilt.screenshots).toEqual(FULL.screenshots);
    expect(rebuilt.iconUrl).toBe(FULL.iconUrl);
    expect(rebuilt.videoUrl).toBe(FULL.videoUrl);
    expect(rebuilt.rating).toBe(FULL.rating);
    expect(rebuilt.ratingCount).toBe(FULL.ratingCount);
  });

  it("does not coerce missing subtitle/shortDescription to empty string", () => {
    const playLike = { ...FULL, subtitle: undefined, shortDescription: "Short blurb", genres: undefined };
    const parsed = ListingPatch.parse(playLike);
    const rebuilt = toListingData(parsed);
    expect(rebuilt.subtitle).toBeUndefined();
    expect(rebuilt.shortDescription).toBe("Short blurb");
    expect(score(rebuilt).total).toBe(score(playLike).total);
  });

  it("accepts null values from JSON round-trip", () => {
    const nullish = { ...FULL, subtitle: null, genres: null };
    const baseline = { ...FULL, subtitle: undefined, genres: undefined };
    const parsed = ListingPatch.parse(nullish);
    const rebuilt = toListingData(parsed);
    expect(rebuilt.subtitle).toBeUndefined();
    expect(score(rebuilt).total).toBe(score(baseline).total);
  });
});
