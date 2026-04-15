-- Add model and compatibility_type columns to products table for phone accessory drilldown
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS compatibility_type TEXT DEFAULT 'brand';

COMMENT ON COLUMN public.products.model IS 'Specific model name, e.g. iPhone 12 Pro Max, used to filter products by exact device compatibility.';
COMMENT ON COLUMN public.products.compatibility_type IS 'Compatibility strategy for a product: universal, brand-specific, or model-specific.';

CREATE INDEX IF NOT EXISTS idx_products_model ON public.products(model);
CREATE INDEX IF NOT EXISTS idx_products_compatibility_type ON public.products(compatibility_type);
