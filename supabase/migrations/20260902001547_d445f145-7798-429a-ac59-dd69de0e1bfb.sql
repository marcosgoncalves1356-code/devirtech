CREATE TABLE public.access_profile_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.access_profiles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module_slug text NOT NULL,
  can_view boolean NOT NULL DEFAULT true,
  can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, module_slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_profile_permissions TO authenticated;
GRANT ALL ON public.access_profile_permissions TO service_role;

ALTER TABLE public.access_profile_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_perms_read" ON public.access_profile_permissions
  FOR SELECT TO authenticated
  USING (public.is_devitech_admin() OR company_id = public.current_company_id());

CREATE POLICY "app_perms_admin_write" ON public.access_profile_permissions
  FOR ALL TO authenticated
  USING (public.is_devitech_admin())
  WITH CHECK (public.is_devitech_admin());

CREATE TRIGGER access_profile_permissions_updated_at
  BEFORE UPDATE ON public.access_profile_permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX access_profile_permissions_profile_idx ON public.access_profile_permissions(profile_id);