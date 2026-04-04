# Order Tracking & Email System Setup Guide

## Overview
This guide walks you through setting up the complete order tracking and email notification system for Case Trends Kenya.

---

## 📋 What Has Been Implemented

### 1. **User Order Tracking** ✅
- `/account/orders` - Protected page for logged-in users to view their order history
- Order details with expandable sections showing items, delivery info, and status timeline
- Status badges with color coding

### 2. **Order Confirmation Page** ✅
- `/order/:orderId` - Displays after checkout
- Shows order details, customer info, delivery details
- Links to WhatsApp for payment
- Email sending option (manual trigger)

### 3. **Guest & Logged-in Order Support** ✅
- **Logged-in users:** Orders stored with `user_id` in database
  - Can view all their orders in `/account/orders`
  - Orders persist across sessions
  - Current status visible in dashboard
  
- **Guest users:** Orders stored with `user_id = NULL`
  - Still receive order confirmation emails
  - Still receive status update emails
  - Can view order via confirmation page (URL with order ID)

### 4. **Email Templates** ✅
- Order confirmation email (professional HTML template)
- Status update email (professional HTML template)
- Responsive design for all email clients
- Clear call-to-action and order details

### 5. **Database Updates** ✅
- SQL migration adds email tracking columns:
  - `confirmation_email_sent` (boolean)
  - `confirmation_email_sent_at` (timestamp)
  - `status_update_email_sent` (boolean)
  - `status_update_email_sent_at` (timestamp)
  - `last_email_sent_status` (text)
- Indexes created for efficient querying

---

## 🚀 Setup Steps

### Step 1: Run Database Migration

1. Navigate to Supabase dashboard
2. Go to SQL Editor
3. Create new query
4. Copy and run this SQL:

```sql
-- Add email tracking columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS confirmation_email_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS status_update_email_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status_update_email_sent_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_email_sent_status TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_confirmation_pending 
ON orders(id) WHERE confirmation_email_sent = false;

CREATE INDEX IF NOT EXISTS idx_orders_status_update_pending 
ON orders(id) WHERE status_update_email_sent = false;
```

### Step 2: Choose Email Service

Pick one of the following:

#### **Option A: Resend (Recommended - Easy)**
- Best for startups and small businesses
- Free tier: 100 emails/day
- Simple API, great documentation

1. Go to https://resend.com
2. Sign up for free account
3. Get your API key from dashboard
4. Create domain (if want custom email address)

#### **Option B: SendGrid**
- Larger scale, free tier: 100 emails/day
- More features but steeper learning curve

1. Go to https://sendgrid.com
2. Sign up for free account
3. Get API key from Settings → API Keys
4. Verify sender email

#### **Option C: Development Only (No External Service)**
- For testing without sending real emails
- Just logs emails to console

---

### Step 3: Set Up Email Service

#### **Using Supabase Edge Functions (Recommended)**

1. **Install Supabase CLI:**
```bash
npm install -g supabase
```

2. **Initialize Supabase in your project:**
```bash
supabase login
supabase init
```

3. **Create edge function:**
```bash
supabase functions new send-email
```

4. **Copy the function code** from `supabase/functions/send-email/index.ts` into the new function file

5. **Set environment variables:**

For **Resend**:
```bash
supabase secrets set RESEND_API_KEY="re_your_api_key_here"
supabase secrets set FROM_EMAIL="noreply@casetrendskеnya.com"
```

For **SendGrid**:
```bash
supabase secrets set SENDGRID_API_KEY="SG.your_key_here"
supabase secrets set FROM_EMAIL="noreply@casetrendskеnya.com"
```

6. **Deploy function:**
```bash
supabase functions deploy send-email
```

7. **Get your function URL** from Supabase dashboard:
   - Go to Functions → send-email → Details
   - Copy the invoke URL (looks like: `https://your-project.supabase.co/functions/v1/send-email`)

8. **Update OrderConfirmationPage.tsx:**
   - Replace `/api/send-email` with your function URL:
```typescript
// Line ~95 in OrderConfirmationPage.tsx
const response = await fetch(
  "https://your-project.supabase.co/functions/v1/send-email",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: order.customer_email,
      type: "order_confirmation",
      data: order,
    }),
  }
);
```

---

#### **Using Backend API (Alternative)**

1. **Install email package:**
```bash
npm install resend
# OR
npm install @sendgrid/mail
```

2. **Create API route** in your backend (Express/NodeJS):
   - Use code from `src/api/emailRoutes.example.ts`
   - Update endpoint path as needed

