import { z } from "zod";
import { extractListing } from "../../src/lib/extract";
import { score } from "../../src/lib/aso-rules/scorer";
import type { Env } from "../_lib/env";

const Body = z.object({ storeUrl: z.string().min(1).max(500) });

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
    return Response.json({ error: "storeUrl is required" }, { status: 400 });
  }

  try {
    const started = Date.now();
    const listing = await extractListing(parsed.data.storeUrl, context.env);
    const aso = score(listing);
    return Response.json({
      listing,
      score: aso,
      meta: { extractionMs: Date.now() - started },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    return Response.json({ error: message }, { status: 422 });
  }
};