export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

interface OrderData {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_method: string;
  delivery_address: string | null;
  items: Array<{ name: string; price: number; quantity: number }>;
  total_amount: number;
  status: string;
  created_at: string;
}

const baseStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    margin: 0;
    padding: 0;
    background-color: #f9fafb;
  }
  .container {
    max-width: 600px;
    margin: 20px auto;
    background-color: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  .header {
    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
    color: white;
    padding: 30px 20px;
    text-align: center;
  }
  .header h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
  }
  .content {
    padding: 30px 20px;
  }
  .section {
    margin-bottom: 25px;
  }
  .section h2 {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 15px 0;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 10px;
  }
  .item {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #f3f4f6;
  }
  .item:last-child {
    border-bottom: none;
  }
  .item-name {
    color: #374151;
    flex: 1;
  }
  .item-price {
    color: #1f2937;
    font-weight: 600;
    text-align: right;
  }
  .info-row {
    display: flex;
    padding: 8px 0;
    font-size: 14px;
  }
  .info-label {
    color: #6b7280;
    min-width: 120px;
    font-weight: 500;
  }
  .info-value {
    color: #1f2937;
    flex: 1;
  }
  .status-badge {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    text-transform: capitalize;
  }
  .status-pending {
    background-color: #fef3c7;
    color: #92400e;
  }
  .status-confirmed {
    background-color: #bfdbfe;
    color: #1e40af;
  }
  .status-processing {
    background-color: #d8b4fe;
    color: #6b21a8;
  }
  .status-delivered {
    background-color: #bbf7d0;
    color: #166534;
  }
  .total {
    display: flex;
    justify-content: space-between;
    padding: 15px 0;
    border-top: 2px solid #e5e7eb;
    border-bottom: 2px solid #e5e7eb;
    margin: 20px 0;
    font-size: 18px;
    font-weight: 700;
  }
  .total-amount {
    color: #0284c7;
  }
  .cta-button {
    display: inline-block;
    background-color: #0ea5e9;
    color: white;
    padding: 12px 30px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 600;
    text-align: center;
    margin-top: 10px;
  }
  .footer {
    background-color: #f9fafb;
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: #6b7280;
    border-top: 1px solid #e5e7eb;
  }
