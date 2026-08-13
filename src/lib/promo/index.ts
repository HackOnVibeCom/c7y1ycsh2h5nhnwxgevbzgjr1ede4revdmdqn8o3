import type { ListingData } from "../aso-rules/types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function customDeepLink(listing: ListingData): string {
  const scheme = slugify(listing.title) || "myapp";
  const id = listing.platform === "apple" ? `id${listing.appId}` : listing.appId;
  return `${scheme}://open?source=launchdesk&id=${id}`;
}

export function utfBtoa(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export function qrCodeUrl(deepLink: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(deepLink)}`;
}

export function qrCodeUrlFallback(deepLink: string): string {
  return `https://chart.googleapis.com/chart?cht=qr&chs=240x240&chl=${encodeURIComponent(deepLink)}`;
}

export function smartBannerSnippet(listing: ListingData, deepLink: string): string {
  const storeLink =
    listing.platform === "apple"
      ? listing.storeUrl
      : `https://play.google.com/store/apps/details?id=${listing.appId}`;
  const metaName = listing.platform === "apple" ? "apple-itunes-app" : "google-play-app";
  const metaContent =
    listing.platform === "apple"
      ? `app-id=${listing.appId}, app-argument=${deepLink}`
      : `app-id=${listing.appId}`;
  return `<!-- Smart banner: add to your landing page <head> -->
<meta name="${metaName}" content="${metaContent}" />
<a href="${storeLink}" rel="noopener" target="_blank">Download ${listing.title}</a>`;
}

export interface PublishPayload {
  x: string;
  linkedin: string;
  reddit: string;
  telegram: string;
  discordWebhookUrl?: string;
}

export function buildPublishPayload(listing: ListingData, deepLink: string): PublishPayload {
  const t = listing.title;
  const cat = listing.category || "mobile app";
  const url = listing.storeUrl;
  return {
    x: `Just shipped ${t} 🚀\n\n${listing.shortDescription ?? listing.subtitle ?? ""}\n\n→ ${url}\n\n${deepLink}\n\n#IndieDev #${slugify(t).replace(/-/g, "")} #MobileApp`,
    linkedin: `I'm excited to share ${t} — a new ${cat}. ${listing.shortDescription ?? listing.subtitle ?? ""}.\n\nCheck it out: ${url}\n\n${deepLink}`,
    reddit: `I built ${t}, a ${cat}. ${listing.description.slice(0, 280)}… What do you think?\n\n${url}`,
    telegram: `${t} 🚀 ${listing.shortDescription ?? listing.subtitle ?? ""}\n\n${url}`,
  };
}

export { slugify };