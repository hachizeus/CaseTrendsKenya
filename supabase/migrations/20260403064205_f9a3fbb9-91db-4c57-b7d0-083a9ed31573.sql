
-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT 'Smartphone',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add color column to products
ALTER TABLE public.products ADD COLUMN color TEXT;

-- Insert some default categories
INSERT INTO public.categories (name, slug, icon, display_order) VALUES
  ('Smartphones', 'smartphones', 'Smartphone', 0),
  ('Tablets & iPads', 'tablets', 'Tablet', 1),
  ('Audio & Earbuds', 'audio', 'Headphones', 2),
  ('Gaming', 'gaming', 'Gamepad2', 3),
  ('Wearables', 'wearables', 'Watch', 4),
  ('Accessories', 'accessories', 'Cable', 5),
  ('Streaming Devices', 'streaming', 'Tv', 6);
