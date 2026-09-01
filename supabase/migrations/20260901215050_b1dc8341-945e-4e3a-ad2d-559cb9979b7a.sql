-- FINANCEIRO
CREATE TYPE public.entry_kind AS ENUM ('receivable','payable');
CREATE TYPE public.entry_status AS ENUM ('open','paid','overdue','canceled');
CREATE TYPE public.doc_status AS ENUM ('draft','confirmed','canceled');

CREATE TABLE public.financial_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  kind public.entry_kind NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'geral',
  amount numeric(14,2) NOT NULL DEFAULT 0,
  due_date date NOT NULL DEFAULT current_date,
  paid_at date,
  status public.entry_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_entries TO authenticated;
GRANT ALL ON public.financial_entries TO service_role;
ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY financial_entries_company ON public.financial_entries FOR ALL TO authenticated
  USING (public.is_devitech_admin() OR company_id = public.current_company_id())
  WITH CHECK (public.is_devitech_admin() OR company_id = public.current_company_id());
CREATE TRIGGER financial_entries_updated_at BEFORE UPDATE ON public.financial_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX financial_entries_company_idx ON public.financial_entries(company_id, due_date);

-- VENDAS
CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer text NOT NULL,
  total numeric(14,2) NOT NULL DEFAULT 0,
  sold_at date NOT NULL DEFAULT current_date,
  status public.doc_status NOT NULL DEFAULT 'confirmed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY sales_company ON public.sales FOR ALL TO authenticated
  USING (public.is_devitech_admin() OR company_id = public.current_company_id())
  WITH CHECK (public.is_devitech_admin() OR company_id = public.current_company_id());
CREATE TRIGGER sales_updated_at BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX sales_company_idx ON public.sales(company_id, sold_at);

-- COMPRAS
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier text NOT NULL,
  total numeric(14,2) NOT NULL DEFAULT 0,
  purchased_at date NOT NULL DEFAULT current_date,
  status public.doc_status NOT NULL DEFAULT 'confirmed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY purchases_company ON public.purchases FOR ALL TO authenticated
  USING (public.is_devitech_admin() OR company_id = public.current_company_id())
  WITH CHECK (public.is_devitech_admin() OR company_id = public.current_company_id());
CREATE TRIGGER purchases_updated_at BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX purchases_company_idx ON public.purchases(company_id, purchased_at);

-- ESTOQUE
CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'un',
  quantity numeric(14,3) NOT NULL DEFAULT 0,
  min_quantity numeric(14,3) NOT NULL DEFAULT 0,
  unit_cost numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY inventory_items_company ON public.inventory_items FOR ALL TO authenticated
  USING (public.is_devitech_admin() OR company_id = public.current_company_id())
  WITH CHECK (public.is_devitech_admin() OR company_id = public.current_company_id());
CREATE TRIGGER inventory_items_updated_at BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX inventory_items_company_idx ON public.inventory_items(company_id);

-- FOLHA DE PAGAMENTO
CREATE TABLE public.payroll_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  reference_month date NOT NULL,
  employees_count integer NOT NULL DEFAULT 0,
  gross_total numeric(14,2) NOT NULL DEFAULT 0,
  deductions numeric(14,2) NOT NULL DEFAULT 0,
  net_total numeric(14,2) NOT NULL DEFAULT 0,
  status public.doc_status NOT NULL DEFAULT 'confirmed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_entries TO authenticated;
GRANT ALL ON public.payroll_entries TO service_role;
ALTER TABLE public.payroll_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY payroll_entries_company ON public.payroll_entries FOR ALL TO authenticated
  USING (public.is_devitech_admin() OR company_id = public.current_company_id())
  WITH CHECK (public.is_devitech_admin() OR company_id = public.current_company_id());
CREATE TRIGGER payroll_entries_updated_at BEFORE UPDATE ON public.payroll_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX payroll_entries_company_idx ON public.payroll_entries(company_id, reference_month);