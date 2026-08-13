import type { ListingData } from "../aso-rules/types";
import { parseStoreUrl } from "./index";

interface PlayJsonLd {
  name?: string;
  description?: string;
  aggregateRating?: { ratingValue?: string | number; ratingCount?: string | number };
  applicationCategory?: string;
  offers?: { price?: string | number; priceCurrency?: string };
  screenshot?: string[];
  image?: string;
  publisher?: { name?: string };
  url?: string;
  version?: string;
  interactionStatistic?: Array<{ interactionType?: string; userInteractionCount?: string | number }>;
}

function parseLdJson(html: string): PlayJsonLd | null {
  const blocks = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const block of blocks) {
    const inner = block.replace(/<script[^>]*>/, "").replace(/<\/script>/, "").trim();
    try {
      const parsed = JSON.parse(inner) as PlayJsonLd;
      if (parsed?.name || parsed?.description) return parsed;
    } catch {
      // try next block
    }
  }
  return null;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export async function fetchPlayListing(appId: string): Promise<ListingData> {
  const url = `https://play.google.com/store/apps/details?id=${appId}&hl=en&gl=US`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; LaunchDesk/0.1)" },
  });
  if (!res.ok) {
    throw new Error(`Play Store responded ${res.status}`);
  }
  const html = await res.text();

  const ld = parseLdJson(html);

  if (!ld?.name) {
    throw new Error("Could not read this Play Store listing. Try an Apple App Store link instead.");
  }

  const description = decodeHtmlEntities(ld.description ?? "");
  const shortDescription = description.split("\n")[0]?.slice(0, 100) ?? "";

  const rating = Number(ld.aggregateRating?.ratingValue ?? 0);
  const ratingCount = Number(ld.aggregateRating?.ratingCount ?? 0);
  const screenshots = ld.screenshot ?? [];

  const price = ld.offers?.price !== undefined ? `$${Number(ld.offers.price).toFixed(2)}` : "Free";

  return {
    platform: "play",
    appId,
    storeUrl: url,
    title: ld.name ?? "",
    shortDescription,
    description,
    category: ld.applicationCategory ?? "",
    rating: Number.isFinite(rating) ? rating : 0,
    ratingCount: Number.isFinite(ratingCount) ? ratingCount : 0,
    screenshots,
    iconUrl: typeof ld.image === "string" ? ld.image : undefined,
    videoUrl: undefined,
    developer: ld.publisher?.name ?? "",
    price,
    version: ld.version,
  };
}

export async function extractFromUrl(input: string): Promise<ListingData> {
  const parsed = parseStoreUrl(input);
  if (!parsed) {
    throw new Error("Could not parse the store URL. Use an App Store or Play Store link.");
  }
  if (parsed.platform !== "play") {
    throw new Error("Expected a Google Play Store link.");
  }
  return fetchPlayListing(parsed.appId);
}