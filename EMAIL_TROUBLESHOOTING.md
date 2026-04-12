# 📧 Email Troubleshooting Guide

## What Was Fixed ✅

### 1. Status Update Emails (Admin Requirement)
When admins update order status in the Admin Panel, the system now:
- ✅ Automatically sends a status update email to the customer
- ✅ Provides a "Resend Status Email" button in the order detail panel
- ✅ Shows success/error feedback to the admin

### 2. Resend Confirmation Email (User Requirement)
On the Order Confirmation page, customers now see:
- ✅ "Resend Confirmation Email" button (if email address is on file)
- ✅ Ability to resend if initial email didn't arrive

---

## Why Emails Still Might Not Be Sending

### Issue #1: Email Service Not Configured
**Symptoms:** "Email service not configured" error message

**Fix:** You need to set up an email service. Choose ONE of these:

#### Option A: Resend (Recommended ⭐)
```bash
supabase secrets set RESEND_API_KEY="re_your_key_here"
supabase secrets set FROM_EMAIL="info@casetrendskenya.co.ke"
supabase functions deploy send-email
```
1. Get API key from https://resend.com → Settings → API Keys
2. Copy key (starts with `re_`)
3. Run commands above
4. Deploy function

#### Option B: SendGrid
```bash
supabase secrets set SENDGRID_API_KEY="SG.your_key_here"
supabase secrets set FROM_EMAIL="info@casetrendskenya.co.ke"
supabase functions deploy send-email
```
1. Get API key from https://sendgrid.com → Settings → API Keys
2. Verify sender email in Settings → Sender Authentication
3. Run commands above
4. Deploy function

#### Option C: Test Only (No Real Emails)
```bash
supabase functions deploy send-email
```
Emails will log to console, not send (good for development)

### Issue #2: Send-Email Function Not Deployed
**Symptoms:** "Function not found" error

**Fix:** Deploy the function
```bash
supabase functions deploy send-email
```

### Issue #3: Invalid Email Address
**Symptoms:** Email sent but customer never receives it

**Check:** 
- Customer entered valid email during checkout
- Check customer's spam/junk folder
- Verify with email service (Resend/SendGrid dashboard)

### Issue #4: Incorrect Email Domain
The FROM_EMAIL has a special Cyrillic character (е) that might cause issues.

**Recommended:** Use standard ASCII domain
```bash
supabase secrets set FROM_EMAIL="info@casetrendskenya.co.ke"
```

---

## How to Test Emails

### Test 1: Manual Admin Status Update
1. Go to Admin Panel → Orders
2. Click on an order
3. Change status (e.g., pending → confirmed)
4. You should see "Status update email sent to customer@email.com"
5. Check customer's email inbox

### Test 2: Resend Confirmation Email
1. Go to any completed order (or make a test order)
2. Click "Resend Confirmation Email" button
3. You should see "Confirmation email sent!"
4. Check inbox

### Test 3: Check Secrets Are Set
```bash
supabase secrets list
```
Look for:
- `RESEND_API_KEY` or `SENDGRID_API_KEY` (one of these should be present)
- `FROM_EMAIL`

### Test 4: Check Console Logs
1. Open browser DevTools (F12)
2. Check Console tab for any error messages
3. Look for "Email error:" messages that indicate the problem

---

## Debugging Flow

If emails aren't being sent:

1. **Check if secrets are set**
   ```bash
   supabase secrets list
   ```
   Should show `RESEND_API_KEY` or `SENDGRID_API_KEY`

2. **Check browser console (F12)**
   - Look for error messages
   - Screenshot for debugging

3. **Test sending manually**
   - Admin Panel → Click an order
   - Click "Resend Status Email"
   - Watch console for errors

4. **Check email service dashboard**
   - Resend: https://resend.com/emails
   - SendGrid: https://sendgrid.com/activity
   - Look for failed deliveries

5. **Re-deploy if needed**
   ```bash
   supabase functions deploy send-email
   ```

---

## What Information to Provide When Asking for Help

If emails still don't work, share:
1. Screenshot of error message in browser
2. Output of `supabase secrets list`
3. Browser console error (F12 → Console tab)
4. Email service dashboard showing errors
5. Whether you're using Resend or SendGrid
