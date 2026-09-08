ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

ALTER TABLE public.inventory_items
  ADD CONSTRAINT inventory_items_status_check CHECK (status IN ('active', 'inactive'));

CREATE TABLE public.stock_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  source_warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  destination_warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit_cost numeric NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  transferred_at date NOT NULL DEFAULT current_date,
  document text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stock_transfers_distinct_warehouses CHECK (source_warehouse_id <> destination_warehouse_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_transfers TO authenticated;
GRANT ALL ON public.stock_transfers TO service_role;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members manage stock transfers"
ON public.stock_transfers FOR ALL TO authenticated
USING (company_id = public.current_company_id() OR public.is_devitech_admin())
WITH CHECK (company_id = public.current_company_id() OR public.is_devitech_admin());
CREATE TRIGGER stock_transfers_updated_at BEFORE UPDATE ON public.stock_transfers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX stock_transfers_company_idx ON public.stock_transfers(company_id, transferred_at DESC);
CREATE INDEX stock_transfers_item_idx ON public.stock_transfers(item_id);

CREATE TABLE public.inventory_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  system_quantity numeric NOT NULL DEFAULT 0,
  counted_quantity numeric NOT NULL CHECK (counted_quantity >= 0),
  difference numeric NOT NULL DEFAULT 0,
  adjustment numeric NOT NULL DEFAULT 0,
  counted_at date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'adjusted', 'canceled')),
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  adjusted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_counts TO authenticated;
GRANT ALL ON public.inventory_counts TO service_role;
ALTER TABLE public.inventory_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members manage inventory counts"
ON public.inventory_counts FOR ALL TO authenticated
USING (company_id = public.current_company_id() OR public.is_devitech_admin())
WITH CHECK (company_id = public.current_company_id() OR public.is_devitech_admin());
CREATE TRIGGER inventory_counts_updated_at BEFORE UPDATE ON public.inventory_counts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX inventory_counts_company_idx ON public.inventory_counts(company_id, counted_at DESC);
CREATE INDEX inventory_counts_item_warehouse_idx ON public.inventory_counts(item_id, warehouse_id);

ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transfer_id uuid REFERENCES public.stock_transfers(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS inventory_count_id uuid REFERENCES public.inventory_counts(id) ON DELETE RESTRICT;

ALTER TABLE public.stock_movements
  ADD CONSTRAINT stock_movements_origin_check CHECK (origin IN ('manual', 'transfer', 'inventory'));

CREATE INDEX stock_movements_transfer_idx ON public.stock_movements(transfer_id);
CREATE INDEX stock_movements_inventory_count_idx ON public.stock_movements(inventory_count_id);

CREATE OR REPLACE FUNCTION public.stock_quantity_at(
  _company_id uuid,
  _item_id uuid,
  _warehouse_id uuid,
  _ignore_movement_id uuid DEFAULT NULL
)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT SUM(pri.quantity)
    FROM public.purchase_receipt_items pri
    JOIN public.purchase_receipts pr ON pr.id = pri.receipt_id
    JOIN public.purchase_items pi ON pi.id = pri.purchase_item_id
    WHERE pri.company_id = _company_id
      AND pr.company_id = _company_id
      AND pr.warehouse_id = _warehouse_id
      AND pi.inventory_item_id = _item_id
  ), 0) + COALESCE((
    SELECT SUM(CASE WHEN sm.kind = 'out' THEN -sm.quantity ELSE sm.quantity END)
    FROM public.stock_movements sm
    WHERE sm.company_id = _company_id
      AND sm.item_id = _item_id
      AND sm.warehouse_id = _warehouse_id
      AND (_ignore_movement_id IS NULL OR sm.id <> _ignore_movement_id)
  ), 0);
