-- Invite tokens: replace raw org UUID in invite URLs with short-lived tokens.
-- Prevents anyone from guessing/crafting an org UUID to join.

CREATE TABLE IF NOT EXISTS public.invite_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;

-- Only org members can create invite tokens
CREATE POLICY "Org members can create invite tokens"
  ON public.invite_tokens FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

-- Anyone can validate a token (needed during signup before user has an org)
CREATE POLICY "Anyone can read invite tokens"
  ON public.invite_tokens FOR SELECT TO authenticated
  USING (true);

-- RPC to validate and consume an invite token
CREATE OR REPLACE FUNCTION public.validate_invite_token(token_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id uuid;
BEGIN
  SELECT organization_id INTO org_id
  FROM public.invite_tokens
  WHERE id = token_id
    AND used_at IS NULL
    AND expires_at > now();

  IF org_id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN org_id;
END;
$$;
