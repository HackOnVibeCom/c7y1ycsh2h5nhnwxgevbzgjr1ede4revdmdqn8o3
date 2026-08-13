import { describe, expect, it } from "vitest";
import { parseStoreUrl } from "./index";

describe("parseStoreUrl", () => {
  it("parses Apple App Store URL", () => {
    expect(parseStoreUrl("https://apps.apple.com/app/habit-tracker/id123456789")).toEqual({
      platform: "apple",
      appId: "123456789",
    });
  });

  it("parses Apple URL without slug", () => {
    expect(parseStoreUrl("https://itunes.apple.com/us/app/id123456789")).toEqual({
      platform: "apple",
      appId: "123456789",
    });
  });

  it("parses Play Store URL with query id", () => {
    expect(parseStoreUrl("https://play.google.com/store/apps/details?id=com.acme.habit&hl=en")).toEqual({
      platform: "play",
      appId: "com.acme.habit",
      query: { hl: "en" },
    });
  });

  it("extracts hl and gl from Play Store URL", () => {
    expect(
      parseStoreUrl(
        "https://play.google.com/store/apps/details?id=com.mobile.legends&hl=id_ID&gl=LA",
      ),
    ).toEqual({
      platform: "play",
      appId: "com.mobile.legends",
      query: { hl: "id_ID", gl: "LA" },
    });
  });

  it("accepts a bare play package id", () => {
    expect(parseStoreUrl("com.acme.habit")).toEqual({ platform: "play", appId: "com.acme.habit" });
  });

  it("returns null for invalid input", () => {
    expect(parseStoreUrl("https://example.com")).toBeNull();
    expect(parseStoreUrl("")).toBeNull();
    expect(parseStoreUrl("not a url")).toBeNull();
  });
});