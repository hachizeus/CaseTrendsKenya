-- Add stock_quantity column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- Add a comment to document the column
COMMENT ON COLUMN public.products.stock_quantity IS 'Actual quantity of stock available for this product. Works with stock_status to show x items left.';

-- Create an index for quick queries
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON public.products(stock_quantity);
