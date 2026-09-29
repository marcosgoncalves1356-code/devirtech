CREATE TABLE public.rural_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  document text NOT NULL DEFAULT '',
  registry_number text NOT NULL DEFAULT '',
  total_area numeric(14,4) NOT NULL DEFAULT 0 CHECK (total_area >= 0),
  area_unit text NOT NULL DEFAULT 'ha',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rural_properties TO authenticated;
GRANT ALL ON public.rural_properties TO service_role;
ALTER TABLE public.rural_properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY rural_properties_company_select ON public.rural_properties FOR SELECT TO authenticated USING (public.is_devitech_admin() OR company_id = public.current_company_id());
CREATE POLICY rural_properties_company_insert ON public.rural_properties FOR INSERT TO authenticated WITH CHECK (public.is_devitech_admin() OR company_id = public.current_company_id());
CREATE POLICY rural_properties_company_update ON public.rural_properties FOR UPDATE TO authenticated USING (public.is_devitech_admin() OR company_id = public.current_company_id()) WITH CHECK (public.is_devitech_admin() OR company_id = public.current_company_id());
CREATE POLICY rural_properties_company_delete ON public.rural_properties FOR DELETE TO authenticated USING (public.is_devitech_admin() OR company_id = public.current_company_id());
CREATE TRIGGER rural_properties_updated_at BEFORE UPDATE ON public.rural_properties FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER rural_properties_access BEFORE INSERT OR UPDATE OR DELETE ON public.rural_properties FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('propriedades.farms');
CREATE INDEX rural_properties_company_idx ON public.rural_properties(company_id, status, name);

CREATE TABLE public.property_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.rural_properties(id) ON DELETE RESTRICT,
  name text NOT NULL,
  registry_number text NOT NULL DEFAULT '',
  area numeric(14,4) NOT NULL DEFAULT 0 CHECK (area >= 0),
  area_unit text NOT NULL DEFAULT 'ha',
  crop_type text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_fields TO authenticated;
GRANT ALL ON public.property_fields TO service_role;
ALTER TABLE public.property_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY property_fields_company_select ON public.property_fields FOR SELECT TO authenticated USING (public.is_devitech_admin() OR company_id = public.current_company_id());
CREATE POLICY property_fields_company_insert ON public.property_fields FOR INSERT TO authenticated WITH CHECK (public.is_devitech_admin() OR company_id = public.current_company_id());
CREATE POLICY property_fields_company_update ON public.property_fields FOR UPDATE TO authenticated USING (public.is_devitech_admin() OR company_id = public.current_company_id()) WITH CHECK (public.is_devitech_admin() OR company_id = public.current_company_id());
CREATE POLICY property_fields_company_delete ON public.property_fields FOR DELETE TO authenticated USING (public.is_devitech_admin() OR company_id = public.current_company_id());
CREATE TRIGGER property_fields_updated_at BEFORE UPDATE ON public.property_fields FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER property_fields_access BEFORE INSERT OR UPDATE OR DELETE ON public.property_fields FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('propriedades.areas');
CREATE INDEX property_fields_company_idx ON public.property_fields(company_id, property_id, status, name);

CREATE OR REPLACE FUNCTION public.validate_property_field_company()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.rural_properties p WHERE p.id = NEW.property_id AND p.company_id = NEW.company_id) THEN
    RAISE EXCEPTION 'A propriedade deve pertencer à mesma empresa.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_property_field_company() FROM PUBLIC;
CREATE TRIGGER validate_property_field_company BEFORE INSERT OR UPDATE ON public.property_fields FOR EACH ROW EXECUTE FUNCTION public.validate_property_field_company();

ALTER TABLE public.crop_seasons
  ADD CONSTRAINT crop_seasons_property_fk FOREIGN KEY (property_id) REFERENCES public.rural_properties(id) ON DELETE RESTRICT,
  ADD CONSTRAINT crop_seasons_field_fk FOREIGN KEY (field_id) REFERENCES public.property_fields(id) ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION public.validate_crop_season_location()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.property_id IS NULL AND NEW.field_id IS NOT NULL THEN
    RAISE EXCEPTION 'Selecione a propriedade do talhão.' USING ERRCODE = '23514';
  END IF;
  IF NEW.property_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.rural_properties p WHERE p.id = NEW.property_id AND p.company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'A propriedade deve pertencer à mesma empresa da safra.' USING ERRCODE = '23514';
  END IF;
  IF NEW.field_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.property_fields f WHERE f.id = NEW.field_id AND f.property_id = NEW.property_id AND f.company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'O talhão deve pertencer à propriedade e à empresa da safra.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_crop_season_location() FROM PUBLIC;
