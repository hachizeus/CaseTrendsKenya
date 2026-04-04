import nodemailer from "nodemailer";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: ".env.local" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(cors());

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

// Serve static files with compression
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1y',
  etag: false,
}));

// Gmail transporter configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Order Confirmation Email Template
const generateOrderConfirmationEmail = (orderData) => {
  const siteUrl = process.env.SITE_URL || "https://casetrendskenya.com";
  const trackingLink = `${siteUrl}/account/orders`;
  
  const itemsHtml = orderData.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 14px;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-size: 14px;">KES ${Number(item.price).toLocaleString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; font-size: 14px;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600; font-size: 14px;">KES ${Number(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `
    )
    .join("");

  const deliveryInfo =
    orderData.delivery_method === "pickup"
      ? `Pickup at Case Trends Kenya Store`
      : `${orderData.delivery_address || "Delivery address will be confirmed with you shortly"}`;

  const text = `Order Confirmation

Dear ${orderData.customer_name},

Thank you for your order! We're excited to process it for you.

Order Details:
Order Number: ${orderData.id}
Order Date: ${new Date(orderData.created_at).toLocaleDateString()}

Items Ordered:
${orderData.items.map((item) => `- ${item.name} x${item.quantity} = KES ${Number(item.price * item.quantity).toLocaleString()}`).join("\n")}

Order Summary:
Total Amount: KES ${Number(orderData.total_amount).toLocaleString()}
Delivery Method: ${orderData.delivery_method === "pickup" ? "Pickup" : "Delivery"}
Delivery Address: ${deliveryInfo}

Order Status: PENDING

We will contact you shortly to confirm your order details and provide you with shipping information. You can track your order at: ${trackingLink}

If you have any questions or need to make changes, please reply to this email or contact us at support@casetrendskenya.com

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
              <h1>Order Confirmed!</h1>
              <p>Thank you for your purchase</p>
            </div>
            
            <div class="content">
              <p>Dear ${orderData.customer_name},</p>
              
              <p>We've received your order and we're thrilled to process it for you. Here's a summary of your purchase:</p>
              
              <div class="order-info">
                <div class="status-line">
                  <span>Order Number:</span>
                  <span>${orderData.id}</span>
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
              
              <p>We'll contact you shortly to confirm your order details. You can track your order status anytime by visiting your account.</p>
              
              <div style="text-align: center;">
                <a href="${trackingLink}" class="cta-button">Track Your Order</a>
              </div>
              
              <hr class="divider">
              
              <p style="font-size: 13px; color: #666;">If you have any questions about your order or need assistance, please don't hesitate to reach out to our support team at <strong>support@casetrendskenya.com</strong> or reply to this email.</p>
            </div>
            
            <div class="footer">
              <p><strong>Case Trends Kenya</strong></p>
              <p>Your Trusted Mobile Phone & Accessories Provider</p>
              <div class="contact-info">
                <p>Email: <a href="mailto:support@casetrendskenya.com">support@casetrendskenya.com</a></p>
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
    subject: `Order Confirmation ${orderData.id} - Case Trends Kenya`,
    text,
    html,
  };
};
  `.trim();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; color: #333; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { background-color: #0ea5e9; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h2 { margin: 0; }
          .content { padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          table td { padding: 10px; border-bottom: 1px solid #eee; }
          table th { padding: 10px; text-align: left; background-color: #f0f0f0; font-weight: bold; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; color: #0ea5e9; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
          .status-badge { display: inline-block; padding: 8px 12px; background-color: #eef3ff; color: #0ea5e9; border-radius: 4px; font-weight: bold; }
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
            
            <p><strong>Order #${orderData.id}</strong></p>
            <p><strong>Date:</strong> ${new Date(orderData.created_at).toLocaleDateString()}</p>
            
            <h3>Items:</h3>
            <table>
              <tr style="background-color: #f0f0f0;">
                <th>Item</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Total</th>
              </tr>
              ${itemsHtml}
            </table>
            
            <div class="total">
              Total: KES ${orderData.total_amount.toLocaleString()}
            </div>
            
            <h3>Delivery Information</h3>
            ${deliveryInfo}
            
            <p><strong>Order Status:</strong> <span class="status-badge">${orderData.status.toUpperCase()}</span></p>
            
            <p>We will contact you shortly with updates on your order. If you have any questions, please feel free to reach out to us.</p>
            
            <div class="footer">
              <p>Case Trends Kenya | Support Team</p>
              <p style="margin-top: 10px; color: #999;">This is an automated email from Case Trends Kenya.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return {
    to: orderData.customer_email,
    subject: `Order Confirmation #${orderData.id}`,
    text,
    html,
  };
};

