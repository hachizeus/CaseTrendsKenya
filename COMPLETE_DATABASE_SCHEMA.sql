-- =====================================================
-- Case Trends Kenya - Complete Database Schema & SQL Reference
-- Combined from all migrations and references
-- Generated on: April 18, 2026
-- =====================================================

-- =====================================================
-- TABLE RELATIONSHIPS OVERVIEW
-- =====================================================
--
-- Core Entities:
-- • auth.users (Supabase Auth) → profiles (1:1)
-- • profiles → user_roles (1:many)
--
-- Products & Categories:
-- • categories (main categories)
--   ↓ (1:many)
-- • subcategories (belongs to category)
--   ↓ (references)
-- • products (references category_id, subcategory_id)
--   ↓ (1:many)
-- • product_images (belongs to product)
-- • product_colors (belongs to product)
-- • product_specifications (belongs to product)
--
-- User Interactions:
-- • auth.users → favorites (1:many)
-- • auth.users → reviews (1:many)
-- • auth.users → carts (1:1) → cart_items (1:many)
-- • auth.users → orders (1:many)
--
-- Content Management:
-- • hero_sections → hero_slides (1:many)
--
-- Audit & Tracking:
-- • audit_logs (tracks all admin actions)
--
-- Storage:
-- • storage.objects (product-images bucket)
--
-- =====================================================
-- COMPLETE TABLE SCHEMAS
-- =====================================================

-- ==================== AUTH & USER MANAGEMENT ====================

-- User roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- User roles table (MUST come before has_role function)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ==================== PRODUCTS & CATEGORIES ====================

-- Categories table (main categories)
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

-- Subcategories table (belongs to categories)
CREATE TABLE public.subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Products table (references categories and subcategories)
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  category TEXT NOT NULL, -- Legacy field (slug-based)
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory TEXT, -- Legacy field
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  brand TEXT NOT NULL,
  model TEXT,
  compatibility_type TEXT,
  stock_status TEXT NOT NULL DEFAULT 'in_stock',
  stock_quantity INTEGER DEFAULT 0,
  color TEXT,
  sku TEXT,
  warranty TEXT,
  weight TEXT,
  tags TEXT[],
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_trending BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product images table
CREATE TABLE public.product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product colors table
CREATE TABLE public.product_colors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product specifications table
CREATE TABLE public.product_specifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  spec_key TEXT NOT NULL,
  spec_value TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== CONTENT MANAGEMENT ====================

-- Hero sections table
CREATE TABLE IF NOT EXISTS public.hero_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_number INTEGER NOT NULL UNIQUE CHECK (section_number BETWEEN 1 AND 3),
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hero slides table
CREATE TABLE public.hero_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID REFERENCES public.hero_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  cta_text TEXT,
  cta_link TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== USER INTERACTIONS ====================

-- Favorites table
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

-- Carts table
CREATE TABLE public.carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cart items table
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color TEXT NOT NULL DEFAULT '',
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id, color)
);

-- ==================== ORDERS & TRACKING ====================

-- Orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_method TEXT NOT NULL DEFAULT 'pickup',
  delivery_address TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  guest_access_token TEXT UNIQUE,
  confirmation_email_sent BOOLEAN DEFAULT false,
  confirmation_email_sent_at TIMESTAMPTZ DEFAULT NULL,
  status_update_email_sent BOOLEAN DEFAULT false,
  status_update_email_sent_at TIMESTAMPTZ DEFAULT NULL,
  last_email_sent_status TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== AUDIT & LOGGING ====================