3. **Set environment variables:**
```
RESEND_API_KEY=your_key_here
# OR
SENDGRID_API_KEY=your_key_here
FROM_EMAIL=noreply@casetrendskеnya.com
```

4. **Mount route** in your Express app:
```typescript
import emailRoutes from "./api/emailRoutes";
app.use(emailRoutes);
```

5. **Update OrderConfirmationPage.tsx:**
```typescript
const response = await fetch("http://localhost:3001/api/send-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    to: order.customer_email,
    type: "order_confirmation",
    data: order,
  }),
});
```

---

### Step 4: Verify Email Sending

1. **Go to checkout page** and place a test order
2. **On confirmation page**, click "Send Email Now" button
3. **Check inbox** for order confirmation email
4. **Admin updates order status** (AdminOrders page)
5. **Verify** status update email is sent

---

## 📧 Email Automation (Admin Status Change)

When admin changes order status in `/admin/orders`, it should automatically trigger an email. Here's how to set it up:

### Option A: Supabase Real-time Trigger

Create a database trigger that sends email on status change:

```sql
CREATE OR REPLACE FUNCTION send_status_update_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Only send if status actually changed
  IF OLD.status != NEW.status THEN
    -- Call your edge function via HTTP
    SELECT
      http_post(
        'https://your-project.supabase.co/functions/v1/send-email',
        jsonb_build_object(
          'to', NEW.customer_email,
          'type', 'status_update',
          'data', row_to_json(NEW)
        ),
        'application/json'
      );
    
    -- Update tracking columns
    NEW.status_update_email_sent = true;
    NEW.status_update_email_sent_at = NOW();
    NEW.last_email_sent_status = NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_order_status_email
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION send_status_update_email();
```

**Note:** Requires `pgsql` extension. Enable in Supabase:
- Go to Database → Extensions → Search "http"
- Enable the extension

### Option B: Manual Admin Action

In AdminOrders component, add email sending when status changes:

```typescript
const handleStatusChange = async (orderId: string, newStatus: string) => {
  // Update order status
  await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId);

  // Get order details
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  // Send status update email
  if (order?.customer_email) {
    await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: order.customer_email,
        type: "status_update",
        data: order,
      }),
    });
  }
};
```

---

## 🧪 Testing

### Test Order Confirmation Email
1. Go to checkout page
2. Fill in a test email you have access to
3. Complete order
4. On confirmation page, click "Send Email Now"
5. Check inbox for email

### Test Status Updates
1. Go to admin orders
2. Change an order status
3. Check if email triggers (depends on your setup)
4. Verify in email inbox

### Troubleshooting
- **Email not sending:** Check API key is set correctly
- **404 on email endpoint:** Verify function URL is correct
- **CORS error:** Make sure email service allows your domain

---

## 📱 Guest Order Recovery

Guests see their order on the confirmation page. To let them access it later, you could add:

```typescript
// Create a guest order lookup page at /order-lookup
// Query: SELECT * FROM orders WHERE customer_phone = ? AND id = ?
```

---

## 🔐 Security Considerations

1. **API Keys:** Never commit API keys - use environment variables
2. **Email rates:** Resend/SendGrid have rate limits - implement queue if bulk sending
3. **RLS Policies:** Orders table has RLS - users can only see their own (or admins see all)
4. **Email verification:** Consider email verification before sending

---

## 📊 Monitoring

Track email sending in database:
```sql
-- See pending emails
SELECT * FROM orders 
WHERE confirmation_email_sent = false 
ORDER BY created_at DESC;

-- See email history
SELECT id, customer_email, status, 
       confirmation_email_sent_at,
       status_update_email_sent_at
FROM orders
ORDER BY created_at DESC
LIMIT 20;
```

---

## ✅ Checklist

- [ ] Database migration run successfully
- [ ] Email service account created (Resend/SendGrid)
- [ ] API keys configured as environment variables
- [ ] Edge function deployed (or backend API set up)
- [ ] Function URL verified working
- [ ] Test order placed and confirmation email received
- [ ] Admin status change tested
- [ ] Status update email verified
- [ ] Email templates reviewed (check for branding)
- [ ] Guest emails working

---

## 📞 Support

For issues:
1. Check email service dashboard for delivery failures
2. Review browser console for fetch errors
3. Check backend logs for email sending errors
4. Verify API keys are correctly set
5. Test with a simple curl command first

```bash
curl -X POST https://your-function-url \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "type": "order_confirmation",
    "data": {"id": "test-order"}
  }'
```

---

**Last Updated:** April 4, 2026
