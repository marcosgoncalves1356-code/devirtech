CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE SET NULL,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'in',
  quantity numeric NOT NULL DEFAULT 0,
  unit_cost numeric NOT NULL DEFAULT 0,
  moved_at date NOT NULL DEFAULT current_date,
  document text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stock_movements_kind_check CHECK (kind IN ('in','out')),
  CONSTRAINT stock_movements_quantity_check CHECK (quantity > 0)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members manage stock movements"
ON public.stock_movements FOR ALL TO authenticated
USING (company_id = public.current_company_id() OR public.is_devitech_admin())
WITH CHECK (company_id = public.current_company_id() OR public.is_devitech_admin());

CREATE TRIGGER stock_movements_updated_at BEFORE UPDATE ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX stock_movements_company_idx ON public.stock_movements(company_id);
CREATE INDEX stock_movements_warehouse_idx ON public.stock_movements(warehouse_id);
CREATE INDEX stock_movements_item_idx ON public.stock_movements(item_id);