# Order Tracking System - Architecture & Flow

## 🔄 Complete User Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         LOGGED-IN USER FLOW                          │
└─────────────────────────────────────────────────────────────────────┘

Shop → Add to Cart → /checkout
              ↓
        ┌─────────────────┐
        │  Fill Form      │
        │ - Name          │
        │ - Phone         │
        │ - Email         │
        │ - Delivery Info │
        └─────────────────┘
              ↓
        Submit Order
              ↓
    ┌──────────────────────┐
    │  orders table insert │
    │  user_id = logged_in │
    │  status = 'pending'  │
    └──────────────────────┘
              ↓
    ┌──────────────────────┐
    │   /order/{id}        │
    │ Confirmation Page    │
    └──────────────────────┘
              ↓
        (User Chooses)
         /      \
        /        \
    WhatsApp   Send Email
      (Pay)      (Confirm)
        \        /
         \      /
              ↓
    ┌──────────────────────┐
    │   /account/orders    │
    │   View All Orders    │
    │   - See status       │
    │   - See history      │
    └──────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                          GUEST USER FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

Shop → Add to Cart → /checkout
              ↓
        ┌─────────────────┐
        │  Fill Form      │
        │ - Name          │
        │ - Phone         │
        │ - Email ✓       │ ← KEY: Guest provides email
        │ - Delivery Info │
        └─────────────────┘
              ↓
        Submit Order
              ↓
    ┌──────────────────────┐
    │  orders table insert │
    │  user_id = NULL      │ ← Guest order
    │  status = 'pending'  │
    │  email = provided    │
    └──────────────────────┘
              ↓
    ┌──────────────────────┐
    │   /order/{id}        │
    │ Confirmation Page    │
    └──────────────────────┘
              ↓
    ┌──────────────────────┐
    │ ✉️ Confirmation Email│
    │ Sent to guest email  │
    │ (auto or manual)     │
    └──────────────────────┘
              ↓
    Receives Status Emails
    as Admin Updates Order


┌─────────────────────────────────────────────────────────────────────┐
│                        ADMIN ORDER MANAGEMENT                        │
└─────────────────────────────────────────────────────────────────────┘

/admin/orders
      ↓
┌──────────────────────┐
│  View All Orders     │
│  - Search by name    │
│  - Filter by status  │
│  - See revenue       │
└──────────────────────┘
      ↓
Select Order → View Details
      ↓
Change Status:
pending → confirmed → processing → delivered
      ↓
        (Option A)              (Option B)
    Auto-trigger Email      Manual Email Send
         ↓                         ↓
    Supabase Trigger      Admin clicks "Send"
    fires immediately     (if you choose this)
      ↓
┌──────────────────────┐
│  ✉️ Status Email Sent│
│  To: customer_email  │
│  With: New status    │
└──────────────────────┘
      ↓
  Customer receives
  status notification
```

---

## 🏗️ System Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + Vite)                   │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐      ┌──────────────────┐               │
│  │  CheckoutPage   │      │ OrderConfirm     │               │
│  │  - Form         │      │ Page             │               │
│  │  - Submit       │      │ - Show Order ID  │               │
│  │  → DB Insert    │      │ - Email button   │               │
│  └────────┬────────┘      │ - WhatsApp btn   │               │
│           │               └────────┬─────────┘               │
│           └──────────────┬─────────┘                         │
│                          ↓                                    │
│            ┌─────────────────────────┐                      │
│            │  OrdersPage             │                      │
│            │  (Protected route)      │                      │
│            │  - View order history   │                      │
│            │  - Expandable orders    │                      │
│            │  - Status tracking      │                      │
│            └─────────────────────────┘                      │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                         ↓ Supabase Client
┌───────────────────────────────────────────────────────────────┐
│                    SUPABASE (Backend)                          │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  Database (PostgreSQL):                                       │
│  ┌──────────────────────────────────────┐                    │
│  │  orders table                        │                    │
│  │  - id, user_id, customer_info       │                    │
│  │  - items (JSON), total_amount       │                    │
│  │  - status, created_at, updated_at   │                    │
│  │  - confirmation_email_sent          │                    │
│  │  - status_update_email_sent         │                    │
│  └──────────────────────────────────────┘                    │
│                                                                 │
│  Edge Functions:                                              │
│  ┌──────────────────────────────────────┐                    │
│  │  send-email function                 │                    │
│  │  - Receives: email request           │                    │
│  │  - Calls: Resend or SendGrid API     │                    │
│  │  - Returns: success/error            │                    │
│  └──────────────────────────────────────┘                    │
│                                                                 │
│  Auth (JWT):                                                  │
│  ┌──────────────────────────────────────┐                    │
│  │  user authentication & RLS           │                    │
│  │  - Users see only their orders       │                    │
│  │  - Admins see all orders             │                    │
│  └──────────────────────────────────────┘                    │
│                                                                 │
└───────────────────────────────────────────────────────────────┘
              ↓                              ↓
    ┌──────────────────────┐    ┌──────────────────────┐
    │  Email Service       │    │  Admin Panel         │
    │  (Resend/SendGrid)   │    │  (/admin/orders)     │
    │                      │    │  - View all orders   │
    │  ✓ From: setup       │    │  - Change status     │
    │  ✓ To: customer_email│    │  - Search/filter     │
    │  ✓ Subject: template │    │  - Revenue tracking  │
    │  ✓ HTML: formatted   │    │  - Send emails       │
    │                      │    │                      │
    │  ┌────────────────┐  │    └──────────────────────┘
    │  │ Confirmation   │  │
    │  │ Status Update  │  │
    │  └────────────────┘  │
    │                      │
    │  Sends to:           │
    │  • Customer mailbox  │
    │  • Spam? Junk?       │
    │                      │
    └──────────────────────┘
```

