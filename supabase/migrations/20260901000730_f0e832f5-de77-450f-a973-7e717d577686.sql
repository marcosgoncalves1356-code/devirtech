CREATE TYPE public.app_role AS ENUM ('devitech_admin', 'company_admin', 'manager', 'operator');
CREATE TYPE public.account_status AS ENUM ('active', 'blocked');
CREATE TYPE public.permission_level AS ENUM ('none', 'view', 'edit');

CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  document text,
  segment text,
  status public.account_status NOT NULL DEFAULT 'active',
  enabled_modules text[] NOT NULL DEFAULT ARRAY['dashboard','empresas','usuarios','funcionarios','financeiro','compras','estoque','vendas','folha-de-pagamento','veiculos','propriedades','producao','relatorios','configuracoes'],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL,
  status public.account_status NOT NULL DEFAULT 'active',
  must_change_password boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE public.user_module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_slug text NOT NULL,
  level public.permission_level NOT NULL DEFAULT 'view',
  UNIQUE (user_id, module_slug)
);

CREATE TABLE public.access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  action text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT ON public.user_module_permissions TO authenticated;
GRANT ALL ON public.user_module_permissions TO service_role;
GRANT SELECT, INSERT ON public.access_logs TO authenticated;
GRANT ALL ON public.access_logs TO service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_devitech_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'devitech_admin');
$$;

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_read_own" ON public.companies FOR SELECT TO authenticated
  USING (id = public.current_company_id() OR public.is_devitech_admin());

CREATE POLICY "profiles_read_self_or_company" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_devitech_admin() OR (company_id IS NOT NULL AND company_id = public.current_company_id()));

CREATE POLICY "profiles_update_self_name" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "roles_read_self_or_admin" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_devitech_admin());

CREATE POLICY "perms_read_self_or_admin" ON public.user_module_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_devitech_admin());

CREATE POLICY "logs_read_company_or_admin" ON public.access_logs FOR SELECT TO authenticated
  USING (public.is_devitech_admin() OR (company_id IS NOT NULL AND company_id = public.current_company_id()));

CREATE POLICY "logs_insert_self" ON public.access_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();