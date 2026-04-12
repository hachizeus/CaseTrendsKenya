# 🚀 Quick Email Setup (5 Minutes)

Pick one option below:

## Option 1: Resend (Recommended ⭐)

### Step 1: Create Account
1. Go to https://resend.com
2. Click "Sign up"
3. Enter email and create password
4. Verify email

### Step 2: Get API Key
1. Go to Settings → API Keys
2. Click "Create API Key"
3. Copy the key (starts with `re_`)

### Step 3: Set Supabase Secret
```bash
supabase secrets set RESEND_API_KEY="re_your_full_key_here"
supabase secrets set FROM_EMAIL="info@casetrendskenya.co.ke"
```

### Step 4: Deploy Function
```bash
supabase functions deploy send-email
```

### Done! ✅
Test by placing an order and clicking "Send Email Now"

---

## Option 2: SendGrid

### Step 1: Create Account
1. Go to https://sendgrid.com
2. Click "Sign up"
3. Verify email

### Step 2: Get API Key
1. Go to Settings → API Keys
2. Click "Create API Key"
3. Give it a name like "Case Trends Kenya"
4. Copy the full key

### Step 3: Verify Sender Email
1. Go to Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Enter `info@casetrendskenya.co.ke`
4. Verify email (check junk folder)

### Step 4: Set Supabase Secret
```bash
supabase secrets set SENDGRID_API_KEY="SG.your_full_key_here"
supabase secrets set FROM_EMAIL="info@casetrendskenya.co.ke"
```

### Step 5: Deploy Function
```bash
supabase functions deploy send-email
```

### Done! ✅
Test by placing an order and clicking "Send Email Now"

---

## Option 3: Development Only (No Email Service)

No setup needed! Just:

```bash
supabase functions deploy send-email
```

Emails will be logged to console instead of sent. Good for testing!

---

## Verify It Works

### Test Flow:
1. Go to http://localhost:5173/checkout
2. Fill in test order with your email
3. Click "Place Order"
4. On confirmation page, click "Send Email Now"
5. Check your email inbox

### Troubleshooting:

**Issue: "Email service not configured"**
- ✅ Check secrets are set: `supabase secrets list`
- ✅ Verify key is correct (no spaces)
- ✅ Redeploy function after setting secrets

**Issue: Email not arriving**
- ✅ Check spam/junk folder
- ✅ Verify email address is correct
- ✅ Check email service dashboard for errors

**Issue: 404 on send**
- ✅ Get your function URL: https://your-project.supabase.co/functions/v1/send-email
- ✅ Update OrderConfirmationPage.tsx to use correct URL

### Quick Curl Test:
```bash
# Replace URL and API key
curl -X POST https://your-project.supabase.co/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@gmail.com",
    "type": "order_confirmation",
    "data": {
      "id": "test-order-123",
      "customer_name": "Test User",
      "customer_email": "test@example.com",
      "customer_phone": "+254712345678",
      "delivery_method": "delivery",
      "delivery_address": "123 Test St",
      "items": [{"name": "Test Product", "price": 5000, "quantity": 1}],
      "total_amount": 5000,
      "status": "pending",
      "created_at": "2026-04-04T12:00:00Z"
    }
  }'
```

---

## That's It! 🎉

You now have:
- ✅ Order confirmation emails
- ✅ Status update emails  
- ✅ Guest orders with email tracking
- ✅ Logged-in user order history
- ✅ Admin order management

Enjoy! 🚀
