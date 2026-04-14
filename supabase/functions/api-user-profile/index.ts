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

async function buildProfile(userId: string) {
  const { data: user } = await supabase
    .from("user")
    .select("id, name, email, image, role")
    .eq("id", userId)
    .single();

  const { data: profile } = await supabase
    .from("user_profile")
    .select("full_name, phone, avatar_url, role, default_location_city, default_location_state, diaspora_segment, favorite_cuisines")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    id: user?.id ?? userId,
    name: user?.name ?? null,
    email: user?.email ?? null,
    image: user?.image ?? null,
    role: profile?.role ?? user?.role ?? null,
    full_name: profile?.full_name ?? null,
    phone: profile?.phone ?? null,
    avatar_url: profile?.avatar_url ?? null,
    default_location_city: profile?.default_location_city ?? null,
    default_location_state: profile?.default_location_state ?? null,
    diaspora_segment: profile?.diaspora_segment ?? null,
    favorite_cuisines: profile?.favorite_cuisines ?? null,
  };
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const authUser = await getAuthUser(req);
  if (!authUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "GET") {
    const profile = await buildProfile(authUser.id);
    return new Response(JSON.stringify({ profile }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "PATCH") {
    const body = await req.json().catch(() => ({}));
    const { name, full_name, phone, avatar_url, default_location_city, default_location_state, diaspora_segment, favorite_cuisines } = body;

    // Update name in user table if provided
    if (name !== undefined) {
      await supabase
        .from("user")
        .update({ name, updated_at: new Date().toISOString() })
        .eq("id", authUser.id);
    }

    // Upsert user_profile
    const profileUpdates: Record<string, unknown> = {
      user_id: authUser.id,
      updated_at: new Date().toISOString(),
    };
    if (full_name !== undefined) profileUpdates.full_name = full_name;
    if (phone !== undefined) profileUpdates.phone = phone;
    if (avatar_url !== undefined) profileUpdates.avatar_url = avatar_url;
    if (default_location_city !== undefined) profileUpdates.default_location_city = default_location_city;
    if (default_location_state !== undefined) profileUpdates.default_location_state = default_location_state;
    if (diaspora_segment !== undefined) profileUpdates.diaspora_segment = diaspora_segment;
    if (favorite_cuisines !== undefined) profileUpdates.favorite_cuisines = favorite_cuisines;

    await supabase
      .from("user_profile")
      .upsert(profileUpdates, { onConflict: "user_id" });

    const profile = await buildProfile(authUser.id);
    return new Response(JSON.stringify({ profile }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
