-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- Organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  setup_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- User roles table (stores role assignments)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Product Areas table
CREATE TABLE public.product_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on product_areas
ALTER TABLE public.product_areas ENABLE ROW LEVEL SECURITY;

-- Domains table
CREATE TABLE public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_area_id UUID NOT NULL REFERENCES public.product_areas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on domains
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

-- Teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pm_name TEXT,
  cadence TEXT DEFAULT 'biweekly',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user has a specific role (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Helper function: Get user's organization ID
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- Helper function: Check if user is admin of their organization
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- RLS Policies for organizations
CREATE POLICY "Users can view their own organization"
  ON public.organizations
  FOR SELECT
  USING (id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can update their organization"
  ON public.organizations
  FOR UPDATE
  USING (id = public.get_user_organization_id(auth.uid()) AND public.is_org_admin(auth.uid()));

-- RLS Policies for user_roles
CREATE POLICY "Users can view roles in their organization"
  ON public.user_roles
  FOR SELECT
  USING (
    public.get_user_organization_id(user_id) = public.get_user_organization_id(auth.uid())
  );

CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  USING (public.is_org_admin(auth.uid()));

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their organization"
  ON public.profiles
  FOR SELECT
  USING (
    organization_id = public.get_user_organization_id(auth.uid())
    OR id = auth.uid()
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- RLS Policies for product_areas
CREATE POLICY "Users can view product areas in their organization"
  ON public.product_areas
  FOR SELECT
  USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can insert product areas"
  ON public.product_areas
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_user_organization_id(auth.uid())
    AND public.is_org_admin(auth.uid())
  );

CREATE POLICY "Admins can update product areas"
  ON public.product_areas
  FOR UPDATE
  USING (
    organization_id = public.get_user_organization_id(auth.uid())
    AND public.is_org_admin(auth.uid())
  );

CREATE POLICY "Admins can delete product areas"
  ON public.product_areas
  FOR DELETE
  USING (
    organization_id = public.get_user_organization_id(auth.uid())
    AND public.is_org_admin(auth.uid())
  );

-- RLS Policies for domains
CREATE POLICY "Users can view domains in their organization"
  ON public.domains
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.product_areas pa
      WHERE pa.id = domains.product_area_id
      AND pa.organization_id = public.get_user_organization_id(auth.uid())
    )
  );

CREATE POLICY "Admins can insert domains"
  ON public.domains
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.product_areas pa
      WHERE pa.id = domains.product_area_id
      AND pa.organization_id = public.get_user_organization_id(auth.uid())
    )
    AND public.is_org_admin(auth.uid())
  );

CREATE POLICY "Admins can update domains"
  ON public.domains
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.product_areas pa
      WHERE pa.id = domains.product_area_id
      AND pa.organization_id = public.get_user_organization_id(auth.uid())
    )
    AND public.is_org_admin(auth.uid())
  );

CREATE POLICY "Admins can delete domains"
  ON public.domains
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.product_areas pa
      WHERE pa.id = domains.product_area_id
      AND pa.organization_id = public.get_user_organization_id(auth.uid())
    )
    AND public.is_org_admin(auth.uid())
  );

-- RLS Policies for teams
CREATE POLICY "Users can view teams in their organization"
  ON public.teams
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.domains d
      JOIN public.product_areas pa ON pa.id = d.product_area_id
      WHERE d.id = teams.domain_id
      AND pa.organization_id = public.get_user_organization_id(auth.uid())
    )
  );

CREATE POLICY "Admins can insert teams"
  ON public.teams
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.domains d
      JOIN public.product_areas pa ON pa.id = d.product_area_id
      WHERE d.id = teams.domain_id
      AND pa.organization_id = public.get_user_organization_id(auth.uid())
    )
    AND public.is_org_admin(auth.uid())
  );

CREATE POLICY "Admins can update teams"
  ON public.teams
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.domains d
      JOIN public.product_areas pa ON pa.id = d.product_area_id
      WHERE d.id = teams.domain_id
      AND pa.organization_id = public.get_user_organization_id(auth.uid())
    )
    AND public.is_org_admin(auth.uid())
  );

CREATE POLICY "Admins can delete teams"
  ON public.teams
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.domains d
      JOIN public.product_areas pa ON pa.id = d.product_area_id
      WHERE d.id = teams.domain_id
      AND pa.organization_id = public.get_user_organization_id(auth.uid())
    )
    AND public.is_org_admin(auth.uid())
  );

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_areas_updated_at
  BEFORE UPDATE ON public.product_areas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_domains_updated_at
  BEFORE UPDATE ON public.domains
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();