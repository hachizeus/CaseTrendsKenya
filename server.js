import { ServerClient } from "postmark";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fileupload from "express-fileupload";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || "";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:3000,https://casetrendskenya.onrender.com,https://casetrendskenya.co.ke").split(",").map((origin) => origin.trim()).filter(Boolean);
const EMAIL_USER = "info@casetrendskenya.co.ke";
const EMAIL_FROM = `Case Trends Kenya <${EMAIL_USER}>`;
const EMAIL_REPLY_TO = "info@casetrendskenya.co.ke";
const ADMIN_NOTIFICATION_EMAIL = EMAIL_USER;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, storage: null },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
}));
app.use(fileupload());

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== "string") return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

async function getSupabaseUser(req) {
  const token = getBearerToken(req);
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return null;
  }
  return data.user;
}

async function isAdminUser(userId) {
  if (!userId) return false;
  const { data, error } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" });
  return !!(data && !error);
}

// Ensure order items are parsed correctly from JSONB
function normalizeOrderData(orderData) {
  if (!orderData) return orderData;
  return {
    ...orderData,
    items: Array.isArray(orderData.items) 
      ? orderData.items 
      : typeof orderData.items === 'string' 
        ? JSON.parse(orderData.items) 
        : [],
  };
}

async function fetchOrderWithGuestToken(orderId, token) {
  if (!orderId || !token) return null;
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("guest_access_token", token)
    .single();
  if (error) {
    return null;
  }
  return normalizeOrderData(data);
}

function buildSecureHeaders(req, res, next) {
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +
      "https://www.googletagmanager.com " +
      "https://*.googletagmanager.com " +
      "https://www.google-analytics.com " +
      "https://*.google-analytics.com " +
      "https://challenges.cloudflare.com " +
      "https://*.cloudflare.com " +
      "https://*.paystack.co " +
      "https://checkout.paystack.com " +
      "https://js.paystack.co " +
      "https://cdn.jsdelivr.net",
    "script-src-elem 'self' 'unsafe-inline' " +
      "https://www.googletagmanager.com " +
      "https://*.googletagmanager.com " +
      "https://www.google-analytics.com " +
      "https://*.google-analytics.com " +
      "https://challenges.cloudflare.com " +
      "https://*.cloudflare.com " +
      "https://*.paystack.co " +
      "https://checkout.paystack.com " +
      "https://js.paystack.co " +
      "https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "img-src 'self' data: blob: https: " +
      "https://picsum.photos " +
      "https://images.unsplash.com " +
      "https://yrhczwzqvzqalyjpxdmi.supabase.co",
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:",
    "connect-src 'self' https: wss: " +
      "https://yrhczwzqvzqalyjpxdmi.supabase.co " +
      "wss://yrhczwzqvzqalyjpxdmi.supabase.co " +
      "https://*.supabase.co " +
      "https://api.paystack.co " +
      "https://*.paystack.co " +
      "https://www.google-analytics.com " +
      "https://*.google-analytics.com " +
      "https://api.maptiler.com " +
      "http://localhost:3000 " +
      "http://localhost:5173 " +
      "https://casetrendskenya.co.ke " +
      "https://*.onrender.com",
    "frame-src 'self' " +
      "https://challenges.cloudflare.com " +
      "https://*.cloudflare.com " +
      "https://checkout.paystack.com " +
      "https://*.paystack.co",
    "worker-src 'self' blob:",
    "child-src 'self' blob: " +
      "https://challenges.cloudflare.com " +
      "https://checkout.paystack.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ];

  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.set('Content-Security-Policy', cspDirectives.join('; '));
  
  next();
}

app.use(buildSecureHeaders);

// Cache middleware for static assets
app.use((req, res, next) => {
  // Cache static assets for 1 year
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i)) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // Cache HTML for 1 hour
  else if (req.path.endsWith('.html') || req.path === '/') {
    res.set('Cache-Control', 'public, max-age=3600, must-revalidate');
  }
  // No cache for dynamic content
  else {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  
  // Security headers
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
});

// Serve static assets directly and avoid SPA fallback for asset paths
app.use('/assets', express.static(path.join(__dirname, 'dist', 'assets'), {
  maxAge: '1y',
  etag: false,
  fallthrough: false,
}));

