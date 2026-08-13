import type { Env } from "../_lib/env";

export const onRequest: PagesFunction<Env> = async () => {
  return Response.json({
    ok: true,
    app: "launchdesk",
    source: "cloudflare-pages-functions",
  });
};