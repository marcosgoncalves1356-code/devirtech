ALTER TABLE public.companies
  ADD COLUMN enabled_submodules text[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.profiles
  ADD COLUMN access_profile_id uuid REFERENCES public.access_profiles(id) ON DELETE SET NULL;

CREATE INDEX profiles_access_profile_id_idx
  ON public.profiles (access_profile_id)
  WHERE access_profile_id IS NOT NULL;

CREATE TABLE public.access_profile_submodule_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.access_profiles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module_slug text NOT NULL,
  submodule_slug text NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, module_slug, submodule_slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_profile_submodule_permissions TO authenticated;
GRANT ALL ON public.access_profile_submodule_permissions TO service_role;

ALTER TABLE public.access_profile_submodule_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY access_profile_submodule_permissions_read
  ON public.access_profile_submodule_permissions
  FOR SELECT TO authenticated
  USING (public.is_devitech_admin() OR company_id = public.current_company_id());

CREATE POLICY access_profile_submodule_permissions_admin_write
  ON public.access_profile_submodule_permissions
  FOR ALL TO authenticated
  USING (public.is_devitech_admin())
  WITH CHECK (public.is_devitech_admin());

CREATE TRIGGER access_profile_submodule_permissions_updated_at
  BEFORE UPDATE ON public.access_profile_submodule_permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.validate_profile_assignment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.access_profile_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.access_profiles ap
    WHERE ap.id = NEW.access_profile_id
      AND ap.company_id = NEW.company_id
      AND ap.status = 'active'
  ) THEN
    RAISE EXCEPTION 'O perfil de acesso deve estar ativo e pertencer à mesma empresa.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_validate_access_profile
  BEFORE INSERT OR UPDATE OF company_id, access_profile_id ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_assignment();

CREATE OR REPLACE FUNCTION public.validate_submodule_permission()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.access_profiles ap
    WHERE ap.id = NEW.profile_id AND ap.company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'O perfil e a permissão devem pertencer à mesma empresa.';
  END IF;
  IF NEW.submodule_slug !~ ('^' || regexp_replace(NEW.module_slug, '([.\\+*?\[\](){}|^$])', '\\\1', 'g') || '\.') THEN
    RAISE EXCEPTION 'O submódulo deve pertencer ao módulo informado.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER access_profile_submodule_permissions_validate
  BEFORE INSERT OR UPDATE ON public.access_profile_submodule_permissions
  FOR EACH ROW EXECUTE FUNCTION public.validate_submodule_permission();