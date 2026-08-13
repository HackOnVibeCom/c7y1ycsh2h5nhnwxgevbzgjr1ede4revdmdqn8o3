import { z } from "zod";
import type { Env } from "../_lib/env";
import type { ListingData } from "../../src/lib/aso-rules/types";
import { reviseListing } from "../../src/lib/llm";
import { score } from "../../src/lib/aso-rules/scorer";

export const ListingPatch = z.object({
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
  genres: z.array(z.string()).optional(),
  rating: z.number().optional(),
  ratingCount: z.number().optional(),
  screenshots: z.array(z.string()).optional(),
  iconUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  releaseNotes: z.string().optional(),
  version: z.string().optional(),
});

export type ListingPatchType = z.infer<typeof ListingPatch>;

export function toListingData(l: ListingPatchType): ListingData {
  return {
    platform: l.platform,
    appId: l.appId,
    storeUrl: l.storeUrl,
    title: l.title,
    subtitle: l.subtitle ?? "",
    shortDescription: l.shortDescription ?? "",
    description: l.description,
    keywords: l.keywords ?? "",
    category: l.category ?? "",
    developer: l.developer ?? "",
    price: l.price,
    genres: l.genres ?? [],
    rating: l.rating,
    ratingCount: l.ratingCount,
    screenshots: l.screenshots ?? [],
    iconUrl: l.iconUrl,
    videoUrl: l.videoUrl,
    releaseNotes: l.releaseNotes,
    version: l.version,
  };
}

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
  const before = toListingData(p.listing);
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