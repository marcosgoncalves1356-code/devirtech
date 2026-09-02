CREATE TABLE public.access_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  status account_status NOT NULL DEFAULT 'active',
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX access_profiles_company_name_key ON public.access_profiles (company_id, lower(name));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_profiles TO authenticated;
GRANT ALL ON public.access_profiles TO service_role;

ALTER TABLE public.access_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY access_profiles_read ON public.access_profiles
  FOR SELECT TO authenticated
  USING (is_devitech_admin() OR company_id = current_company_id());

CREATE POLICY access_profiles_admin_write ON public.access_profiles
  FOR ALL TO authenticated
  USING (is_devitech_admin())
  WITH CHECK (is_devitech_admin());

CREATE TRIGGER access_profiles_updated_at BEFORE UPDATE ON public.access_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();