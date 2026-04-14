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

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return json(req, { error: "Invalid JSON body" }, 400);
  }

  const { email, password } = body;

  if (!email || !password) {
    return json(req, { error: "email and password are required" }, 400);
  }

  // Look up user by email
  const { data: user, error: userError } = await supabase
    .from("user")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (userError) {
    console.error("[auth-login] user lookup error:", userError);
    return json(req, { error: "Internal server error" }, 500);
  }

  if (!user) {
    return json(req, { error: "Invalid email or password" }, 401);
  }

  // Look up credential account
  const { data: account, error: accountError } = await supabase
    .from("account")
    .select("password")
    .eq("user_id", user.id)
    .eq("provider_id", "credential")
    .maybeSingle();

  if (accountError || !account?.password) {
    return json(req, { error: "Invalid email or password" }, 401);
  }

  // Verify PBKDF2 password
  const parts = account.password.split(":");
  if (parts.length !== 3 || parts[0] !== "pbkdf2") {
    return json(req, { error: "Invalid email or password" }, 401);
  }

  const [, saltHex, storedHash] = parts;
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

  if (hashHex !== storedHash) {
    return json(req, { error: "Invalid email or password" }, 401);
  }

  // Create session token
  const token = crypto.randomUUID() + "-" + crypto.randomUUID();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error: sessionError } = await supabase
    .from("session")
    .insert({
      id: crypto.randomUUID(),
      token,
      user_id: user.id,
      expires_at: expiresAt,
      created_at: now,
      updated_at: now,
    });

  if (sessionError) {
    console.error("[auth-login] session insert error:", sessionError);
    return json(req, { error: sessionError.message }, 500);
  }

  return json(req, {
    user: { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role, created_at: user.created_at },
    token,
  });
});
