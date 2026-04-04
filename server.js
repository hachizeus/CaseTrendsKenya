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
  const itemsHtml = orderData.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">KES ${item.price.toLocaleString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">KES ${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `
    )
    .join("");

  const deliveryInfo =
    orderData.delivery_method === "pickup"
      ? `<p><strong>Pickup Location:</strong> Case Trends Kenya Store</p>`
      : `<p><strong>Delivery Address:</strong> ${orderData.delivery_address || "Will be contacted for address"}</p>`;

  const text = `
Order Confirmation

Dear ${orderData.customer_name},

Thank you for your order! Here are your order details:

Order #${orderData.id}
Date: ${new Date(orderData.created_at).toLocaleDateString()}
Name: ${orderData.customer_name}
Phone: ${orderData.customer_phone}
Email: ${orderData.customer_email}

Items:
${orderData.items.map((item) => `${item.name} x${item.quantity} = KES ${(item.price * item.quantity).toLocaleString()}`).join("\n")}

Total: KES ${orderData.total_amount.toLocaleString()}

Delivery: ${orderData.delivery_method === "pickup" ? "Pickup at our store" : "Delivery to: " + (orderData.delivery_address || "Address to be confirmed")}

Order Status: ${orderData.status}

We will contact you shortly with updates on your order. If you have any questions, please feel free to reach out to us.

Best regards,
Case Trends Kenya Team
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
  const text = `
Order Status Update

Dear ${orderData.customer_name},

Your order status has been updated!

Order #${orderData.id}
New Status: ${orderData.status.toUpperCase()}

We'll keep you updated on your order. Thank you for your business!

Best regards,
Case Trends Kenya Team
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
          .status-badge { display: inline-block; padding: 12px 20px; border-radius: 6px; font-weight: bold; font-size: 16px; }
          .status-confirmed { background-color: #dbeafe; color: #1e40af; }
          .status-processing { background-color: #e9d5ff; color: #6b21a8; }
          .status-delivered { background-color: #dcfce7; color: #15803d; }
          .status-pending { background-color: #fef3c7; color: #92400e; }
          .status-cancelled { background-color: #fee2e2; color: #991b1b; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Order Status Update</h2>
          </div>
          <div class="content">
            <p>Dear ${orderData.customer_name},</p>
            <p>Your order status has been updated!</p>
            
            <p><strong>Order #${orderData.id}</strong></p>
            
            <p style="text-align: center; margin: 20px 0;">
              <span class="status-badge status-${orderData.status.toLowerCase()}">${orderData.status.toUpperCase()}</span>
            </p>
            
            <p>We'll keep you updated on your order. Thank you for your business!</p>
            
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
    subject: `Order Status Update #${orderData.id}`,
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Email server running on http://localhost:${PORT}`);
  console.log(`📧 Email configured: ${process.env.EMAIL_USER}`);
});
