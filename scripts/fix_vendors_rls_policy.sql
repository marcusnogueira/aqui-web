-- Fix vendors table RLS policy to use NextAuth
-- Replace auth.uid() with public.get_current_user_id()

BEGIN;

-- Drop the old policy that uses auth.uid()
DROP POLICY IF EXISTS "Vendors: owner can manage" ON public.vendors;

-- Create new policy that uses get_current_user_id()
CREATE POLICY "Vendors can manage their own profile" ON public.vendors
    FOR ALL USING (public.get_current_user_id() = user_id)
    WITH CHECK (public.get_current_user_id() = user_id);

COMMIT;