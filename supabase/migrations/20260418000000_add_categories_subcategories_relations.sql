-- Create subcategories table for relational product categorization
CREATE TABLE IF NOT EXISTS public.subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subcategories' AND policyname = 'Anyone can view subcategories') THEN
    CREATE POLICY "Anyone can view subcategories" ON public.subcategories FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subcategories' AND policyname = 'Admins can insert subcategories') THEN
    CREATE POLICY "Admins can insert subcategories" ON public.subcategories FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subcategories' AND policyname = 'Admins can update subcategories') THEN
    CREATE POLICY "Admins can update subcategories" ON public.subcategories FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subcategories' AND policyname = 'Admins can delete subcategories') THEN
    CREATE POLICY "Admins can delete subcategories" ON public.subcategories FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subcategories_updated_at') THEN
    CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON public.subcategories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory_id UUID;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_category_id_fkey'
  ) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_subcategory_id_fkey'
  ) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON public.products(subcategory_id);

-- Seed or update main categories
INSERT INTO public.categories (name, slug, icon, display_order, is_active)
VALUES
  ('Protectors', 'protectors', 'Shield', 0, true),
  ('Android Phones (Protectors)', 'android-phones', 'Smartphone', 1, true),
  ('iPhone Model (Protectors)', 'iphone-model', 'Smartphone', 2, true),
  ('Audio', 'audio', 'Headphones', 3, true),
  ('Smart Watch', 'smart-watch', 'Watch', 4, true),
  ('Charging Devices', 'charging-devices', 'Cable', 5, true),
  ('Power Banks', 'power-banks', 'Battery', 6, true),
  ('Camera Lens Protectors', 'camera-lens-protectors', 'Camera', 7, true),
  ('Accessories', 'accessories', 'Laptop', 8, true),
  ('Phone Holders', 'phone-holders', 'Phone', 9, true),
  ('Gaming', 'gaming', 'Gamepad2', 10, true),
  ('MagSafe Cases', 'magsafe-cases', 'Smartphone', 11, true),
  ('Stickers', 'stickers', 'Tag', 12, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- Seed subcategories under each main category
WITH protectors AS (SELECT id FROM public.categories WHERE slug = 'protectors'),
android_phones AS (SELECT id FROM public.categories WHERE slug = 'android-phones'),
iphone_model AS (SELECT id FROM public.categories WHERE slug = 'iphone-model'),
audio AS (SELECT id FROM public.categories WHERE slug = 'audio'),
smart_watch AS (SELECT id FROM public.categories WHERE slug = 'smart-watch'),
charging_devices AS (SELECT id FROM public.categories WHERE slug = 'charging-devices'),
power_banks AS (SELECT id FROM public.categories WHERE slug = 'power-banks'),
camera_lens AS (SELECT id FROM public.categories WHERE slug = 'camera-lens-protectors'),
accessories AS (SELECT id FROM public.categories WHERE slug = 'accessories'),
phone_holders AS (SELECT id FROM public.categories WHERE slug = 'phone-holders'),
gaming AS (SELECT id FROM public.categories WHERE slug = 'gaming'),
magsafe_cases AS (SELECT id FROM public.categories WHERE slug = 'magsafe-cases'),
stickers AS (SELECT id FROM public.categories WHERE slug = 'stickers')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT protectors.id, 'Curved Screens', 'curved-screens', 0, true FROM protectors
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH protectors AS (SELECT id FROM public.categories WHERE slug = 'protectors')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT protectors.id, 'Full Glue 900', 'full-glue-900', 1, true FROM protectors
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH protectors AS (SELECT id FROM public.categories WHERE slug = 'protectors')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT protectors.id, 'UV 1000', 'uv-1000', 2, true FROM protectors
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH protectors AS (SELECT id FROM public.categories WHERE slug = 'protectors')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT protectors.id, 'Ceramic Privacy', 'protectors-ceramic-privacy', 3, true FROM protectors
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH protectors AS (SELECT id FROM public.categories WHERE slug = 'protectors')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT protectors.id, 'Glass Privacy', 'protectors-glass-privacy', 4, true FROM protectors
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH android_phones AS (SELECT id FROM public.categories WHERE slug = 'android-phones')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT android_phones.id, 'Normal / OG Glass', 'android-normal-og-glass', 0, true FROM android_phones
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH android_phones AS (SELECT id FROM public.categories WHERE slug = 'android-phones')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT android_phones.id, 'Ceramic Matte', 'android-ceramic-matte', 1, true FROM android_phones
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH android_phones AS (SELECT id FROM public.categories WHERE slug = 'android-phones')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT android_phones.id, 'Ceramic Privacy', 'android-ceramic-privacy', 2, true FROM android_phones
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH android_phones AS (SELECT id FROM public.categories WHERE slug = 'android-phones')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT android_phones.id, 'Glass Privacy', 'android-glass-privacy', 3, true FROM android_phones
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH iphone_model AS (SELECT id FROM public.categories WHERE slug = 'iphone-model')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT iphone_model.id, 'Normal / OG Glass', 'iphone-normal-og-glass', 0, true FROM iphone_model
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH iphone_model AS (SELECT id FROM public.categories WHERE slug = 'iphone-model')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT iphone_model.id, 'Glass Privacy', 'iphone-glass-privacy', 1, true FROM iphone_model
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH iphone_model AS (SELECT id FROM public.categories WHERE slug = 'iphone-model')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT iphone_model.id, 'Ceramic Privacy', 'iphone-ceramic-privacy', 2, true FROM iphone_model
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH audio AS (SELECT id FROM public.categories WHERE slug = 'audio')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT audio.id, 'Headphones', 'headphones', 0, true FROM audio
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH audio AS (SELECT id FROM public.categories WHERE slug = 'audio')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT audio.id, 'Earphones', 'earphones', 1, true FROM audio
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH audio AS (SELECT id FROM public.categories WHERE slug = 'audio')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT audio.id, 'AirPods Pro', 'airpods-pro', 2, true FROM audio
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH audio AS (SELECT id FROM public.categories WHERE slug = 'audio')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT audio.id, 'Neck Band', 'neck-band', 3, true FROM audio
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH audio AS (SELECT id FROM public.categories WHERE slug = 'audio')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT audio.id, 'Space Buds', 'space-buds', 4, true FROM audio
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH audio AS (SELECT id FROM public.categories WHERE slug = 'audio')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT audio.id, 'AirPods Cases', 'airpods-cases', 5, true FROM audio
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH smart_watch AS (SELECT id FROM public.categories WHERE slug = 'smart-watch')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT smart_watch.id, 'Kids Smart Watch', 'kids-smart-watch', 0, true FROM smart_watch
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH smart_watch AS (SELECT id FROM public.categories WHERE slug = 'smart-watch')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT smart_watch.id, 'Apple Watch', 'apple-watch', 1, true FROM smart_watch
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH smart_watch AS (SELECT id FROM public.categories WHERE slug = 'smart-watch')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT smart_watch.id, 'Galaxy Watch', 'galaxy-watch', 2, true FROM smart_watch
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH smart_watch AS (SELECT id FROM public.categories WHERE slug = 'smart-watch')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT smart_watch.id, 'Oraimo Watch', 'oraimo-watch', 3, true FROM smart_watch
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH charging_devices AS (SELECT id FROM public.categories WHERE slug = 'charging-devices')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT charging_devices.id, 'Apple Adapters', 'apple-adapters', 0, true FROM charging_devices
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH charging_devices AS (SELECT id FROM public.categories WHERE slug = 'charging-devices')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT charging_devices.id, 'Samsung Adapters', 'samsung-adapters', 1, true FROM charging_devices
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH charging_devices AS (SELECT id FROM public.categories WHERE slug = 'charging-devices')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT charging_devices.id, 'Complete Chargers (25W / 45W / 65W)', 'complete-chargers', 2, true FROM charging_devices
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH charging_devices AS (SELECT id FROM public.categories WHERE slug = 'charging-devices')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT charging_devices.id, 'USB Cables', 'usb-cables', 3, true FROM charging_devices
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH charging_devices AS (SELECT id FROM public.categories WHERE slug = 'charging-devices')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT charging_devices.id, 'Type-C Cables', 'type-c-cables', 4, true FROM charging_devices
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH charging_devices AS (SELECT id FROM public.categories WHERE slug = 'charging-devices')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT charging_devices.id, 'Lightning Cables', 'lightning-cables', 5, true FROM charging_devices
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH charging_devices AS (SELECT id FROM public.categories WHERE slug = 'charging-devices')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT charging_devices.id, 'C to C Cables', 'c-to-c-cables', 6, true FROM charging_devices
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH charging_devices AS (SELECT id FROM public.categories WHERE slug = 'charging-devices')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT charging_devices.id, 'USB to Micro', 'usb-to-micro', 7, true FROM charging_devices
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH charging_devices AS (SELECT id FROM public.categories WHERE slug = 'charging-devices')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT charging_devices.id, 'USB to C', 'usb-to-c', 8, true FROM charging_devices
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH charging_devices AS (SELECT id FROM public.categories WHERE slug = 'charging-devices')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT charging_devices.id, 'AUX Cables', 'aux-cables', 9, true FROM charging_devices
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH charging_devices AS (SELECT id FROM public.categories WHERE slug = 'charging-devices')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT charging_devices.id, 'Car Charger', 'car-charger', 10, true FROM charging_devices
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH power_banks AS (SELECT id FROM public.categories WHERE slug = 'power-banks')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT power_banks.id, 'Wired Power Banks', 'wired-power-banks', 0, true FROM power_banks
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH power_banks AS (SELECT id FROM public.categories WHERE slug = 'power-banks')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT power_banks.id, 'Battery Pack', 'battery-pack', 1, true FROM power_banks
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH power_banks AS (SELECT id FROM public.categories WHERE slug = 'power-banks')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT power_banks.id, 'Wireless Power Bank', 'wireless-power-bank', 2, true FROM power_banks
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH power_banks AS (SELECT id FROM public.categories WHERE slug = 'power-banks')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT power_banks.id, 'Fast Charging Power Bank', 'fast-charging-power-bank', 3, true FROM power_banks
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH camera_lens AS (SELECT id FROM public.categories WHERE slug = 'camera-lens-protectors')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT camera_lens.id, 'Glitter Lens Protectors', 'glitter-lens-protectors', 0, true FROM camera_lens
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH camera_lens AS (SELECT id FROM public.categories WHERE slug = 'camera-lens-protectors')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT camera_lens.id, 'Normal Lens Protectors', 'normal-lens-protectors', 1, true FROM camera_lens
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH camera_lens AS (SELECT id FROM public.categories WHERE slug = 'camera-lens-protectors')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT camera_lens.id, 'Octagon Lens Protectors', 'octagon-lens-protectors', 2, true FROM camera_lens
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH accessories AS (SELECT id FROM public.categories WHERE slug = 'accessories')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT accessories.id, 'Phone Charms', 'phone-charms', 0, true FROM accessories
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH accessories AS (SELECT id FROM public.categories WHERE slug = 'accessories')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT accessories.id, 'Gents Phone Charms', 'gents-phone-charms', 1, true FROM accessories
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH accessories AS (SELECT id FROM public.categories WHERE slug = 'accessories')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT accessories.id, 'Phone Lanyards', 'phone-lanyards', 2, true FROM accessories
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH accessories AS (SELECT id FROM public.categories WHERE slug = 'accessories')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT accessories.id, 'Crossbody Phone Lanyards', 'crossbody-phone-lanyards', 3, true FROM accessories
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH accessories AS (SELECT id FROM public.categories WHERE slug = 'accessories')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT accessories.id, 'Waterproof Bags', 'waterproof-bags', 4, true FROM accessories
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH accessories AS (SELECT id FROM public.categories WHERE slug = 'accessories')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT accessories.id, 'Fluffy Charms', 'fluffy-charms', 5, true FROM accessories
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH accessories AS (SELECT id FROM public.categories WHERE slug = 'accessories')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT accessories.id, 'Marble Charms', 'marble-charms', 6, true FROM accessories
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH accessories AS (SELECT id FROM public.categories WHERE slug = 'accessories')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT accessories.id, 'Fabric Charms', 'fabric-charms', 7, true FROM accessories
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH accessories AS (SELECT id FROM public.categories WHERE slug = 'accessories')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT accessories.id, 'Charger Protectors', 'charger-protectors', 8, true FROM accessories
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH accessories AS (SELECT id FROM public.categories WHERE slug = 'accessories')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT accessories.id, 'iPhone Charger Protectors', 'iphone-charger-protectors', 9, true FROM accessories
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH accessories AS (SELECT id FROM public.categories WHERE slug = 'accessories')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT accessories.id, 'Samsung Charger Protectors', 'samsung-charger-protectors', 10, true FROM accessories
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH accessories AS (SELECT id FROM public.categories WHERE slug = 'accessories')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT accessories.id, 'S Pen', 's-pen', 11, true FROM accessories
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH phone_holders AS (SELECT id FROM public.categories WHERE slug = 'phone-holders')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT phone_holders.id, 'Car Phone Holder', 'car-phone-holder', 0, true FROM phone_holders
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH phone_holders AS (SELECT id FROM public.categories WHERE slug = 'phone-holders')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT phone_holders.id, 'Magnetic Phone Holder', 'magnetic-phone-holder', 1, true FROM phone_holders
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH phone_holders AS (SELECT id FROM public.categories WHERE slug = 'phone-holders')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT phone_holders.id, 'Gimbal', 'gimbal', 2, true FROM phone_holders
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH phone_holders AS (SELECT id FROM public.categories WHERE slug = 'phone-holders')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT phone_holders.id, 'Phone Stand', 'phone-stand', 3, true FROM phone_holders
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH gaming AS (SELECT id FROM public.categories WHERE slug = 'gaming')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT gaming.id, 'PS5', 'ps5', 0, true FROM gaming
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH gaming AS (SELECT id FROM public.categories WHERE slug = 'gaming')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT gaming.id, 'Controllers', 'controllers', 1, true FROM gaming
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH magsafe_cases AS (SELECT id FROM public.categories WHERE slug = 'magsafe-cases')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT magsafe_cases.id, 'Premium Leather Cases', 'premium-leather-cases', 0, true FROM magsafe_cases
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH magsafe_cases AS (SELECT id FROM public.categories WHERE slug = 'magsafe-cases')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT magsafe_cases.id, 'Cases with Lens Protectors', 'cases-with-lens-protectors', 1, true FROM magsafe_cases
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH magsafe_cases AS (SELECT id FROM public.categories WHERE slug = 'magsafe-cases')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT magsafe_cases.id, 'Fancy Cases', 'fancy-cases', 2, true FROM magsafe_cases
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH magsafe_cases AS (SELECT id FROM public.categories WHERE slug = 'magsafe-cases')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT magsafe_cases.id, 'Clear Cases', 'clear-cases', 3, true FROM magsafe_cases
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH magsafe_cases AS (SELECT id FROM public.categories WHERE slug = 'magsafe-cases')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT magsafe_cases.id, 'Frosted Cases', 'frosted-cases', 4, true FROM magsafe_cases
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH magsafe_cases AS (SELECT id FROM public.categories WHERE slug = 'magsafe-cases')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT magsafe_cases.id, '3D Pop Socket Cases', '3d-pop-socket-cases', 5, true FROM magsafe_cases
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH magsafe_cases AS (SELECT id FROM public.categories WHERE slug = 'magsafe-cases')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT magsafe_cases.id, '3-in-1 Cases', '3-in-1-cases', 6, true FROM magsafe_cases
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH magsafe_cases AS (SELECT id FROM public.categories WHERE slug = 'magsafe-cases')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT magsafe_cases.id, '360 Cases', '360-cases', 7, true FROM magsafe_cases
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH magsafe_cases AS (SELECT id FROM public.categories WHERE slug = 'magsafe-cases')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT magsafe_cases.id, 'Converter Cases', 'converter-cases', 8, true FROM magsafe_cases
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH stickers AS (SELECT id FROM public.categories WHERE slug = 'stickers')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT stickers.id, 'Laptop Stickers', 'laptop-stickers', 0, true FROM stickers
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH stickers AS (SELECT id FROM public.categories WHERE slug = 'stickers')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT stickers.id, 'Phone Stickers', 'phone-stickers', 1, true FROM stickers
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH stickers AS (SELECT id FROM public.categories WHERE slug = 'stickers')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT stickers.id, 'Console Stickers', 'console-stickers', 2, true FROM stickers
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

WITH stickers AS (SELECT id FROM public.categories WHERE slug = 'stickers')
INSERT INTO public.subcategories (category_id, name, slug, display_order, is_active)
SELECT stickers.id, 'Machine Cut Phone Stickers', 'machine-cut-phone-stickers', 3, true FROM stickers
ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;
