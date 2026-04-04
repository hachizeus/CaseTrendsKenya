-- Create hero_sections table
CREATE TABLE IF NOT EXISTS public.hero_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_number INTEGER NOT NULL UNIQUE CHECK (section_number BETWEEN 1 AND 3),
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add section_id to hero_slides
ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS section_id UUID;

-- Add FK constraint if not already present
ALTER TABLE public.hero_slides
  ADD CONSTRAINT IF NOT EXISTS fk_hero_slides_section
  FOREIGN KEY (section_id) REFERENCES public.hero_sections(id) ON DELETE CASCADE;

-- Insert the 3 hero sections
INSERT INTO public.hero_sections (section_number, label) VALUES
  (1, 'Main Hero'),
  (2, 'After Trending Products'),
  (3, 'Between Category 1 & 2')
ON CONFLICT (section_number) DO NOTHING;

-- Enable RLS
ALTER TABLE public.hero_sections ENABLE ROW LEVEL SECURITY;

-- Public can view all hero sections
CREATE POLICY IF NOT EXISTS "Anyone can view hero sections" ON public.hero_sections FOR SELECT USING (true);

-- Only admins can INSERT hero sections
CREATE POLICY IF NOT EXISTS "Admins can insert hero sections" ON public.hero_sections FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can UPDATE hero sections
CREATE POLICY IF NOT EXISTS "Admins can update hero sections" ON public.hero_sections FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can DELETE hero sections
CREATE POLICY IF NOT EXISTS "Admins can delete hero sections" ON public.hero_sections FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
