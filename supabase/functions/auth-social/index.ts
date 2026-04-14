import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const FUNCTION_BASE = "https://vitgqdlredogyfuodnfy.supabase.co/functions/v1";

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const provider = url.searchParams.get("provider");
  const callbackURL = url.searchParams.get("callbackURL") || "/auth-callback";

  if (!provider || !["google", "apple"].includes(provider)) {
    return new Response("Unsupported provider", { status: 400 });
  }

  // Encode provider + callbackURL into state for the callback to use
  const state = btoa(JSON.stringify({ provider, callbackURL, nonce: crypto.randomUUID() }));
  const redirectUri = `${FUNCTION_BASE}/auth-social-callback`;

  if (provider === "google") {
    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    if (!GOOGLE_CLIENT_ID) {
      return new Response("Google OAuth not configured", { status: 503 });
    }
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "offline",
    });
    return Response.redirect(`https://accounts.google.com/o/oauth2/auth?${params}`);
  }

  if (provider === "apple") {
    const APPLE_CLIENT_ID = Deno.env.get("APPLE_CLIENT_ID");
    if (!APPLE_CLIENT_ID) {
      return new Response("Apple OAuth not configured", { status: 503 });
    }
    const params = new URLSearchParams({
      client_id: APPLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "email name",
      response_mode: "form_post",
      state,
    });
    return Response.redirect(`https://appleid.apple.com/auth/authorize?${params}`);
  }

  return new Response("Unsupported provider", { status: 400 });
});
