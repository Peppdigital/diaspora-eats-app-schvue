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

async function isVendorOwnerOrAdmin(user: Record<string, unknown>, vendorId: string): Promise<boolean> {
  if (user.role === "admin") return true;
  const { data } = await supabase.from("vendors").select("user_id").eq("id", vendorId).maybeSingle();
  return data?.user_id === user.id;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });

  // URL pattern: /api-menu-items/{vendorId} or /api-menu-items/{vendorId}/{itemId}
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  // pathParts[0] = function name, [1] = vendorId, [2] = itemId (optional)
  const vendorId = pathParts[1];
  const itemId = pathParts[2];

  if (!vendorId) {
    return new Response(JSON.stringify({ error: "vendorId required" }), { status: 400, headers: corsHeaders() });
  }

  try {
    // GET /api/vendors/{vendorId}/menu-items
    if (req.method === "GET" && !itemId) {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("sort_order");
      if (error) throw error;
      return new Response(JSON.stringify({ items: data || [] }), { status: 200, headers: corsHeaders() });
    }

    // POST /api/vendors/{vendorId}/menu-items
    if (req.method === "POST" && !itemId) {
      const user = await getAuthUser(req);
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders() });
      const allowed = await isVendorOwnerOrAdmin(user, vendorId);
      if (!allowed) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders() });
      const body = await req.json();
      const { data, error } = await supabase
        .from("menu_items")
        .insert({ ...body, vendor_id: vendorId })
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { status: 201, headers: corsHeaders() });
    }

    // PUT /api/vendors/{vendorId}/menu-items/{id}
    if (req.method === "PUT" && itemId) {
      const user = await getAuthUser(req);
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders() });
      const allowed = await isVendorOwnerOrAdmin(user, vendorId);
      if (!allowed) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders() });
      const body = await req.json();
      const { data, error } = await supabase
        .from("menu_items")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", itemId)
        .eq("vendor_id", vendorId)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders() });
    }

    // DELETE /api/vendors/{vendorId}/menu-items/{id}
    if (req.method === "DELETE" && itemId) {
      const user = await getAuthUser(req);
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders() });
      const allowed = await isVendorOwnerOrAdmin(user, vendorId);
      if (!allowed) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders() });
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", itemId)
        .eq("vendor_id", vendorId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders() });
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: corsHeaders() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders() });
  }
});
