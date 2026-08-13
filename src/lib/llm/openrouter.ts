import type { ListingData } from "../aso-rules/types";

export interface OpenRouterEnv {
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
}

const DEFAULT_MODEL = "openrouter/auto-beta";
const FALLBACK_MODELS = ["poolside/laguna-s-2.1:free"];

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

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
const ATTEMPT_TIMEOUT_MS = 10_000;

async function callOpenRouter(
  messages: ChatMessage[],
  env: OpenRouterEnv,
  options?: { maxTokens?: number },
): Promise<string> {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const primary = env.OPENROUTER_MODEL ?? DEFAULT_MODEL;
  const models = [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];
  let lastError = new Error("OpenRouter request failed");

  for (const model of models) {
    const body = JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: options?.maxTokens ?? 1600,
      response_format: { type: "json_object" },
    });

    try {
      return await attemptWithRetry(apiKey, body);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("OpenRouter request failed");
    }
  }

  throw lastError;
}

async function attemptWithRetry(
  apiKey: string,
  body: string,
): Promise<string> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "X-Title": "LaunchDesk",
        },
        body,
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
        continue;
      }
      throw err;
    }
    clearTimeout(timer);

    if (res.ok) {
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content;
      if (content) return content;
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
        continue;
      }
      throw new Error("OpenRouter returned an empty completion");
    }

    if (attempt < MAX_ATTEMPTS && RETRYABLE_STATUS.has(res.status)) {
      const retryAfter = Number(res.headers.get("Retry-After"));
      const delay = Number.isFinite(retryAfter) ? Math.min(retryAfter, 3000) : 400 * attempt;
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }
    throw new Error(`OpenRouter responded ${res.status}`);
  }

  throw new Error("OpenRouter request failed after retries");
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