-- Add email tracking columns to orders table
-- This migration adds columns to track confirmation and status update emails

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS confirmation_email_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS status_update_email_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status_update_email_sent_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_email_sent_status TEXT DEFAULT NULL;

-- Create indexes for faster querying of un-emailed orders
CREATE INDEX IF NOT EXISTS idx_orders_confirmation_pending 
ON orders(id) WHERE confirmation_email_sent = false;

CREATE INDEX IF NOT EXISTS idx_orders_status_update_pending 
ON orders(id) WHERE status_update_email_sent = false;

-- Add comment to document the columns
COMMENT ON COLUMN orders.confirmation_email_sent IS 'Whether order confirmation email has been sent';
COMMENT ON COLUMN orders.confirmation_email_sent_at IS 'Timestamp when confirmation email was sent';
COMMENT ON COLUMN orders.status_update_email_sent IS 'Whether status update email has been sent for current status';
COMMENT ON COLUMN orders.status_update_email_sent_at IS 'Timestamp when last status update email was sent';
COMMENT ON COLUMN orders.last_email_sent_status IS 'Status value when last email was sent (to detect status changes)';
