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
  subtitle: z.string().nullish(),
  shortDescription: z.string().nullish(),
  description: z.string(),
  keywords: z.string().nullish(),
  category: z.string().nullish(),
  developer: z.string().nullish(),
  price: z.string().nullish(),
  genres: z.array(z.string()).nullish(),
  rating: z.number().nullish(),
  ratingCount: z.number().nullish(),
  screenshots: z.array(z.string()).nullish(),
  iconUrl: z.string().nullish(),
  videoUrl: z.string().nullish(),
  releaseNotes: z.string().nullish(),
  version: z.string().nullish(),
});

export type ListingPatchType = z.infer<typeof ListingPatch>;

export function toListingData(l: ListingPatchType): ListingData {
  return {
    platform: l.platform,
    appId: l.appId,
    storeUrl: l.storeUrl,
    title: l.title,
    subtitle: l.subtitle ?? undefined,
    shortDescription: l.shortDescription ?? undefined,
    description: l.description,
    keywords: l.keywords ?? undefined,
    category: l.category ?? undefined,
    developer: l.developer ?? undefined,
    price: l.price ?? undefined,
    genres: l.genres ?? [],
    rating: l.rating ?? undefined,
    ratingCount: l.ratingCount ?? undefined,
    screenshots: l.screenshots ?? [],
    iconUrl: l.iconUrl ?? undefined,
    videoUrl: l.videoUrl ?? undefined,
    releaseNotes: l.releaseNotes ?? undefined,
    version: l.version ?? undefined,
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
    OPENROUTER_MODEL: context.env.OPENROUTER_MODEL ?? "openrouter/auto-beta",
  };

  try {
    const result = await reviseListing({ listing: before, targetScore: p.targetScore }, env);
    return Response.json({
      before: beforeScore,
      after: result.score,
      revised: result.listing,
      source: result.source,
      note: result.note,
      debug: result.debug,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Revision failed";
    return Response.json({ error: message }, { status: 500 });
  }
};