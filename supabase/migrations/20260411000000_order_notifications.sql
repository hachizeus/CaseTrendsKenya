-- Add persistent order notifications for admin alerts and 24-hour notification retention.
-- Notifications are created automatically when a new order is inserted.
-- Expired notifications are cleaned up during new order creation.

-- Add payment_method to orders for WhatsApp and Paystack tracking.
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'whatsapp';

-- Create a persistent notifications table for admin alerts.
CREATE TABLE IF NOT EXISTS public.order_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_method TEXT NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'whatsapp',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and moderators can view notifications"
  ON public.order_notifications
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Allow background notification inserts"
  ON public.order_notifications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins and moderators can update notification status"
  ON public.order_notifications
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE INDEX IF NOT EXISTS order_notifications_expires_at_idx
  ON public.order_notifications (expires_at);

CREATE INDEX IF NOT EXISTS order_notifications_is_read_idx
  ON public.order_notifications (is_read);

CREATE OR REPLACE FUNCTION public.order_notifications_insert_trigger()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.order_notifications WHERE expires_at < now();

  INSERT INTO public.order_notifications (
    order_id,
    customer_name,
    customer_phone,
    delivery_method,
    total_amount,
    payment_method,
    message
  ) VALUES (
    NEW.id,
    COALESCE(NEW.customer_name, 'Unknown customer'),
    COALESCE(NEW.customer_phone, ''),
    COALESCE(NEW.delivery_method, 'pickup'),
    COALESCE(NEW.total_amount, 0),
    COALESCE(NEW.payment_method, 'whatsapp'),
    CONCAT('New order from ', COALESCE(NEW.customer_name, 'customer'), ' via ', COALESCE(NEW.payment_method, 'whatsapp'), '.')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_notifications_on_new_order ON public.orders;
CREATE TRIGGER order_notifications_on_new_order
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.order_notifications_insert_trigger();

ALTER PUBLICATION supabase_realtime ADD TABLE public.order_notifications;