$$;
GRANT EXECUTE ON FUNCTION public.stock_quantity_at(uuid, uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.stock_quantity_at(uuid, uuid, uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.create_stock_transfer(
  _company_id uuid,
  _item_id uuid,
  _source_warehouse_id uuid,
  _destination_warehouse_id uuid,
  _quantity numeric,
  _unit_cost numeric,
  _transferred_at date,
  _document text,
  _notes text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _transfer_id uuid;
  _available numeric;
BEGIN
  IF NOT (_company_id = public.current_company_id() OR public.is_devitech_admin()) THEN
    RAISE EXCEPTION 'Empresa não autorizada.';
  END IF;
  IF _source_warehouse_id = _destination_warehouse_id THEN
    RAISE EXCEPTION 'Origem e destino devem ser diferentes.';
  END IF;
  IF _quantity <= 0 THEN
    RAISE EXCEPTION 'Informe uma quantidade maior que zero.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE id = _item_id AND company_id = _company_id) OR
     NOT EXISTS (SELECT 1 FROM public.warehouses WHERE id = _source_warehouse_id AND company_id = _company_id) OR
     NOT EXISTS (SELECT 1 FROM public.warehouses WHERE id = _destination_warehouse_id AND company_id = _company_id) THEN
    RAISE EXCEPTION 'Item ou depósito inválido para esta empresa.';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(_company_id::text || _item_id::text || _source_warehouse_id::text, 0));
  _available := public.stock_quantity_at(_company_id, _item_id, _source_warehouse_id, NULL);
  IF _available < _quantity THEN
    RAISE EXCEPTION 'Saldo insuficiente no depósito de origem. Disponível: %.', _available;
  END IF;

  INSERT INTO public.stock_transfers (
    company_id, item_id, source_warehouse_id, destination_warehouse_id, quantity,
    unit_cost, transferred_at, document, notes, created_by
  ) VALUES (
    _company_id, _item_id, _source_warehouse_id, _destination_warehouse_id, _quantity,
    GREATEST(COALESCE(_unit_cost, 0), 0), _transferred_at, COALESCE(_document, ''), COALESCE(_notes, ''), auth.uid()
  ) RETURNING id INTO _transfer_id;

  INSERT INTO public.stock_movements (
    company_id, warehouse_id, item_id, kind, quantity, unit_cost, moved_at,
    document, notes, origin, created_by, transfer_id
  ) VALUES
    (_company_id, _source_warehouse_id, _item_id, 'out', _quantity, GREATEST(COALESCE(_unit_cost, 0), 0), _transferred_at, COALESCE(_document, ''), COALESCE(_notes, ''), 'transfer', auth.uid(), _transfer_id),
    (_company_id, _destination_warehouse_id, _item_id, 'in', _quantity, GREATEST(COALESCE(_unit_cost, 0), 0), _transferred_at, COALESCE(_document, ''), COALESCE(_notes, ''), 'transfer', auth.uid(), _transfer_id);

  INSERT INTO public.access_logs(user_id, company_id, action, detail)
  VALUES (auth.uid(), _company_id, 'stock.transfer.created', 'Transferência de estoque ' || _transfer_id::text);

  RETURN _transfer_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_stock_transfer(uuid, uuid, uuid, uuid, numeric, numeric, date, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_stock_transfer(uuid, uuid, uuid, uuid, numeric, numeric, date, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.create_inventory_count(
  _company_id uuid,
  _item_id uuid,
  _warehouse_id uuid,
  _counted_quantity numeric,
  _counted_at date,
  _notes text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _count_id uuid;
  _system_quantity numeric;
BEGIN
  IF NOT (_company_id = public.current_company_id() OR public.is_devitech_admin()) THEN
    RAISE EXCEPTION 'Empresa não autorizada.';
  END IF;
  IF _counted_quantity < 0 THEN
    RAISE EXCEPTION 'A quantidade contada não pode ser negativa.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE id = _item_id AND company_id = _company_id) OR
     NOT EXISTS (SELECT 1 FROM public.warehouses WHERE id = _warehouse_id AND company_id = _company_id) THEN
    RAISE EXCEPTION 'Item ou depósito inválido para esta empresa.';
  END IF;

  _system_quantity := public.stock_quantity_at(_company_id, _item_id, _warehouse_id, NULL);
  INSERT INTO public.inventory_counts (
    company_id, item_id, warehouse_id, system_quantity, counted_quantity,
    difference, adjustment, counted_at, status, notes, created_by
  ) VALUES (
    _company_id, _item_id, _warehouse_id, _system_quantity, _counted_quantity,
    _counted_quantity - _system_quantity, 0, _counted_at, 'draft', COALESCE(_notes, ''), auth.uid()
  ) RETURNING id INTO _count_id;

  INSERT INTO public.access_logs(user_id, company_id, action, detail)
  VALUES (auth.uid(), _company_id, 'stock.inventory.created', 'Conferência de inventário ' || _count_id::text);

  RETURN _count_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_inventory_count(uuid, uuid, uuid, numeric, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_inventory_count(uuid, uuid, uuid, numeric, date, text) TO service_role;

CREATE OR REPLACE FUNCTION public.apply_inventory_count(_count_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _count public.inventory_counts%ROWTYPE;
  _current numeric;
  _adjustment numeric;
  _movement_id uuid;
  _unit_cost numeric;
BEGIN
  SELECT * INTO _count FROM public.inventory_counts WHERE id = _count_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Conferência não encontrada.'; END IF;
  IF NOT (_count.company_id = public.current_company_id() OR public.is_devitech_admin()) THEN
    RAISE EXCEPTION 'Empresa não autorizada.';
  END IF;
  IF _count.status <> 'draft' THEN RAISE EXCEPTION 'Esta conferência já foi finalizada.'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(_count.company_id::text || _count.item_id::text || _count.warehouse_id::text, 0));
  _current := public.stock_quantity_at(_count.company_id, _count.item_id, _count.warehouse_id, NULL);
  _adjustment := _count.counted_quantity - _current;
  SELECT unit_cost INTO _unit_cost FROM public.inventory_items WHERE id = _count.item_id;

  IF _adjustment <> 0 THEN
    INSERT INTO public.stock_movements (
      company_id, warehouse_id, item_id, kind, quantity, unit_cost, moved_at,
      document, notes, origin, created_by, inventory_count_id
    ) VALUES (
      _count.company_id, _count.warehouse_id, _count.item_id,
      CASE WHEN _adjustment < 0 THEN 'out' ELSE 'in' END,
      ABS(_adjustment), COALESCE(_unit_cost, 0), _count.counted_at,
      'Inventário ' || _count.id::text, _count.notes, 'inventory', auth.uid(), _count.id
    ) RETURNING id INTO _movement_id;
  END IF;

  UPDATE public.inventory_counts
  SET system_quantity = _current,
      difference = _count.counted_quantity - _current,
      adjustment = _adjustment,
      status = 'adjusted',
      adjusted_at = now()
  WHERE id = _count.id;

  INSERT INTO public.access_logs(user_id, company_id, action, detail)
  VALUES (auth.uid(), _count.company_id, 'stock.inventory.adjusted', 'Inventário ajustado ' || _count.id::text);

  RETURN _movement_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.apply_inventory_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_inventory_count(uuid) TO service_role;