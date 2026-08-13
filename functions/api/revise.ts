import { z } from "zod";
import type { Env } from "../_lib/env";
import type { ListingData } from "../../src/lib/aso-rules/types";
import { reviseListing } from "../../src/lib/llm";
import { score } from "../../src/lib/aso-rules/scorer";

const ListingPatch = z.object({
  platform: z.enum(["apple", "play"]),
  appId: z.string().default(""),
  storeUrl: z.string().default(""),
  title: z.string(),
  subtitle: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string(),
  keywords: z.string().optional(),
  category: z.string().optional(),
  developer: z.string().optional(),
  price: z.string().optional(),
});

const Body = z.object({
  listing: ListingPatch,
  targetScore: z.number().min(0).max(100).default(90),
});

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

  const p = parsed.data;
  const before: ListingData = {
    platform: p.listing.platform,
    appId: p.listing.appId,
    storeUrl: p.listing.storeUrl,
    title: p.listing.title,
    subtitle: p.listing.subtitle ?? "",
    shortDescription: p.listing.shortDescription ?? "",
    description: p.listing.description,
    keywords: p.listing.keywords ?? "",
    category: p.listing.category ?? "",
    developer: p.listing.developer ?? "",
    price: p.listing.price,
    screenshots: [],
    rating: 0,
    ratingCount: 0,
  };
  const beforeScore = score(before);

  const env: Env = {
    OPENROUTER_API_KEY: context.env.OPENROUTER_API_KEY,
    OPENROUTER_MODEL: context.env.OPENROUTER_MODEL ?? "openrouter/auto",
  };

  try {
    const result = await reviseListing({ listing: before, targetScore: p.targetScore }, env);
    return Response.json({
      before: beforeScore,
      after: result.score,
      revised: result.listing,
      source: result.source,
      note: result.note,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Revision failed";
    return Response.json({ error: message }, { status: 500 });
  }
};