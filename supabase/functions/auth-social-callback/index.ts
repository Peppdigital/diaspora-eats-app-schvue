import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const FUNCTION_BASE = "https://vitgqdlredogyfuodnfy.supabase.co/functions/v1";

function errorRedirect(callbackURL: string, message: string): Response {
  return Response.redirect(`${callbackURL}?error=${encodeURIComponent(message)}`);
}

async function getOrCreateUser(
  email: string,
  name: string | null,
  image: string | null,
  provider: string
) {
  const { data: existing } = await supabase
    .from("user")
    .select("id, name, email, image, role")
    .eq("email", email)
    .maybeSingle();

  if (existing) return existing;

  const userId = crypto.randomUUID();
  const now = new Date().toISOString();

  const { data: user, error } = await supabase
    .from("user")
    .insert({
      id: userId,
      name: name || email.split("@")[0],
      email,
      image,
      email_verified: true,
      role: "customer",
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create user: ${error.message}`);

  await supabase.from("account").insert({
    id: crypto.randomUUID(),
    account_id: email,
    provider_id: provider,
    user_id: userId,
    created_at: now,
    updated_at: now,
  });

  return user;
}

async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID() + "-" + crypto.randomUUID();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("session").insert({
    id: crypto.randomUUID(),
    token,
    user_id: userId,
    expires_at: expiresAt,
    created_at: now,
    updated_at: now,
  });

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return token;
}

async function handleGoogle(code: string, callbackURL: string): Promise<Response> {
  const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: `${FUNCTION_BASE}/auth-social-callback`,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();
  if (tokenData.error) {
    return errorRedirect(callbackURL, tokenData.error_description || tokenData.error);
  }

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const googleUser = await userRes.json();

  if (!googleUser.email) return errorRedirect(callbackURL, "No email returned from Google");

  const user = await getOrCreateUser(googleUser.email, googleUser.name ?? null, googleUser.picture ?? null, "google");
  const token = await createSession(user.id);

  return Response.redirect(`${callbackURL}?better_auth_token=${token}`);
}

async function handleApple(code: string, callbackURL: string, body: URLSearchParams): Promise<Response> {
  const APPLE_CLIENT_ID = Deno.env.get("APPLE_CLIENT_ID")!;
  const APPLE_TEAM_ID = Deno.env.get("APPLE_TEAM_ID")!;
  const APPLE_KEY_ID = Deno.env.get("APPLE_KEY_ID")!;
  const APPLE_PRIVATE_KEY = Deno.env.get("APPLE_PRIVATE_KEY")!;

  // Build client_secret JWT for Apple
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: APPLE_KEY_ID };
  const payload = {
    iss: APPLE_TEAM_ID,
    iat: now,
    exp: now + 300,
    aud: "https://appleid.apple.com",
    sub: APPLE_CLIENT_ID,
  };

  const encode = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const signingInput = `${encode(header)}.${encode(payload)}`;

  const pemBody = APPLE_PRIVATE_KEY.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
  const keyData = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    new TextEncoder().encode(signingInput)
  );

  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const clientSecret = `${signingInput}.${signature}`;

  const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: APPLE_CLIENT_ID,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${FUNCTION_BASE}/auth-social-callback`,
    }),
  });

  const tokenData = await tokenRes.json();
  if (tokenData.error) {
    return errorRedirect(callbackURL, tokenData.error_description || tokenData.error);
  }

  // Decode id_token to get user info (no signature verification needed here — Apple signed it)
  const idToken = tokenData.id_token;
  const idPayload = JSON.parse(atob(idToken.split(".")[1]));
  const email = idPayload.email;
  if (!email) return errorRedirect(callbackURL, "No email returned from Apple");

  // Apple only sends the user's name on the first sign-in, in the POST body
  let name: string | null = null;
  const userJson = body.get("user");
  if (userJson) {
    try {
      const appleUser = JSON.parse(userJson);
      const fn = appleUser?.name?.firstName ?? "";
      const ln = appleUser?.name?.lastName ?? "";
      name = [fn, ln].filter(Boolean).join(" ") || null;
    } catch { /* ignore */ }
  }

  const user = await getOrCreateUser(email, name, null, "apple");
  const token = await createSession(user.id);

  return Response.redirect(`${callbackURL}?better_auth_token=${token}`);
}

Deno.serve(async (req: Request) => {
  // Apple uses POST (form_post), Google uses GET
  const isPost = req.method === "POST";
  let params: URLSearchParams;

  if (isPost) {
    const text = await req.text();
    params = new URLSearchParams(text);
  } else {
    params = new URL(req.url).searchParams;
  }

  const code = params.get("code");
  const state = params.get("state");
  const oauthError = params.get("error");

  let callbackURL = "/auth-callback";
  let provider = "google";

  if (state) {
    try {
      const decoded = JSON.parse(atob(state));
      callbackURL = decoded.callbackURL || callbackURL;
      provider = decoded.provider || provider;
    } catch { /* use defaults */ }
  }

  if (oauthError) return errorRedirect(callbackURL, oauthError);
  if (!code) return errorRedirect(callbackURL, "No authorization code received");

  try {
    if (provider === "google") return await handleGoogle(code, callbackURL);
    if (provider === "apple") return await handleApple(code, callbackURL, params);
    return errorRedirect(callbackURL, "Unsupported provider");
  } catch (err) {
    console.error("[auth-social-callback] error:", err);
    return errorRedirect(callbackURL, "Authentication failed");
  }
});
