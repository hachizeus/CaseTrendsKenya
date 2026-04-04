-- Product colors table for storing multiple colors per product
CREATE TABLE public.product_colors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create unique index to prevent duplicate colors per product
CREATE UNIQUE INDEX product_colors_unique_per_product ON product_colors(product_id, color);

-- Enable RLS
ALTER TABLE public.product_colors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view product colors" ON public.product_colors FOR SELECT USING (true);
CREATE POLICY "Admins can insert product colors" ON public.product_colors FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update product colors" ON public.product_colors FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete product colors" ON public.product_colors FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Index for faster queries
CREATE INDEX product_colors_product_id_idx ON product_colors(product_id);
