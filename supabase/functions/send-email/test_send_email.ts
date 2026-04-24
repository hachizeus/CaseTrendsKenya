import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

const API_URL = "http://localhost:8000/api/send-email";

Deno.test("Admin can send status update email", async () => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: "customer@example.com",
      type: "status_update",
      data: {
        id: "order123",
        customer_name: "John Doe",
        status: "confirmed",
      },
      role: "admin",
    }),
  });

  const result = await response.json();
  assertEquals(response.status, 200);
  assertEquals(result.success, true);
});

Deno.test("Moderator can send status update email", async () => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: "customer@example.com",
      type: "status_update",
      data: {
        id: "order123",
        customer_name: "John Doe",
        status: "confirmed",
      },
      role: "moderator",
    }),
  });

  const result = await response.json();
  assertEquals(response.status, 200);
  assertEquals(result.success, true);
});

Deno.test("Unauthorized role cannot send status update email", async () => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: "customer@example.com",
      type: "status_update",
      data: {
        id: "order123",
        customer_name: "John Doe",
        status: "confirmed",
      },
      role: "user",
    }),
  });

  assertEquals(response.status, 403);
});