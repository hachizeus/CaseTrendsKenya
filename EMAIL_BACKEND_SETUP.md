# Email Backend Setup - Node.js + Nodemailer

## Overview
We've set up a local Node.js Express backend to handle email sending via Gmail SMTP. This replaces the Supabase Edge Function approach and provides more reliable transactional email delivery.

## Files Created/Modified

### 1. **server.js** (NEW)
- Express server running on `http://localhost:3000`
- Nodemailer transporter configured for Gmail SMTP
- Two email templates: `order_confirmation` and `status_update`
- POST endpoint: `/api/send-email`

### 2. **.env.local** (ALREADY CREATED)
```env
VITE_API_URL=http://localhost:3000
EMAIL_USER=info@casetrendskenya.co.ke
EMAIL_FROM=info@casetrendskenya.co.ke
EMAIL_PASS=<your-email-app-password>
```

### 3. **package.json** (UPDATED)
Added npm scripts:
- `npm run server` - Start email backend server
- `npm run dev:all` - Run frontend + backend simultaneously

### 4. **src/pages/CheckoutPage.tsx** (UPDATED)
- Replaced Supabase function invocation with local API fetch
- Now calls `http://localhost:3000/api/send-email`
- Reads API URL from `VITE_API_URL` environment variable

## Setup Instructions

### Step 1: Install Concurrently (Optional, for running both dev servers)
```bash
npm install --save-dev concurrently
```

### Step 2: Start the Email Server
```bash
npm run server
```

You should see:
```
✅ Email server running on http://localhost:3000
📧 Email configured: info@casetrendskenya.co.ke
```

### Step 3: Start the Frontend (in a new terminal)
```bash
npm run dev
```

### OR Run Both Simultaneously
```bash
npm run dev:all
```

## Testing Email Sending

### Test the Email Endpoint Directly
```bash
curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "type": "order_confirmation",
    "data": {
      "id": 123,
      "customer_name": "John Doe",
      "customer_email": "john@example.com",
      "customer_phone": "+254712345678",
      "items": [
        {
          "name": "iPhone Case",
          "price": 2500,
          "quantity": 2
        }
      ],
      "total_amount": 5000,
      "delivery_method": "pickup",
      "status": "pending",
      "created_at": "2024-01-01T10:00:00Z"
    }
  }'
```

### Test via the Checkout Flow
1. Navigate to the checkout page
2. Fill in order details
3. Submit the form
4. Check your email for the confirmation message

## Email Endpoints

### POST `/api/send-email`
Sends a transactional email.

**Request Body:**
```json
{
  "to": "customer@example.com",
  "type": "order_confirmation" | "status_update",
  "data": {
    "id": "order-id",
    "customer_name": "Customer Name",
    "customer_email": "customer@example.com",
    "customer_phone": "+254...",
    "items": [
      { "name": "Item", "price": 1000, "quantity": 1 }
    ],
    "total_amount": 1000,
    "delivery_method": "pickup" | "delivery",
    "delivery_address": "optional address",
    "status": "pending" | "confirmed" | "shipped" | "delivered",
    "created_at": "ISO timestamp"
  }
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "message-id-from-sender"
}
```

### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "Email server is running"
}
```

## Email Templates

### 1. Order Confirmation
- Triggered when a customer completes checkout
- Includes order details, items list, and totals
- Professional HTML formatting with Case Trends branding
- Sent to `customer_email`

### 2. Status Update
- Triggered when order status changes
- Shows new status with badge styling
- Minimal template for quick updates

## Troubleshooting

### "Email send error: connect ECONNREFUSED"
- Email server is not running
- Start it with `npm run server`

### "Invalid login: 535-5.7.8 Username and password not accepted"
- Gmail app password is incorrect
- Verify `EMAIL_PASS` in `.env.local`
- Ensure "Less secure app access" is enabled in Gmail settings (or use app password)

### "The gmail.com domain is not verified"
- This was the original issue with Resend
- We've solved it by using direct SMTP relay with Gmail app passwords
- No domain verification needed

### Emails not sending but no errors in console
- Check Gmail account security settings
- Ensure 2-factor authentication is enabled (required for app passwords)
- Verify app password is set under Gmail account settings

### CORS errors from frontend
- Frontend should be on `localhost:8080` (Vite default)
- Backend should be on `localhost:3000`
- CORS is enabled on backend for all origins

## Environment Variables

| Variable | Description | Current Value |
|----------|-------------|----------------|
| `EMAIL_USER` | Business email account | `info@casetrendskenya.co.ke` |
| `EMAIL_PASS` | Email app password | `<your-email-app-password>` |
| `VITE_API_URL` | Backend API URL for frontend | `http://localhost:3000` |
| `PORT` | Backend server port | `3000` |

⚠️ **IMPORTANT:** Never commit `.env.local` to git. Add it to `.gitignore` if not already there.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Vite + React)              │
│                  localhost:8080                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │         CheckoutPage.tsx                         │  │
│  │    Calls: fetch('/api/send-email')               │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────│───────────────────────────────┘
                         │ HTTP POST
                         ▼
┌─────────────────────────────────────────────────────────┐
│        Backend (Express + Nodemailer)                  │
│            localhost:3000                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  POST /api/send-email                            │  │
│  │  • Receives order/status data                    │  │
│  │  • Generates HTML email template                │  │
│  │  • Uses Nodemailer + Gmail SMTP                 │  │
│  │  • Sends email directly to recipient            │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────│───────────────────────────────┘
                         │ SMTP
                         ▼
                    Gmail SMTP Server
                         │
                         ▼
                  Customer Email Inbox
```

## Next Steps

1. **Install concurrently** (if running both servers together):
   ```bash
   npm install --save-dev concurrently
   ```

2. **Start the backend server**:
   ```bash
   npm run server
   ```

3. **Start the frontend** (in another terminal):
   ```bash
   npm run dev
   ```

4. **Test the checkout flow** by placing an order

5. **Check your email** for the order confirmation

## Production Deployment

For production:
1. Deploy Express backend to a service like Heroku, Railway, or AWS Lambda
2. Update `VITE_API_URL` in your build environment
3. Use environment secrets for `EMAIL_USER` and `EMAIL_PASS`
4. Ensure backend server has restart policy configured
5. Monitor email delivery logs and error rates

## Support

If emails aren't sending:
- Check backend console for errors
- Verify `.env.local` has correct credentials
- Check Gmail account for suspicious login warnings
- Review CORS settings if frontend requests are blocked
