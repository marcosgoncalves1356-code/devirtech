import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Pencil, Plus, Sprout, Trash2 } from "lucide-react";

import { ModuleTabs } from "@/components/module-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import { listEmployees } from "@/lib/employees.functions";
import { listInventoryItems } from "@/lib/stock.functions";
import {
  deleteCropSeason,
  deleteHarvestRecord,
  deleteProductionActivity,
  listCropSeasons,
  listHarvestRecords,
  listProductionActivities,
  saveCropSeason,
  saveHarvestRecord,
  saveProductionActivity,
  type CropSeason,
  type HarvestRecord,
  type ProductionActivity,
} from "@/lib/production.functions";

type SeasonDraft = {
  id?: string;
  name: string;
  seasonYear: string;
  startDate: string;
  endDate: string;
  cropType: string;
  terrainType: string;
  cultivatedArea: string;
  areaUnit: string;
  productionUnit: string;
  pickRate: string;
  status: "planned" | "active" | "harvesting" | "closed";
  notes: string;
};

type ActivityDraft = {
  id?: string;
  seasonId: string;
  kind: "planting" | "application";
  activityDate: string;
  description: string;
  inventoryItemId: string;
  quantity: string;
  unit: string;
  unitCost: string;
  employeeId: string;
  notes: string;
};

