CREATE TABLE public.sales_price_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  valid_from date NOT NULL,
  valid_until date,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_price_lists_company_name_unique UNIQUE (company_id, name),
  CONSTRAINT sales_price_lists_valid_period CHECK (valid_until IS NULL OR valid_until >= valid_from)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_price_lists TO authenticated;
GRANT ALL ON public.sales_price_lists TO service_role;

ALTER TABLE public.sales_price_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_price_lists_company"
ON public.sales_price_lists
FOR ALL
TO authenticated
USING (company_id = public.current_company_id() OR public.is_devitech_admin())
WITH CHECK (company_id = public.current_company_id() OR public.is_devitech_admin());

CREATE TABLE public.sales_price_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id uuid NOT NULL REFERENCES public.sales_price_lists(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  description text NOT NULL,
  unit text NOT NULL DEFAULT 'un',
  price numeric(15,2) NOT NULL CHECK (price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_price_list_items_description_unique UNIQUE (price_list_id, description)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_price_list_items TO authenticated;
GRANT ALL ON public.sales_price_list_items TO service_role;

ALTER TABLE public.sales_price_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_price_list_items_company"
ON public.sales_price_list_items
FOR ALL
TO authenticated
USING (company_id = public.current_company_id() OR public.is_devitech_admin())
WITH CHECK (company_id = public.current_company_id() OR public.is_devitech_admin());

CREATE INDEX sales_price_lists_company_status_idx ON public.sales_price_lists(company_id, status);
CREATE INDEX sales_price_lists_company_validity_idx ON public.sales_price_lists(company_id, valid_from DESC);
CREATE INDEX sales_price_list_items_list_idx ON public.sales_price_list_items(price_list_id);
CREATE INDEX sales_price_list_items_company_idx ON public.sales_price_list_items(company_id);

CREATE TRIGGER set_sales_price_lists_updated_at
BEFORE UPDATE ON public.sales_price_lists
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_sales_price_list_items_updated_at
BEFORE UPDATE ON public.sales_price_list_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.validate_sales_price_list_item()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.sales_price_lists
    WHERE id = NEW.price_list_id AND company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'A tabela de preços não pertence à empresa informada';
  END IF;
  NEW.description := btrim(NEW.description);
  NEW.unit := btrim(NEW.unit);
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_sales_price_list_item_before_write
BEFORE INSERT OR UPDATE ON public.sales_price_list_items
FOR EACH ROW EXECUTE FUNCTION public.validate_sales_price_list_item();

CREATE OR REPLACE FUNCTION public.prevent_active_sales_price_list_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'active' THEN
    RAISE EXCEPTION 'Desative a tabela de preços antes de excluí-la';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER prevent_active_sales_price_list_delete_before_delete
BEFORE DELETE ON public.sales_price_lists
FOR EACH ROW EXECUTE FUNCTION public.prevent_active_sales_price_list_delete();