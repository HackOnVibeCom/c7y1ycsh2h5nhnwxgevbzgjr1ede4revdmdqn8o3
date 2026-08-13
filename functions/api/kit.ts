import { z } from "zod";
import type { Env } from "../_lib/env";
import type { ListingData } from "../../src/lib/aso-rules/types";
import { customDeepLink, qrCodeUrl, smartBannerSnippet, buildPublishPayload } from "../../src/lib/promo";

const Listing = z.object({
  platform: z.enum(["apple", "play"]),
  appId: z.string(),
  storeUrl: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string(),
  category: z.string().optional(),
});

const Body = z.object({ listing: Listing });

export const onRequest: PagesFunction<Env> = async (context) => {
  const req = context.request;
  if (req.method !== "POST") {
    return Response.json({ error: "method not allowed" }, { status: 405 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = Body.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  const listing: ListingData = {
    ...parsed.data.listing,
    developer: "",
    price: "Free",
    rating: 0,
    ratingCount: 0,
    screenshots: [],
  };

  const deepLink = customDeepLink(listing);
  return Response.json({
    deepLink,
    qrCodeUrl: qrCodeUrl(deepLink),
    smartBanner: smartBannerSnippet(listing, deepLink),
    publishPayload: buildPublishPayload(listing, deepLink),
  });
};