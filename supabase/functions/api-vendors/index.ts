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
  const segment = pathParts[1];
  const isMeRoute = segment === "me";
  const vendorId = segment && !isMeRoute ? segment : null;

  try {
    if (req.method === "GET" && isMeRoute) {
      const user = await getAuthUser(req);
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders() });
      const { data, error } = await supabase.from("vendors").select("*").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      if (!data) return new Response(JSON.stringify({ error: "Vendor not found" }), { status: 404, headers: corsHeaders() });
      return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders() });
    }

    if (req.method === "GET" && vendorId) {
      const { data: vendor, error } = await supabase.from("vendors").select("*").eq("id", vendorId).maybeSingle();
      if (error) throw error;
      if (!vendor) return new Response(JSON.stringify({ error: "Vendor not found" }), { status: 404, headers: corsHeaders() });
      const { data: categories } = await supabase.from("menu_categories").select("*").eq("vendor_id", vendorId).order("sort_order");
      const { data: items } = await supabase.from("menu_items").select("*").eq("vendor_id", vendorId).order("sort_order");
      return new Response(JSON.stringify({ ...vendor, menu_categories: categories || [], menu_items: items || [] }), { status: 200, headers: corsHeaders() });
    }

    if (req.method === "PUT" && vendorId) {
      const user = await getAuthUser(req);
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders() });
      const { data: vendor } = await supabase.from("vendors").select("user_id").eq("id", vendorId).maybeSingle();
      if (!vendor) return new Response(JSON.stringify({ error: "Vendor not found" }), { status: 404, headers: corsHeaders() });
      if (user.role !== "admin" && vendor.user_id !== user.id) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders() });
      const body = await req.json();
      const { data, error } = await supabase.from("vendors").update({ ...body, updated_at: new Date().toISOString() }).eq("id", vendorId).select().single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders() });
    }

    if (req.method === "DELETE" && vendorId) {
      const user = await getAuthUser(req);
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders() });
      if (user.role !== "admin") return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders() });
      const { error } = await supabase.from("vendors").delete().eq("id", vendorId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders() });
    }

    if (req.method === "GET") {
      const cuisine = url.searchParams.get("cuisine_type");
      const featured = url.searchParams.get("featured");
      const search = url.searchParams.get("search");
      let query = supabase.from("vendors").select("*").eq("is_active", true);
      if (cuisine) query = query.eq("cuisine_type", cuisine);
      if (featured === "true") query = query.eq("is_featured", true);
      if (search) query = query.ilike("name", `%${search}%`);
      const { data, error } = await query.order("rating", { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ vendors: data || [] }), { status: 200, headers: corsHeaders() });
    }

    if (req.method === "POST") {
      const user = await getAuthUser(req);
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders() });
      if (user.role !== "vendor" && user.role !== "admin") return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders() });
      const body = await req.json();
      const { data, error } = await supabase.from("vendors").insert({ ...body, user_id: user.id }).select().single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { status: 201, headers: corsHeaders() });
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: corsHeaders() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders() });
  }
});
