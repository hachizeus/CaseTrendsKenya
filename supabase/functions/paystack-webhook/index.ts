// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-paystack-signature, apikey, x-client-info",
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

async function computeHmacSha512(secret: string, payload: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
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

  const signatureHeader = req.headers.get("x-paystack-signature");
  if (!signatureHeader) {
    return errorResponse("Missing Paystack signature header", 400);
  }

  const rawBody = await req.text();
  const expectedSignature = await computeHmacSha512(PAYSTACK_SECRET_KEY, rawBody);
  if (signatureHeader !== expectedSignature) {
    console.error("Signature mismatch", { received: signatureHeader, expected: expectedSignature });
    return errorResponse("Invalid signature", 401);
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    return errorResponse("Invalid JSON payload", 400);
  }

  if (event.event !== "charge.success") {
    return jsonResponse({ message: "Event ignored", event: event.event });
  }

  const charge = event.data;
  const reference = charge.reference;
  const metadata = charge.metadata ?? {};
  const orderId = typeof metadata.order_id === "string" ? metadata.order_id : null;

  const updates = [];

  // Update transaction status
  if (reference) {
    const txResponse = await fetch(`${SUPABASE_URL}/rest/v1/transactions?paystack_ref=eq.${encodeURIComponent(reference)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        status: "success",
        updated_at: new Date().toISOString(),
        metadata: {
          ...metadata,
          paystack_charge: charge,
        },
      }),
    });

    if (!txResponse.ok) {
      const errorBody = await txResponse.text();
      console.error("Failed to update transaction record", errorBody);
      updates.push("transaction update failed");
    }
  }

  // Update order status if order_id is present
  if (orderId) {
    const orderResponse = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        status: "paid",
        updated_at: new Date().toISOString(),
      }),
    });

    if (!orderResponse.ok) {
      const errorBody = await orderResponse.text();
      console.error("Failed to update order status", errorBody);
      updates.push("order update failed");
    }
  }

  return jsonResponse({ message: "Webhook processed", reference, order_id: orderId, updates });
});
