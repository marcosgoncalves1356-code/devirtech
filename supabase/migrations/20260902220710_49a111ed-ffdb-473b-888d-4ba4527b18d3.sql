CREATE TABLE public.cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cost_centers TO authenticated;
GRANT ALL ON public.cost_centers TO service_role;

ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cost_centers_company" ON public.cost_centers
  FOR ALL TO authenticated
  USING (is_devitech_admin() OR company_id = current_company_id())
  WITH CHECK (is_devitech_admin() OR company_id = current_company_id());

CREATE TRIGGER cost_centers_updated_at BEFORE UPDATE ON public.cost_centers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.financial_entries
  ADD COLUMN cost_center_id uuid REFERENCES public.cost_centers(id) ON DELETE SET NULL;

CREATE INDEX financial_entries_cost_center_idx ON public.financial_entries (cost_center_id);