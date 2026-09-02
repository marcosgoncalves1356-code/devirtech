CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  cpf text NOT NULL DEFAULT '',
  rg text NOT NULL DEFAULT '',
  birth_date date,
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  job_title text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  contract_type text NOT NULL DEFAULT 'clt',
  admission_date date,
  termination_date date,
  salary numeric(14,2) NOT NULL DEFAULT 0,
  allocation text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX employees_company_cpf_key ON public.employees (company_id, cpf) WHERE cpf <> '';
CREATE INDEX employees_company_idx ON public.employees (company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members read employees"
  ON public.employees FOR SELECT TO authenticated
  USING (public.is_devitech_admin() OR company_id = public.current_company_id());

CREATE POLICY "Company members insert employees"
  ON public.employees FOR INSERT TO authenticated
  WITH CHECK (public.is_devitech_admin() OR company_id = public.current_company_id());

CREATE POLICY "Company members update employees"
  ON public.employees FOR UPDATE TO authenticated
  USING (public.is_devitech_admin() OR company_id = public.current_company_id())
  WITH CHECK (public.is_devitech_admin() OR company_id = public.current_company_id());

CREATE POLICY "Company members delete employees"
  ON public.employees FOR DELETE TO authenticated
  USING (public.is_devitech_admin() OR company_id = public.current_company_id());

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();