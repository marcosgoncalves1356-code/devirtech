CREATE TABLE public.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.warehouses TO authenticated;
GRANT ALL ON public.warehouses TO service_role;

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members manage warehouses"
ON public.warehouses FOR ALL TO authenticated
USING (company_id = public.current_company_id() OR public.is_devitech_admin())
WITH CHECK (company_id = public.current_company_id() OR public.is_devitech_admin());

CREATE TRIGGER warehouses_updated_at BEFORE UPDATE ON public.warehouses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX warehouses_company_idx ON public.warehouses(company_id);

ALTER TABLE public.purchase_receipts
  ADD COLUMN warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE SET NULL;

ALTER TABLE public.purchase_items
  ADD COLUMN inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL;