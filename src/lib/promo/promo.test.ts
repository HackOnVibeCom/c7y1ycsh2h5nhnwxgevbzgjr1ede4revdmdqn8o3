import { describe, expect, it } from "vitest";
import {
  buildPublishPayload,
  customDeepLink,
  qrCodeUrl,
  qrCodeUrlFallback,
  slugify,
  smartBannerSnippet,
  utfBtoa,
} from "./index";
import type { ListingData } from "../aso-rules/types";

function listing(overrides: Partial<ListingData> = {}): ListingData {
  return {
    platform: "apple",
    appId: "123",
    storeUrl: "https://apps.apple.com/app/id123",
    title: "Habit Tracker",
    shortDescription: "Build daily routines.",
    description: "A habit tracker that helps you build routines.",
    category: "Health & Fitness",
    screenshots: [],
    developer: "Acme",
    price: "Free",
    ...overrides,
  };
}

describe("customDeepLink", () => {
  it("slugifies the title into a scheme", () => {
    const link = customDeepLink(listing({ title: "My Cool App!" }));
    expect(link).toBe("my-cool-app://open?source=launchdesk&id=id123");
  });

  it("uses raw appId for Play listings", () => {
    const link = customDeepLink(listing({ platform: "play", appId: "com.acme.app" }));
    expect(link).toBe("habit-tracker://open?source=launchdesk&id=com.acme.app");
  });

  it("falls back to myapp when title slugifies to empty", () => {
    const link = customDeepLink(listing({ title: "!!!" }));
    expect(link).toContain("myapp://open");
  });
});

describe("slugify", () => {
  it("lowercases, strips symbols, collapses dashes", () => {
    expect(slugify("Duolingo - Bahasa & Catur")).toBe("duolingo-bahasa-catur");
  });
});

describe("qrCodeUrl", () => {
  it("encodes the deep link", () => {
    const url = qrCodeUrl("my-app://open?source=launchdesk&id=id123");
    expect(url).toContain("data=my-app%3A%2F%2Fopen%3Fsource%3Dlaunchdesk%26id%3Did123");
  });

  it("fallback QR encodes the same deep link", () => {
    const url = qrCodeUrlFallback("my-app://open?source=launchdesk&id=id123");
    expect(url).toContain("chl=my-app%3A%2F%2Fopen%3Fsource%3Dlaunchdesk%26id%3Did123");
  });
});

describe("smartBannerSnippet", () => {
  it("includes app-argument for Apple listings", () => {
    const snippet = smartBannerSnippet(listing(), "my-app://open");
    expect(snippet).toContain('<meta name="apple-itunes-app"');
    expect(snippet).toContain("app-id=123, app-argument=my-app://open");
  });

  it("omits app-argument for Play listings", () => {
    const snippet = smartBannerSnippet(
      listing({ platform: "play", appId: "com.acme.app" }),
      "my-app://open",
    );
    expect(snippet).toContain('<meta name="google-play-app"');
    expect(snippet).toContain("app-id=com.acme.app");
    expect(snippet).not.toContain("app-argument");
  });

  it("links to the Play store page", () => {
    const snippet = smartBannerSnippet(
      listing({ platform: "play", appId: "com.acme.app" }),
      "my-app://open",
    );
    expect(snippet).toContain("https://play.google.com/store/apps/details?id=com.acme.app");
  });
});

describe("buildPublishPayload", () => {
  it("builds per-channel copy referencing the app", () => {
    const payload = buildPublishPayload(listing(), "my-app://open");
    expect(payload.x).toContain("Habit Tracker");
    expect(payload.linkedin).toContain("Health & Fitness");
    expect(payload.reddit).toContain("A habit tracker");
    expect(payload.telegram).toContain("Habit Tracker");
  });
});

describe("utfBtoa", () => {
  it("encodes unicode safely", () => {
    expect(utfBtoa("héllo ✓")).toBe(btoa(String.fromCharCode(...new TextEncoder().encode("héllo ✓"))));
  });
});
