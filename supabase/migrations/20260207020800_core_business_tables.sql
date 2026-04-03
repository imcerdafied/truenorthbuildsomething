-- Reconstructed migration for core business tables that were created via dashboard.
-- These tables already exist in production — this migration ensures the schema
-- is reproducible from source for staging, local dev, and disaster recovery.
-- All CREATE statements use IF NOT EXISTS for idempotency.

-- ══════════════════════════════════════════════════════════════════════
-- Enums (created in earlier migrations but listing for completeness)
-- ══════════════════════════════════════════════════════════════════════
DO $$ BEGIN
  CREATE TYPE public.okr_level AS ENUM ('productArea', 'domain', 'team');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.okr_status AS ENUM ('active', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.cadence_type AS ENUM ('weekly', 'biweekly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.confidence_label AS ENUM ('High', 'Medium', 'Low');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.achievement_status AS ENUM ('achieved', 'missed', 'partially_achieved');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.quarter_label AS ENUM ('Q1', 'Q2', 'Q3', 'Q4');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ══════════════════════════════════════════════════════════════════════
-- 1. okrs
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.okrs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  level public.okr_level NOT NULL,
  owner_id uuid NOT NULL,
  quarter text NOT NULL,
  year integer NOT NULL,
  quarter_num public.quarter_label NOT NULL,
  objective_text text NOT NULL,
  parent_okr_id uuid REFERENCES public.okrs(id) ON DELETE SET NULL,
  is_rolled_over boolean NOT NULL DEFAULT false,
  rolled_over_from uuid REFERENCES public.okrs(id) ON DELETE SET NULL,
  status public.okr_status NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.okrs ENABLE ROW LEVEL SECURITY;

-- RLS: org-scoped read/write, admin delete
DROP POLICY IF EXISTS "Users can view okrs in their org" ON public.okrs;
CREATE POLICY "Users can view okrs in their org"
  ON public.okrs FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()));

DROP POLICY IF EXISTS "Users can create okrs in their org" ON public.okrs;
CREATE POLICY "Users can create okrs in their org"
  ON public.okrs FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

DROP POLICY IF EXISTS "Users can update okrs in their org" ON public.okrs;
CREATE POLICY "Users can update okrs in their org"
  ON public.okrs FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete okrs" ON public.okrs;
CREATE POLICY "Admins can delete okrs"
  ON public.okrs FOR DELETE TO authenticated
  USING (public.is_org_admin(auth.uid()));

-- ══════════════════════════════════════════════════════════════════════
-- 2. key_results
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.key_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id uuid NOT NULL REFERENCES public.okrs(id) ON DELETE CASCADE,
  text text NOT NULL,
  target_value numeric NOT NULL DEFAULT 0,
  current_value numeric NOT NULL DEFAULT 0,
  needs_attention boolean NOT NULL DEFAULT false,
  attention_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view key_results in their org" ON public.key_results;
CREATE POLICY "Users can view key_results in their org"
  ON public.key_results FOR SELECT TO authenticated
  USING (okr_id IN (SELECT id FROM public.okrs WHERE organization_id = public.get_user_organization_id(auth.uid())));

DROP POLICY IF EXISTS "Users can create key_results in their org" ON public.key_results;
CREATE POLICY "Users can create key_results in their org"
  ON public.key_results FOR INSERT TO authenticated
  WITH CHECK (okr_id IN (SELECT id FROM public.okrs WHERE organization_id = public.get_user_organization_id(auth.uid())));

DROP POLICY IF EXISTS "Users can update key_results in their org" ON public.key_results;
CREATE POLICY "Users can update key_results in their org"
  ON public.key_results FOR UPDATE TO authenticated
  USING (okr_id IN (SELECT id FROM public.okrs WHERE organization_id = public.get_user_organization_id(auth.uid())));

DROP POLICY IF EXISTS "Admins can delete key_results" ON public.key_results;
CREATE POLICY "Admins can delete key_results"
  ON public.key_results FOR DELETE TO authenticated
  USING (public.is_org_admin(auth.uid()));