// Serve SPA static files and index.html fallback
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1y',
  etag: false,
}));

const POSTMARK_API_TOKEN = "10b0fffa-aa2b-4302-8568-199e0ecb31df";

const postmarkClient = new ServerClient(POSTMARK_API_TOKEN);

if (!POSTMARK_API_TOKEN) {
  console.warn(
    "POSTMARK_API_TOKEN is required to send emails. Email delivery will fail without it."
  );
}

// Order Confirmation Email Template
const generateOrderConfirmationEmail = (orderData) => {
  const siteUrl = process.env.SITE_URL || "https://casetrendskenya.co.ke";
  const trackingLink = `${siteUrl}/account/orders`;
  const safeCustomerName = escapeHtml(orderData.customer_name);
  const isGuestOrder = !orderData.user_id;
  const safeCustomerEmail = escapeHtml(orderData.customer_email);
  const safeDeliveryAddress = escapeHtml(orderData.delivery_address || "");
  const safeStatus = escapeHtml(orderData.status);
  const safeId = escapeHtml(orderData.id);

  const itemsHtml = orderData.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 14px;">${escapeHtml(item.name)}${item.color ? ` (${escapeHtml(item.color)})` : ""}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-size: 14px;">KES ${Number(item.price).toLocaleString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; font-size: 14px;">${escapeHtml(item.quantity)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600; font-size: 14px;">KES ${Number(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `
    )
    .join("");

  const deliveryInfo =
    orderData.delivery_method === "pickup"
      ? `Pickup at Case Trends Kenya Store`
      : `${safeDeliveryAddress || "Delivery address will be confirmed with you shortly"}`;

  const statusUpdateText = isGuestOrder
    ? "Since you placed this order as a guest, we will send order status updates to your email."
    : `We will contact you shortly to confirm your order details and provide you with shipping information. You can track your order at: ${trackingLink}`;

  const text = `Order Confirmation

Dear ${safeCustomerName},

Thank you for your order! We're excited to process it for you.

Order Details:
Order Number: ${safeId}
Order Date: ${new Date(orderData.created_at).toLocaleDateString()}

Items Ordered:
${orderData.items.map((item) => `- ${escapeHtml(item.name)}${item.color ? ` (${escapeHtml(item.color)})` : ""} x${escapeHtml(item.quantity)} = KES ${Number(item.price * item.quantity).toLocaleString()}`).join("\n")}

Order Summary:
Total Amount: KES ${Number(orderData.total_amount).toLocaleString()}
Delivery Method: ${orderData.delivery_method === "pickup" ? "Pickup" : "Delivery"}
Delivery Address: ${deliveryInfo}

Order Status: PENDING

${statusUpdateText}

If you have any questions or need to make changes, please reply to this email or contact us at support@casetrendskenya.co.ke

Thank you for choosing Case Trends Kenya!

Best regards,
Case Trends Kenya Customer Support Team
Website: ${siteUrl}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; background-color: #f9f9f9; margin: 0; padding: 0; }
          .wrapper { width: 100%; background-color: #f9f9f9; }
          .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd; }
          .header { background-color: #1e293b; color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
          .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
          .content { padding: 30px 20px; }
          .content p { margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; }
          .content strong { font-weight: 600; }
          .order-info { background-color: #f5f5f5; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; font-size: 14px; }
          .order-info p { margin: 8px 0; }
          .status-line { display: flex; justify-content: space-between; margin: 12px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .status-line span:first-child { font-weight: 500; color: #666; }
          .status-line span:last-child { font-weight: 600; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          table th { padding: 12px 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #0ea5e9; background-color: #f5f5f5; font-size: 13px; }
          table td { padding: 10px; border-bottom: 1px solid #eee; font-size: 14px; }
          table tr:last-child td { border-bottom: none; }
          .total-section { padding: 15px; background-color: #f5f5f5; border: 1px solid #ddd; text-align: right; margin: 20px 0; }
          .total-section p { margin: 8px 0; font-size: 14px; }
          .total-amount { font-size: 18px; font-weight: bold; color: #0ea5e9; margin-top: 10px; }
          .cta-button { display: inline-block; background-color: #0ea5e9; color: white; padding: 12px 28px; margin: 20px 0; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 600; }
          .cta-button:hover { background-color: #0d8fce; }
          .divider { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
          .footer { background-color: #f5f5f5; padding: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666; }
          .footer p { margin: 4px 0; }
          .footer a { color: #0ea5e9; text-decoration: none; }
          .contact-info { font-size: 13px; color: #666; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <img src="${siteUrl}/logo.png" alt="Case Trends Kenya" width="140" style="display:block; margin: 0 auto 20px; max-width: 100%; height: auto;" />
              <h1>Order Confirmed!</h1>
              <p>Thank you for your purchase</p>
            </div>
            
            <div class="content">
              <p>Dear ${safeCustomerName},</p>
              
              <p>We've received your order and we're thrilled to process it for you. Here's a summary of your purchase:</p>
              
              <div class="order-info">
                <div class="status-line">
                  <span>Order Number:</span>
                  <span>${safeId}</span>
                </div>
                <div class="status-line">
                  <span>Order Date:</span>
                  <span>${new Date(orderData.created_at).toLocaleDateString()}</span>
                </div>
                <div class="status-line">
                  <span>Status:</span>
                  <span style="color: #f59e0b;">PENDING</span>
                </div>
              </div>
              
              <h3 style="margin: 20px 0 15px 0; font-size: 16px; color: #1e293b;">Order Items</h3>
              <table>
                <tr style="background-color: #f5f5f5;">
                  <th>Item</th>
                  <th style="text-align: right;">Price</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Total</th>
                </tr>
                ${itemsHtml}
              </table>
              
              <div class="total-section">
                <p><strong>Order Total:</strong></p>
                <div class="total-amount">KES ${Number(orderData.total_amount).toLocaleString()}</div>
              </div>
              
              <h3 style="margin: 20px 0 15px 0; font-size: 16px; color: #1e293b;">Delivery Details</h3>
              <div class="order-info" style="border-left-color: #10b981;">
                <div class="status-line">
                  <span>Method:</span>
                  <span>${orderData.delivery_method === "pickup" ? "Pickup" : "Delivery"}</span>
                </div>
                <div class="status-line">
                  <span>Address:</span>
                  <span>${deliveryInfo}</span>
                </div>
              </div>
              
<p>${isGuestOrder ? "Since you placed this order as a guest, we will send order status updates to your email." : "We'll contact you shortly to confirm your order details. You can track your order status anytime by visiting your account."}</p>
               
              ${isGuestOrder ? "" : `
              <div style="text-align: center;">
                <a href="${trackingLink}" class="cta-button">Track Your Order</a>
              </div>
              `}
              
              <hr class="divider">
              
              <p style="font-size: 13px; color: #666;">If you have any questions about your order or need assistance, please don't hesitate to reach out to our support team at <strong>support@casetrendskenya.co.ke</strong> or reply to this email.</p>
            </div>
            
            <div class="footer">
              <p><strong>Case Trends Kenya</strong></p>
              <p>Your Trusted Mobile Phone & Accessories Provider</p>
              <div class="contact-info">
                <p>Email: <a href="mailto:support@casetrendskenya.co.ke">support@casetrendskenya.co.ke</a></p>
                <p>Website: <a href="${siteUrl}">${siteUrl}</a></p>
              </div>
              <p style="margin-top: 12px; color: #999;">© 2026 Case Trends Kenya. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return {
    to: orderData.customer_email,
    subject: `Order Confirmation ${safeId} - Case Trends Kenya`,
    text,
    html,
  };
};

// Status Update Email Template
const generateStatusUpdateEmail = (orderData) => {
  const siteUrl = process.env.SITE_URL || "https://casetrendskenya.co.ke";
  const orderLink = `${siteUrl}/account/orders`;
  const safeCustomerName = escapeHtml(orderData.customer_name);
  const isGuestOrder = !orderData.user_id;
  const safeOrderId = escapeHtml(orderData.id);
  const safeStatus = escapeHtml(orderData.status);
  const safeTotal = Number(orderData.total_amount).toLocaleString();
  
  const statusMessages = {
    confirmed: "Your order has been confirmed and will be processed soon.",
    processing: "Your order is being prepared and will ship shortly.",
    delivered: "Your order has been delivered! Thank you for your purchase.",
    pending: "Your order is pending and awaiting confirmation.",
    cancelled: "Your order has been cancelled. Please contact support if you have questions."
  };

  const statusUpdateText = isGuestOrder
    ? "Since you placed this order as a guest, we will send status updates to your email."
    : `View your full order details at: ${orderLink}`;

  const text = `Order Status Update

Dear ${safeCustomerName},

Your order status has been updated to: ${safeStatus.toUpperCase()}

Order Details:
Order Number: ${safeOrderId}
Status: ${safeStatus.toUpperCase()}

${statusMessages[orderData.status] || "Thank you for your business!"}

${statusUpdateText}

If you have any questions about your order, please reply to this email or contact us at support@casetrendskenya.co.ke

Best regards,
Case Trends Kenya Customer Support Team
visit: https://casetrendskenya.co.ke
  `.trim();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; background-color: #f9f9f9; margin: 0; padding: 0; }
          .wrapper { width: 100%; background-color: #f9f9f9; }
          .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd; }
          .header { background-color: #1e293b; color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
          .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
          .content { padding: 30px 20px; }
          .content p { margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; }
          .content strong { font-weight: 600; }
          .order-info { background-color: #f5f5f5; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; font-size: 14px; }
          .order-info p { margin: 8px 0; }
          .status-line { display: flex; justify-content: space-between; margin: 12px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .status-line span:first-child { font-weight: 500; color: #666; }
          .status-line span:last-child { font-weight: 600; color: #1e293b; }
          .cta-button { display: inline-block; background-color: #0ea5e9; color: white; padding: 10px 24px; margin: 20px 0; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500; }
          .cta-button:hover { background-color: #0d8fce; }
          .divider { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
          .footer { background-color: #f5f5f5; padding: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666; }
          .footer p { margin: 4px 0; }
          .footer a { color: #0ea5e9; text-decoration: none; }
          .contact-info { font-size: 13px; color: #666; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <img src="${siteUrl}/logo.png" alt="Case Trends Kenya" width="140" style="display:block; margin: 0 auto 20px; max-width: 100%; height: auto;" />
              <h1>Order Update</h1>
              <p>Your Case Trends Kenya order status has changed</p>
            </div>
            
            <div class="content">
              <p>Hi ${safeCustomerName},</p>
              
              <p>Thank you for your order! We wanted to let you know that your order status has been updated.</p>
              
              <div class="order-info">
                <div class="status-line">
                  <span>Order Number:</span>
                  <span>${safeOrderId}</span>
                </div>
                <div class="status-line">
                  <span>Current Status:</span>
                  <span style="color: #0ea5e9; font-size: 15px;">${safeStatus.toUpperCase()}</span>
                </div>
                <div class="status-line">
                  <span>Order Total:</span>
                  <span>KES ${safeTotal}</span>
                </div>
              </div>
              
              <p>${statusMessages[orderData.status] || "Thank you for your business!"}</p>
              
<p>If you have any questions about your order, feel free to reach out to us at <strong>support@casetrendskenya.co.ke</strong> or reply directly to this email.</p>
              ${isGuestOrder ? `
              <p style="margin-top: 16px;">Since you placed this order as a guest, we will send status updates to your email.</p>
              ` : `
              <div style="text-align: center; margin: 20px 0;">
                <a href="${orderLink}" class="cta-button">View Order Details</a>
              </div>
              `}
              
              <hr class="divider">
              
              <p style="font-size: 13px; color: #999; margin-top: 16px;">
                You're receiving this email because you placed an order with Case Trends Kenya. This is an automated message, please do not reply with sensitive information.
              </p>
            </div>
            
            <div class="footer">
              <p><strong>Case Trends Kenya</strong></p>
              <p>Mobile Phone & Accessories</p>
              <div class="contact-info">
                <p>Email: <a href="mailto:support@casetrendskenya.co.ke">support@casetrendskenya.co.ke</a></p>
                <p>Website: <a href="${siteUrl}">${siteUrl}</a></p>
              </div>
              <p style="margin-top: 12px; color: #999;">© 2026 Case Trends Kenya. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return {
    to: orderData.customer_email,
    subject: `Order Status Update: ${safeStatus.toUpperCase()} - Order #${safeOrderId}`,
    text,
    html,
  };
};

app.get("/api/order/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const token = typeof req.query.token === "string" ? req.query.token : null;
  const user = await getSupabaseUser(req);

  let order = null;
  if (user) {
    const { data, error } = await supabaseAdmin.from("orders").select("*").eq("id", orderId).single();
    if (!error && data && (data.user_id === user.id || await isAdminUser(user.id))) {
      order = normalizeOrderData(data);
    }
  } else if (token) {
    order = await fetchOrderWithGuestToken(orderId, token);
  }

  if (!order) {
    return res.status(401).json({ error: "Unauthorized to view this order" });
  }

  res.json({ order });
});

app.post("/api/orders", async (req, res) => {
  try {
    const orderPayload = req.body;
    if (!orderPayload || !orderPayload.customer_name || !orderPayload.customer_phone || !orderPayload.items) {
      return res.status(400).json({ error: "Missing required order fields" });
    }

    const { data, error } = await supabaseAdmin.from("orders").insert(orderPayload).select("*").single();
    if (error) {
      return res.status(400).json({ error: error.message, details: error });
    }

    res.json({ order: normalizeOrderData(data) });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Send Email Endpoint
app.post("/api/send-email", async (req, res) => {
  try {
    const { to, type, data } = req.body;

    if (!type || !data) {
      return res.status(400).json({ error: "Missing required fields: type, data" });
    }

    const user = await getSupabaseUser(req);
    let emailTemplate;
    let orderData = data;

    if (type === "order_confirmation") {
      if (data.order_id && typeof data.guest_access_token === "string") {
        orderData = await fetchOrderWithGuestToken(data.order_id, data.guest_access_token);
        if (!orderData) {
          return res.status(401).json({ error: "Invalid guest order token" });
        }
      } else if (user) {
        const { data: order, error } = await supabaseAdmin.from("orders").select("*").eq("id", data.order_id).single();
        if (error || !order) {
          return res.status(404).json({ error: "Order not found" });
        }
        if (order.user_id !== user.id && !(await isAdminUser(user.id))) {
          return res.status(403).json({ error: "Forbidden" });
        }
        orderData = normalizeOrderData(order);
      } else {
        return res.status(401).json({ error: "Authentication required for order confirmation emails" });
      }

      emailTemplate = generateOrderConfirmationEmail(orderData);
    } else if (type === "status_update") {
      if (!user || !(await isAdminUser(user.id))) {
        return res.status(403).json({ error: "Admin authorization required" });
      }
      emailTemplate = generateStatusUpdateEmail(normalizeOrderData(orderData));
    } else if (type === "order_notification") {
      // Order notifications are sent by the checkout flow and do not require admin auth.
      const orderNotificationRecipient = to || ADMIN_NOTIFICATION_EMAIL;
      emailTemplate = generateOrderNotificationEmail(normalizeOrderData(orderData), orderNotificationRecipient);
    } else {
      return res.status(400).json({ error: "Invalid email type" });
    }

    console.log(`Sending ${type} email to ${emailTemplate.to}...`);

    const info = await postmarkClient.sendEmail({
      From: EMAIL_FROM,
      To: emailTemplate.to,
      ReplyTo: EMAIL_REPLY_TO,
      Subject: emailTemplate.subject,
      TextBody: emailTemplate.text,
      HtmlBody: emailTemplate.html,
      Headers: [
        { Name: "X-Mailer", Value: "CaseTrendsKenya/1.0" },
        { Name: "X-Priority", Value: "3" },
        { Name: "Importance", Value: "normal" },
        { Name: "List-Unsubscribe", Value: `<mailto:${EMAIL_USER}?subject=Unsubscribe>, <https://casetrendskenya.co.ke/unsubscribe>` },
      ],
    });

    console.log("Email sent successfully:", info.MessageID);

    res.json({ success: true, messageId: info.MessageID });
  } catch (error) {
    console.error("Email send error:", error);
    res.status(500).json({ error: error.message || "Failed to send email" });
  }
});

function generateOrderNotificationEmail(orderData, adminEmail) {
  const safeCustomerName = escapeHtml(orderData.customer_name);
  const safeCustomerEmail = escapeHtml(orderData.customer_email || "");
  const safeOrderId = escapeHtml(orderData.id);
  const safeDeliveryAddress = escapeHtml(orderData.delivery_address || "");
  const deliveryMapUrl = orderData.delivery_method === "delivery" && orderData.delivery_address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(orderData.delivery_address)}`
    : null;
  const itemsHtml = (orderData.items || [])
    .map((item) => `
      <div style="display:flex; justify-content:space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
        <span style="color:#374151;">${escapeHtml(item.name)}${item.color ? ` (${escapeHtml(item.color)})` : ""} × ${escapeHtml(item.quantity)}</span>
        <span style="color:#1f2937; font-weight:600;">KSh ${(item.price * item.quantity).toLocaleString()}</span>
      </div>
    `)
    .join("");

  const orderDate = new Date(orderData.created_at).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; background: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0ea5e9; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: white; padding: 20px; border-radius: 0 0 8px 8px; }
          .section { margin-bottom: 20px; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Order Notification</h1>
          </div>
          <div class="content">
            <div class="section">
              <p><strong>Order ID:</strong> ${safeOrderId}</p>
              <p><strong>Customer:</strong> ${safeCustomerName}</p>
              <p><strong>Phone:</strong> ${escapeHtml(orderData.customer_phone)}</p>
              <p><strong>Email:</strong> ${safeCustomerEmail || "N/A"}</p>
              <p><strong>Delivery:</strong> ${orderData.delivery_method === "delivery" ? "Delivery" : "Pickup"}</p>
              ${orderData.delivery_method === "delivery" && safeDeliveryAddress ? `<p><strong>Address:</strong> ${safeDeliveryAddress}</p>` : ""}
              ${deliveryMapUrl ? `<p><strong>Map:</strong> <a href="${deliveryMapUrl}" target="_blank" rel="noopener noreferrer">View delivery location</a></p>` : ""}
            </div>
            <div class="section">
              <h2 style="margin-bottom: 10px;">Items</h2>
              ${itemsHtml}
              <p style="margin-top: 15px; font-weight: 700;">Total: KSh ${Number(orderData.total_amount).toLocaleString()}</p>
            </div>
            <div class="section">
              <p><strong>Status:</strong> ${escapeHtml(orderData.status)}</p>
              <p>Please review this order in the admin panel and take the next steps.</p>
            </div>
          </div>
          <div class="footer">Case Trends Kenya Admin Notification</div>
        </div>
      </body>
    </html>
  `;

  const mapLinkText = deliveryMapUrl ? `\nDelivery map: ${deliveryMapUrl}` : "";

  return {
    to: adminEmail,
    subject: `New Order Received - ${safeOrderId.slice(0, 8)}`,
    text: `New order received: ${safeCustomerName} - KSh ${Number(orderData.total_amount).toLocaleString()}${mapLinkText}`,
    html,
  };
}

// Background Removal Endpoint
app.post("/api/remove-bg", async (req, res) => {
  try {
    const user = await getSupabaseUser(req);
    if (!user || !(await isAdminUser(user.id))) {
      return res.status(403).json({ error: "Admin authorization required" });
    }

    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const imageFile = Array.isArray(req.files.image) ? req.files.image[0] : req.files.image;
    const apiKey = process.env.REMOVE_BG_API_KEY;

    if (!apiKey) {
      console.error("REMOVE_BG_API_KEY is not configured");
      return res.status(500).json({ error: "Background removal key not configured" });
    }

    const formData = new FormData();
    formData.append("image_file", new Blob([imageFile.data], { type: imageFile.mimetype }), imageFile.name);
    formData.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("remove.bg error:", response.status, err);
      return res.status(500).json({ error: "Background removal failed" });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    res.json({ image: base64 });
  } catch (error) {
    console.error("Background removal error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Email server is running" });
});

// SPA fallback - serve index.html only for client app routes, not missing asset paths
// This allows React Router to handle client-side routing without returning HTML for missing assets
app.use((req, res) => {
  const extension = path.extname(req.path);
  const isAssetRequest = extension !== "";

  if (!req.path.startsWith('/api/') && !req.path.startsWith('/health') && !isAssetRequest) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    res.status(404).json({ error: "Not found" });
  } else {
    res.status(404).send('Not found');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Email server running on http://localhost:${PORT}`);
  console.log(`📧 Email configured: ${process.env.EMAIL_USER}`);
});