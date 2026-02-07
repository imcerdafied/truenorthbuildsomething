-- Drop and recreate the policy with correct role targeting
DROP POLICY IF EXISTS "Users without org can create organization" ON public.organizations;

-- Create policy that applies to all authenticated requests (public role with auth check)
CREATE POLICY "Authenticated users without org can create organization"
ON public.organizations
FOR INSERT
TO public
WITH CHECK (
  -- Must be authenticated
  auth.uid() IS NOT NULL
  AND
  -- Only allow if user doesn't already belong to an organization
  (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) IS NULL
);