-- ══════════════════════════════════════════════════════════════════════
-- 3. check_ins
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id uuid NOT NULL REFERENCES public.okrs(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  cadence public.cadence_type NOT NULL DEFAULT 'biweekly',
  progress numeric NOT NULL DEFAULT 0,
  confidence numeric NOT NULL DEFAULT 50,
  confidence_label public.confidence_label NOT NULL DEFAULT 'Medium',
  reason_for_change text,
  optional_note text,
  root_cause public.root_cause_category,
  root_cause_note text,
  recovery_likelihood text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view check_ins in their org" ON public.check_ins;
CREATE POLICY "Users can view check_ins in their org"
  ON public.check_ins FOR SELECT TO authenticated
  USING (okr_id IN (SELECT id FROM public.okrs WHERE organization_id = public.get_user_organization_id(auth.uid())));

DROP POLICY IF EXISTS "Users can create check_ins in their org" ON public.check_ins;
CREATE POLICY "Users can create check_ins in their org"
  ON public.check_ins FOR INSERT TO authenticated
  WITH CHECK (okr_id IN (SELECT id FROM public.okrs WHERE organization_id = public.get_user_organization_id(auth.uid())));

DROP POLICY IF EXISTS "Users can update check_ins in their org" ON public.check_ins;
CREATE POLICY "Users can update check_ins in their org"
  ON public.check_ins FOR UPDATE TO authenticated
  USING (okr_id IN (SELECT id FROM public.okrs WHERE organization_id = public.get_user_organization_id(auth.uid())));

DROP POLICY IF EXISTS "Admins can delete check_ins" ON public.check_ins;
CREATE POLICY "Admins can delete check_ins"
  ON public.check_ins FOR DELETE TO authenticated
  USING (public.is_org_admin(auth.uid()));

-- ══════════════════════════════════════════════════════════════════════
-- 4. jira_links
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.jira_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id uuid NOT NULL REFERENCES public.okrs(id) ON DELETE CASCADE,
  epic_identifier_or_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.jira_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view jira_links in their org" ON public.jira_links;
CREATE POLICY "Users can view jira_links in their org"
  ON public.jira_links FOR SELECT TO authenticated
  USING (okr_id IN (SELECT id FROM public.okrs WHERE organization_id = public.get_user_organization_id(auth.uid())));

DROP POLICY IF EXISTS "Users can manage jira_links in their org" ON public.jira_links;
CREATE POLICY "Users can manage jira_links in their org"
  ON public.jira_links FOR ALL TO authenticated
  USING (okr_id IN (SELECT id FROM public.okrs WHERE organization_id = public.get_user_organization_id(auth.uid())));

-- ══════════════════════════════════════════════════════════════════════
-- 5. okr_links
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.okr_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_okr_id uuid NOT NULL REFERENCES public.okrs(id) ON DELETE CASCADE,
  child_okr_id uuid NOT NULL REFERENCES public.okrs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.okr_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view okr_links in their org" ON public.okr_links;
CREATE POLICY "Users can view okr_links in their org"
  ON public.okr_links FOR SELECT TO authenticated
  USING (parent_okr_id IN (SELECT id FROM public.okrs WHERE organization_id = public.get_user_organization_id(auth.uid())));

DROP POLICY IF EXISTS "Users can manage okr_links in their org" ON public.okr_links;
CREATE POLICY "Users can manage okr_links in their org"
  ON public.okr_links FOR ALL TO authenticated
  USING (parent_okr_id IN (SELECT id FROM public.okrs WHERE organization_id = public.get_user_organization_id(auth.uid())));

-- ══════════════════════════════════════════════════════════════════════
-- 6. quarter_closes
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.quarter_closes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id uuid NOT NULL UNIQUE REFERENCES public.okrs(id) ON DELETE CASCADE,
  final_value numeric NOT NULL,
  achievement public.achievement_status NOT NULL,
  summary text NOT NULL,
  closed_by uuid,
  closed_at timestamptz NOT NULL DEFAULT now(),
  reopened_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.quarter_closes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view quarter_closes in their org" ON public.quarter_closes;
CREATE POLICY "Users can view quarter_closes in their org"
  ON public.quarter_closes FOR SELECT TO authenticated
  USING (okr_id IN (SELECT id FROM public.okrs WHERE organization_id = public.get_user_organization_id(auth.uid())));

DROP POLICY IF EXISTS "Users can manage quarter_closes in their org" ON public.quarter_closes;
CREATE POLICY "Users can manage quarter_closes in their org"
  ON public.quarter_closes FOR ALL TO authenticated
  USING (okr_id IN (SELECT id FROM public.okrs WHERE organization_id = public.get_user_organization_id(auth.uid())));

-- ══════════════════════════════════════════════════════════════════════
-- Helper function for OKR org lookup (used by RLS on child tables)
-- ══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_okr_organization_id(_okr_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.okrs WHERE id = _okr_id;
$$;

-- ══════════════════════════════════════════════════════════════════════
-- Indexes
-- ══════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_okrs_organization_id ON public.okrs(organization_id);
CREATE INDEX IF NOT EXISTS idx_okrs_owner_id ON public.okrs(owner_id);
CREATE INDEX IF NOT EXISTS idx_okrs_quarter ON public.okrs(quarter);
CREATE INDEX IF NOT EXISTS idx_okrs_status ON public.okrs(status);
CREATE INDEX IF NOT EXISTS idx_key_results_okr_id ON public.key_results(okr_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_okr_id ON public.check_ins(okr_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_date ON public.check_ins(date);
CREATE INDEX IF NOT EXISTS idx_jira_links_okr_id ON public.jira_links(okr_id);
CREATE INDEX IF NOT EXISTS idx_okr_links_parent ON public.okr_links(parent_okr_id);
CREATE INDEX IF NOT EXISTS idx_okr_links_child ON public.okr_links(child_okr_id);
CREATE INDEX IF NOT EXISTS idx_quarter_closes_okr_id ON public.quarter_closes(okr_id);
