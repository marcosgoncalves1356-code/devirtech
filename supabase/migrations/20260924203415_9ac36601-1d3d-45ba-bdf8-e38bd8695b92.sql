ALTER TABLE public.financial_entries
  ADD COLUMN season_id uuid REFERENCES public.crop_seasons(id) ON DELETE SET NULL;

ALTER TABLE public.sales
  ADD COLUMN season_id uuid REFERENCES public.crop_seasons(id) ON DELETE SET NULL;

CREATE INDEX financial_entries_company_season_idx
  ON public.financial_entries(company_id, season_id);

CREATE INDEX sales_company_season_idx
  ON public.sales(company_id, season_id);

CREATE OR REPLACE FUNCTION public.validate_financial_entry_season()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.season_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.crop_seasons
    WHERE id = NEW.season_id
      AND company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'Safra inválida para esta empresa.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER financial_entries_validate_season
  BEFORE INSERT OR UPDATE OF season_id, company_id ON public.financial_entries
  FOR EACH ROW EXECUTE FUNCTION public.validate_financial_entry_season();

CREATE OR REPLACE FUNCTION public.validate_sales_season()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.season_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.crop_seasons
    WHERE id = NEW.season_id
      AND company_id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'Safra inválida para esta empresa.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sales_validate_season
  BEFORE INSERT OR UPDATE OF season_id, company_id ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.validate_sales_season();