-- Audit logs table
CREATE TABLE public.audit_logs (
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

-- =====================================================
-- WORKING SQL EXAMPLES
-- =====================================================

-- ==================== CATEGORY MANAGEMENT ====================

-- Insert a new main category
INSERT INTO public.categories (name, slug, icon, display_order, is_active)
VALUES ('New Category', 'new-category', 'IconName', 99, true);

-- Insert a subcategory under a category
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT c.id, 'New Subcategory', 'new-subcategory', 0, true
FROM public.categories c WHERE c.slug = 'new-category';

-- Get all categories with their subcategories
SELECT
  c.name as category_name,
  c.slug as category_slug,
  c.icon,
  c.display_order as category_order,
  json_agg(
    json_build_object(
      'id', s.id,
      'name', s.name,
      'slug', s.slug,
      'display_order', s.display_order,
      'is_active', s.is_active
    ) ORDER BY s.display_order
  ) as subcategories
FROM public.categories c
LEFT JOIN public.subcategories s ON c.id = s.category_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.slug, c.icon, c.display_order
ORDER BY c.display_order;

-- ==================== PRODUCT MANAGEMENT ====================

-- Insert a new product with category relationships
INSERT INTO public.products (
  name, description, price, original_price, category, category_id,
  subcategory, subcategory_id, brand, model, compatibility_type,
  stock_status, stock_quantity, color, sku, warranty, weight, tags,
  is_featured, is_trending
) VALUES (
  'iPhone 15 Pro Case',
  'Premium protective case for iPhone 15 Pro',
  2500.00,
  3000.00,
  'iphone-model',
  (SELECT id FROM categories WHERE slug = 'iphone-model'),
  'premium-leather-cases',
  (SELECT id FROM subcategories WHERE slug = 'premium-leather-cases'),
  'iPhone',
  '15 Pro',
  'model',
  'in_stock',
  50,
  'Black',
  'IPH15-BLK-001',
  '1 Year',
  '50g',
  ARRAY['premium', 'leather', 'protective'],
  true,
  false
);

-- Add product colors
INSERT INTO public.product_colors (product_id, color, display_order, status)
SELECT p.id, 'Black', 0, 'available' FROM products p WHERE p.sku = 'IPH15-BLK-001'
UNION ALL
SELECT p.id, 'White', 1, 'available' FROM products p WHERE p.sku = 'IPH15-BLK-001'
UNION ALL
SELECT p.id, 'Blue', 2, 'available' FROM products p WHERE p.sku = 'IPH15-BLK-001';

-- Add product specifications
INSERT INTO public.product_specifications (product_id, spec_key, spec_value, display_order)
SELECT p.id, 'Material', 'Premium Leather', 0 FROM products p WHERE p.sku = 'IPH15-BLK-001'
UNION ALL
SELECT p.id, 'Compatibility', 'iPhone 15 Pro', 1 FROM products p WHERE p.sku = 'IPH15-BLK-001'
UNION ALL
SELECT p.id, 'Warranty', '1 Year', 2 FROM products p WHERE p.sku = 'IPH15-BLK-001';

-- Add product images
INSERT INTO public.product_images (product_id, image_url, display_order, is_primary)
SELECT p.id, 'https://example.com/image1.webp', 0, true FROM products p WHERE p.sku = 'IPH15-BLK-001'
UNION ALL
SELECT p.id, 'https://example.com/image2.webp', 1, false FROM products p WHERE p.sku = 'IPH15-BLK-001';

-- Get complete product with all related data
SELECT
  p.*,
  json_agg(DISTINCT pi.*) as images,
  json_agg(DISTINCT pc.*) as colors,
  json_agg(DISTINCT ps.*) as specifications,
  c.name as category_name,
  c.slug as category_slug,
  s.name as subcategory_name,
  s.slug as subcategory_slug
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
LEFT JOIN product_colors pc ON p.id = pc.product_id
LEFT JOIN product_specifications ps ON p.id = ps.product_id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN subcategories s ON p.subcategory_id = s.id
WHERE p.id = 'your-product-id'
GROUP BY p.id, c.name, c.slug, s.name, s.slug;

-- ==================== ORDER MANAGEMENT ====================

-- Create a new order
INSERT INTO public.orders (
  user_id, customer_name, customer_phone, customer_email,
  delivery_method, delivery_address, items, total_amount, status
) VALUES (
  'user-uuid', -- or NULL for guest orders
  'John Doe',
  '+254712345678',
  'john@example.com',
  'delivery',
  'Nairobi, Kenya',
  '[
    {"product_id": "prod-uuid-1", "name": "iPhone Case", "price": 2500, "quantity": 1},
    {"product_id": "prod-uuid-2", "name": "Screen Protector", "price": 800, "quantity": 2}
  ]'::jsonb,
  4100.00,
  'pending'
);

