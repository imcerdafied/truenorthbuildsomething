-- Organization creation is handled explicitly in app logic / backend function.
-- Remove the trigger-based side effects to avoid failures when inserts are performed with elevated privileges.
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
DROP FUNCTION IF EXISTS public.setup_organization_for_user();