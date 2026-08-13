interface Env {
  OPENROUTER_API_KEY?: string;
}

export const onRequest: PagesFunction<Env> = async () => {
  return Response.json({
    ok: true,
    app: "launchdesk",
    source: "cloudflare-pages-functions",
  });
};