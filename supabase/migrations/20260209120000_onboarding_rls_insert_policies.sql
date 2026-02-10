-- ============================================================================
-- Fix: Add INSERT policies for onboarding flow
-- Allows authenticated users to create orgs and self-assign admin role
-- ============================================================================

-- Allow authenticated users to create an organization (only if they don't have one yet)
CREATE POLICY "Authenticated users can create an organization"
  ON public.organizations
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.get_user_organization_id(auth.uid()) IS NULL
  );

-- Allow users to insert their own role (self-assign during onboarding)
CREATE POLICY "Users can insert their own role"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- Verification: SELECT policyname, cmd FROM pg_policies WHERE tablename = 'organizations';
-- Verification: SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_roles';
-- DOWN: DROP POLICY IF EXISTS "Authenticated users can create an organization" ON public.organizations;
-- DOWN: DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
