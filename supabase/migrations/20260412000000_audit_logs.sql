-- Add audit logging for user activity and payment events.
-- Audit logs are visible to admins and moderators, and write-guarded so only privileged actions are captured.

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and moderators can view audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins and moderators can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE OR REPLACE FUNCTION public.audit_logs_orders_trigger()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_logs (
      actor_id,
      actor_email,
      user_id,
      action_type,
      entity,
      entity_id,
      details
    ) VALUES (
      auth.uid(),
      (SELECT email FROM auth.users WHERE id = auth.uid()),
      NEW.user_id,
      'order_created',
      'orders',
      NEW.id::text,
      jsonb_build_object(
        'customer_name', NEW.customer_name,
        'payment_method', COALESCE(NEW.payment_method, 'whatsapp'),
        'total_amount', COALESCE(NEW.total_amount, 0),
        'status', NEW.status
      )
    );
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF NEW.status <> OLD.status THEN
      INSERT INTO public.audit_logs (
        actor_id,
        actor_email,
        user_id,
        action_type,
        entity,
        entity_id,
        details
      ) VALUES (
        auth.uid(),
        (SELECT email FROM auth.users WHERE id = auth.uid()),
        NEW.user_id,
        'order_status_updated',
        'orders',
        NEW.id::text,
        jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
      );
    END IF;

    IF NEW.payment_method <> OLD.payment_method THEN
      INSERT INTO public.audit_logs (
        actor_id,
        actor_email,
        user_id,
        action_type,
        entity,
        entity_id,
        details
      ) VALUES (
        auth.uid(),
        (SELECT email FROM auth.users WHERE id = auth.uid()),
        NEW.user_id,
        'order_payment_method_changed',
        'orders',
        NEW.id::text,
        jsonb_build_object('old_payment_method', OLD.payment_method, 'new_payment_method', NEW.payment_method)
      );
    END IF;

    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_logs_orders_trigger ON public.orders;
CREATE TRIGGER audit_logs_orders_trigger
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.audit_logs_orders_trigger();

ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
