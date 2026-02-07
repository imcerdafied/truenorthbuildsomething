-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;

-- Create a more restrictive policy: only users without an organization can create one
CREATE POLICY "Users without org can create organization"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (
  -- Only allow if user doesn't already belong to an organization
  (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) IS NULL
);