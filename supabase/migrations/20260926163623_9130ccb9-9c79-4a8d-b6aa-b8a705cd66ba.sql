CREATE OR REPLACE FUNCTION public.can_access_submodule(_submodule text, _action text DEFAULT 'view')
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _company_id uuid;
  _profile_id uuid;
  _module text := split_part(_submodule, '.', 1);
  _has_individual boolean;
  _level public.permission_level;
  _allowed boolean;
BEGIN
  IF _uid IS NULL THEN RETURN true; END IF;
  IF public.is_devitech_admin() THEN RETURN true; END IF;

  SELECT company_id, access_profile_id INTO _company_id, _profile_id
  FROM public.profiles WHERE id = _uid AND status = 'active';
  IF _company_id IS NULL THEN RETURN false; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = _company_id AND c.status = 'active'
      AND _module = ANY(c.enabled_modules)
      AND _submodule = ANY(c.enabled_submodules)
  ) THEN RETURN false; END IF;

  IF _profile_id IS NOT NULL THEN
    SELECT CASE _action
      WHEN 'view' THEN can_view WHEN 'create' THEN can_create
      WHEN 'edit' THEN can_edit WHEN 'delete' THEN can_delete ELSE false END
    INTO _allowed
    FROM public.access_profile_submodule_permissions
    WHERE profile_id = _profile_id AND submodule_slug = _submodule;
    IF _allowed IS NOT NULL THEN RETURN _allowed; END IF;

    SELECT CASE _action
      WHEN 'view' THEN can_view WHEN 'create' THEN can_create
      WHEN 'edit' THEN can_edit WHEN 'delete' THEN can_delete ELSE false END
    INTO _allowed
    FROM public.access_profile_permissions
    WHERE profile_id = _profile_id AND module_slug = _module;
    RETURN COALESCE(_allowed, false);
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.user_module_permissions WHERE user_id = _uid),
         (SELECT level FROM public.user_module_permissions WHERE user_id = _uid AND module_slug = _module)
  INTO _has_individual, _level;
  IF NOT _has_individual THEN RETURN true; END IF;
  IF _action = 'view' THEN RETURN COALESCE(_level IN ('view', 'edit'), false); END IF;
  RETURN COALESCE(_level = 'edit', false);
END;
$$;

