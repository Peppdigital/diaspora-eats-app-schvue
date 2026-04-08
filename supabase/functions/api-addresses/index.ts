import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function getAuthUser(req: Request): Promise<{ id: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const { data, error } = await supabase
    .from("session")
    .select("user_id, expires_at")
    .eq("token", token)
    .single();
  if (error || !data) return null;
  if (new Date(data.expires_at) < new Date()) return null;
  return { id: data.user_id };
}

function json(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, content-type",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      ...extra,
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      },
    });
  }

  const authUser = await getAuthUser(req);
  if (!authUser) return json({ error: "Unauthorized" }, 401);

  // Parse path: /api-addresses or /api-addresses/:id
  const url = new URL(req.url);
  const pathParts = url.pathname.replace(/^\//, "").split("/");
  // pathParts[0] = "api-addresses", pathParts[1] = optional id
  const addressId = pathParts[1] ?? null;

  // --- GET /api-addresses ---
  if (req.method === "GET" && !addressId) {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: true });
    if (error) return json({ error: error.message }, 500);
    return json({ addresses: data });
  }

  // --- POST /api-addresses ---
  if (req.method === "POST" && !addressId) {
    const body = await req.json().catch(() => ({}));
    const {
      label,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country = "US",
      is_default = false,
    } = body;

    if (!label || !address_line1 || !city || !state || !postal_code) {
      return json({ error: "Missing required fields: label, address_line1, city, state, postal_code" }, 400);
    }

    if (is_default) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", authUser.id);
    }

    const { data, error } = await supabase
      .from("addresses")
      .insert({
        user_id: authUser.id,
        label,
        address_line1,
        address_line2: address_line2 ?? null,
        city,
        state,
        postal_code,
        country,
        is_default,
      })
      .select()
      .single();

    if (error) return json({ error: error.message }, 500);
    return json({ address: data }, 201);
  }

  // --- PATCH /api-addresses/:id ---
  if (req.method === "PATCH" && addressId) {
    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("addresses")
      .select("id, user_id")
      .eq("id", addressId)
      .single();

    if (fetchError || !existing) return json({ error: "Address not found" }, 404);
    if (existing.user_id !== authUser.id) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const {
      label,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      is_default,
    } = body;

    if (is_default === true) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", authUser.id)
        .neq("id", addressId);
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (label !== undefined) updates.label = label;
    if (address_line1 !== undefined) updates.address_line1 = address_line1;
    if (address_line2 !== undefined) updates.address_line2 = address_line2;
    if (city !== undefined) updates.city = city;
    if (state !== undefined) updates.state = state;
    if (postal_code !== undefined) updates.postal_code = postal_code;
    if (country !== undefined) updates.country = country;
    if (is_default !== undefined) updates.is_default = is_default;

    const { data, error } = await supabase
      .from("addresses")
      .update(updates)
      .eq("id", addressId)
      .select()
      .single();

    if (error) return json({ error: error.message }, 500);
    return json({ address: data });
  }

  // --- DELETE /api-addresses/:id ---
  if (req.method === "DELETE" && addressId) {
    const { data: existing, error: fetchError } = await supabase
      .from("addresses")
      .select("id, user_id")
      .eq("id", addressId)
      .single();

    if (fetchError || !existing) return json({ error: "Address not found" }, 404);
    if (existing.user_id !== authUser.id) return json({ error: "Forbidden" }, 403);

    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", addressId);

    if (error) return json({ error: error.message }, 500);
    return json({ success: true });
  }

  return json({ error: "Method not allowed" }, 405);
});
