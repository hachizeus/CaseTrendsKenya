-- Order Tracking & Email System - SQL Reference Guide
-- Run these queries in Supabase SQL Editor for monitoring and debugging

-- ==================== ORDER STATUS ====================

-- See all orders with email tracking status
SELECT 
  id,
  customer_name,
  customer_email,
  status,
  total_amount,
  created_at,
  confirmation_email_sent,
  status_update_email_sent
FROM orders
ORDER BY created_at DESC
LIMIT 50;

-- See orders that haven't had confirmation email sent
SELECT 
  id,
  customer_name,
  customer_email,
  created_at,
  total_amount
FROM orders
WHERE confirmation_email_sent = false
ORDER BY created_at DESC;

-- See orders pending payment confirmation (admin action needed)
SELECT 
  id,
  customer_name,
  customer_phone,
  total_amount,
  delivery_method,
  created_at,
  status
FROM orders
WHERE status = 'pending'
ORDER BY created_at DESC;

-- See orders that need follow-up
SELECT 
  id,
  customer_name,
  customer_email,
  status,
  created_at,
  updated_at,
  status_update_email_sent
FROM orders
WHERE status IN ('pending', 'confirmed', 'processing')
AND status_update_email_sent = false
ORDER BY created_at DESC;

-- ==================== REVENUE & ANALYTICS ====================

-- Total revenue (excluding cancelled orders)
SELECT 
  SUM(total_amount) as total_revenue,
  COUNT(*) as total_orders
FROM orders
WHERE status != 'cancelled';

-- Revenue by status
SELECT 
  status,
  COUNT(*) as order_count,
  SUM(total_amount) as revenue,
  ROUND(AVG(total_amount)) as avg_order_value
FROM orders
WHERE status != 'cancelled'
GROUP BY status
ORDER BY revenue DESC;

-- Revenue by date (last 30 days)
SELECT 
  DATE(created_at) as order_date,
  COUNT(*) as orders,
  SUM(total_amount) as daily_revenue
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
AND status != 'cancelled'
GROUP BY DATE(created_at)
ORDER BY order_date DESC;

-- ==================== DELIVERY & FULFILLMENT ====================

-- Orders by delivery method
SELECT 
  delivery_method,
  COUNT(*) as count,
  SUM(total_amount) as total_revenue,
  ROUND(AVG(total_amount)) as avg_order_value
FROM orders
WHERE status != 'cancelled'
GROUP BY delivery_method;

-- Pending delivery orders
SELECT 
  id,
  customer_name,
  customer_phone,
  delivery_address,
  total_amount,
  created_at,
  status
FROM orders
WHERE delivery_method = 'delivery'
AND status IN ('confirmed', 'processing')
ORDER BY created_at ASC;

-- ==================== CUSTOMER INSIGHTS ====================

-- Top customers by number of orders
SELECT 
  customer_phone,
  customer_name,
  customer_email,
  COUNT(*) as orders,
  SUM(total_amount) as total_spent,
  MAX(created_at) as last_order
FROM orders
WHERE user_id IS NOT NULL  -- Registered users only
GROUP BY customer_phone, customer_name, customer_email
ORDER BY orders DESC
LIMIT 20;

-- Find orders from specific customer
SELECT *
FROM orders
WHERE customer_phone = '+254712345678'
OR customer_email = 'customer@example.com'
ORDER BY created_at DESC;

-- Guest vs Registered users
SELECT 
  CASE WHEN user_id IS NULL THEN 'Guest' ELSE 'Registered' END as user_type,
  COUNT(*) as orders,
  SUM(total_amount) as revenue,
  ROUND(AVG(total_amount)) as avg_order
FROM orders
WHERE status != 'cancelled'
GROUP BY user_type;

-- ==================== EMAIL TRACKING ====================