-- Update order status
UPDATE public.orders
SET status = 'confirmed', updated_at = now()
WHERE id = 'order-uuid';

-- Get orders with items expanded
SELECT
  o.*,
  jsonb_array_elements(o.items) as item
FROM orders o
WHERE o.id = 'order-uuid';

-- ==================== USER MANAGEMENT ====================

-- Assign admin role to user
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-uuid', 'admin');

-- Check if user has role
SELECT public.has_role('user-uuid', 'admin');

-- Get user profile with roles
SELECT
  p.*,
  json_agg(ur.role) as roles
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
WHERE p.user_id = 'user-uuid'
GROUP BY p.id;

-- ==================== ANALYTICS & REPORTING ====================

-- Product performance report
SELECT
  p.name,
  p.brand,
  p.category,
  COUNT(f.id) as favorites_count,
  COUNT(r.id) as reviews_count,
  AVG(r.rating) as avg_rating,
  SUM(CASE WHEN o.status != 'cancelled' THEN
    (SELECT SUM((item->>'quantity')::int)
     FROM jsonb_array_elements(o.items) as item
     WHERE (item->>'product_id')::text = p.id::text)
  ELSE 0 END) as total_sold
FROM products p
LEFT JOIN favorites f ON p.id = f.product_id
LEFT JOIN reviews r ON p.id = r.product_id
LEFT JOIN orders o ON jsonb_exists(o.items, p.id::text)
GROUP BY p.id, p.name, p.brand, p.category
ORDER BY total_sold DESC;

-- Revenue by category
SELECT
  p.category,
  COUNT(DISTINCT o.id) as orders_count,
  SUM(o.total_amount) as total_revenue,
  AVG(o.total_amount) as avg_order_value
FROM orders o
CROSS JOIN LATERAL jsonb_array_elements(o.items) as item
JOIN products p ON (item->>'product_id')::uuid = p.id
WHERE o.status != 'cancelled'
GROUP BY p.category
ORDER BY total_revenue DESC;

-- Customer lifetime value
SELECT
  CASE WHEN o.user_id IS NULL THEN 'Guest' ELSE 'Registered' END as customer_type,
  COUNT(DISTINCT o.customer_phone) as unique_customers,
  COUNT(o.id) as total_orders,
  SUM(o.total_amount) as total_revenue,
  AVG(o.total_amount) as avg_order_value,
  SUM(o.total_amount) / COUNT(DISTINCT o.customer_phone) as customer_lifetime_value
FROM orders o
WHERE o.status != 'cancelled'
GROUP BY customer_type;

-- ==================== INVENTORY MANAGEMENT ====================

-- Low stock alert
SELECT
  name,
  brand,
  stock_quantity,
  stock_status,
  CASE
    WHEN stock_quantity <= 0 THEN 'Out of Stock'
    WHEN stock_quantity <= 5 THEN 'Critical'
    WHEN stock_quantity <= 10 THEN 'Low'
    ELSE 'Good'
  END as stock_level
FROM products
WHERE stock_quantity <= 10
ORDER BY stock_quantity ASC;

-- Update stock after sale
UPDATE products
SET stock_quantity = stock_quantity - 1,
    updated_at = now()
WHERE id = 'product-uuid' AND stock_quantity > 0;

-- ==================== SEARCH & FILTERING ====================

-- Full-text search across products
SELECT
  p.*,
  c.name as category_name,
  s.name as subcategory_name,
  ts_rank_cd(to_tsvector('english', p.name || ' ' || p.description || ' ' || p.brand || ' ' || p.model), plainto_tsquery('english', 'iPhone case')) as rank
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN subcategories s ON p.subcategory_id = s.id
WHERE to_tsvector('english', p.name || ' ' || p.description || ' ' || p.brand || ' ' || p.model) @@ plainto_tsquery('english', 'iPhone case')
ORDER BY rank DESC;

