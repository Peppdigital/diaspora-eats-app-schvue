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

function formatOrderDetail(order: Record<string, unknown>, items: Record<string, unknown>[], vendorName?: string) {
  return {
    id: order.id,
    vendor_id: order.vendor_id,
    vendor_name: vendorName || null,
    user_id: order.user_id,
    status: order.status,
    subtotal: Number(order.subtotal),
    delivery_fee: Number(order.delivery_fee),
    total: Number(order.total),
    delivery_address: order.delivery_address,
    delivery_instructions: order.delivery_instructions,
    estimated_delivery_time: order.estimated_delivery_time,
    created_at: order.created_at,
    updated_at: order.updated_at,
    items: items.map((i: Record<string, unknown>) => ({
      id: i.id,
      menu_item_id: i.menu_item_id,
      name: i.name,
      price: Number(i.price),
      quantity: i.quantity,
      special_instructions: i.special_instructions,
    })),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  // /api-orders or /api-orders/{id} or /api-orders/{id}/status
  const orderId = pathParts[1];
  const isStatus = pathParts[2] === "status";

  const user = await getAuthUser(req);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders() });

  try {
    // PATCH /api/orders/{id}/status
    if (req.method === "PATCH" && orderId && isStatus) {
      const { data: order } = await supabase.from("orders").select("*, vendor:vendor_id(user_id,name)").eq("id", orderId).maybeSingle();
      if (!order) return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: corsHeaders() });
      const vendor = order.vendor as Record<string, unknown>;
      if (user.role !== "admin" && vendor.user_id !== user.id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders() });
      }
      const { status } = await req.json();
      const { data: updated, error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", orderId)
        .select()
        .single();
      if (error) throw error;
      const { data: items } = await supabase.from("order_items").select("*").eq("order_id", orderId);
      return new Response(JSON.stringify(formatOrderDetail(updated, items || [], vendor.name as string)), { status: 200, headers: corsHeaders() });
    }

    // GET /api/orders/{id}
    if (req.method === "GET" && orderId) {
      const { data: order, error } = await supabase
        .from("orders")
        .select("*, vendor:vendor_id(name)")
        .eq("id", orderId)
        .maybeSingle();
      if (error) throw error;
      if (!order) return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: corsHeaders() });
      if (user.role !== "admin" && order.user_id !== user.id) {
        const { data: v } = await supabase.from("vendors").select("user_id").eq("id", order.vendor_id).maybeSingle();
        if (!v || v.user_id !== user.id) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders() });
      }
      const { data: items } = await supabase.from("order_items").select("*").eq("order_id", orderId);
      const vendor = order.vendor as Record<string, unknown>;
      return new Response(JSON.stringify(formatOrderDetail(order, items || [], vendor?.name as string)), { status: 200, headers: corsHeaders() });
    }

    // GET /api/orders (list my orders)
    if (req.method === "GET") {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*, vendor:vendor_id(name), order_items(id)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const result = (orders || []).map((o: Record<string, unknown>) => {
        const vendor = o.vendor as Record<string, unknown>;
        const orderItems = o.order_items as unknown[];
        return {
          id: o.id,
          vendor_id: o.vendor_id,
          vendor_name: vendor?.name,
          status: o.status,
          total: Number(o.total),
          item_count: orderItems?.length || 0,
          created_at: o.created_at,
        };
      });
      return new Response(JSON.stringify({ orders: result }), { status: 200, headers: corsHeaders() });
    }

    // POST /api/orders (place order)
    if (req.method === "POST") {
      const body = await req.json();
      const { vendor_id, items, delivery_address, delivery_instructions } = body;
      if (!vendor_id || !items || !delivery_address) {
        return new Response(JSON.stringify({ error: "vendor_id, items, and delivery_address are required" }), { status: 400, headers: corsHeaders() });
      }

      // Get vendor
      const { data: vendor } = await supabase.from("vendors").select("*").eq("id", vendor_id).maybeSingle();
      if (!vendor) return new Response(JSON.stringify({ error: "Vendor not found" }), { status: 404, headers: corsHeaders() });

      // Get menu items and calculate subtotal
      const menuItemIds = items.map((i: Record<string, unknown>) => i.menu_item_id);
      const { data: menuItems } = await supabase.from("menu_items").select("*").in("id", menuItemIds);
      const menuMap = new Map((menuItems || []).map((m: Record<string, unknown>) => [m.id, m]));

      let subtotal = 0;
      const orderItemsData = [];
      for (const item of items) {
        const menuItem = menuMap.get(item.menu_item_id) as Record<string, unknown>;
        if (!menuItem) return new Response(JSON.stringify({ error: `Menu item ${item.menu_item_id} not found` }), { status: 400, headers: corsHeaders() });
        const lineTotal = Number(menuItem.price) * item.quantity;
        subtotal += lineTotal;
        orderItemsData.push({
          menu_item_id: item.menu_item_id,
          name: menuItem.name,
          price: Number(menuItem.price),
          quantity: item.quantity,
          special_instructions: item.special_instructions || null,
        });
      }

      const deliveryFee = Number(vendor.delivery_fee);
      const total = subtotal + deliveryFee;
      const now = new Date().toISOString();

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          vendor_id,
          status: "pending",
          subtotal,
          delivery_fee: deliveryFee,
          total,
          delivery_address,
          delivery_instructions: delivery_instructions || null,
          estimated_delivery_time: vendor.estimated_delivery_time,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();
      if (orderError) throw orderError;

      const itemsWithOrderId = orderItemsData.map(i => ({ ...i, order_id: order.id }));
      const { data: createdItems, error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsWithOrderId)
        .select();
      if (itemsError) throw itemsError;

      return new Response(JSON.stringify(formatOrderDetail(order, createdItems || [], vendor.name as string)), { status: 201, headers: corsHeaders() });
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: corsHeaders() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders() });
  }
});
