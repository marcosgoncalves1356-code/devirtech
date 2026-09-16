CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  trade_name text NOT NULL DEFAULT '',
  document text NOT NULL DEFAULT '',
  state_registration text NOT NULL DEFAULT '',
  contact_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  zip_code text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  payment_terms text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, document)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY customers_company ON public.customers FOR ALL TO authenticated
  USING (public.is_devitech_admin() OR company_id = public.current_company_id())
  WITH CHECK (public.is_devitech_admin() OR company_id = public.current_company_id());
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX customers_company_name_idx ON public.customers(company_id, name);

CREATE TABLE public.sales_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  contract_number text NOT NULL,
  start_date date NOT NULL DEFAULT current_date,
  end_date date,
  product text NOT NULL,
  quantity numeric(14,3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit text NOT NULL DEFAULT 'saca',
  unit_price numeric(14,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  total numeric(14,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'canceled')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, contract_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_contracts TO authenticated;
GRANT ALL ON public.sales_contracts TO service_role;
ALTER TABLE public.sales_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY sales_contracts_company ON public.sales_contracts FOR ALL TO authenticated
  USING (public.is_devitech_admin() OR company_id = public.current_company_id())
  WITH CHECK (public.is_devitech_admin() OR company_id = public.current_company_id());
CREATE TRIGGER sales_contracts_updated_at BEFORE UPDATE ON public.sales_contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX sales_contracts_company_customer_idx ON public.sales_contracts(company_id, customer_id);
CREATE INDEX sales_contracts_company_dates_idx ON public.sales_contracts(company_id, start_date, end_date);

CREATE OR REPLACE FUNCTION public.validate_sales_contract_customer()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = NEW.customer_id AND company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'O cliente deve pertencer à mesma empresa do contrato.';
  END IF;
  IF NEW.end_date IS NOT NULL AND NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'A data final não pode ser anterior à data inicial.';
  END IF;
  NEW.total := ROUND(NEW.quantity * NEW.unit_price, 2);
  RETURN NEW;
END;
$$;
CREATE TRIGGER sales_contracts_validate
  BEFORE INSERT OR UPDATE ON public.sales_contracts
  FOR EACH ROW EXECUTE FUNCTION public.validate_sales_contract_customer();