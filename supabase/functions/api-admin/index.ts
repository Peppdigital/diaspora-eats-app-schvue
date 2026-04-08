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
  if (user.role !== "admin") return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders() });

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  // /api-admin/users or /api-admin/users/{id}/role
  const userId = pathParts[2]; // index 0=fn-name, 1="users", 2=userId
  const isRoleRoute = pathParts[3] === "role";

  try {
    // GET /api/admin/users
    if (req.method === "GET" && !userId) {
      const { data, error } = await supabase
        .from("user")
        .select("id, name, email, image, role, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ users: data || [] }), { status: 200, headers: corsHeaders() });
    }

    // PATCH /api/admin/users/{id}/role
    if (req.method === "PATCH" && userId && isRoleRoute) {
      const { role } = await req.json();
      if (!role || !["customer", "vendor", "admin"].includes(role)) {
        return new Response(JSON.stringify({ error: "Valid role (customer, vendor, admin) is required" }), { status: 400, headers: corsHeaders() });
      }
      const { data, error } = await supabase
        .from("user")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select("id, name, email, image, role, created_at")
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
