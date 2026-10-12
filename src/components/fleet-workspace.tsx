import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { ModuleTabs } from "@/components/module-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import { listCostCenters, type CostCenter } from "@/lib/cost-centers.functions";
import { listCropSeasons, type CropSeason } from "@/lib/production.functions";
import { listRuralProperties, type RuralProperty } from "@/lib/properties.functions";
import {
  deleteFleetAsset, deleteFleetFuelRecord, deleteFleetMaintenanceRecord,
  listFleetAssets, listFleetFuelRecords, listFleetMaintenanceRecords,
  saveFleetAsset, saveFleetFuelRecord, saveFleetMaintenanceRecord,
  type FleetAsset, type FleetFuelRecord, type FleetMaintenanceRecord,
} from "@/lib/fleet.functions";

type AssetDraft = { id?: string; name: string; code: string; kind: string; plate: string; meterUnit: string; initialMeter: string; status: "active" | "inactive"; notes: string };
type FuelDraft = { id?: string; assetId: string; recordedAt: string; meter: string; liters: string; unitPrice: string; fullTank: boolean; supplier: string; propertyId: string; costCenterId: string; seasonId: string; notes: string };
type MaintenanceDraft = { id?: string; assetId: string; description: string; scheduledAt: string; completedAt: string; meter: string; nextMeter: string; amount: string; status: "scheduled" | "completed" | "canceled"; supplier: string; propertyId: string; costCenterId: string; seasonId: string; notes: string };

