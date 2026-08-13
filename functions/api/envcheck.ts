import type { Env } from "../_lib/env";

export const onRequest: PagesFunction<Env> = async (context) => {
  return Response.json({
    hasOpenRouterKey: Boolean(context.env.OPENROUTER_API_KEY),
    model: context.env.OPENROUTER_MODEL ?? null,
  });
};