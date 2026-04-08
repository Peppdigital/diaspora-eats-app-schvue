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
  const favoriteId = pathParts[1];

  const user = await getAuthUser(req);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders() });

  try {
    // DELETE /api/favorites/{id}
    if (req.method === "DELETE" && favoriteId) {
      const { data: fav } = await supabase.from("favorites").select("user_id").eq("id", favoriteId).maybeSingle();
      if (!fav) return new Response(JSON.stringify({ error: "Favorite not found" }), { status: 404, headers: corsHeaders() });
      if (fav.user_id !== user.id && user.role !== "admin") {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders() });
      }
      const { error } = await supabase.from("favorites").delete().eq("id", favoriteId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders() });
    }

    // GET /api/favorites
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("favorites")
        .select("*, vendor:vendor_id(*), menu_item:menu_item_id(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ favorites: data || [] }), { status: 200, headers: corsHeaders() });
    }

    // POST /api/favorites
    if (req.method === "POST") {
      const body = await req.json();
      const { vendor_id, menu_item_id } = body;
      if (!vendor_id && !menu_item_id) {
        return new Response(JSON.stringify({ error: "vendor_id or menu_item_id is required" }), { status: 400, headers: corsHeaders() });
      }
      const { data, error } = await supabase
        .from("favorites")
        .insert({
          user_id: user.id,
          vendor_id: vendor_id || null,
          menu_item_id: menu_item_id || null,
        })
        .select("*, vendor:vendor_id(*), menu_item:menu_item_id(*)")
        .single();
      if (error) {
        if (error.code === "23505") {
          return new Response(JSON.stringify({ error: "Already in favorites" }), { status: 409, headers: corsHeaders() });
        }
        throw error;
      }
      return new Response(JSON.stringify(data), { status: 201, headers: corsHeaders() });
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: corsHeaders() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders() });
  }
});
