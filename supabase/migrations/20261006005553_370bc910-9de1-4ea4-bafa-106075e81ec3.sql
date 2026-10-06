ALTER TABLE public.purchase_items
  ADD COLUMN product_service_id uuid NULL REFERENCES public.products_services(id) ON DELETE RESTRICT;

ALTER TABLE public.inventory_items
  ADD COLUMN product_service_id uuid NULL REFERENCES public.products_services(id) ON DELETE RESTRICT;

ALTER TABLE public.sales_order_items
  ADD COLUMN product_service_id uuid NULL REFERENCES public.products_services(id) ON DELETE RESTRICT;

ALTER TABLE public.sales_price_list_items
  ADD COLUMN product_service_id uuid NULL REFERENCES public.products_services(id) ON DELETE RESTRICT;

CREATE UNIQUE INDEX inventory_items_company_product_service_unique
  ON public.inventory_items(company_id, product_service_id)
  WHERE product_service_id IS NOT NULL;

CREATE INDEX purchase_items_product_service_idx ON public.purchase_items(product_service_id);
CREATE INDEX sales_order_items_product_service_idx ON public.sales_order_items(product_service_id);
CREATE INDEX sales_price_list_items_product_service_idx ON public.sales_price_list_items(product_service_id);

CREATE OR REPLACE FUNCTION public.validate_product_service_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  linked_kind text;
  linked_status text;
  old_link uuid;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    old_link := OLD.product_service_id;
  END IF;

  IF NEW.product_service_id IS NULL OR NEW.product_service_id IS NOT DISTINCT FROM old_link THEN
    RETURN NEW;
  END IF;

  SELECT kind, status
    INTO linked_kind, linked_status
  FROM public.products_services
  WHERE id = NEW.product_service_id
    AND company_id = NEW.company_id;

  IF linked_kind IS NULL THEN
    RAISE EXCEPTION 'Produto ou serviço inválido para esta empresa.';
  END IF;

  IF linked_status <> 'active' THEN
    RAISE EXCEPTION 'Selecione um produto ou serviço ativo.';
  END IF;

  IF TG_TABLE_NAME = 'inventory_items' AND linked_kind <> 'product' THEN
    RAISE EXCEPTION 'Somente produtos podem ser vinculados ao estoque.';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_product_service_link() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_product_service_link() TO service_role;

CREATE TRIGGER validate_purchase_item_product_service
BEFORE INSERT OR UPDATE OF product_service_id, company_id ON public.purchase_items
FOR EACH ROW EXECUTE FUNCTION public.validate_product_service_link();

CREATE TRIGGER validate_inventory_item_product_service
BEFORE INSERT OR UPDATE OF product_service_id, company_id ON public.inventory_items
FOR EACH ROW EXECUTE FUNCTION public.validate_product_service_link();

CREATE TRIGGER validate_sales_order_item_product_service
BEFORE INSERT OR UPDATE OF product_service_id, company_id ON public.sales_order_items
FOR EACH ROW EXECUTE FUNCTION public.validate_product_service_link();

CREATE TRIGGER validate_sales_price_item_product_service
BEFORE INSERT OR UPDATE OF product_service_id, company_id ON public.sales_price_list_items
FOR EACH ROW EXECUTE FUNCTION public.validate_product_service_link();