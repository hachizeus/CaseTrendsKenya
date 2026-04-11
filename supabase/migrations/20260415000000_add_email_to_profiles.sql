-- Add email to profiles so admins can display user emails in the admin panel.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Populate existing profiles from auth.users.email where possible.
UPDATE public.profiles
SET email = u.email
FROM auth.users AS u
WHERE u.id = public.profiles.user_id
  AND public.profiles.email IS NULL;