type HarvestDraft = {
  id?: string;
  seasonId: string;
  harvestedAt: string;
  employeeId: string;
  pickerName: string;
  quantity: string;
  notes: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const qty = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
const dateBR = (v: string | null) => (v ? new Date(`${v}T00:00:00`).toLocaleDateString("pt-BR") : "—");

const seasonStatusLabel: Record<string, string> = {
  planned: "Planejada",
  active: "Em andamento",
  harvesting: "Em colheita",
  closed: "Encerrada",
};

const empty = (text: string) => (
  <p className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">{text}</p>
);

export function ProductionWorkspace() {
  const { company, canEdit } = useCompany();
  const editable = canEdit("producao");
  const qc = useQueryClient();
  const [tab, setTab] = useState("seasons");
  const [error, setError] = useState<string | null>(null);

  const fetchSeasons = useServerFn(listCropSeasons);
  const fetchActivities = useServerFn(listProductionActivities);
  const fetchHarvests = useServerFn(listHarvestRecords);
  const fetchEmployees = useServerFn(listEmployees);
  const fetchItems = useServerFn(listInventoryItems);
  const persistSeason = useServerFn(saveCropSeason);
  const removeSeason = useServerFn(deleteCropSeason);
  const persistActivity = useServerFn(saveProductionActivity);
  const removeActivity = useServerFn(deleteProductionActivity);
  const persistHarvest = useServerFn(saveHarvestRecord);
  const removeHarvest = useServerFn(deleteHarvestRecord);

  const args = { data: { companyId: company.id } };
  const enabled = Boolean(company.id);

  const seasonsQuery = useQuery({ queryKey: ["crop-seasons", company.id], queryFn: () => fetchSeasons(args), enabled });
  const activitiesQuery = useQuery({ queryKey: ["production-activities", company.id], queryFn: () => fetchActivities(args), enabled });
  const harvestsQuery = useQuery({ queryKey: ["harvest-records", company.id], queryFn: () => fetchHarvests(args), enabled });
  const employeesQuery = useQuery({ queryKey: ["employees", company.id], queryFn: () => fetchEmployees(args), enabled });
  const itemsQuery = useQuery({ queryKey: ["inventory-items", company.id], queryFn: () => fetchItems(args), enabled });

  const seasons = (seasonsQuery.data ?? []) as CropSeason[];
  const activities = (activitiesQuery.data ?? []) as ProductionActivity[];
  const harvests = (harvestsQuery.data ?? []) as HarvestRecord[];
  const employees = (employeesQuery.data ?? []) as { id: string; full_name: string; status: string }[];
  const items = (itemsQuery.data ?? []) as { id: string; name: string; unit: string }[];

  const seasonName = (id: string) => seasons.find((s) => s.id === id)?.name ?? "Safra";
  const seasonById = useMemo(() => new Map(seasons.map((s) => [s.id, s])), [seasons]);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["crop-seasons", company.id] });
    void qc.invalidateQueries({ queryKey: ["production-activities", company.id] });
    void qc.invalidateQueries({ queryKey: ["harvest-records", company.id] });
  };
  const onError = (e: Error) => setError(e.message);

  const [seasonDraft, setSeasonDraft] = useState<SeasonDraft | null>(null);
  const [activityDraft, setActivityDraft] = useState<ActivityDraft | null>(null);
  const [harvestDraft, setHarvestDraft] = useState<HarvestDraft | null>(null);

  const seasonMutation = useMutation({
    mutationFn: (d: SeasonDraft) =>
      persistSeason({
        data: {
          id: d.id,
          companyId: company.id,
          propertyId: null,
          fieldId: null,
          name: d.name,
          seasonYear: Number(d.seasonYear),
          startDate: d.startDate || null,
          endDate: d.endDate || null,
          cropType: d.cropType,
          terrainType: d.terrainType,
          cultivatedArea: Number(d.cultivatedArea || 0),
          areaUnit: d.areaUnit || "ha",
          productionUnit: d.productionUnit || "saca",
          pickRate: Number(d.pickRate || 0),
          status: d.status,
          notes: d.notes,
        },
      }),
    onSuccess: () => {
      setSeasonDraft(null);
      setError(null);
      invalidate();
    },
    onError,
  });

  const activityMutation = useMutation({
    mutationFn: (d: ActivityDraft) =>
      persistActivity({
        data: {
          id: d.id,
          companyId: company.id,
          seasonId: d.seasonId,
          kind: d.kind,
          activityDate: d.activityDate,
          description: d.description,
          inventoryItemId: d.inventoryItemId || null,
          quantity: Number(d.quantity || 0),
          unit: d.unit,
          unitCost: Number(d.unitCost || 0),
          employeeId: d.employeeId || null,
          notes: d.notes,
        },
      }),
    onSuccess: () => {
      setActivityDraft(null);
      setError(null);
      invalidate();
    },
    onError,
  });

  const harvestMutation = useMutation({
    mutationFn: (d: HarvestDraft) =>
      persistHarvest({
        data: {
          id: d.id,
          companyId: company.id,
          seasonId: d.seasonId,
          harvestedAt: d.harvestedAt,
          employeeId: d.employeeId || null,
          pickerName: d.employeeId
            ? (employees.find((e) => e.id === d.employeeId)?.full_name ?? d.pickerName)
            : d.pickerName,
          quantity: Number(d.quantity || 0),
          notes: d.notes,
        },
      }),
    onSuccess: () => {
      setHarvestDraft(null);
      setError(null);
      invalidate();
    },
    onError,
  });

  const deleteSeasonMutation = useMutation({ mutationFn: (id: string) => removeSeason({ data: { id } }), onSuccess: invalidate, onError });
  const deleteActivityMutation = useMutation({ mutationFn: (id: string) => removeActivity({ data: { id } }), onSuccess: invalidate, onError });
  const deleteHarvestMutation = useMutation({ mutationFn: (id: string) => removeHarvest({ data: { id } }), onSuccess: invalidate, onError });

  const newSeason = (): SeasonDraft => ({
    name: "",
    seasonYear: String(new Date().getFullYear()),
    startDate: "",
    endDate: "",
    cropType: "Café",
    terrainType: "",
    cultivatedArea: "",
    areaUnit: "ha",
    productionUnit: "saca",
    pickRate: "",
    status: "planned",
    notes: "",
  });

  const noSeasons = seasons.length === 0;

  const seasonsTab = (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Safras</h2>
          <p className="text-sm text-muted-foreground">
            Cadastro das safras com cultivo, terreno, área e valor único de referência da apanha. Os vínculos com
            propriedade e talhão serão ativados quando o módulo Propriedades Rurais for liberado.
          </p>
        </div>
        {editable ? (
          <Button variant="glow" onClick={() => setSeasonDraft(newSeason())}>
            <Plus className="h-4 w-4" /> Nova safra
          </Button>
        ) : null}
      </div>

      {seasonDraft ? (
        <form
          className="space-y-4 rounded-2xl border border-primary/40 bg-card/80 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            seasonMutation.mutate(seasonDraft);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="field-shell text-sm" placeholder="Nome da safra" required minLength={2} value={seasonDraft.name} onChange={(e) => setSeasonDraft({ ...seasonDraft, name: e.target.value })} />
            <input className="field-shell text-sm" type="number" placeholder="Ano" required value={seasonDraft.seasonYear} onChange={(e) => setSeasonDraft({ ...seasonDraft, seasonYear: e.target.value })} />
            <select className="field-shell text-sm" value={seasonDraft.status} onChange={(e) => setSeasonDraft({ ...seasonDraft, status: e.target.value as SeasonDraft["status"] })}>
              <option value="planned">Planejada</option>
              <option value="active">Em andamento</option>
              <option value="harvesting">Em colheita</option>
              <option value="closed">Encerrada</option>
            </select>
            <label className="text-xs text-muted-foreground">
              Início do período
              <input className="field-shell mt-1 w-full text-sm" type="date" value={seasonDraft.startDate} onChange={(e) => setSeasonDraft({ ...seasonDraft, startDate: e.target.value })} />
            </label>
            <label className="text-xs text-muted-foreground">
              Fim do período
              <input className="field-shell mt-1 w-full text-sm" type="date" value={seasonDraft.endDate} onChange={(e) => setSeasonDraft({ ...seasonDraft, endDate: e.target.value })} />
            </label>
            <input className="field-shell text-sm" placeholder="Tipo de cultivo (Café…)" required value={seasonDraft.cropType} onChange={(e) => setSeasonDraft({ ...seasonDraft, cropType: e.target.value })} />
            <input className="field-shell text-sm" placeholder="Tipo de terreno (plano, montanha…)" value={seasonDraft.terrainType} onChange={(e) => setSeasonDraft({ ...seasonDraft, terrainType: e.target.value })} />
            <input className="field-shell text-sm" type="number" step="0.01" placeholder="Área cultivada" value={seasonDraft.cultivatedArea} onChange={(e) => setSeasonDraft({ ...seasonDraft, cultivatedArea: e.target.value })} />
            <input className="field-shell text-sm" placeholder="Unidade da área (ha)" value={seasonDraft.areaUnit} onChange={(e) => setSeasonDraft({ ...seasonDraft, areaUnit: e.target.value })} />
            <input className="field-shell text-sm" placeholder="Unidade de produção (saca, litro…)" value={seasonDraft.productionUnit} onChange={(e) => setSeasonDraft({ ...seasonDraft, productionUnit: e.target.value })} />
            <input className="field-shell text-sm" type="number" step="0.01" placeholder="Valor da apanha por unidade" value={seasonDraft.pickRate} onChange={(e) => setSeasonDraft({ ...seasonDraft, pickRate: e.target.value })} />
            <input className="field-shell text-sm" placeholder="Observações" value={seasonDraft.notes} onChange={(e) => setSeasonDraft({ ...seasonDraft, notes: e.target.value })} />
          </div>
          <p className="text-xs text-muted-foreground">
            O valor da apanha é único por safra e é aplicado automaticamente a todos os registros de colheita.
          </p>
          <div className="flex gap-2">
            <Button type="submit" variant="glow" disabled={seasonMutation.isPending}>
              {seasonMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar safra"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setSeasonDraft(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {seasonsQuery.isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : noSeasons ? (
        empty("Nenhuma safra cadastrada.")
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {seasons.map((s) => (
            <article key={s.id} className="space-y-2 rounded-2xl border border-border/60 bg-card/80 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Sprout className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {s.name} <span className="text-muted-foreground">· {s.season_year}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.crop_type} · {s.terrain_type || "terreno não informado"} · {qty(Number(s.cultivated_area))} {s.area_unit}
                  </p>
                </div>
                <Badge variant="outline">{seasonStatusLabel[s.status] ?? s.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Período: {dateBR(s.start_date)} → {dateBR(s.end_date)} · Apanha: {money(Number(s.pick_rate))} por {s.production_unit}
              </p>
              <p className="text-xs text-muted-foreground">Propriedade e talhão: a vincular no módulo Propriedades Rurais.</p>
              {editable ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setSeasonDraft({
                        id: s.id,
                        name: s.name,
                        seasonYear: String(s.season_year),
                        startDate: s.start_date ?? "",
                        endDate: s.end_date ?? "",
                        cropType: s.crop_type,
                        terrainType: s.terrain_type,
                        cultivatedArea: String(s.cultivated_area ?? ""),
                        areaUnit: s.area_unit,
                        productionUnit: s.production_unit,
                        pickRate: String(s.pick_rate ?? ""),
                        status: (s.status as SeasonDraft["status"]) ?? "planned",
                        notes: s.notes,
                      })
                    }
                  >
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => deleteSeasonMutation.mutate(s.id)}>
                    <Trash2 className="h-4 w-4" /> Excluir
                  </Button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );

  const activitiesTab = (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Plantio e aplicações</h2>
          <p className="text-sm text-muted-foreground">
            Registre plantios e aplicações de insumos por safra, com quantidade, custo e responsável.
          </p>
        </div>
        {editable && !noSeasons ? (
          <Button
            variant="glow"
            onClick={() =>
              setActivityDraft({
                seasonId: seasons[0]?.id ?? "",
                kind: "planting",
                activityDate: today(),
                description: "",
                inventoryItemId: "",
                quantity: "",
                unit: "",
                unitCost: "",
                employeeId: "",
                notes: "",
              })
            }
          >
            <Plus className="h-4 w-4" /> Novo lançamento
          </Button>
        ) : null}
      </div>

      {noSeasons ? empty("Cadastre uma safra para registrar plantios e aplicações.") : null}

      {activityDraft ? (
        <form
          className="space-y-4 rounded-2xl border border-primary/40 bg-card/80 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            activityMutation.mutate(activityDraft);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <select className="field-shell text-sm" value={activityDraft.seasonId} onChange={(e) => setActivityDraft({ ...activityDraft, seasonId: e.target.value })} required>
              <option value="">Safra</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.season_year}
                </option>
              ))}
            </select>
            <select className="field-shell text-sm" value={activityDraft.kind} onChange={(e) => setActivityDraft({ ...activityDraft, kind: e.target.value as ActivityDraft["kind"] })}>
              <option value="planting">Plantio</option>
              <option value="application">Aplicação</option>
            </select>
            <input className="field-shell text-sm" type="date" value={activityDraft.activityDate} onChange={(e) => setActivityDraft({ ...activityDraft, activityDate: e.target.value })} required />
            <input className="field-shell text-sm sm:col-span-2" placeholder="Descrição (adubação, calagem, mudas…)" required minLength={2} value={activityDraft.description} onChange={(e) => setActivityDraft({ ...activityDraft, description: e.target.value })} />
            <select
              className="field-shell text-sm"
              value={activityDraft.inventoryItemId}
              onChange={(e) => {
                const item = items.find((i) => i.id === e.target.value);
                setActivityDraft({ ...activityDraft, inventoryItemId: e.target.value, unit: item?.unit ?? activityDraft.unit });
              }}
            >
              <option value="">Insumo do estoque (opcional)</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
            <input className="field-shell text-sm" type="number" step="0.001" placeholder="Quantidade" value={activityDraft.quantity} onChange={(e) => setActivityDraft({ ...activityDraft, quantity: e.target.value })} />
            <input className="field-shell text-sm" placeholder="Unidade" value={activityDraft.unit} onChange={(e) => setActivityDraft({ ...activityDraft, unit: e.target.value })} />
            <input className="field-shell text-sm" type="number" step="0.01" placeholder="Custo unitário" value={activityDraft.unitCost} onChange={(e) => setActivityDraft({ ...activityDraft, unitCost: e.target.value })} />
            <select className="field-shell text-sm" value={activityDraft.employeeId} onChange={(e) => setActivityDraft({ ...activityDraft, employeeId: e.target.value })}>
              <option value="">Responsável (opcional)</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name}
                </option>
              ))}
            </select>
            <input className="field-shell text-sm sm:col-span-2" placeholder="Observações" value={activityDraft.notes} onChange={(e) => setActivityDraft({ ...activityDraft, notes: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="glow" disabled={activityMutation.isPending}>
              {activityMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar lançamento"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setActivityDraft(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {activitiesQuery.isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : activities.length === 0 ? (
        empty("Nenhum plantio ou aplicação registrado.")
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/60">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Data</th>
                <th className="px-3 py-2 text-left">Tipo</th>
                <th className="px-3 py-2 text-left">Safra</th>
                <th className="px-3 py-2 text-left">Descrição</th>
                <th className="px-3 py-2 text-right">Qtd.</th>
                <th className="px-3 py-2 text-right">Custo total</th>
                <th className="px-3 py-2 text-left">Responsável</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {activities.map((a) => (
                <tr key={a.id} className="border-t border-border/50">
                  <td className="px-3 py-2">{dateBR(a.activity_date)}</td>
                  <td className="px-3 py-2">{a.kind === "planting" ? "Plantio" : "Aplicação"}</td>
                  <td className="px-3 py-2">{seasonName(a.season_id)}</td>
                  <td className="px-3 py-2">{a.description}</td>
                  <td className="px-3 py-2 text-right">
                    {qty(Number(a.quantity))} {a.unit}
                  </td>
                  <td className="px-3 py-2 text-right">{money(Number(a.total_cost))}</td>
                  <td className="px-3 py-2">{employees.find((e) => e.id === a.employee_id)?.full_name ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    {editable ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setActivityDraft({
                              id: a.id,
                              seasonId: a.season_id,
                              kind: a.kind,
                              activityDate: a.activity_date,
                              description: a.description,
                              inventoryItemId: a.inventory_item_id ?? "",
                              quantity: String(a.quantity ?? ""),
                              unit: a.unit,
                              unitCost: String(a.unit_cost ?? ""),
                              employeeId: a.employee_id ?? "",
                              notes: a.notes,
                            })
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteActivityMutation.mutate(a.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  const harvestTotals = useMemo(() => {
    const totals = new Map<string, { quantity: number; amount: number }>();
    for (const h of harvests) {
      const current = totals.get(h.season_id) ?? { quantity: 0, amount: 0 };
      totals.set(h.season_id, {
        quantity: current.quantity + Number(h.quantity),
        amount: current.amount + Number(h.total_amount),
      });
    }
    return totals;
  }, [harvests]);

  const harvestTab = (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Colheita e produtividade</h2>
          <p className="text-sm text-muted-foreground">
            Registre a colheita por apanhador. O valor pago por unidade vem sempre da safra selecionada.
          </p>
        </div>
        {editable && !noSeasons ? (
          <Button
            variant="glow"
            onClick={() =>
              setHarvestDraft({
                seasonId: seasons[0]?.id ?? "",
                harvestedAt: today(),
                employeeId: "",
                pickerName: "",
                quantity: "",
                notes: "",
              })
            }
          >
            <Plus className="h-4 w-4" /> Nova colheita
          </Button>
        ) : null}
      </div>

      {noSeasons ? empty("Cadastre uma safra para registrar colheitas.") : null}

      {harvestDraft ? (
        <form
          className="space-y-4 rounded-2xl border border-primary/40 bg-card/80 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            harvestMutation.mutate(harvestDraft);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <select className="field-shell text-sm" value={harvestDraft.seasonId} onChange={(e) => setHarvestDraft({ ...harvestDraft, seasonId: e.target.value })} required>
              <option value="">Safra</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.season_year}
                </option>
              ))}
            </select>
            <input className="field-shell text-sm" type="date" value={harvestDraft.harvestedAt} onChange={(e) => setHarvestDraft({ ...harvestDraft, harvestedAt: e.target.value })} required />
            <input className="field-shell text-sm" type="number" step="0.001" placeholder="Quantidade colhida" required value={harvestDraft.quantity} onChange={(e) => setHarvestDraft({ ...harvestDraft, quantity: e.target.value })} />
            <select className="field-shell text-sm" value={harvestDraft.employeeId} onChange={(e) => setHarvestDraft({ ...harvestDraft, employeeId: e.target.value })}>
              <option value="">Apanhador cadastrado</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name}
                </option>
              ))}
            </select>
            <input className="field-shell text-sm" placeholder="Ou nome do apanhador" value={harvestDraft.pickerName} onChange={(e) => setHarvestDraft({ ...harvestDraft, pickerName: e.target.value })} />
            <input className="field-shell text-sm" placeholder="Observações" value={harvestDraft.notes} onChange={(e) => setHarvestDraft({ ...harvestDraft, notes: e.target.value })} />
          </div>
          <p className="text-xs text-muted-foreground">
            Valor da apanha aplicado:{" "}
            {money(Number(seasonById.get(harvestDraft.seasonId)?.pick_rate ?? 0))} por{" "}
            {seasonById.get(harvestDraft.seasonId)?.production_unit ?? "unidade"}.
          </p>
          <div className="flex gap-2">
            <Button type="submit" variant="glow" disabled={harvestMutation.isPending}>
              {harvestMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar colheita"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setHarvestDraft(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {harvestTotals.size > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {seasons
            .filter((s) => harvestTotals.has(s.id))
            .map((s) => {
              const totals = harvestTotals.get(s.id)!;
              const area = Number(s.cultivated_area) || 0;
              return (
                <article key={s.id} className="rounded-2xl border border-border/60 bg-card/80 p-4">
                  <p className="text-sm font-semibold">{s.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {qty(totals.quantity)} {s.production_unit} colhidos · {money(totals.amount)} em apanha
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Produtividade: {area > 0 ? `${qty(totals.quantity / area)} ${s.production_unit}/${s.area_unit}` : "informe a área da safra"}
                  </p>
                </article>
              );
            })}
        </div>
      ) : null}

      {harvestsQuery.isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : harvests.length === 0 ? (
        empty("Nenhuma colheita registrada.")
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/60">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Data</th>
                <th className="px-3 py-2 text-left">Safra</th>
                <th className="px-3 py-2 text-left">Apanhador</th>
                <th className="px-3 py-2 text-right">Quantidade</th>
                <th className="px-3 py-2 text-right">Valor unitário</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {harvests.map((h) => (
                <tr key={h.id} className="border-t border-border/50">
                  <td className="px-3 py-2">{dateBR(h.harvested_at)}</td>
                  <td className="px-3 py-2">{seasonName(h.season_id)}</td>
                  <td className="px-3 py-2">
                    {employees.find((e) => e.id === h.employee_id)?.full_name ?? h.picker_name ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {qty(Number(h.quantity))} {seasonById.get(h.season_id)?.production_unit ?? ""}
                  </td>
                  <td className="px-3 py-2 text-right">{money(Number(h.unit_rate))}</td>
                  <td className="px-3 py-2 text-right">{money(Number(h.total_amount))}</td>
                  <td className="px-3 py-2 text-right">
                    {editable ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setHarvestDraft({
                              id: h.id,
                              seasonId: h.season_id,
                              harvestedAt: h.harvested_at,
                              employeeId: h.employee_id ?? "",
                              pickerName: h.picker_name,
                              quantity: String(h.quantity ?? ""),
                              notes: h.notes,
                            })
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteHarvestMutation.mutate(h.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">{error}</p>
      ) : null}
      <ModuleTabs
        value={tab}
        onValueChange={setTab}
        tabs={[
          { value: "seasons", label: "Safras", content: seasonsTab },
          { value: "activities", label: "Plantio e aplicações", content: activitiesTab },
          { value: "harvest", label: "Colheita e produtividade", content: harvestTab },
        ]}
      />
    </div>
  );
}
