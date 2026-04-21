-- Allow admins to delete any review
CREATE POLICY "Admins can delete reviews" ON public.reviews
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete user profiles and roles
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Note: Deleting from auth.users requires service role, so we'll handle user deletion in the application
-- by deleting from profiles and user_roles, and marking the user as inactive if needed