REVOKE ALL ON FUNCTION public.can_access_submodule(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_submodule(text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.enforce_submodule_write_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _action text := CASE TG_OP WHEN 'INSERT' THEN 'create' WHEN 'UPDATE' THEN 'edit' ELSE 'delete' END;
BEGIN
  IF NOT public.can_access_submodule(TG_ARGV[0], _action) THEN
    RAISE EXCEPTION 'Ação não permitida para este submódulo.' USING ERRCODE = '42501';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_submodule_write_access() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.enforce_financial_entry_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _kind text := CASE WHEN TG_OP = 'DELETE' THEN OLD.kind::text ELSE NEW.kind::text END;
  _action text := CASE TG_OP WHEN 'INSERT' THEN 'create' WHEN 'UPDATE' THEN 'edit' ELSE 'delete' END;
BEGIN
  IF NOT public.can_access_submodule('financeiro.' || CASE WHEN _kind = 'payable' THEN 'payables' ELSE 'receivables' END, _action) THEN
    RAISE EXCEPTION 'Ação não permitida para este submódulo.' USING ERRCODE = '42501';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_financial_entry_access() FROM PUBLIC;
CREATE TRIGGER enforce_financial_entries BEFORE INSERT OR UPDATE OR DELETE ON public.financial_entries FOR EACH ROW EXECUTE FUNCTION public.enforce_financial_entry_access();
CREATE TRIGGER enforce_cost_centers BEFORE INSERT OR UPDATE OR DELETE ON public.cost_centers FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('financeiro.cost-centers');
CREATE TRIGGER enforce_suppliers BEFORE INSERT OR UPDATE OR DELETE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('compras.suppliers');
CREATE TRIGGER enforce_purchases BEFORE INSERT OR UPDATE OR DELETE ON public.purchases FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('compras.orders');
CREATE TRIGGER enforce_purchase_items BEFORE INSERT OR UPDATE OR DELETE ON public.purchase_items FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('compras.orders');
CREATE TRIGGER enforce_purchase_receipts BEFORE INSERT OR UPDATE OR DELETE ON public.purchase_receipts FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('compras.receipts');
CREATE TRIGGER enforce_purchase_receipt_items BEFORE INSERT OR UPDATE OR DELETE ON public.purchase_receipt_items FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('compras.receipts');
CREATE TRIGGER enforce_inventory_items BEFORE INSERT OR UPDATE OR DELETE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('estoque.items');
CREATE TRIGGER enforce_warehouses BEFORE INSERT OR UPDATE OR DELETE ON public.warehouses FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('estoque.warehouses');
CREATE TRIGGER enforce_stock_movements BEFORE INSERT OR UPDATE OR DELETE ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('estoque.movements');
CREATE TRIGGER enforce_stock_transfers BEFORE INSERT OR UPDATE OR DELETE ON public.stock_transfers FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('estoque.movements');
CREATE TRIGGER enforce_inventory_counts BEFORE INSERT OR UPDATE OR DELETE ON public.inventory_counts FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('estoque.inventory');
CREATE TRIGGER enforce_customers BEFORE INSERT OR UPDATE OR DELETE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('vendas.customers');
CREATE TRIGGER enforce_sales_contracts BEFORE INSERT OR UPDATE OR DELETE ON public.sales_contracts FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('vendas.contracts');
CREATE TRIGGER enforce_sales_orders BEFORE INSERT OR UPDATE OR DELETE ON public.sales_orders FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('vendas.orders');
CREATE TRIGGER enforce_sales_order_items BEFORE INSERT OR UPDATE OR DELETE ON public.sales_order_items FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('vendas.orders');
CREATE TRIGGER enforce_sales_price_lists BEFORE INSERT OR UPDATE OR DELETE ON public.sales_price_lists FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('vendas.prices');
CREATE TRIGGER enforce_sales_price_list_items BEFORE INSERT OR UPDATE OR DELETE ON public.sales_price_list_items FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('vendas.prices');
CREATE TRIGGER enforce_sales_billing BEFORE INSERT OR UPDATE OR DELETE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('vendas.billing');
CREATE TRIGGER enforce_crop_seasons BEFORE INSERT OR UPDATE OR DELETE ON public.crop_seasons FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('producao.seasons');
CREATE TRIGGER enforce_production_activities BEFORE INSERT OR UPDATE OR DELETE ON public.production_activities FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('producao.activities');
CREATE TRIGGER enforce_harvest_records BEFORE INSERT OR UPDATE OR DELETE ON public.harvest_records FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('producao.harvest');
CREATE TRIGGER enforce_employees BEFORE INSERT OR UPDATE OR DELETE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('funcionarios.records');
CREATE TRIGGER enforce_departments BEFORE INSERT OR UPDATE OR DELETE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('funcionarios.structure');
CREATE TRIGGER enforce_job_positions BEFORE INSERT OR UPDATE OR DELETE ON public.job_positions FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('funcionarios.structure');
CREATE TRIGGER enforce_access_profiles BEFORE INSERT OR UPDATE OR DELETE ON public.access_profiles FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('usuarios.profiles');
CREATE TRIGGER enforce_access_profile_permissions BEFORE INSERT OR UPDATE OR DELETE ON public.access_profile_permissions FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('usuarios.permissions');
CREATE TRIGGER enforce_access_profile_submodule_permissions BEFORE INSERT OR UPDATE OR DELETE ON public.access_profile_submodule_permissions FOR EACH ROW EXECUTE FUNCTION public.enforce_submodule_write_access('usuarios.permissions');