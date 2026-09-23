CREATE TABLE public.sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  order_number text NOT NULL,
  ordered_at date NOT NULL DEFAULT CURRENT_DATE,
  expected_date date,
  status public.doc_status NOT NULL DEFAULT 'draft',
  notes text NOT NULL DEFAULT '',
  total numeric(15,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, order_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_orders TO authenticated;
GRANT ALL ON public.sales_orders TO service_role;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY sales_orders_company ON public.sales_orders
  FOR ALL TO authenticated
  USING (company_id = public.current_company_id() OR public.is_devitech_admin())
  WITH CHECK (company_id = public.current_company_id() OR public.is_devitech_admin());

CREATE TABLE public.sales_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  description text NOT NULL,
  unit text NOT NULL DEFAULT 'un',
  quantity numeric(15,3) NOT NULL CHECK (quantity > 0),
  unit_price numeric(15,2) NOT NULL CHECK (unit_price >= 0),
  total numeric(15,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_order_items TO authenticated;
GRANT ALL ON public.sales_order_items TO service_role;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY sales_order_items_company ON public.sales_order_items
  FOR ALL TO authenticated
  USING (company_id = public.current_company_id() OR public.is_devitech_admin())
  WITH CHECK (company_id = public.current_company_id() OR public.is_devitech_admin());

CREATE INDEX sales_orders_company_date_idx ON public.sales_orders(company_id, ordered_at DESC);
CREATE INDEX sales_orders_company_customer_idx ON public.sales_orders(company_id, customer_id);
CREATE INDEX sales_order_items_order_idx ON public.sales_order_items(order_id);
CREATE INDEX sales_order_items_company_idx ON public.sales_order_items(company_id);

CREATE OR REPLACE FUNCTION public.validate_sales_order()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = NEW.customer_id AND company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'O cliente deve pertencer à mesma empresa do pedido.';
  END IF;
  IF NEW.expected_date IS NOT NULL AND NEW.expected_date < NEW.ordered_at THEN
    RAISE EXCEPTION 'A previsão de entrega não pode ser anterior à data do pedido.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_sales_order_item()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.sales_orders
    WHERE id = NEW.order_id AND company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'O pedido deve pertencer à mesma empresa do item.';
  END IF;
  NEW.total := ROUND(NEW.quantity * NEW.unit_price, 2);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_sales_order_total()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  affected_order_id uuid;
BEGIN
  affected_order_id := COALESCE(NEW.order_id, OLD.order_id);
  UPDATE public.sales_orders
  SET total = COALESCE((SELECT ROUND(SUM(total), 2) FROM public.sales_order_items WHERE order_id = affected_order_id), 0)
  WHERE id = affected_order_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER sales_orders_validate
  BEFORE INSERT OR UPDATE ON public.sales_orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_sales_order();
CREATE TRIGGER sales_orders_updated_at
  BEFORE UPDATE ON public.sales_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER sales_order_items_validate
  BEFORE INSERT OR UPDATE ON public.sales_order_items
  FOR EACH ROW EXECUTE FUNCTION public.validate_sales_order_item();
CREATE TRIGGER sales_order_items_updated_at
  BEFORE UPDATE ON public.sales_order_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER sales_order_items_refresh_total
  AFTER INSERT OR UPDATE OR DELETE ON public.sales_order_items
  FOR EACH ROW EXECUTE FUNCTION public.refresh_sales_order_total();