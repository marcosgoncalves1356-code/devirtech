CREATE TABLE public.crop_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  property_id uuid,
  field_id uuid,
  name text NOT NULL,
  season_year integer NOT NULL,
  start_date date,
  end_date date,
  crop_type text NOT NULL DEFAULT 'cafe',
  terrain_type text NOT NULL DEFAULT '',
  cultivated_area numeric NOT NULL DEFAULT 0,
  area_unit text NOT NULL DEFAULT 'ha',
  production_unit text NOT NULL DEFAULT 'saca',
  pick_rate numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'planned',
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crop_seasons TO authenticated;
GRANT ALL ON public.crop_seasons TO service_role;
ALTER TABLE public.crop_seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crop_seasons_company" ON public.crop_seasons FOR ALL TO authenticated
USING (company_id = public.current_company_id() OR public.is_devitech_admin())
WITH CHECK (company_id = public.current_company_id() OR public.is_devitech_admin());
CREATE TRIGGER crop_seasons_updated_at BEFORE UPDATE ON public.crop_seasons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_crop_seasons_company ON public.crop_seasons(company_id);

CREATE TABLE public.production_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES public.crop_seasons(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('planting','application')),
  activity_date date NOT NULL,
  description text NOT NULL DEFAULT '',
  inventory_item_id uuid REFERENCES public.inventory_items(id),
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT '',
  unit_cost numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  employee_id uuid REFERENCES public.employees(id),
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_activities TO authenticated;
GRANT ALL ON public.production_activities TO service_role;
ALTER TABLE public.production_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "production_activities_company" ON public.production_activities FOR ALL TO authenticated
USING (company_id = public.current_company_id() OR public.is_devitech_admin())
WITH CHECK (company_id = public.current_company_id() OR public.is_devitech_admin());
CREATE TRIGGER production_activities_updated_at BEFORE UPDATE ON public.production_activities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_production_activities_season ON public.production_activities(season_id);

CREATE TABLE public.harvest_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES public.crop_seasons(id) ON DELETE CASCADE,
  harvested_at date NOT NULL,
  employee_id uuid REFERENCES public.employees(id),
  picker_name text NOT NULL DEFAULT '',
  quantity numeric NOT NULL DEFAULT 0,
  unit_rate numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.harvest_records TO authenticated;
GRANT ALL ON public.harvest_records TO service_role;
ALTER TABLE public.harvest_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "harvest_records_company" ON public.harvest_records FOR ALL TO authenticated
USING (company_id = public.current_company_id() OR public.is_devitech_admin())
WITH CHECK (company_id = public.current_company_id() OR public.is_devitech_admin());
CREATE TRIGGER harvest_records_updated_at BEFORE UPDATE ON public.harvest_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_harvest_records_season ON public.harvest_records(season_id);