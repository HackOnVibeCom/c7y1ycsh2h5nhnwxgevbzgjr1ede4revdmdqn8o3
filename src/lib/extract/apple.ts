import type { ListingData } from "../aso-rules/types";
import { parseStoreUrl } from "./index";

interface AppleResult {
  trackId?: number;
  trackName?: string;
  subtitle?: string;
  description?: string;
  genres?: string[];
  primaryGenreName?: string;
  sellerName?: string;
  averageUserRating?: number;
  userRatingCount?: number;
  screenshotUrls?: string[];
  artworkUrl512?: string;
  previewUrl?: string;
  trackViewUrl?: string;
  formattedPrice?: string;
  version?: string;
}

export async function fetchAppleListing(appId: string): Promise<ListingData> {
  const url = `https://itunes.apple.com/lookup?id=${appId}&country=US&entity=software`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Apple Lookup API responded ${res.status}`);
  }
  const data = (await res.json()) as { resultCount: number; results: AppleResult[] };
  const app = data.results[0];

  if (!app) {
    throw new Error("App not found on the App Store.");
  }

  const storeUrl = app.trackViewUrl ?? `https://apps.apple.com/app/id${appId}`;

  return {
    platform: "apple",
    appId,
    storeUrl,
    title: app.trackName ?? "",
    subtitle: app.subtitle ?? "",
    description: app.description ?? "",
    category: app.primaryGenreName ?? app.genres?.[0] ?? "",
    genres: app.genres ?? [],
    rating: app.averageUserRating ?? 0,
    ratingCount: app.userRatingCount ?? 0,
    screenshots: app.screenshotUrls ?? [],
    iconUrl: app.artworkUrl512,
    videoUrl: app.previewUrl,
    developer: app.sellerName ?? "",
    price: app.formattedPrice,
    version: app.version,
  };
}

export async function extractFromUrl(input: string): Promise<ListingData> {
  const parsed = parseStoreUrl(input);
  if (!parsed) {
    throw new Error("Could not parse the store URL. Use an App Store or Play Store link.");
  }
  if (parsed.platform !== "apple") {
    throw new Error("Expected an Apple App Store link.");
  }
  return fetchAppleListing(parsed.appId);
}