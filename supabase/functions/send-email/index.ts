// Edge Function for sending transactional emails
// Using Resend API with hardcoded credentials

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface EmailRequest {
  to: string;
  type: "order_confirmation" | "status_update" | "order_notification";
  data: any;
}

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

// Resend API key and sender email should be configured in environment variables
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "info@casetrendskenya.co.ke";
const ADMIN_NOTIFICATION_EMAIL = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || FROM_EMAIL;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, authorization",
  "Access-Control-Max-Age": "86400",
};

// Generate order confirmation email template
function generateOrderConfirmationEmail(orderData: any): EmailTemplate {
  const itemsHtml = orderData.items
    .map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}${item.color ? ` (${item.color})` : ""}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">KES ${(item.price).toLocaleString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">KES ${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `)
    .join("");

  const deliveryInfo = `<p><strong>Pickup Location:</strong> Case Trends Kenya Store</p>`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0ea5e9; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Order Confirmation</h2>
          </div>
          <div class="content">
            <p>Dear ${orderData.customer_name},</p>
            <p>Thank you for your order! Here are your order details:</p>
            
            <h3>Order #${orderData.id}</h3>
            <p><strong>Date:</strong> ${new Date(orderData.created_at).toLocaleDateString()}</p>
            <p><strong>Name:</strong> ${orderData.customer_name}</p>
            <p><strong>Phone:</strong> ${orderData.customer_phone}</p>
            <p><strong>Email:</strong> ${orderData.customer_email}</p>
            
            <h3>Items:</h3>
            <table>
              <thead>
                <tr style="background-color: #e0f2fe;">
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                  <th style="padding: 10px; text-align: center;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div class="total">
              Total: KES ${(orderData.total_amount).toLocaleString()}
            </div>
            
            <h3>Delivery</h3>
            ${deliveryInfo}
            <p><strong>Order Status:</strong> ${orderData.status}</p>
            
            <p>We will contact you shortly with updates on your order. If you have any questions, please don't hesitate to reach out.</p>
            
            <div class="footer">
              <p>Case Trends Kenya | WhatsApp: +254 XXX XXX XXX | Email: support@casetrendskеnya.com</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return {
    to: orderData.customer_email,
    subject: `Order Confirmation #${orderData.id}`,
    html,
  };
}

// Generate status update email template
function generateStatusUpdateEmail(orderData: any): EmailTemplate {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0ea5e9; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
          .status-badge { display: inline-block; padding: 8px 12px; background-color: #10b981; color: white; border-radius: 4px; font-weight: bold; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Order Status Update</h2>
          </div>
          <div class="content">
            <p>Dear ${orderData.customer_name},</p>
            <p>Your order status has been updated:</p>
            
            <p><strong>Order #${orderData.id}</strong></p>
            <p>Status: <span class="status-badge">${orderData.status.toUpperCase()}</span></p>
            
            <p>We'll keep you updated on your order. Thank you for your business!</p>
            
            <div class="footer">
              <p>Case Trends Kenya | WhatsApp: +254 XXX XXX XXX | Email: support@casetrendskеnya.com</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return {
    to: orderData.customer_email,
    subject: `Order Status Update #${orderData.id}`,
    html,
  };
}

// Send via Resend
async function sendViaResend(template: EmailTemplate) {
  console.log(`Sending email to ${template.to} via Resend...`);

  if (!RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY environment variable");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: template.to,
      subject: template.subject,
      html: template.html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Resend error (${response.status}):`, error);
    throw new Error(`Resend error: ${error}`);
  }

  const result = await response.json();
  console.log("Email sent successfully:", result);
  return result;
}

function generateOrderNotificationEmail(orderData: any, adminEmail: string): EmailTemplate {
  const itemsHtml = orderData.items
    .map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}${item.color ? ` (${item.color})` : ""}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">KES ${(item.price).toLocaleString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">KES ${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `)
    .join("");

  const orderDate = new Date(orderData.created_at).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    to: adminEmail,
    subject: `New Order Received - ${orderData.id.slice(0, 8)}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0ea5e9; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Order Received</h2>
              <p>${orderDate}</p>
            </div>
            <div class="content">
              <p><strong>Order ID:</strong> ${orderData.id}</p>
              <p><strong>Customer:</strong> ${orderData.customer_name}</p>
              <p><strong>Phone:</strong> ${orderData.customer_phone}</p>
              <p><strong>Email:</strong> ${orderData.customer_email || "N/A"}</p>
              <p><strong>Delivery:</strong> ${orderData.delivery_method === "delivery" ? "Delivery" : "Pickup"}</p>
              ${orderData.delivery_method === "delivery" && orderData.delivery_address ? `<p><strong>Address:</strong> ${orderData.delivery_address}</p>` : ""}
              <h3>Items</h3>
              <table>
                <thead>
                  <tr style="background-color: #e0f2fe;">
                    <th style="padding: 10px; text-align: left;">Item</th>
                    <th style="padding: 10px; text-align: right;">Price</th>
                    <th style="padding: 10px; text-align: center;">Qty</th>
                    <th style="padding: 10px; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              <div class="total">Total: KES ${orderData.total_amount.toLocaleString()}</div>
              <p style="margin-top: 20px;">Please review this order in the admin panel and take action.</p>
            </div>
            <div class="footer">Case Trends Kenya Admin Notification</div>
          </div>
        </body>
      </html>
    `,
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const payload: EmailRequest = await req.json();

    console.log("Email request received:", { to: payload.to, type: payload.type });

    if (!payload.to || !payload.type || !payload.data) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, type, data" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        }
      );
    }

    let emailTemplate: EmailTemplate;

    if (payload.type === "order_confirmation") {
      emailTemplate = generateOrderConfirmationEmail(payload.data);
    } else if (payload.type === "status_update") {
      emailTemplate = generateStatusUpdateEmail(payload.data);
    } else if (payload.type === "order_notification") {
      const adminRecipient = payload.to || ADMIN_NOTIFICATION_EMAIL;
      emailTemplate = generateOrderNotificationEmail(payload.data, adminRecipient);
    } else {
      return new Response(JSON.stringify({ error: "Invalid email type" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      });
    }

    const result = await sendViaResend(emailTemplate);

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    });
  } catch (error: any) {
    console.error("Email function error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      }
    );
  }
});
