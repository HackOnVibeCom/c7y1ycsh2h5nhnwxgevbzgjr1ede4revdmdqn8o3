import type { ListingData, Platform } from "../aso-rules/types";

const APPLE_RE =
  /^https?:\/\/(?:apps|itunes)\.apple\.com\/(?:[\w-]+\/)?app\/[\w-]*\/?id(\d+)/i;
const PLAY_RE =
  /^https?:\/\/play\.google\.com\/store\/apps\/details\?id=([\w.]+)/i;
const PLAY_PK = /^[\w.]+\.[\w.]+\.[\w.]+$/;

export interface StoreQuery {
  hl?: string;
  gl?: string;
}

export function parseStoreUrl(
  url: string,
): { platform: Platform; appId: string; query?: StoreQuery } | null {
  const mApple = url.match(APPLE_RE);
  if (mApple?.[1]) return { platform: "apple", appId: mApple[1] };

  const mPlay = url.match(PLAY_RE);
  if (mPlay?.[1]) {
    return { platform: "play", appId: mPlay[1], query: extractPlayQuery(url) };
  }

  const trimmed = url.trim();
  if (PLAY_PK.test(trimmed)) return { platform: "play", appId: trimmed };

  return null;
}

function extractPlayQuery(url: string): StoreQuery | undefined {
  const params = new URL(url).searchParams;
  const hl = params.get("hl") ?? undefined;
  const gl = params.get("gl") ?? undefined;
  return hl || gl ? { hl, gl } : undefined;
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
  return fetchPlayListing(parsed.appId, parsed.query);
}