const emptyAsset = (): AssetDraft => ({ name: "", code: "", kind: "vehicle", plate: "", meterUnit: "km", initialMeter: "", status: "active", notes: "" });
const today = () => new Date().toISOString().slice(0, 10);
const emptyFuel = (assetId = ""): FuelDraft => ({ assetId, recordedAt: today(), meter: "", liters: "", unitPrice: "", fullTank: true, supplier: "", propertyId: "", costCenterId: "", seasonId: "", notes: "" });
const emptyMaintenance = (assetId = ""): MaintenanceDraft => ({ assetId, description: "", scheduledAt: today(), completedAt: "", meter: "", nextMeter: "", amount: "", status: "scheduled", supplier: "", propertyId: "", costCenterId: "", seasonId: "", notes: "" });

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const numberFmt = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
const dateFmt = (value: string | null) => (value ? new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR") : "—");

const kindLabels: Record<string, string> = { vehicle: "Veículo", machine: "Máquina", implement: "Implemento" };
const maintenanceStatusLabels: Record<string, string> = { scheduled: "Agendada", completed: "Concluída", canceled: "Cancelada" };

const fieldClass = "field-shell w-full text-sm";
const labelClass = "space-y-1 text-xs text-muted-foreground";

export function FleetWorkspace() {
  const { company, canCreate, canEdit, canDelete } = useCompany();
  const queryClient = useQueryClient();
  const fetchAssets = useServerFn(listFleetAssets);
  const fetchFuel = useServerFn(listFleetFuelRecords);
  const fetchMaintenance = useServerFn(listFleetMaintenanceRecords);
  const fetchProperties = useServerFn(listRuralProperties);
  const fetchCostCenters = useServerFn(listCostCenters);
  const fetchSeasons = useServerFn(listCropSeasons);
  const persistAsset = useServerFn(saveFleetAsset);
  const persistFuel = useServerFn(saveFleetFuelRecord);
  const persistMaintenance = useServerFn(saveFleetMaintenanceRecord);
  const removeAsset = useServerFn(deleteFleetAsset);
  const removeFuel = useServerFn(deleteFleetFuelRecord);
  const removeMaintenance = useServerFn(deleteFleetMaintenanceRecord);

  const [assetDraft, setAssetDraft] = useState<AssetDraft | null>(null);
  const [fuelDraft, setFuelDraft] = useState<FuelDraft | null>(null);
  const [maintenanceDraft, setMaintenanceDraft] = useState<MaintenanceDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const args = { data: { companyId: company.id } };
  const assetsQuery = useQuery({ queryKey: ["fleet-assets", company.id], queryFn: () => fetchAssets(args), enabled: Boolean(company.id) });
  const fuelQuery = useQuery({ queryKey: ["fleet-fuel", company.id], queryFn: () => fetchFuel(args), enabled: Boolean(company.id) });
  const maintenanceQuery = useQuery({ queryKey: ["fleet-maintenance", company.id], queryFn: () => fetchMaintenance(args), enabled: Boolean(company.id) });
  const propertiesQuery = useQuery({ queryKey: ["rural-properties", company.id], queryFn: () => fetchProperties(args), enabled: Boolean(company.id) });
  const costCentersQuery = useQuery({ queryKey: ["cost-centers", company.id], queryFn: () => fetchCostCenters(args), enabled: Boolean(company.id) });
  const seasonsQuery = useQuery({ queryKey: ["crop-seasons", company.id], queryFn: () => fetchSeasons(args), enabled: Boolean(company.id) });

  const assets = assetsQuery.data ?? [];
  const fuelRecords = fuelQuery.data ?? [];
  const maintenanceRecords = maintenanceQuery.data ?? [];
  const properties = propertiesQuery.data ?? [];
  const costCenters = costCentersQuery.data ?? [];
  const seasons = seasonsQuery.data ?? [];

  const assetNames = useMemo(() => new Map(assets.map((item) => [item.id, item.name])), [assets]);

  const invalidate = () => {
    setError(null); setAssetDraft(null); setFuelDraft(null); setMaintenanceDraft(null);
    void queryClient.invalidateQueries({ queryKey: ["fleet-assets", company.id] });
    void queryClient.invalidateQueries({ queryKey: ["fleet-fuel", company.id] });
    void queryClient.invalidateQueries({ queryKey: ["fleet-maintenance", company.id] });
  };
  const onError = (cause: Error) => setError(cause.message);

  const assetMutation = useMutation({ mutationFn: (draft: AssetDraft) => persistAsset({ data: { ...draft, companyId: company.id, initialMeter: Number(draft.initialMeter || 0) } }), onSuccess: invalidate, onError });
  const fuelMutation = useMutation({
    mutationFn: (draft: FuelDraft) => persistFuel({ data: { ...draft, companyId: company.id, meter: Number(draft.meter || 0), liters: Number(draft.liters || 0), unitPrice: Number(draft.unitPrice || 0), propertyId: draft.propertyId || null, costCenterId: draft.costCenterId || null, seasonId: draft.seasonId || null } }),
    onSuccess: invalidate, onError,
  });
  const maintenanceMutation = useMutation({
    mutationFn: (draft: MaintenanceDraft) => persistMaintenance({ data: { ...draft, companyId: company.id, meter: Number(draft.meter || 0), nextMeter: draft.nextMeter ? Number(draft.nextMeter) : null, amount: Number(draft.amount || 0), completedAt: draft.completedAt || null, propertyId: draft.propertyId || null, costCenterId: draft.costCenterId || null, seasonId: draft.seasonId || null } }),
    onSuccess: invalidate, onError,
  });
  const deleteAssetMutation = useMutation({ mutationFn: (id: string) => removeAsset({ data: { id, companyId: company.id } }), onSuccess: invalidate, onError });
  const deleteFuelMutation = useMutation({ mutationFn: (id: string) => removeFuel({ data: { id, companyId: company.id } }), onSuccess: invalidate, onError });
  const deleteMaintenanceMutation = useMutation({ mutationFn: (id: string) => removeMaintenance({ data: { id, companyId: company.id } }), onSuccess: invalidate, onError });

  const linkSelects = (draft: FuelDraft | MaintenanceDraft, setDraft: (next: FuelDraft & MaintenanceDraft) => void) => (
    <>
      <label className={labelClass}>Propriedade
        <select className={fieldClass} value={draft.propertyId} onChange={(e) => setDraft({ ...draft, propertyId: e.target.value } as FuelDraft & MaintenanceDraft)}>
          <option value="">Nenhuma</option>
          {properties.map((item: RuralProperty) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <label className={labelClass}>Centro de custo
        <select className={fieldClass} value={draft.costCenterId} onChange={(e) => setDraft({ ...draft, costCenterId: e.target.value } as FuelDraft & MaintenanceDraft)}>
          <option value="">Nenhum</option>
          {costCenters.map((item: CostCenter) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <label className={labelClass}>Safra
        <select className={fieldClass} value={draft.seasonId} onChange={(e) => setDraft({ ...draft, seasonId: e.target.value } as FuelDraft & MaintenanceDraft)}>
          <option value="">Nenhuma</option>
          {seasons.map((item: CropSeason) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
    </>
  );

  const assetForm = assetDraft ? (
    <form className="space-y-4 border-y border-border/60 bg-card/40 px-3 py-5 sm:rounded-lg sm:border sm:p-5" onSubmit={(event) => { event.preventDefault(); assetMutation.mutate(assetDraft); }}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className={`${labelClass} sm:col-span-2`}>Nome<input className={fieldClass} required value={assetDraft.name} onChange={(e) => setAssetDraft({ ...assetDraft, name: e.target.value })} /></label>
        <label className={labelClass}>Código<input className={fieldClass} value={assetDraft.code} onChange={(e) => setAssetDraft({ ...assetDraft, code: e.target.value })} /></label>
        <label className={labelClass}>Tipo
          <select className={fieldClass} value={assetDraft.kind} onChange={(e) => setAssetDraft({ ...assetDraft, kind: e.target.value })}>
            <option value="vehicle">Veículo</option><option value="machine">Máquina</option><option value="implement">Implemento</option>
          </select>
        </label>
        <label className={labelClass}>Placa<input className={fieldClass} value={assetDraft.plate} onChange={(e) => setAssetDraft({ ...assetDraft, plate: e.target.value })} /></label>
        <label className={labelClass}>Medidor
          <select className={fieldClass} value={assetDraft.meterUnit} onChange={(e) => setAssetDraft({ ...assetDraft, meterUnit: e.target.value })}>
            <option value="km">Quilômetros (km)</option><option value="h">Horas (h)</option>
          </select>
        </label>
        <label className={labelClass}>Medidor inicial<input className={fieldClass} type="number" min="0" step="0.01" value={assetDraft.initialMeter} onChange={(e) => setAssetDraft({ ...assetDraft, initialMeter: e.target.value })} /></label>
        <label className={labelClass}>Situação
          <select className={fieldClass} value={assetDraft.status} onChange={(e) => setAssetDraft({ ...assetDraft, status: e.target.value as AssetDraft["status"] })}>
            <option value="active">Ativo</option><option value="inactive">Inativo</option>
          </select>
        </label>
        <label className={`${labelClass} sm:col-span-2 lg:col-span-4`}>Observações<textarea className={`${fieldClass} min-h-20`} value={assetDraft.notes} onChange={(e) => setAssetDraft({ ...assetDraft, notes: e.target.value })} /></label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setAssetDraft(null)}>Cancelar</Button>
        <Button type="submit" disabled={assetMutation.isPending}>{assetMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Salvar</Button>
      </div>
    </form>
  ) : null;

  const fuelForm = fuelDraft ? (
    <form className="space-y-4 border-y border-border/60 bg-card/40 px-3 py-5 sm:rounded-lg sm:border sm:p-5" onSubmit={(event) => { event.preventDefault(); fuelMutation.mutate(fuelDraft); }}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className={`${labelClass} sm:col-span-2`}>Veículo / máquina
          <select className={fieldClass} required value={fuelDraft.assetId} onChange={(e) => setFuelDraft({ ...fuelDraft, assetId: e.target.value })}>
            <option value="">Selecione</option>
            {assets.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className={labelClass}>Data<input className={fieldClass} type="date" required value={fuelDraft.recordedAt} onChange={(e) => setFuelDraft({ ...fuelDraft, recordedAt: e.target.value })} /></label>
        <label className={labelClass}>Medidor<input className={fieldClass} type="number" min="0" step="0.01" value={fuelDraft.meter} onChange={(e) => setFuelDraft({ ...fuelDraft, meter: e.target.value })} /></label>
        <label className={labelClass}>Litros<input className={fieldClass} type="number" min="0" step="0.001" required value={fuelDraft.liters} onChange={(e) => setFuelDraft({ ...fuelDraft, liters: e.target.value })} /></label>
        <label className={labelClass}>Valor por litro<input className={fieldClass} type="number" min="0" step="0.0001" value={fuelDraft.unitPrice} onChange={(e) => setFuelDraft({ ...fuelDraft, unitPrice: e.target.value })} /></label>
        <label className={labelClass}>Fornecedor<input className={fieldClass} value={fuelDraft.supplier} onChange={(e) => setFuelDraft({ ...fuelDraft, supplier: e.target.value })} /></label>
        <label className="flex items-end gap-2 pb-2 text-xs text-muted-foreground">
          <input type="checkbox" className="h-4 w-4 accent-primary" checked={fuelDraft.fullTank} onChange={(e) => setFuelDraft({ ...fuelDraft, fullTank: e.target.checked })} /> Tanque cheio
        </label>
        {linkSelects(fuelDraft, (next) => setFuelDraft(next))}
        <label className={`${labelClass} sm:col-span-2 lg:col-span-4`}>Observações<textarea className={`${fieldClass} min-h-20`} value={fuelDraft.notes} onChange={(e) => setFuelDraft({ ...fuelDraft, notes: e.target.value })} /></label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setFuelDraft(null)}>Cancelar</Button>
        <Button type="submit" disabled={fuelMutation.isPending}>{fuelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Salvar</Button>
      </div>
    </form>
  ) : null;

  const maintenanceForm = maintenanceDraft ? (
    <form className="space-y-4 border-y border-border/60 bg-card/40 px-3 py-5 sm:rounded-lg sm:border sm:p-5" onSubmit={(event) => { event.preventDefault(); maintenanceMutation.mutate(maintenanceDraft); }}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className={`${labelClass} sm:col-span-2`}>Veículo / máquina
          <select className={fieldClass} required value={maintenanceDraft.assetId} onChange={(e) => setMaintenanceDraft({ ...maintenanceDraft, assetId: e.target.value })}>
            <option value="">Selecione</option>
            {assets.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className={`${labelClass} sm:col-span-2`}>Descrição<input className={fieldClass} required value={maintenanceDraft.description} onChange={(e) => setMaintenanceDraft({ ...maintenanceDraft, description: e.target.value })} /></label>
        <label className={labelClass}>Data prevista<input className={fieldClass} type="date" required value={maintenanceDraft.scheduledAt} onChange={(e) => setMaintenanceDraft({ ...maintenanceDraft, scheduledAt: e.target.value })} /></label>
        <label className={labelClass}>Data de conclusão<input className={fieldClass} type="date" value={maintenanceDraft.completedAt} onChange={(e) => setMaintenanceDraft({ ...maintenanceDraft, completedAt: e.target.value })} /></label>
        <label className={labelClass}>Medidor atual<input className={fieldClass} type="number" min="0" step="0.01" value={maintenanceDraft.meter} onChange={(e) => setMaintenanceDraft({ ...maintenanceDraft, meter: e.target.value })} /></label>
        <label className={labelClass}>Próximo medidor<input className={fieldClass} type="number" min="0" step="0.01" value={maintenanceDraft.nextMeter} onChange={(e) => setMaintenanceDraft({ ...maintenanceDraft, nextMeter: e.target.value })} /></label>
        <label className={labelClass}>Valor<input className={fieldClass} type="number" min="0" step="0.01" value={maintenanceDraft.amount} onChange={(e) => setMaintenanceDraft({ ...maintenanceDraft, amount: e.target.value })} /></label>
        <label className={labelClass}>Fornecedor<input className={fieldClass} value={maintenanceDraft.supplier} onChange={(e) => setMaintenanceDraft({ ...maintenanceDraft, supplier: e.target.value })} /></label>
        <label className={labelClass}>Situação
          <select className={fieldClass} value={maintenanceDraft.status} onChange={(e) => setMaintenanceDraft({ ...maintenanceDraft, status: e.target.value as MaintenanceDraft["status"] })}>
            <option value="scheduled">Agendada</option><option value="completed">Concluída</option><option value="canceled">Cancelada</option>
          </select>
        </label>
        {linkSelects(maintenanceDraft, (next) => setMaintenanceDraft(next))}
        <label className={`${labelClass} sm:col-span-2 lg:col-span-4`}>Observações<textarea className={`${fieldClass} min-h-20`} value={maintenanceDraft.notes} onChange={(e) => setMaintenanceDraft({ ...maintenanceDraft, notes: e.target.value })} /></label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setMaintenanceDraft(null)}>Cancelar</Button>
        <Button type="submit" disabled={maintenanceMutation.isPending}>{maintenanceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Salvar</Button>
      </div>
    </form>
  ) : null;

  const fleetTab = (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold">Frota e implementos</h2><p className="text-sm text-muted-foreground">Veículos, máquinas e implementos da empresa.</p></div>
        {canCreate("veiculos.fleet") ? <Button variant="glow" onClick={() => setAssetDraft(emptyAsset())}><Plus className="h-4 w-4" /> Novo veículo</Button> : null}
      </div>
      {assetForm}
      {assetsQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : assets.length === 0 ? (
        <p className="border-y border-border/60 py-8 text-center text-sm text-muted-foreground">Nenhum veículo cadastrado.</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {assets.map((item: FleetAsset) => (
            <article key={item.id} className="space-y-2 rounded-lg border border-border/60 bg-card/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div><h3 className="font-semibold">{item.name}</h3><p className="text-xs text-muted-foreground">{kindLabels[item.kind] ?? item.kind}{item.plate ? ` · ${item.plate}` : ""}{item.code ? ` · ${item.code}` : ""}</p></div>
                <Badge variant="outline">{item.status === "active" ? "Ativo" : "Inativo"}</Badge>
              </div>
              <p className="text-sm">Medidor inicial: {numberFmt(Number(item.initial_meter))} {item.meter_unit}</p>
              <div className="flex justify-end gap-1">
                {canEdit("veiculos.fleet") ? <Button size="icon" variant="ghost" aria-label={`Editar ${item.name}`} onClick={() => setAssetDraft({ id: item.id, name: item.name, code: item.code, kind: item.kind, plate: item.plate, meterUnit: item.meter_unit, initialMeter: String(item.initial_meter), status: item.status, notes: item.notes })}><Pencil className="h-4 w-4" /></Button> : null}
                {canDelete("veiculos.fleet") ? <Button size="icon" variant="ghost" aria-label={`Excluir ${item.name}`} onClick={() => { if (window.confirm(`Excluir ${item.name}?`)) deleteAssetMutation.mutate(item.id); }}><Trash2 className="h-4 w-4" /></Button> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  const fuelTab = (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold">Abastecimentos</h2><p className="text-sm text-muted-foreground">Consumo de combustível por veículo, com vínculo a propriedade, centro de custo e safra.</p></div>
        {canCreate("veiculos.fuel") ? <Button variant="glow" onClick={() => setFuelDraft(emptyFuel(assets[0]?.id ?? ""))} disabled={assets.length === 0}><Plus className="h-4 w-4" /> Novo abastecimento</Button> : null}
      </div>
      {fuelForm}
      {fuelQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : fuelRecords.length === 0 ? (
        <p className="border-y border-border/60 py-8 text-center text-sm text-muted-foreground">Nenhum abastecimento registrado.</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {fuelRecords.map((item: FleetFuelRecord) => (
            <article key={item.id} className="space-y-2 rounded-lg border border-border/60 bg-card/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div><h3 className="font-semibold">{assetNames.get(item.asset_id) ?? "Veículo"}</h3><p className="text-xs text-muted-foreground">{dateFmt(item.recorded_at)} · {numberFmt(Number(item.meter))} {assets.find((a) => a.id === item.asset_id)?.meter_unit ?? ""}</p></div>
                <Badge variant="outline">{item.full_tank ? "Tanque cheio" : "Parcial"}</Badge>
              </div>
              <p className="text-sm">{numberFmt(Number(item.liters))} L × {money(Number(item.unit_price))} = <strong>{money(Number(item.total))}</strong></p>
              {item.supplier ? <p className="text-xs text-muted-foreground">Fornecedor: {item.supplier}</p> : null}
              <div className="flex justify-end gap-1">
                {canEdit("veiculos.fuel") ? <Button size="icon" variant="ghost" aria-label="Editar abastecimento" onClick={() => setFuelDraft({ id: item.id, assetId: item.asset_id, recordedAt: item.recorded_at, meter: String(item.meter), liters: String(item.liters), unitPrice: String(item.unit_price), fullTank: item.full_tank, supplier: item.supplier, propertyId: item.property_id ?? "", costCenterId: item.cost_center_id ?? "", seasonId: item.season_id ?? "", notes: item.notes })}><Pencil className="h-4 w-4" /></Button> : null}
                {canDelete("veiculos.fuel") ? <Button size="icon" variant="ghost" aria-label="Excluir abastecimento" onClick={() => { if (window.confirm("Excluir este abastecimento?")) deleteFuelMutation.mutate(item.id); }}><Trash2 className="h-4 w-4" /></Button> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  const maintenanceTab = (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold">Manutenções</h2><p className="text-sm text-muted-foreground">Manutenções preventivas e corretivas com controle de medidor.</p></div>
        {canCreate("veiculos.maintenance") ? <Button variant="glow" onClick={() => setMaintenanceDraft(emptyMaintenance(assets[0]?.id ?? ""))} disabled={assets.length === 0}><Plus className="h-4 w-4" /> Nova manutenção</Button> : null}
      </div>
      {maintenanceForm}
      {maintenanceQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : maintenanceRecords.length === 0 ? (
        <p className="border-y border-border/60 py-8 text-center text-sm text-muted-foreground">Nenhuma manutenção registrada.</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {maintenanceRecords.map((item: FleetMaintenanceRecord) => (
            <article key={item.id} className="space-y-2 rounded-lg border border-border/60 bg-card/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div><h3 className="font-semibold">{item.description}</h3><p className="text-xs text-muted-foreground">{assetNames.get(item.asset_id) ?? "Veículo"} · Prevista: {dateFmt(item.scheduled_at)}</p></div>
                <Badge variant="outline">{maintenanceStatusLabels[item.status] ?? item.status}</Badge>
              </div>
              <p className="text-sm">Valor: <strong>{money(Number(item.amount))}</strong>{item.next_meter ? ` · Próxima em ${numberFmt(Number(item.next_meter))}` : ""}</p>
              <div className="flex justify-end gap-1">
                {canEdit("veiculos.maintenance") ? <Button size="icon" variant="ghost" aria-label="Editar manutenção" onClick={() => setMaintenanceDraft({ id: item.id, assetId: item.asset_id, description: item.description, scheduledAt: item.scheduled_at, completedAt: item.completed_at ?? "", meter: String(item.meter), nextMeter: item.next_meter ? String(item.next_meter) : "", amount: String(item.amount), status: item.status, supplier: item.supplier, propertyId: item.property_id ?? "", costCenterId: item.cost_center_id ?? "", seasonId: item.season_id ?? "", notes: item.notes })}><Pencil className="h-4 w-4" /></Button> : null}
                {canDelete("veiculos.maintenance") ? <Button size="icon" variant="ghost" aria-label="Excluir manutenção" onClick={() => { if (window.confirm("Excluir esta manutenção?")) deleteMaintenanceMutation.mutate(item.id); }}><Trash2 className="h-4 w-4" /></Button> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}
      <ModuleTabs
        moduleSlug="veiculos"
        tabs={[
          { value: "fleet", label: "Frota e implementos", content: fleetTab },
          { value: "fuel", label: "Abastecimentos", content: fuelTab },
          { value: "maintenance", label: "Manutenções", content: maintenanceTab },
        ]}
      />
    </div>
  );
}
