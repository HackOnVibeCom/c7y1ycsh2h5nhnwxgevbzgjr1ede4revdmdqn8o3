import { z } from "zod";
import type { ListingData } from "../aso-rules/types";
import { callLLM, type ChatMessage, type OpenRouterEnv } from "../llm/openrouter";

export const AiExtractSchema = z.object({
  title: z.string(),
  shortDescription: z.string(),
  description: z.string(),
  category: z.string(),
  developer: z.string(),
  price: z.string(),
});

export type AiExtract = z.infer<typeof AiExtractSchema>;

const EXTRACT_SYSTEM_PROMPT = `You are a precise app-store data extractor.
Given a digest of an app store listing page, return the clean, complete text fields as JSON.
Rules:
1. title: the exact app name (keep the real product name, no edits).
2. shortDescription: the app's short description / subtitle if present, otherwise the first sentence.
3. description: the FULL description verbatim — do not truncate, do not invent features, keep all sentences.
4. category: the store category of the app.
5. developer: the publisher/developer name exactly as shown.
6. price: the price as displayed (e.g. "Free" or "$4.99").
Return JSON only (no markdown fences).`;

export function buildExtractDigest(listing: ListingData, html: string): string {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return JSON.stringify({
    platform: listing.platform,
    known: {
      title: listing.title,
      shortDescription: listing.shortDescription ?? "",
      category: listing.category ?? "",
      developer: listing.developer ?? "",
      price: listing.price ?? "",
    },
    pageText: text.slice(0, 6000),
  });
}

const mergeTextFields = (base: ListingData, ai: AiExtract): ListingData => ({
  ...base,
  title: ai.title,
  shortDescription: ai.shortDescription,
  description: ai.description,
  category: ai.category,
  developer: ai.developer,
  price: ai.price,
});

export async function aiRefineListing(
  listing: ListingData,
  html: string,
  env: OpenRouterEnv,
): Promise<ListingData> {
  const messages: ChatMessage[] = [
    { role: "system", content: EXTRACT_SYSTEM_PROMPT },
    { role: "user", content: buildExtractDigest(listing, html) },
  ];
  const raw = await callLLM(messages, env, { maxTokens: 3000 });
  const parsed = AiExtractSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new Error("AI extraction output failed schema validation");
  }
  return mergeTextFields(listing, parsed.data);
}
