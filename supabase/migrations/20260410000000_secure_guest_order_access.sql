-- Add guest access tokens to orders and tighten guest access
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS guest_access_token TEXT UNIQUE;

-- Restrict order SELECT so only the owner or admins can use the Supabase client.
DROP POLICY IF EXISTS "Users can view own orders or admins can view all" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
