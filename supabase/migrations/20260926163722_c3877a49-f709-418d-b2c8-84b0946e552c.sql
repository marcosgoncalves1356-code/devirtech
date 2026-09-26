CREATE TABLE public.products_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('product', 'service')),
  code text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT 'un',
  category text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products_services TO authenticated;
GRANT ALL ON public.products_services TO service_role;
ALTER TABLE public.products_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can view products and services" ON public.products_services FOR SELECT TO authenticated USING (company_id = public.current_company_id() OR public.is_devitech_admin());
CREATE POLICY "Company members can create products and services" ON public.products_services FOR INSERT TO authenticated WITH CHECK ((company_id = public.current_company_id() OR public.is_devitech_admin()) AND public.can_access_submodule('cadastros.products-services', 'create'));
CREATE POLICY "Company members can edit products and services" ON public.products_services FOR UPDATE TO authenticated USING ((company_id = public.current_company_id() OR public.is_devitech_admin()) AND public.can_access_submodule('cadastros.products-services', 'edit')) WITH CHECK ((company_id = public.current_company_id() OR public.is_devitech_admin()) AND public.can_access_submodule('cadastros.products-services', 'edit'));
CREATE POLICY "Company members can delete products and services" ON public.products_services FOR DELETE TO authenticated USING ((company_id = public.current_company_id() OR public.is_devitech_admin()) AND public.can_access_submodule('cadastros.products-services', 'delete'));
CREATE TRIGGER set_products_services_updated_at BEFORE UPDATE ON public.products_services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER enforce_products_services_access BEFORE INSERT OR UPDATE OR DELETE ON public.products_services FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('cadastros.products-services');