// Status Update Email Template
const generateStatusUpdateEmail = (orderData) => {
  const siteUrl = process.env.SITE_URL || "https://casetrendskenya.com";
  const orderLink = `${siteUrl}/account/orders`;
  
  const statusMessages = {
    confirmed: "Your order has been confirmed and will be processed soon.",
    processing: "Your order is being prepared and will ship shortly.",
    delivered: "Your order has been delivered! Thank you for your purchase.",
    pending: "Your order is pending and awaiting confirmation.",
    cancelled: "Your order has been cancelled. Please contact support if you have questions."
  };

  const text = `Order Status Update

Dear ${orderData.customer_name},

Your order status has been updated to: ${orderData.status.toUpperCase()}

Order Details:
Order Number: ${orderData.id}
Status: ${orderData.status.toUpperCase()}

${statusMessages[orderData.status as keyof typeof statusMessages] || "Thank you for your business!"}

View your full order details at: ${orderLink}

If you have any questions about your order, please reply to this email or contact us at support@casetrendskenya.com

Best regards,
Case Trends Kenya Customer Support Team
visit: https://casetrendskenya.com
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
              <h1>Order Update</h1>
              <p>Your Case Trends Kenya order status has changed</p>
            </div>
            
            <div class="content">
              <p>Hi ${orderData.customer_name},</p>
              
              <p>Thank you for your order! We wanted to let you know that your order status has been updated.</p>
              
              <div class="order-info">
                <div class="status-line">
                  <span>Order Number:</span>
                  <span>${orderData.id}</span>
                </div>
                <div class="status-line">
                  <span>Current Status:</span>
                  <span style="color: #0ea5e9; font-size: 15px;">${orderData.status.toUpperCase()}</span>
                </div>
                <div class="status-line">
                  <span>Order Total:</span>
                  <span>KES ${Number(orderData.total_amount).toLocaleString()}</span>
                </div>
              </div>
              
              <p>${statusMessages[orderData.status as keyof typeof statusMessages] || "Thank you for your business!"}</p>
              
              <p>If you have any questions about your order, feel free to reach out to us at <strong>support@casetrendskenya.com</strong> or reply directly to this email.</p>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="${orderLink}" class="cta-button">View Order Details</a>
              </div>
              
              <hr class="divider">
              
              <p style="font-size: 13px; color: #999; margin-top: 16px;">
                You're receiving this email because you placed an order with Case Trends Kenya. This is an automated message, please do not reply with sensitive information.
              </p>
            </div>
            
            <div class="footer">
              <p><strong>Case Trends Kenya</strong></p>
              <p>Mobile Phone & Accessories</p>
              <div class="contact-info">
                <p>Email: <a href="mailto:support@casetrendskenya.com">support@casetrendskenya.com</a></p>
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
    subject: `Order Status Update: ${orderData.status.toUpperCase()} - Order #${orderData.id}`,
    text,
    html,
  };
};

// Send Email Endpoint
app.post("/api/send-email", async (req, res) => {
  try {
    const { to, type, data } = req.body;

    if (!to || !type || !data) {
      return res.status(400).json({ error: "Missing required fields: to, type, data" });
    }

    let emailTemplate;

    if (type === "order_confirmation") {
      emailTemplate = generateOrderConfirmationEmail(data);
    } else if (type === "status_update") {
      emailTemplate = generateStatusUpdateEmail(data);
    } else {
      return res.status(400).json({ error: "Invalid email type" });
    }

    console.log(`Sending ${type} email to ${to}...`);

    const info = await transporter.sendMail({
      from: `Case Trends Kenya <${process.env.EMAIL_USER}>`,
      to: emailTemplate.to,
      replyTo: process.env.EMAIL_USER,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
      headers: {
        "X-Mailer": "CaseTrendsKenya/1.0",
        "X-Priority": "3",
        "Importance": "normal",
        "List-Unsubscribe": `<mailto:support@casetrendskenya.com?subject=Unsubscribe>, <https://casetrendskenya.com/unsubscribe>`,
      },
    });

    console.log("Email sent successfully:", info.messageId);

    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("Email send error:", error);
    res.status(500).json({ error: error.message || "Failed to send email" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Email server is running" });
});

// SPA fallback - serve index.html for all non-API routes
// This allows React Router to handle client-side routing
app.use((req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api/') && !req.path.startsWith('/health')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Email server running on http://localhost:${PORT}`);
  console.log(`📧 Email configured: ${process.env.EMAIL_USER}`);
});
