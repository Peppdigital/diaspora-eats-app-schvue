import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  let body: { email?: string; password?: string; name?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return json(req, { error: "Invalid JSON body" }, 400);
  }

  const { email, password, name, role = "customer" } = body;

  if (!email || !password || !name) {
    return json(req, { error: "email, password, and name are required" }, 400);
  }

  // Check if user already exists
  const { data: existing } = await supabase
    .from("user")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return json(req, { error: "Email already registered" }, 409);
  }

  // Hash password using Web Crypto (PBKDF2)
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  const hashedPassword = `pbkdf2:${saltHex}:${hashHex}`;

  const userId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Insert user
  const { data: user, error: userError } = await supabase
    .from("user")
    .insert({ id: userId, name, email, email_verified: false, role, created_at: now, updated_at: now })
    .select()
    .single();

  if (userError) {
    console.error("[auth-signup] user insert error:", userError);
    return json(req, { error: userError.message }, 500);
  }

  // Insert account (credential provider)
  const { error: accountError } = await supabase
    .from("account")
    .insert({
      id: crypto.randomUUID(),
      account_id: email,
      provider_id: "credential",
      user_id: userId,
      password: hashedPassword,
      created_at: now,
      updated_at: now,
    });

  if (accountError) {
    console.error("[auth-signup] account insert error:", accountError);
    return json(req, { error: accountError.message }, 500);
  }

  // Create session token
  const token = crypto.randomUUID() + "-" + crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error: sessionError } = await supabase
    .from("session")
    .insert({
      id: crypto.randomUUID(),
      token,
      user_id: userId,
      expires_at: expiresAt,
      created_at: now,
      updated_at: now,
    });

  if (sessionError) {
    console.error("[auth-signup] session insert error:", sessionError);
    return json(req, { error: sessionError.message }, 500);
  }

  return json(req, {
    user: { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role, created_at: user.created_at },
    token,
  }, 201);
});
