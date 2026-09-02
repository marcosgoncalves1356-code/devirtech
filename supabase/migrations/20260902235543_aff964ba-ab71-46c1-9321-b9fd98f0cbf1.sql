CREATE TABLE IF NOT EXISTS public.purchase_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  purchase_id uuid NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  received_at date NOT NULL DEFAULT current_date,
  document text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_receipts TO authenticated;
GRANT ALL ON public.purchase_receipts TO service_role;

ALTER TABLE public.purchase_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchase_receipts_company_access" ON public.purchase_receipts
  FOR ALL TO authenticated
  USING (company_id = public.current_company_id() OR public.is_devitech_admin())
  WITH CHECK (company_id = public.current_company_id() OR public.is_devitech_admin());

CREATE TRIGGER purchase_receipts_updated_at BEFORE UPDATE ON public.purchase_receipts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.purchase_receipt_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id uuid NOT NULL REFERENCES public.purchase_receipts(id) ON DELETE CASCADE,
  purchase_item_id uuid NOT NULL REFERENCES public.purchase_items(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_receipt_items TO authenticated;
GRANT ALL ON public.purchase_receipt_items TO service_role;

ALTER TABLE public.purchase_receipt_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchase_receipt_items_company_access" ON public.purchase_receipt_items
  FOR ALL TO authenticated
  USING (company_id = public.current_company_id() OR public.is_devitech_admin())
  WITH CHECK (company_id = public.current_company_id() OR public.is_devitech_admin());

CREATE TRIGGER purchase_receipt_items_updated_at BEFORE UPDATE ON public.purchase_receipt_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS purchase_receipts_purchase_id_idx ON public.purchase_receipts(purchase_id);
CREATE INDEX IF NOT EXISTS purchase_receipt_items_receipt_id_idx ON public.purchase_receipt_items(receipt_id);