`;

export function generateOrderConfirmationEmail(order: OrderData): EmailTemplate {
  const itemsHtml = order.items
    .map(
      (item) =>
        `
      <div class="item">
        <span class="item-name">${item.name} × ${item.quantity}</span>
        <span class="item-price">KSh ${(item.price * item.quantity).toLocaleString()}</span>
      </div>
    `
    )
    .join("");

  const orderDate = new Date(order.created_at).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    to: order.customer_email,
    subject: `Order Confirmation - ${order.id.slice(0, 8)} | Case Trends Kenya`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Order Confirmed!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for shopping with Case Trends Kenya</p>
          </div>
          
          <div class="content">
            <p>Hi ${order.customer_name},</p>
            <p>Your order has been received and is pending payment confirmation. Please proceed to WhatsApp to complete payment.</p>

            <!-- Order ID -->
            <div class="section">
              <h2>Order ID</h2>
              <div style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; font-family: monospace; color: #0284c7; word-break: break-all;">
                ${order.id}
              </div>
              <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">Save this ID for your records</p>
            </div>

            <!-- Order Items -->
            <div class="section">
              <h2>Order Items (${order.items.length})</h2>
              ${itemsHtml}
              <div class="total">
                <span>Total Amount</span>
                <span class="total-amount">KSh ${order.total_amount.toLocaleString()}</span>
              </div>
            </div>

            <!-- Delivery Information -->
            <div class="section">
              <h2>Delivery Information</h2>
              <div class="info-row">
                <span class="info-label">Method:</span>
                <span class="info-value">${
                  order.delivery_method === "delivery" ? "Delivery" : "Pickup"
                }</span>
              </div>
              ${
                order.delivery_method === "delivery"
                  ? `
              <div class="info-row">
                <span class="info-label">Address:</span>
                <span class="info-value">${order.delivery_address}</span>
              </div>
              `
                  : ""
              }
              <div class="info-row">
                <span class="info-label">Phone:</span>
                <span class="info-value">${order.customer_phone}</span>
              </div>
            </div>

            <!-- Status -->
            <div class="section">
              <h2>Order Status</h2>
              <p>
                <span class="status-badge status-${order.status}">${order.status}</span>
              </p>
            </div>

            <!-- Next Steps -->
            <div class="section" style="background-color: #eff6ff; padding: 15px; border-radius: 6px; border-left: 4px solid #0284c7;">
              <h2 style="border: none; color: #1e40af; padding: 0; margin: 0 0 10px 0;">Next Steps</h2>
              <ol style="margin: 0; padding-left: 20px; color: #1e40af;">
                <li>Open WhatsApp and send your order ID: <strong>${order.id.slice(0, 8)}</strong></li>
                <li>Complete the payment process</li>
                <li>We'll confirm and process your order</li>
              </ol>
            </div>

            <p style="margin-top: 25px; color: #6b7280;">
              If you have any questions, please don't hesitate to contact us on WhatsApp.
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">Case Trends Kenya | Your trusted electronics retailer</p>
            <p style="margin: 5px 0 0 0;">© 2026 All rights reserved</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

export function generateOrderNotificationEmail(order: OrderData, adminEmail: string): EmailTemplate {
  const itemsHtml = order.items
    .map(
      (item) =>
        `
        <div class="item">
          <span class="item-name">${item.name} × ${item.quantity}</span>
          <span class="item-price">KSh ${(item.price * item.quantity).toLocaleString()}</span>
        </div>
      `
    )
    .join("");

  const orderDate = new Date(order.created_at).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    to: adminEmail,
    subject: `New Order Received - ${order.id.slice(0, 8)} | Case Trends Kenya`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Order Received</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Order #${order.id.slice(0, 8)} placed on ${orderDate}</p>
          </div>

          <div class="content">
            <p><strong>Customer:</strong> ${order.customer_name}</p>
            <p><strong>Phone:</strong> ${order.customer_phone}</p>
            <p><strong>Email:</strong> ${order.customer_email || "N/A"}</p>
            <p><strong>Delivery:</strong> ${order.delivery_method === "delivery" ? "Delivery" : "Pickup"}</p>
            ${order.delivery_method === "delivery" && order.delivery_address ? `
              <p><strong>Delivery Address:</strong> ${order.delivery_address}</p>
            ` : ""}

            <div class="section">
              <h2>Order Items</h2>
              ${itemsHtml}
              <div class="total">
                <span>Total Amount</span>
                <span class="total-amount">KSh ${order.total_amount.toLocaleString()}</span>
              </div>
            </div>

            <div class="section">
              <h2>Order Status</h2>
              <p><span class="status-badge status-${order.status}">${order.status}</span></p>
            </div>

            <p style="margin-top: 25px; color: #6b7280;">View the order in the admin panel to process it.</p>
          </div>

          <div class="footer">
            <p>Case Trends Kenya | Admin Notification</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

export function generateStatusUpdateEmail(order: OrderData): EmailTemplate {
  const statusMessages: Record<string, string> = {
    pending: "Your order is awaiting payment confirmation through WhatsApp.",
    confirmed: "Your payment has been confirmed! We're preparing your order.",
    processing: "Your order is being processed and will be ready soon.",
    delivered: "Your order has been delivered! Thank you for shopping with us.",
    cancelled: "Your order has been cancelled. Please contact us for details.",
  };

  return {
    to: order.customer_email,
    subject: `Order Status Update - ${order.id.slice(0, 8)} | Case Trends Kenya`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Status Update</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Order #${order.id.slice(0, 8)}</p>
          </div>
          
          <div class="content">
            <p>Hi ${order.customer_name},</p>
            <p>${statusMessages[order.status] || "Your order status has been updated."}</p>

            <!-- Current Status -->
            <div class="section" style="text-align: center; padding: 20px; background-color: #f3f4f6; border-radius: 6px;">
              <h2 style="border: none; margin: 0 0 10px 0;">Current Status</h2>
              <p style="margin: 0;">
                <span class="status-badge status-${order.status}" style="font-size: 16px; padding: 8px 16px;">
                  ${order.status}
                </span>
              </p>
            </div>

            <!-- Order Summary -->
            <div class="section">
              <h2>Order Summary</h2>
              <div class="info-row">
                <span class="info-label">Order ID:</span>
                <span class="info-value">${order.id.slice(0, 8)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total Amount:</span>
                <span class="info-value"><strong>KSh ${order.total_amount.toLocaleString()}</strong></span>
              </div>
              <div class="info-row">
                <span class="info-label">Delivery:</span>
                <span class="info-value">${
                  order.delivery_method === "delivery" ? "Delivery" : "Pickup"
                }</span>
              </div>
              ${
                order.delivery_method === "delivery" && order.delivery_address
                  ? `
              <div class="info-row">
                <span class="info-label">Address:</span>
                <span class="info-value">${order.delivery_address}</span>
              </div>
              `
                  : ""
              }
            </div>

            <!-- Items -->
            <div class="section">
              <h2>Items Ordered</h2>
              ${order.items
                .map(
                  (item) =>
                    `<div class="info-row">
                <span class="info-label">${item.name}</span>
                <span class="info-value">× ${item.quantity}</span>
              </div>`
                )
                .join("")}
            </div>

            <p style="margin-top: 25px; color: #6b7280;">
              Need help? Contact us on WhatsApp for immediate assistance.
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">Case Trends Kenya | Your trusted electronics retailer</p>
            <p style="margin: 5px 0 0 0;">© 2026 All rights reserved</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}
