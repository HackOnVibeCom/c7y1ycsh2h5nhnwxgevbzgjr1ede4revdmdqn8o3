import type { ListingData } from "../aso-rules/types";

export interface OpenRouterEnv {
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
}

const DEFAULT_MODEL = "openrouter/auto";

const SYSTEM_PROMPT = `You are LaunchDesk, an expert App Store Optimization (ASO) consultant.
Rewrite the app store listing so it scores higher on our 28 deterministic ASO rules.
Follow these rules strictly:
1. Keep the title short (max 30 chars), normal capitalization, no filler words like 'best', 'free', 'app'.
2. Subtitle must be <= 30 chars and contain a keyword.
3. Description: first line repeats the top keyword; use scannable bullets (- or •); end with a call to action (download / get started); length 800+ chars.
4. Keywords (iOS): space-separated, no commas, no stuffing, relevant to the description.
Return JSON only (no markdown fences) with fields: title, subtitle, shortDescription, description, keywords, category, developer, price, note.
The "note" field summarizes what changed and why in <= 60 words.`;

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

async function callOpenRouter(
  messages: ChatMessage[],
  env: OpenRouterEnv,
  options?: { maxTokens?: number },
): Promise<string> {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Title": "LaunchDesk",
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL ?? DEFAULT_MODEL,
      messages,
      temperature: 0.4,
      max_tokens: options?.maxTokens ?? 1600,
      response_format: {
 type: "json_object" },
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter responded ${res.status}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned an empty completion");
  }
  return content;
}

export async function callLLM(
  messages: ChatMessage[],
  env: OpenRouterEnv,
  options?: { maxTokens?: number },
): Promise<string> {
  return callOpenRouter(messages, env, options);
}

export { SYSTEM_PROMPT };

export function buildUserPrompt(listing: Pick<ListingData, "platform" | "title" | "subtitle" | "shortDescription" | "description" | "keywords" | "category">, targetScore: number): string {
  return JSON.stringify({
    task: "Rewrite this listing to be ASO-optimized",
    targetScore,
    currentListing: {
      platform: listing.platform,
      title: listing.title,
      subtitle: listing.subtitle ?? "",
      shortDescription: listing.shortDescription ?? "",
      description: listing.description,
      keywords: listing.keywords ?? "",
      category: listing.category ?? "",
    },
  });
}