-- Filter products by category and price range
SELECT p.*, c.name as category_name
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.slug = 'protectors'
AND p.price BETWEEN 500 AND 5000
AND p.stock_status = 'in_stock'
ORDER BY p.price ASC;

-- Get products with specific color
SELECT p.*, pc.color
FROM products p
JOIN product_colors pc ON p.id = pc.product_id
WHERE pc.color = 'Black'
AND pc.status = 'available';

-- ==================== AUDIT & LOGGING ====================

-- Log admin action
INSERT INTO public.audit_logs (
  actor_id, actor_email, user_id, action_type, entity, entity_id, details
) VALUES (
  auth.uid(),
  (SELECT email FROM auth.users WHERE id = auth.uid()),
  'affected-user-id',
  'product_updated',
  'products',
  'product-uuid',
  jsonb_build_object('changes', 'Updated price from 2000 to 2500')
);

-- Get audit trail for product
SELECT * FROM audit_logs
WHERE entity = 'products' AND entity_id = 'product-uuid'
ORDER BY created_at DESC;

-- ==================== EMAIL TRACKING ====================

-- Orders needing confirmation emails
SELECT id, customer_name, customer_email, created_at
FROM orders
WHERE confirmation_email_sent = false
ORDER BY created_at DESC;

-- Mark email as sent
UPDATE orders
SET confirmation_email_sent = true,
    confirmation_email_sent_at = now()
WHERE id = 'order-uuid';

-- Orders needing status update emails
SELECT id, customer_name, customer_email, status, last_email_sent_status
FROM orders
WHERE status_update_email_sent = false
OR (status != last_email_sent_status AND last_email_sent_status IS NOT NULL)
ORDER BY updated_at DESC;

-- ==================== DATA MIGRATION HELPERS ====================

-- Migrate existing products to use category_id and subcategory_id
UPDATE products
SET category_id = c.id
FROM categories c
WHERE products.category = c.slug;

UPDATE products
SET subcategory_id = s.id
FROM subcategories s
WHERE products.subcategory = s.slug;

-- Find products without proper category relationships
SELECT p.name, p.category, p.subcategory
FROM products p
WHERE p.category_id IS NULL OR p.subcategory_id IS NULL;

-- ==================== PERFORMANCE OPTIMIZATION ====================

-- Add indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_brand ON products(category, brand);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_stock_status ON products(stock_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_created ON orders(status, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);

-- Full-text search index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_fts ON products
USING gin(to_tsvector('english', name || ' ' || description || ' ' || brand || ' ' || model));

-- ==================== BACKUP & RECOVERY ====================

-- Export products with all related data
COPY (
  SELECT
    p.*,
    json_agg(pi.*) as images,
    json_agg(pc.*) as colors,
    json_agg(ps.*) as specifications
  FROM products p
  LEFT JOIN product_images pi ON p.id = pi.product_id
  LEFT JOIN product_colors pc ON p.id = pc.product_id
  LEFT JOIN product_specifications ps ON p.id = ps.product_id
  GROUP BY p.id
) TO '/tmp/products_backup.json';

-- =====================================================
-- USEFUL QUERIES FOR DEVELOPMENT
-- =====================================================

-- Reset demo data
TRUNCATE products, product_images, product_colors, product_specifications CASCADE;

-- Get database size
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Find duplicate products
SELECT name, brand, model, COUNT(*)
FROM products
GROUP BY name, brand, model
HAVING COUNT(*) > 1;

-- Clean up orphaned records
DELETE FROM product_images WHERE product_id NOT IN (SELECT id FROM products);
DELETE FROM product_colors WHERE product_id NOT IN (SELECT id FROM products);
DELETE FROM product_specifications WHERE product_id NOT IN (SELECT id FROM products);