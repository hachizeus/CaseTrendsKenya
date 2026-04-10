import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants";

export interface PaystackInitPayload {
  amount: number;
  email: string;
  orderId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface PaystackInitResponse {
  access_code: string;
  reference: string;
  transaction: {
    id: string;
    paystack_ref: string;
    status: string;
  } | null;
}

export async function initializePaystackPayment(payload: PaystackInitPayload): Promise<PaystackInitResponse> {
  const functionUrl = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/paystack-init` : "/functions/v1/paystack-init";
  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      amount: payload.amount,
      email: payload.email,
      order_id: payload.orderId,
      user_id: payload.userId,
      metadata: payload.metadata,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Paystack init failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function payWithPaystack(payload: PaystackInitPayload, publicKey: string) {
  const initResult = await initializePaystackPayment(payload);
  const amountInKobo = Math.round(payload.amount * 100);

  const { default: Paystack }: { default: any } = await import("@paystack/inline-js");
  const paystack = new Paystack();

  return new Promise<{ reference: string }>((resolve, reject) => {
    paystack.newTransaction({
      key: publicKey,
      email: payload.email,
      amount: amountInKobo,
      reference: initResult.reference,
      onSuccess: (_response: unknown) => {
        resolve({ reference: initResult.reference });
      },
      onClose: () => {
        reject(new Error("Paystack payment window was closed."));
      },
    });
  });
}
