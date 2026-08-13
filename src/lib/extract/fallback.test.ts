import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPlayListing } from "./play";
import { fetchAppleListing } from "./apple";

function playHtml(name: string): string {
  return `<script type="application/ld+json">{"name":"${name}","description":"Desc.","aggregateRating":{"ratingValue":"4.5","ratingCount":"1000"}}</script>`;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchPlayListing locale fallback", () => {
  it("tries user locale first and succeeds", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string | URL) => {
      calls.push(String(url));
      return new Response(playHtml("Mobile Legends"), { status: 200 });
    }));

    const out = await fetchPlayListing("com.mobile.legends", { hl: "id_ID", gl: "LA" });
    expect(out.title).toBe("Mobile Legends");
    expect(calls[0]).toContain("hl=id_ID");
    expect(calls[0]).toContain("gl=LA");
    expect(calls).toHaveLength(1);
  });

  it("falls back to next locale when user locale 404s", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string | URL) => {
      calls.push(String(url));
      const s = String(url);
      if (s.includes("gl=LA")) return new Response(playHtml("Mobile Legends"), { status: 200 });
      return new Response("not found", { status: 404 });
    }));

    const out = await fetchPlayListing("com.mobile.legends", { hl: "id_ID", gl: "US" });
    expect(out.title).toBe("Mobile Legends");
    expect(calls[0]).toContain("hl=id_ID");
    expect(calls[0]).toContain("gl=US");
    expect(calls.some((u) => u.includes("gl=LA"))).toBe(true);
  });

  it("uses default fallback chain when no locale provided", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string | URL) => {
      calls.push(String(url));
      return new Response("not found", { status: 404 });
    }));

    await expect(fetchPlayListing("com.missing.app")).rejects.toThrow("Play Store responded 404");
    expect(calls.length).toBeGreaterThan(2);
    expect(calls[0]).toContain("gl=ID");
  });
});

describe("fetchAppleListing retry", () => {
  it("succeeds on retry after a 403", async () => {
    let attempts = 0;
    vi.stubGlobal("fetch", vi.fn(async () => {
      attempts += 1;
      if (attempts === 1) {
        return new Response("forbidden", { status: 403 });
      }
      return new Response(
        JSON.stringify({
          resultCount: 1,
          results: [{ trackName: "X", artworkUrl512: "icon.png" }],
        }),
        { status: 200 },
      );
    }));

    const out = await fetchAppleListing("333903271");
    expect(out.title).toBe("X");
    expect(attempts).toBe(2);
  });

  it("scrapes apps.apple.com when lookup keeps failing with 403", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string | URL) => {
      const s = String(url);
      if (s.includes("itunes.apple.com")) {
        return new Response("forbidden", { status: 403 });
      }
      return new Response(
        `<html><script type="application/ld+json">{"@type":"SoftwareApplication","name":"TikTok - Videos, Shop & LIVE","description":"Watch videos.","applicationCategory":"EntertainmentApplication","image":"icon.png","author":{"name":"TikTok Ltd."},"offers":{"price":0},"aggregateRating":{"ratingValue":"4.7","reviewCount":"18337831"}}</script><p class="subtitle svelte-x">Watch, discover and stream!</p></html>`,
        { status: 200 },
      );
    }));

    const out = await fetchAppleListing("835599320");
    expect(out.title).toBe("TikTok - Videos, Shop & LIVE");
    expect(out.subtitle).toBe("Watch, discover and stream!");
    expect(out.rating).toBe(4.7);
    expect(out.ratingCount).toBe(18337831);
    expect(out.developer).toBe("TikTok Ltd.");
    expect(out.price).toBe("$0.00");
  });

  it("throws when lookup and scrape both fail", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("forbidden", { status: 403 })));

    await expect(fetchAppleListing("333903271")).rejects.toThrow(
      "Apple Lookup API responded 403",
    );
  });
});
