CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX departments_company_name_idx ON public.departments (company_id, lower(name));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members read departments" ON public.departments FOR SELECT TO authenticated
  USING (is_devitech_admin() OR company_id = current_company_id());
CREATE POLICY "Company members insert departments" ON public.departments FOR INSERT TO authenticated
  WITH CHECK (is_devitech_admin() OR company_id = current_company_id());
CREATE POLICY "Company members update departments" ON public.departments FOR UPDATE TO authenticated
  USING (is_devitech_admin() OR company_id = current_company_id())
  WITH CHECK (is_devitech_admin() OR company_id = current_company_id());
CREATE POLICY "Company members delete departments" ON public.departments FOR DELETE TO authenticated
  USING (is_devitech_admin() OR company_id = current_company_id());

CREATE TRIGGER departments_updated_at BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.job_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX job_positions_company_name_idx ON public.job_positions (company_id, lower(name));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_positions TO authenticated;
GRANT ALL ON public.job_positions TO service_role;
ALTER TABLE public.job_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members read positions" ON public.job_positions FOR SELECT TO authenticated
  USING (is_devitech_admin() OR company_id = current_company_id());
CREATE POLICY "Company members insert positions" ON public.job_positions FOR INSERT TO authenticated
  WITH CHECK (is_devitech_admin() OR company_id = current_company_id());
CREATE POLICY "Company members update positions" ON public.job_positions FOR UPDATE TO authenticated
  USING (is_devitech_admin() OR company_id = current_company_id())
  WITH CHECK (is_devitech_admin() OR company_id = current_company_id());
CREATE POLICY "Company members delete positions" ON public.job_positions FOR DELETE TO authenticated
  USING (is_devitech_admin() OR company_id = current_company_id());

CREATE TRIGGER job_positions_updated_at BEFORE UPDATE ON public.job_positions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();