-- Email delivery status summary
SELECT 
  'Confirmation Email' as email_type,
  SUM(CASE WHEN confirmation_email_sent THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN NOT confirmation_email_sent THEN 1 ELSE 0 END) as pending
FROM orders
UNION ALL
SELECT 
  'Status Update Email' as email_type,
  SUM(CASE WHEN status_update_email_sent THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN NOT status_update_email_sent THEN 1 ELSE 0 END) as pending
FROM orders;

-- Email sending timeline
SELECT 
  DATE(confirmation_email_sent_at) as date,
  COUNT(*) as confirmation_emails_sent,
  COUNT(status_update_email_sent_at) as status_emails_sent
FROM orders
WHERE confirmation_email_sent = true
GROUP BY DATE(confirmation_email_sent_at)
ORDER BY date DESC
LIMIT 30;

-- ==================== ORDER PERFORMANCE ====================

-- Average time to complete orders
SELECT 
  status,
  COUNT(*) as orders,
  ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600)::numeric, 1) as avg_hours,
  MIN(created_at) as oldest_order,
  MAX(created_at) as newest_order
FROM orders
WHERE status IN ('delivered', 'cancelled')
GROUP BY status;

-- Orders stuck in processing (more than 2 days)
SELECT 
  id,
  customer_name,
  customer_phone,
  status,
  created_at,
  updated_at,
  EXTRACT(DAY FROM NOW() - updated_at) as days_stuck
FROM orders
WHERE status = 'processing'
AND updated_at < NOW() - INTERVAL '2 days'
ORDER BY updated_at ASC;

-- ==================== DATA MAINTENANCE ====================

-- Duplicate customer emails
SELECT 
  customer_email,
  COUNT(*) as count,
  ARRAY_AGG(id) as order_ids
FROM orders
WHERE customer_email IS NOT NULL
GROUP BY customer_email
HAVING COUNT(*) > 1
ORDER BY COUNT DESC;

-- Orders with missing data
SELECT 
  id,
  customer_name,
  customer_email,
  customer_phone,
  delivery_method,
  created_at,
  status
FROM orders
WHERE customer_email IS NULL
OR customer_phone IS NULL
OR delivery_address IS NULL
ORDER BY created_at DESC;

-- ==================== UPDATES & MAINTENANCE ====================

-- Manually mark emails as sent (if needed for cleanup)
-- UPDATE orders 
-- SET confirmation_email_sent = true, 
--     confirmation_email_sent_at = NOW()
-- WHERE id = 'order-uuid-here';

-- Reset email tracking for specific orders (to resend)
-- UPDATE orders
-- SET confirmation_email_sent = false,
--     confirmation_email_sent_at = NULL
-- WHERE id IN ('order-uuid-1', 'order-uuid-2');

-- Delete all pending emails older than 90 days
-- DELETE FROM orders
-- WHERE status = 'pending'
-- AND created_at < NOW() - INTERVAL '90 days';

-- ==================== EXPORT DATA ====================

-- Export all orders as CSV
SELECT 
  id,
  customer_name,
  customer_email,
  customer_phone,
  status,
  total_amount,
  delivery_method,
  delivery_address,
  created_at,
  updated_at
FROM orders
WHERE created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
ORDER BY created_at DESC;

-- Export this month's revenue report
SELECT 
  DATE(created_at) as date,
  COUNT(*) as orders,
  SUM(total_amount) as revenue,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
FROM orders
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ==================== HELPFUL VIEWS (Optional) ====================

-- Create view for quick dashboard
-- CREATE OR REPLACE VIEW order_dashboard AS
-- SELECT 
--   (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
--   (SELECT COUNT(*) FROM orders WHERE status = 'delivered') as delivered_orders,
--   (SELECT SUM(total_amount) FROM orders WHERE status != 'cancelled') as total_revenue,
--   (SELECT COUNT(*) FROM orders WHERE confirmation_email_sent = false) as pending_emails;

-- Query the view:
-- SELECT * FROM order_dashboard;
