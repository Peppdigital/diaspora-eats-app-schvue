import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function getAuthUser(req: Request): Promise<Record<string, unknown> | null> {
  const auth = req.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const { data: session } = await supabase
    .from("session")
    .select("*, user:user_id(*)")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (!session) return null;
  return session.user as Record<string, unknown>;
}

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });

  const user = await getAuthUser(req);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders() });

  try {
    // GET /api/membership
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        // Return a default free membership if none exists
        return new Response(JSON.stringify({
          id: null,
          user_id: user.id,
          tier: "free",
          started_at: null,
          expires_at: null,
          created_at: null,
        }), { status: 200, headers: corsHeaders() });
      }
      return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders() });
    }

    // POST /api/membership (upsert)
    if (req.method === "POST") {
      const { tier } = await req.json();
      if (!tier || !["free", "premium", "vip"].includes(tier)) {
        return new Response(JSON.stringify({ error: "Valid tier (free, premium, vip) is required" }), { status: 400, headers: corsHeaders() });
      }
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("memberships")
        .upsert(
          { user_id: user.id, tier, started_at: now, created_at: now },
          { onConflict: "user_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders() });
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: corsHeaders() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders() });
  }
});
