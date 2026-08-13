import type { ListingData } from "../aso-rules/types";
import { parseStoreUrl } from "./index";
import { aiRefineListing } from "./ai";
import type { OpenRouterEnv } from "../llm/openrouter";

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

export async function fetchAppleListing(
  appId: string,
  env?: OpenRouterEnv,
): Promise<ListingData> {
  const url = `https://itunes.apple.com/lookup?id=${appId}&country=US&entity=software`;
  const res = await fetchWithRetry(url);
  if (!res.ok) {
    return scrapeAppleListing(appId, env);
  }
  const data = (await res.json()) as { resultCount: number; results: AppleResult[] };
  const app = data.results[0];

  if (!app) {
    throw new Error("App not found on the App Store.");
  }

  const storeUrl = app.trackViewUrl ?? `https://apps.apple.com/app/id${appId}`;

  const listing: ListingData = {
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

  if (!env?.OPENROUTER_API_KEY) return listing;
  try {
    const html = await fetch(app.trackViewUrl ?? storeUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LaunchDesk/0.1)" },
    })
      .then((r) => r.text())
      .catch(() => "");
    return html
      ? await aiRefineListing(listing, html, env)
      : listing;
  } catch {
    return listing;
  }
}

interface ScrapeLd {
  name?: string;
  description?: string;
  applicationCategory?: string;
  image?: string;
  author?: { name?: string };
  offers?: { price?: string | number };
  aggregateRating?: { ratingValue?: string | number; reviewCount?: string | number };
}

async function scrapeAppleListing(
  appId: string,
  env?: OpenRouterEnv,
): Promise<ListingData> {
  const pageUrl = `https://apps.apple.com/us/app/id${appId}`;
  const res = await fetch(pageUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; LaunchDesk/0.1)" },
  });
  if (!res.ok) {
    throw new Error(`Apple Lookup API responded ${res.status}`);
  }
  const html = await res.text();

  const ld = parseSoftwareApplicationLd(html);
  if (!ld?.name) {
    throw new Error("App not found on the App Store.");
  }

  const description = decodeHtmlEntities(ld.description ?? "");
  const subtitle = extractSubtitle(html);
  const rating = Math.round(Number(ld.aggregateRating?.ratingValue ?? 0) * 10) / 10;
  const ratingCount = Number(ld.aggregateRating?.reviewCount ?? 0);
  const price =
    ld.offers?.price !== undefined
      ? `$${Number(ld.offers.price).toFixed(2)}`
      : undefined;

  const listing: ListingData = {
    platform: "apple",
    appId,
    storeUrl: pageUrl,
    title: ld.name ?? "",
    subtitle,
    description,
    category: ld.applicationCategory ?? "",
    genres: ld.applicationCategory ? [ld.applicationCategory] : [],
    rating: Number.isFinite(rating) ? rating : 0,
    ratingCount: Number.isFinite(ratingCount) ? ratingCount : 0,
    screenshots: extractScreenshots(html),
    iconUrl: typeof ld.image === "string" ? ld.image : undefined,
    videoUrl: extractVideoUrl(html),
    developer: ld.author?.name ?? "",
    price,
    version: undefined,
  };

  if (!env?.OPENROUTER_API_KEY) return listing;
  try {
    return await aiRefineListing(listing, html, env);
  } catch {
    return listing;
  }
}

function parseSoftwareApplicationLd(html: string): ScrapeLd | null {
  const blocks =
    html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const block of blocks) {
    const inner = block.replace(/<script[^>]*>/, "").replace(/<\/script>/, "").trim();
    try {
      const parsed = JSON.parse(inner) as ScrapeLd & { "@type"?: string | string[] };
      const type = Array.isArray(parsed["@type"]) ? parsed["@type"] : [parsed["@type"]];
      if (type.includes("SoftwareApplication") && parsed.name) return parsed;
    } catch {
      // try next block
    }
  }
  return null;
}

function extractSubtitle(html: string): string {
  const m = html.match(/<p class="subtitle[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
  if (!m?.[1]) return "";
  return decodeHtmlEntities(m[1]).replace(/<[^>]*>/g, "").trim().slice(0, 100);
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

interface ScreenshotItem {
  screenshot?: {
    template?: string;
    width?: number;
    height?: number;
    variants?: Array<{ format?: string }>;
  };
}

function extractScreenshots(html: string): string[] {
  const data = parseSerializedData(html);
  if (!data) return [];

  const items = findMediaScreenshots(data);
  return items
    .map(({ template, width, height, format }) => {
      if (!template) return null;
      return template
        .replace("{w}", String(width ?? 1242))
        .replace("{h}", String(height ?? 2688))
        .replace("{c}", "bb")
        .replace("{f}", format ?? "jpeg");
    })
    .filter((s): s is string => Boolean(s))
    .slice(0, 8);
}

function extractVideoUrl(html: string): string | undefined {
  const data = parseSerializedData(html);
  if (!data) return undefined;

  let found: string | undefined;
  const visit = (node: unknown): void => {
    if (found) return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== "object") return;

    const obj = node as Record<string, unknown>;
    const video = obj["video"] as { videoUrl?: string } | undefined;
    if (typeof video?.videoUrl === "string" && video.videoUrl) {
      found = video.videoUrl;
      return;
    }
    for (const value of Object.values(obj)) {
      visit(value);
    }
  };

  visit(data);
  return found;
}

function parseSerializedData(html: string): unknown {
  const block = html.match(
    /<script[^>]*type="application\/json"[^>]*id="serialized-server-data"[^>]*>([\s\S]*?)<\/script>/i,
  );
  if (!block?.[1]) return null;
  try {
    return JSON.parse(block[1]);
  } catch {
    return null;
  }
}

function findMediaScreenshots(data: unknown): Array<{
  template?: string;
  width?: number;
  height?: number;
  format?: string;
}> {
  const results: Array<{
    template?: string;
    width?: number;
    height?: number;
    format?: string;
  }> = [];

  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== "object") return;

    const obj = node as Record<string, unknown>;
    const shot = obj["screenshot"] as ScreenshotItem["screenshot"] | undefined;
    if (shot?.template) {
      results.push({
        template: shot.template,
        width: shot.width,
        height: shot.height,
        format: shot.variants?.[0]?.format,
      });
    }
    for (const value of Object.values(obj)) {
      visit(value);
    }
  };

  visit(data);
  return results;
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

const RETRYABLE_STATUS = new Set([403, 429, 500, 502, 503, 504]);
const RETRY_DELAY_MS = 400;
const MAX_ATTEMPTS = 3;

async function fetchWithRetry(url: string, attempt = 1): Promise<Response> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; LaunchDesk/0.1)",
    },
  });
  if (res.ok || attempt >= MAX_ATTEMPTS || !RETRYABLE_STATUS.has(res.status)) {
    return res;
  }
  await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
  return fetchWithRetry(url, attempt + 1);
}