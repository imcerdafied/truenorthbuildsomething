-- Allow authenticated users to create organizations (for initial setup)
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create a function to handle organization setup (assigns admin role and links profile)
CREATE OR REPLACE FUNCTION public.setup_organization_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the user's profile to link to the new organization
  UPDATE public.profiles
  SET organization_id = NEW.id
  WHERE id = auth.uid();
  
  -- Assign admin role to the creating user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run after organization is created
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.setup_organization_for_user();