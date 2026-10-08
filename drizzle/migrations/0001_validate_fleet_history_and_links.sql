CREATE OR REPLACE FUNCTION public.validate_fleet_meter() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE event_date date; BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.fleet_assets a WHERE a.id=NEW.asset_id AND a.company_id=NEW.company_id AND NEW.meter>=a.initial_meter) THEN RAISE EXCEPTION 'Medidor inferior à leitura inicial ou veículo inválido.' USING ERRCODE='23514'; END IF;
 IF NEW.property_id IS NOT NULL AND NEW.season_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.crop_seasons s WHERE s.id=NEW.season_id AND s.company_id=NEW.company_id AND s.property_id=NEW.property_id) THEN RAISE EXCEPTION 'A safra deve pertencer à propriedade selecionada.' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='fleet_fuel_records' THEN
 event_date=NEW.recorded_at;
 IF EXISTS(SELECT 1 FROM public.fleet_fuel_records f WHERE f.asset_id=NEW.asset_id AND f.company_id=NEW.company_id AND f.id<>NEW.id AND ((f.recorded_at<event_date AND f.meter>NEW.meter) OR (f.recorded_at>event_date AND f.meter<NEW.meter))) THEN RAISE EXCEPTION 'A leitura deve respeitar o histórico de abastecimentos.' USING ERRCODE='23514'; END IF;
 ELSE
 IF NEW.next_meter IS NOT NULL AND NEW.next_meter<=NEW.meter THEN RAISE EXCEPTION 'A próxima leitura deve superar a leitura atual.' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW; END; $$;
REVOKE ALL ON FUNCTION public.validate_fleet_meter() FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.protect_fleet_history() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF (NEW.initial_meter<>OLD.initial_meter OR NEW.meter_unit<>OLD.meter_unit OR NEW.company_id<>OLD.company_id) AND (EXISTS(SELECT 1 FROM public.fleet_fuel_records WHERE asset_id=OLD.id) OR EXISTS(SELECT 1 FROM public.fleet_maintenance_records WHERE asset_id=OLD.id)) THEN RAISE EXCEPTION 'Não é possível alterar a empresa, unidade ou leitura inicial de um veículo com histórico.' USING ERRCODE='23514'; END IF;
 RETURN NEW; END; $$;
REVOKE ALL ON FUNCTION public.protect_fleet_history() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER protect_fleet_history BEFORE UPDATE ON public.fleet_assets FOR EACH ROW EXECUTE FUNCTION public.protect_fleet_history();