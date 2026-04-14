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
  // /api-vendor-orders/{vendorId}
  const vendorId = pathParts[1];

  if (!vendorId) {
    return new Response(JSON.stringify({ error: "vendorId required" }), { status: 400, headers: corsHeaders() });
  }

  const user = await getAuthUser(req);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders() });

  try {
    // Check ownership
    const { data: vendor } = await supabase.from("vendors").select("user_id, name").eq("id", vendorId).maybeSingle();
    if (!vendor) return new Response(JSON.stringify({ error: "Vendor not found" }), { status: 404, headers: corsHeaders() });
    if (user.role !== "admin" && vendor.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders() });
    }

    const statusFilter = url.searchParams.get("status");
    let query = supabase
      .from("orders")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (statusFilter) query = query.eq("status", statusFilter);

    const { data: orders, error } = await query;
    if (error) throw error;

    // Fetch order items for each order
    const orderIds = (orders || []).map((o: Record<string, unknown>) => o.id);
    const { data: allItems } = orderIds.length > 0
      ? await supabase.from("order_items").select("*").in("order_id", orderIds)
      : { data: [] };

    const itemsByOrder = new Map<string, Record<string, unknown>[]>();
    for (const item of (allItems || [])) {
      const oi = item as Record<string, unknown>;
      const orderId = oi.order_id as string;
      if (!itemsByOrder.has(orderId)) itemsByOrder.set(orderId, []);
      itemsByOrder.get(orderId)!.push(oi);
    }

    const result = (orders || []).map((o: Record<string, unknown>) => ({
      id: o.id,
      vendor_id: o.vendor_id,
      vendor_name: vendor.name,
      user_id: o.user_id,
      status: o.status,
      subtotal: Number(o.subtotal),
      delivery_fee: Number(o.delivery_fee),
      total: Number(o.total),
      delivery_address: o.delivery_address,
      delivery_instructions: o.delivery_instructions,
      estimated_delivery_time: o.estimated_delivery_time,
      created_at: o.created_at,
      updated_at: o.updated_at,
      items: (itemsByOrder.get(o.id as string) || []).map((i) => ({
        id: i.id,
        menu_item_id: i.menu_item_id,
        name: i.name,
        price: Number(i.price),
        quantity: i.quantity,
        special_instructions: i.special_instructions,
      })),
    }));

    return new Response(JSON.stringify({ orders: result }), { status: 200, headers: corsHeaders() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders() });
  }
});