---

## 💾 Data Flow: Email Sending

```
Frontend Event (User clicks "Send Email")
            ↓
┌─────────────────────────────────────┐
│  OrderConfirmationPage              │
│  .handleSendEmail()                 │
│  - Collects order data              │
│  - Creates JSON payload             │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  fetch("/api/send-email", {         │
│    method: "POST",                  │
│    body: {                          │
│      to: email,                     │
│      type: "order_confirmation",    │
│      data: order                    │
│    }                                │
│  })                                 │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  Supabase Edge Function             │
│  /functions/send-email              │
│                                     │
│  1. Parse request payload           │
│  2. Generate email HTML via         │
│     emailTemplates.ts               │
│  3. Choose service:                 │
│     if RESEND_API_KEY               │
│      → Call Resend API              │
│     else if SENDGRID_API_KEY        │
│      → Call SendGrid API            │
└────────────┬────────────────────────┘
             ↓
        (Bifurcates)
        /          \
    Resend      SendGrid
    (or dev)    (or dev)
       /          \
      ↓            ↓
┌──────────┐  ┌──────────────┐
│  Resend  │  │  SendGrid    │
│  API     │  │  API         │
│  POSTs   │  │  POSTs       │
└────┬─────┘  └────┬─────────┘
     │             │
     └──────┬──────┘
            ↓
┌─────────────────────────────────────┐
│  Email Service                      │
│  - Validates email address          │
│  - Renders HTML template            │
│  - Queues for delivery              │
│  - Updates tracking                 │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  Response to Frontend               │
│  {success: true, data: {...}}       │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  Frontend                           │
│  - Show toast: "Email sent!"        │
│  - Update UI state                  │
│  - Mark email as sent               │
└─────────────────────────────────────┘
             ↓
   Customer receives email
   (check spam folder!)
```

---

## 📊 Status Lifecycle

```
Order Created (Pending)
    ↓
  USER DECISION
    /          \
 PAY VIA    No payment
 WhatsApp    for 24hrs
    |           |
    ↓           ↓
CONFIRMED   AUTO-CANCEL
    ↓
  PROCESSING
    (Admin updating fulfillment)
    ↓
  DELIVERED
    (Order complete)
    OR
  CANCELLED
    (Admin or timeout)


Email Triggers:
━━━━━━━━━━━━━━

Created → PENDING
    ✉️ Confirmation Email Sent
    (To customer with order ID)

PENDING → CONFIRMED
    ✉️ Status Update Email Sent
    (Payment confirmed, order processing)

CONFIRMED → PROCESSING
    ✉️ Status Update Email Sent
    (Order being prepared)

PROCESSING → DELIVERED
    ✉️ Status Update Email Sent
    (Order ready for pickup/delivery)

Any Status → CANCELLED
    ✉️ Status Update Email Sent
    (Order cancelled, explanation)
```

---

## 🔐 Security & Permissions

```
DATABASE ACCESS (RLS Policies)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

orders table:
├─ SELECT: Users see (user_id = auth.uid() OR is_admin)
│          → Users only see their orders
│          → Admins see all
│
├─ INSERT: Anyone (auth.uid() OR anonymous)
│          → Both registered and guests can create
│
└─ UPDATE: Only admins
           → Only admin can update status/notes

EMAIL API ACCESS
━━━━━━━━━━━━━━━━
- API keys stored in Supabase secrets (not in code)
- Environment variables only accessible by Edge Functions
- CORS configured to accept requests from your domain
- Rate limiting recommended for production

FRONTEND SECURITY
━━━━━━━━━━━━━━━━
- OrdersPage protected by <ProtectedRoute>
- OrderConfirmationPage validates user_id matches auth
- API calls include authentication headers
```

---

## 📉 Performance Considerations

```
Database Queries
┌────────────────────────────────────────┐
│ Indexes Created:                       │
│ • idx_orders_user_id                   │
│ • idx_orders_status                    │
│ • idx_orders_created_at                │
│ • idx_orders_confirmation_pending      │
│ • idx_orders_status_update_pending     │
└────────────────────────────────────────┘

Email Service Rates
┌────────────────────────────────────────┐
│ Resend: 100/day free, then $0.001/email
│ SendGrid: 100/day free, then $14.95/mo │
│                                        │
│ For ~50 orders/day in Kenya:           │
│ • 50 orders × 2 emails (confirm+update)
│ • ~100 emails/day                      │
│ • Fits in free tier ✓                  │
└────────────────────────────────────────┘
```

---

**Last Updated:** April 4, 2026
