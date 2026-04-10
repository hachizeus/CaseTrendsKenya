// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  "Access-Control-Max-Age": "86400",
};

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://yrhczwzqvzqalyjpxdmi.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    ...init,
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, { status });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  if (!PAYSTACK_SECRET_KEY) {
    return errorResponse("Missing Paystack secret key", 500);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return errorResponse("Missing Supabase environment configuration", 500);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch (err) {
    return errorResponse("Invalid JSON payload", 400);
  }

  const requestedAmount = Number(payload.amount);
  const email = typeof payload.email === "string" ? payload.email : "";
  const orderId = typeof payload.order_id === "string" ? payload.order_id : null;
  const userId = typeof payload.user_id === "string" ? payload.user_id : null;
  const metadata = typeof payload.metadata === "object" && payload.metadata !== null
    ? payload.metadata
    : {};

  if (!orderId) {
    return errorResponse("order_id is required for Paystack payment initialization", 400);
  }

  const orderResponse = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  const orderData = await orderResponse.json();
  if (!orderResponse.ok || !Array.isArray(orderData) || orderData.length === 0) {
    console.error("Order lookup failed", { status: orderResponse.status, body: orderData });
    return errorResponse("Order not found", 404);
  }

  const order = orderData[0];
  const amount = Number(order.total_amount);
  if (!amount || amount <= 0) {
    return errorResponse("Order total amount is invalid", 400);
  }

  if (!email) {
    return errorResponse("Email is required", 400);
  }

  const amountInKobo = Math.round(amount * 100);
  const reference = `ctk_${crypto.randomUUID()}`;

  const paystackInitResponse = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: amountInKobo,
      currency: "KES",
      reference,
      metadata: {
        order_id: orderId,
        ...metadata,
      },
    }),
  });

  const paystackData = await paystackInitResponse.json();
  if (!paystackInitResponse.ok || !paystackData.status) {
    console.error("Paystack initialize error:", paystackData);
    return errorResponse("Failed to initialize Paystack transaction", 502);
  }

  const transactionRow = {
    user_id: userId,
    amount,
    currency: "KES",
    status: "pending",
    paystack_ref: reference,
    metadata: {
      order_id: orderId,
      email,
      ...metadata,
    },
  };

  const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(transactionRow),
  });

  const supabaseData = await supabaseResponse.json();
  if (!supabaseResponse.ok) {
    console.error("Supabase transaction insert error:", {
      status: supabaseResponse.status,
      body: supabaseData,
    });
    return errorResponse({
      error: "Failed to record transaction",
      supabase: {
        status: supabaseResponse.status,
        body: supabaseData,
      },
    }, 500);
  }

  return jsonResponse({
    access_code: paystackData.data.access_code,
    reference,
    transaction: supabaseData[0] ?? null,
  });
});
