import type { ListingData, Platform } from "../aso-rules/types";

const APPLE_RE =
  /^https?:\/\/(?:apps|itunes)\.apple\.com\/(?:[\w-]+\/)?app\/[\w-]*\/?id(\d+)/i;
const PLAY_RE =
  /^https?:\/\/play\.google\.com\/store\/apps\/details\?id=([\w.]+)/i;
const PLAY_PK = /^[\w.]+\.[\w.]+\.[\w.]+$/;

export function parseStoreUrl(url: string): { platform: Platform; appId: string } | null {
  const mApple = url.match(APPLE_RE);
  if (mApple?.[1]) return { platform: "apple", appId: mApple[1] };

  const mPlay = url.match(PLAY_RE);
  if (mPlay?.[1]) return { platform: "play", appId: mPlay[1] };

  const trimmed = url.trim();
  if (PLAY_PK.test(trimmed)) return { platform: "play", appId: trimmed };

  return null;
}

export async function extractListing(input: string): Promise<ListingData> {
  const parsed = parseStoreUrl(input);
  if (!parsed) {
    throw new Error("Could not parse the store URL. Use an App Store or Play Store link.");
  }
  if (parsed.platform === "apple") {
    const { fetchAppleListing } = await import("./apple");
    return fetchAppleListing(parsed.appId);
  }
  const { fetchPlayListing } = await import("./play");
  return fetchPlayListing(parsed.appId);
}