CREATE TRIGGER validate_crop_season_location BEFORE INSERT OR UPDATE ON public.crop_seasons FOR EACH ROW EXECUTE FUNCTION public.validate_crop_season_location();

CREATE TABLE public.payroll_entry_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_entry_id uuid NOT NULL REFERENCES public.payroll_entries(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  base_salary numeric(14,2) NOT NULL DEFAULT 0 CHECK (base_salary >= 0),
  earnings numeric(14,2) NOT NULL DEFAULT 0 CHECK (earnings >= 0),
  deductions numeric(14,2) NOT NULL DEFAULT 0 CHECK (deductions >= 0),
  net_total numeric(14,2) GENERATED ALWAYS AS (base_salary + earnings - deductions) STORED,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (payroll_entry_id, employee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_entry_items TO authenticated;
GRANT ALL ON public.payroll_entry_items TO service_role;
ALTER TABLE public.payroll_entry_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY payroll_entry_items_company_select ON public.payroll_entry_items FOR SELECT TO authenticated USING (public.is_devitech_admin() OR company_id = public.current_company_id());
CREATE POLICY payroll_entry_items_company_insert ON public.payroll_entry_items FOR INSERT TO authenticated WITH CHECK (public.is_devitech_admin() OR company_id = public.current_company_id());
CREATE POLICY payroll_entry_items_company_update ON public.payroll_entry_items FOR UPDATE TO authenticated USING (public.is_devitech_admin() OR company_id = public.current_company_id()) WITH CHECK (public.is_devitech_admin() OR company_id = public.current_company_id());
CREATE POLICY payroll_entry_items_company_delete ON public.payroll_entry_items FOR DELETE TO authenticated USING (public.is_devitech_admin() OR company_id = public.current_company_id());
CREATE TRIGGER payroll_entry_items_updated_at BEFORE UPDATE ON public.payroll_entry_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER payroll_entry_items_access BEFORE INSERT OR UPDATE OR DELETE ON public.payroll_entry_items FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('folha-de-pagamento.earnings');
CREATE INDEX payroll_entry_items_company_idx ON public.payroll_entry_items(company_id, payroll_entry_id, employee_id);

CREATE OR REPLACE FUNCTION public.validate_payroll_entry_item()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.payroll_entries p WHERE p.id = NEW.payroll_entry_id AND p.company_id = NEW.company_id) THEN
    RAISE EXCEPTION 'A competência deve pertencer à mesma empresa.' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.employees e WHERE e.id = NEW.employee_id AND e.company_id = NEW.company_id) THEN
    RAISE EXCEPTION 'O colaborador deve pertencer à mesma empresa.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_payroll_entry_item() FROM PUBLIC;
CREATE TRIGGER validate_payroll_entry_item BEFORE INSERT OR UPDATE ON public.payroll_entry_items FOR EACH ROW EXECUTE FUNCTION public.validate_payroll_entry_item();

CREATE OR REPLACE FUNCTION public.enforce_payroll_entry_access()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  action_name text := CASE TG_OP WHEN 'INSERT' THEN 'create' WHEN 'UPDATE' THEN 'edit' ELSE 'delete' END;
BEGIN
  IF NOT (public.can_access_submodule('folha-de-pagamento.monthly', action_name) OR public.can_access_submodule('folha-de-pagamento.earnings', action_name)) THEN
    RAISE EXCEPTION 'Ação não permitida para a folha de pagamento.' USING ERRCODE = '42501';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_payroll_entry_access() FROM PUBLIC;
CREATE TRIGGER payroll_entries_access BEFORE INSERT OR UPDATE OR DELETE ON public.payroll_entries FOR EACH ROW EXECUTE FUNCTION public.enforce_payroll_entry_access();
