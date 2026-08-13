import type { ListingData } from "../aso-rules/types";
import { score } from "../aso-rules/scorer";
import { buildUserPrompt, callLLM, SYSTEM_PROMPT, type OpenRouterEnv } from "./openrouter";
import { deterministicRevise } from "./fallback";
import { RevisedListingSchema, type ReviseRequest } from "./schemas";

function mergeRevised(listing: ListingData, revised: {
  title: string;
  subtitle: string;
  shortDescription: string;
  description: string;
  keywords: string;
  category: string;
  developer: string;
  price: string;
}): ListingData {
  return {
    ...listing,
    title: revised.title,
    subtitle: revised.subtitle,
    shortDescription: revised.shortDescription,
    description: revised.description,
    keywords: revised.keywords,
    category: revised.category,
    developer: revised.developer,
    price: revised.price,
  };
}

export async function reviseListing(
  request: ReviseRequest,
  env: OpenRouterEnv,
): Promise<{ listing: ListingData; score: ReturnType<typeof score>; source: "ai" | "fallback"; note: string }> {
  const fallback = deterministicRevise(request.listing as ListingData);
  const fallbackListing = mergeRevised(request.listing as ListingData, fallback);
  const fallbackScore = score(fallbackListing);
  const beforeScore = score(request.listing as ListingData);

  try {
    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      { role: "user" as const, content: buildUserPrompt(request.listing, request.targetScore) },
    ];
    const raw = await callLLM(messages, env);
    const parsed = RevisedListingSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      throw new Error("LLM output failed schema validation");
    }
    const aiListing = mergeRevised(request.listing as ListingData, parsed.data);
    const aiScore = score(aiListing);
    const aiWins =
      aiScore.total > beforeScore.total &&
      aiScore.total > fallbackScore.total;
    if (!aiWins) {
      return { listing: fallbackListing, score: fallbackScore, source: "fallback", note: fallback.note };
    }
    return {
      listing: aiListing,
      score: aiScore,
      source: "ai",
      note: parsed.data.note,
    };
  } catch {
    return { listing: fallbackListing, score: fallbackScore, source: "fallback", note: fallback.note };
  }
}