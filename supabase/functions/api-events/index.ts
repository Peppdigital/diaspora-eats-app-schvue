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

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const eventId = pathParts[1];

  try {
    // GET /api/events/{id}
    if (req.method === "GET" && eventId) {
      const { data, error } = await supabase.from("events").select("*").eq("id", eventId).maybeSingle();
      if (error) throw error;
      if (!data) return new Response(JSON.stringify({ error: "Event not found" }), { status: 404, headers: corsHeaders() });
      return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders() });
    }

    // PUT /api/events/{id}
    if (req.method === "PUT" && eventId) {
      const user = await getAuthUser(req);
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders() });
      if (user.role !== "admin") return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders() });
      const body = await req.json();
      const { data, error } = await supabase
        .from("events")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", eventId)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders() });
    }

    // DELETE /api/events/{id}
    if (req.method === "DELETE" && eventId) {
      const user = await getAuthUser(req);
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders() });
      if (user.role !== "admin") return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders() });
      const { error } = await supabase.from("events").delete().eq("id", eventId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders() });
    }

    // GET /api/events
    if (req.method === "GET") {
      const city = url.searchParams.get("city");
      const tag = url.searchParams.get("tag");
      let query = supabase.from("events").select("*").eq("is_published", true).order("start_date");
      if (city) query = query.eq("city", city);
      if (tag) query = query.contains("tags", [tag]);
      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ events: data || [] }), { status: 200, headers: corsHeaders() });
    }

    // POST /api/events
    if (req.method === "POST") {
      const user = await getAuthUser(req);
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders() });
      if (user.role !== "admin") return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders() });
      const body = await req.json();
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("events")
        .insert({ ...body, created_by: user.id, created_at: now, updated_at: now })
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { status: 201, headers: corsHeaders() });
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: corsHeaders() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders() });
  }
});
