import type { ListingData } from "../aso-rules/types";
import { parseStoreUrl, type StoreQuery } from "./index";
import type { OpenRouterEnv } from "../llm/openrouter";
import { aiRefineListing } from "./ai";

interface PlayJsonLd {
  name?: string;
  description?: string;
  aggregateRating?: { ratingValue?: string | number; ratingCount?: string | number };
  applicationCategory?: string;
  offers?: { price?: string | number; priceCurrency?: string };
  screenshot?: string[];
  image?: string;
  publisher?: { name?: string };
  author?: string | { name?: string };
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

const FALLBACK_LOCALES: Array<{ hl: string; gl: string }> = [
  { hl: "id_ID", gl: "ID" },
  { hl: "en", gl: "LA" },
  { hl: "en", gl: "MY" },
  { hl: "en", gl: "GB" },
  { hl: "en", gl: "US" },
];

export async function fetchPlayListing(
  appId: string,
  query?: StoreQuery,
  env?: OpenRouterEnv,
): Promise<ListingData> {
  const candidates = buildLocaleCandidates(query);
  let lastHtml: string | null = null;
  let lastUrl = "";

  for (const { hl, gl } of candidates) {
    const url = `https://play.google.com/store/apps/details?id=${appId}&hl=${hl}&gl=${gl}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LaunchDesk/0.1)" },
    });
    if (res.ok) {
      lastHtml = await res.text();
      lastUrl = url;
      break;
    }
    if (res.status === 404) continue;
    throw new Error(`Play Store responded ${res.status}`);
  }

  if (!lastHtml) {
    throw new Error(`Play Store responded 404`);
  }

  const ld = parseLdJson(lastHtml);

  if (!ld?.name) {
    throw new Error("Could not read this Play Store listing. Try an Apple App Store link instead.");
  }

  const fullDescription = extractFullDescription(lastHtml, decodeHtmlEntities(ld.description ?? ""));
  const shortDescription = decodeHtmlEntities(ld.description ?? "")
    .split("\n")[0]
    ?.slice(0, 100) ?? "";

  const rating = Math.round(Number(ld.aggregateRating?.ratingValue ?? 0) * 10) / 10;
  const ratingCount = Number(ld.aggregateRating?.ratingCount ?? 0);
  const htmlShots = extractPlayScreenshots(lastHtml);
  const screenshots = htmlShots.length > 0 ? htmlShots : (ld.screenshot ?? []);

  const price = ld.offers?.price !== undefined ? `$${Number(ld.offers.price).toFixed(2)}` : "Free";
  const developer = extractDeveloper(lastHtml, ld);

  const listing: ListingData = {
    platform: "play",
    appId,
    storeUrl: lastUrl,
    title: ld.name ?? "",
    shortDescription,
    description: fullDescription,
    category: ld.applicationCategory ?? "",
    rating: Number.isFinite(rating) ? rating : 0,
    ratingCount: Number.isFinite(ratingCount) ? ratingCount : 0,
    screenshots,
    iconUrl: typeof ld.image === "string" ? ld.image : undefined,
    videoUrl: extractTrailerUrl(lastHtml),
    developer,
    price,
    version: ld.version,
  };

  if (!env?.OPENROUTER_API_KEY) return listing;
  try {
    return await aiRefineListing(listing, lastHtml, env);
  } catch {
    return listing;
  }
}

function extractFullDescription(html: string, fallback: string): string {
  const start = html.search(/data-g-id="description"/);
  if (start === -1) return fallback;
  const open = html.lastIndexOf("<div", start);
  if (open === -1) return fallback;

  const tagRe = /<div\b[^>]*>|<\/div\s*>/g;
  let depth = 0;
  let end = -1;
  let m: RegExpExecArray | null;
  const window = html.slice(open, open + 100000);
  while ((m = tagRe.exec(window)) !== null) {
    if (m[0].startsWith("</div")) {
      depth -= 1;
      if (depth === 0) {
        end = open + m.index + m[0].length;
        break;
      }
    } else {
      depth += 1;
    }
  }
  if (end === -1) return fallback;

  const inner = html.slice(open, end);
  const text = decodeHtmlEntities(inner)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text || fallback;
}

function extractDeveloper(html: string, ld: PlayJsonLd): string {
  const ldAuthor = typeof ld.author === "string" ? ld.author : ld.author?.name;
  if (ldAuthor) return ldAuthor;
  const m = html.match(/href="\/store\/apps\/dev\?id=[^"]*"[^>]*>\s*<span>([^<]+)<\/span>/);
  return m?.[1]?.trim() ?? "";
}

function extractPlayScreenshots(html: string): string[] {
  const urls: string[] = [];
  const imgRe = /<img[^>]*data-screenshot-index[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRe.exec(html)) !== null) {
    const src = m[0].match(/src="([^"]+)"/);
    if (src?.[1]) urls.push(src[1]);
  }
  return [...new Set(urls)].slice(0, 8);
}

function extractTrailerUrl(html: string): string | undefined {
  const m = html.match(/data-trailer-url="([^"]+)"/);
  if (!m?.[1]) return undefined;
  return m[1].replace(/&amp;/g, "&");
}

function buildLocaleCandidates(query?: StoreQuery): Array<{ hl: string; gl: string }> {
  if (query?.hl || query?.gl) {
    const user: { hl: string; gl: string } = {
      hl: query.hl ?? "en",
      gl: query.gl ?? "US",
    };
    const unique = new Set([`${user.hl}/${user.gl}`]);
    const rest = FALLBACK_LOCALES.filter(
      (l) => !unique.has(`${l.hl}/${l.gl}`),
    );
    return [user, ...rest];
  }
  return FALLBACK_LOCALES;
}

export async function extractFromUrl(
  input: string,
  env?: OpenRouterEnv,
): Promise<ListingData> {
  const parsed = parseStoreUrl(input);
  if (!parsed) {
    throw new Error("Could not parse the store URL. Use an App Store or Play Store link.");
  }
  if (parsed.platform !== "play") {
    throw new Error("Expected a Google Play Store link.");
  }
  return fetchPlayListing(parsed.appId, parsed.query, env);
}