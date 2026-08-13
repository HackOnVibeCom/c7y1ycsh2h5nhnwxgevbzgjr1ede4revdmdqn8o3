import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "./appStore";
import type { AsoScore, ListingData } from "../lib/aso-rules/types";

const LISTING: ListingData = {
  platform: "play",
  appId: "com.duolingo",
  storeUrl: "https://play.google.com/store/apps/details?id=com.duolingo",
  title: "Duolingo: Language Lessons",
  description: "Learn languages with bite-sized lessons.",
  screenshots: [],
};

const SCORE: AsoScore = {
  total: 84,
  grade: "B",
  results: [],
  byCategory: {},
};

describe("appStore state persistence", () => {
  beforeEach(() => {
    useAppStore.setState({
      step: "landing",
      storeUrl: "",
      listing: null,
      score: null,
      revisions: [],
      selectedRevisionId: null,
      loading: false,
      error: null,
    });
  });

  it("updateListing keeps revisions and score (edit does not reset state)", () => {
    useAppStore.getState().applyAnalysis(LISTING, SCORE);
    useAppStore
      .getState()
      .addRevision({
        id: "r1",
        listing: LISTING,
        score: SCORE,
        source: "fallback",
        note: "revision",
        createdAt: "2026-08-13T00:00:00Z",
      });

    useAppStore.getState().updateListing({ title: "Duolingo: Learn Languages" });

    const s = useAppStore.getState();
    expect(s.listing?.title).toBe("Duolingo: Learn Languages");
    expect(s.revisions).toHaveLength(1);
    expect(s.revisions[0]?.id).toBe("r1");
    expect(s.score).toEqual(SCORE);
    expect(s.step).toBe("result");
  });
});
