CREATE TABLE public.suppliers (
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
  bank_info text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX suppliers_company_idx ON public.suppliers (company_id);
CREATE UNIQUE INDEX suppliers_company_document_idx ON public.suppliers (company_id, document) WHERE document <> '';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers_company" ON public.suppliers FOR ALL TO authenticated
USING (public.is_devitech_admin() OR company_id = public.current_company_id())
WITH CHECK (public.is_devitech_admin() OR company_id = public.current_company_id());

CREATE TRIGGER suppliers_updated_at BEFORE UPDATE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();