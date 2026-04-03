-- Server-side invite code validation.
-- Moves the hardcoded invite code out of the frontend JS bundle.
-- The code is stored in a single-row settings table, editable by admins.

CREATE TABLE IF NOT EXISTS public.app_settings (
  id integer PRIMARY KEY CHECK (id = 1),
  invite_code text NOT NULL DEFAULT 'truenorth2026',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.app_settings (id, invite_code)
VALUES (1, 'truenorth2026')
ON CONFLICT (id) DO NOTHING;

-- No SELECT policy — the invite code should never be readable from the client.
-- Validation happens via RPC only.
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- RPC to validate invite code without exposing it
CREATE OR REPLACE FUNCTION public.validate_invite_code(code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_settings
    WHERE id = 1 AND lower(invite_code) = lower(code)
  );
$$;
