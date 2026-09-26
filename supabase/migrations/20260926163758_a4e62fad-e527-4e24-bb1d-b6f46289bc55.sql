DROP POLICY "Company members can create products and services" ON public.products_services;
DROP POLICY "Company members can edit products and services" ON public.products_services;
DROP POLICY "Company members can delete products and services" ON public.products_services;
CREATE POLICY "Company members can create products and services" ON public.products_services FOR INSERT TO authenticated WITH CHECK (company_id = public.current_company_id() OR public.is_devitech_admin());
CREATE POLICY "Company members can edit products and services" ON public.products_services FOR UPDATE TO authenticated USING (company_id = public.current_company_id() OR public.is_devitech_admin()) WITH CHECK (company_id = public.current_company_id() OR public.is_devitech_admin());
CREATE POLICY "Company members can delete products and services" ON public.products_services FOR DELETE TO authenticated USING (company_id = public.current_company_id() OR public.is_devitech_admin());