CREATE TABLE public.fleet_assets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id), name text NOT NULL, code text NOT NULL, kind text NOT NULL DEFAULT 'vehicle' CHECK(kind IN ('vehicle','machine','implement')), plate text NOT NULL DEFAULT '', meter_unit text NOT NULL DEFAULT 'km' CHECK(meter_unit IN ('km','h')), initial_meter numeric(14,2) NOT NULL DEFAULT 0 CHECK(initial_meter >= 0), status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')), notes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(company_id,code), UNIQUE(id,company_id)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.fleet_assets TO authenticated;
GRANT ALL ON public.fleet_assets TO service_role;
ALTER TABLE public.fleet_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY fleet_read ON public.fleet_assets FOR SELECT TO authenticated USING ((public.is_devitech_admin() OR company_id=public.current_company_id()) AND (public.can_access_submodule('veiculos.fleet','view') OR public.can_access_submodule('veiculos.fuel','view') OR public.can_access_submodule('veiculos.maintenance','view') OR public.can_access_submodule('veiculos.costs','view')));
CREATE POLICY fleet_insert ON public.fleet_assets FOR INSERT TO authenticated WITH CHECK ((public.is_devitech_admin() OR company_id=public.current_company_id()) AND public.can_access_submodule('veiculos.fleet','create'));
CREATE POLICY fleet_update ON public.fleet_assets FOR UPDATE TO authenticated USING ((public.is_devitech_admin() OR company_id=public.current_company_id()) AND public.can_access_submodule('veiculos.fleet','edit')) WITH CHECK ((public.is_devitech_admin() OR company_id=public.current_company_id()) AND public.can_access_submodule('veiculos.fleet','edit'));
CREATE POLICY fleet_delete ON public.fleet_assets FOR DELETE TO authenticated USING ((public.is_devitech_admin() OR company_id=public.current_company_id()) AND public.can_access_submodule('veiculos.fleet','delete'));
CREATE TRIGGER fleet_updated BEFORE UPDATE ON public.fleet_assets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.rural_properties ADD CONSTRAINT rural_properties_id_company_unique UNIQUE(id,company_id);
ALTER TABLE public.cost_centers ADD CONSTRAINT cost_centers_id_company_unique UNIQUE(id,company_id);
ALTER TABLE public.crop_seasons ADD CONSTRAINT crop_seasons_id_company_unique UNIQUE(id,company_id);
CREATE TABLE public.fleet_fuel_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id), asset_id uuid NOT NULL, recorded_at date NOT NULL, meter numeric(14,2) NOT NULL CHECK(meter>=0), liters numeric(14,3) NOT NULL CHECK(liters>0), unit_price numeric(14,4) NOT NULL CHECK(unit_price>=0), total numeric(14,2) GENERATED ALWAYS AS (liters*unit_price) STORED, full_tank boolean NOT NULL DEFAULT false, supplier text NOT NULL DEFAULT '', property_id uuid, cost_center_id uuid, season_id uuid, notes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), FOREIGN KEY(asset_id,company_id) REFERENCES public.fleet_assets(id,company_id), FOREIGN KEY(property_id,company_id) REFERENCES public.rural_properties(id,company_id), FOREIGN KEY(cost_center_id,company_id) REFERENCES public.cost_centers(id,company_id), FOREIGN KEY(season_id,company_id) REFERENCES public.crop_seasons(id,company_id)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.fleet_fuel_records TO authenticated;
GRANT ALL ON public.fleet_fuel_records TO service_role;
ALTER TABLE public.fleet_fuel_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY fuel_read ON public.fleet_fuel_records FOR SELECT TO authenticated USING ((public.is_devitech_admin() OR company_id=public.current_company_id()) AND (public.can_access_submodule('veiculos.fuel','view') OR public.can_access_submodule('veiculos.costs','view')));
CREATE POLICY fuel_insert ON public.fleet_fuel_records FOR INSERT TO authenticated WITH CHECK ((public.is_devitech_admin() OR company_id=public.current_company_id()) AND public.can_access_submodule('veiculos.fuel','create'));
CREATE POLICY fuel_update ON public.fleet_fuel_records FOR UPDATE TO authenticated USING ((public.is_devitech_admin() OR company_id=public.current_company_id()) AND public.can_access_submodule('veiculos.fuel','edit')) WITH CHECK ((public.is_devitech_admin() OR company_id=public.current_company_id()) AND public.can_access_submodule('veiculos.fuel','edit'));
CREATE POLICY fuel_delete ON public.fleet_fuel_records FOR DELETE TO authenticated USING ((public.is_devitech_admin() OR company_id=public.current_company_id()) AND public.can_access_submodule('veiculos.fuel','delete'));
CREATE TRIGGER fuel_updated BEFORE UPDATE ON public.fleet_fuel_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX fuel_company_asset_date ON public.fleet_fuel_records(company_id,asset_id,recorded_at);
CREATE TABLE public.fleet_maintenance_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id), asset_id uuid NOT NULL, description text NOT NULL, scheduled_at date NOT NULL, completed_at date, meter numeric(14,2) NOT NULL DEFAULT 0 CHECK(meter>=0), next_meter numeric(14,2) CHECK(next_meter>=0), amount numeric(14,2) NOT NULL DEFAULT 0 CHECK(amount>=0), status text NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','completed','canceled')), supplier text NOT NULL DEFAULT '', property_id uuid, cost_center_id uuid, season_id uuid, notes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), FOREIGN KEY(asset_id,company_id) REFERENCES public.fleet_assets(id,company_id), FOREIGN KEY(property_id,company_id) REFERENCES public.rural_properties(id,company_id), FOREIGN KEY(cost_center_id,company_id) REFERENCES public.cost_centers(id,company_id), FOREIGN KEY(season_id,company_id) REFERENCES public.crop_seasons(id,company_id), CHECK((status='completed' AND completed_at IS NOT NULL) OR (status<>'completed' AND completed_at IS NULL))
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.fleet_maintenance_records TO authenticated;
GRANT ALL ON public.fleet_maintenance_records TO service_role;
ALTER TABLE public.fleet_maintenance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY maintenance_read ON public.fleet_maintenance_records FOR SELECT TO authenticated USING ((public.is_devitech_admin() OR company_id=public.current_company_id()) AND (public.can_access_submodule('veiculos.maintenance','view') OR public.can_access_submodule('veiculos.costs','view')));
CREATE POLICY maintenance_insert ON public.fleet_maintenance_records FOR INSERT TO authenticated WITH CHECK ((public.is_devitech_admin() OR company_id=public.current_company_id()) AND public.can_access_submodule('veiculos.maintenance','create'));
CREATE POLICY maintenance_update ON public.fleet_maintenance_records FOR UPDATE TO authenticated USING ((public.is_devitech_admin() OR company_id=public.current_company_id()) AND public.can_access_submodule('veiculos.maintenance','edit')) WITH CHECK ((public.is_devitech_admin() OR company_id=public.current_company_id()) AND public.can_access_submodule('veiculos.maintenance','edit'));
CREATE POLICY maintenance_delete ON public.fleet_maintenance_records FOR DELETE TO authenticated USING ((public.is_devitech_admin() OR company_id=public.current_company_id()) AND public.can_access_submodule('veiculos.maintenance','delete'));
CREATE TRIGGER maintenance_updated BEFORE UPDATE ON public.fleet_maintenance_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX maintenance_company_asset_date ON public.fleet_maintenance_records(company_id,asset_id,scheduled_at);
CREATE FUNCTION public.validate_fleet_meter() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.fleet_assets a WHERE a.id=NEW.asset_id AND a.company_id=NEW.company_id AND NEW.meter>=a.initial_meter) THEN RAISE EXCEPTION 'Medidor inferior à leitura inicial ou veículo inválido.' USING ERRCODE='23514'; END IF;
 RETURN NEW; END; $$;
REVOKE ALL ON FUNCTION public.validate_fleet_meter() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER fuel_meter BEFORE INSERT OR UPDATE ON public.fleet_fuel_records FOR EACH ROW EXECUTE FUNCTION public.validate_fleet_meter();
CREATE TRIGGER maintenance_meter BEFORE INSERT OR UPDATE ON public.fleet_maintenance_records FOR EACH ROW EXECUTE FUNCTION public.validate_fleet_meter();