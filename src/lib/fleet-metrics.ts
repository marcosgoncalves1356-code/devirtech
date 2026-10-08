export type MetricAsset = { id: string; name: string; initial_meter: number; meter_unit: string };
export type MetricFuel = { id: string; asset_id: string; recorded_at: string; meter: number; liters: number; total: number | null; full_tank: boolean };
export type MetricMaintenance = { asset_id: string; scheduled_at: string; completed_at: string | null; meter: number; amount: number; status: string };
export function fleetMetrics(assets: MetricAsset[], fuel: MetricFuel[], maintenance: MetricMaintenance[], start = '', end = '') {
  const within = (date: string) => (!start || date >= start) && (!end || date <= end);
  return assets.map(asset => {
    const logs = fuel.filter(r => r.asset_id === asset.id).sort((a,b) => a.recorded_at.localeCompare(b.recorded_at) || Number(a.meter)-Number(b.meter));
    const selected = logs.filter(r => within(r.recorded_at));
    const services = maintenance.filter(r => r.asset_id === asset.id && r.status === 'completed' && r.completed_at && within(r.completed_at));
    const allReadings = [...logs.map(r => ({date:r.recorded_at,meter:Number(r.meter)})), ...maintenance.filter(r=>r.asset_id===asset.id && r.status==='completed' && r.completed_at).map(r=>({date:r.completed_at ?? r.scheduled_at,meter:Number(r.meter)}))];
    const prior = allReadings.filter(r=>start && r.date<start);
    const baseline = prior.length ? Math.max(...prior.map(r=>r.meter)) : !start ? Number(asset.initial_meter) : null;
    const current = allReadings.filter(r=>within(r.date));
    const distance = baseline !== null && current.length ? Math.max(...current.map(r=>r.meter))-baseline : null;
    const fuelCost = selected.reduce((s,r)=>s+Number(r.total ?? 0),0);
    const maintenanceCost = services.reduce((s,r)=>s+Number(r.amount),0);
    // Only completed full-to-full intervals measure actual fuel consumed.
    let previousFull: MetricFuel | undefined; let accumulated=0; let consumed=0; let measured=0;
    for (const row of logs) {
      if (previousFull) accumulated+=Number(row.liters);
      if (row.full_tank) {
        if (previousFull && within(row.recorded_at) && within(previousFull.recorded_at) && Number(row.meter)>Number(previousFull.meter)) {
          consumed+=accumulated; measured+=Number(row.meter)-Number(previousFull.meter);
        }
        previousFull=row; accumulated=0;
      }
    }
    return { ...asset, liters:selected.reduce((s,r)=>s+Number(r.liters),0), fuelCost, maintenanceCost, total:fuelCost+maintenanceCost, distance:distance!==null && distance>0 ? distance : null, costPerUnit:distance!==null && distance>0 ? (fuelCost+maintenanceCost)/distance : null, consumption: measured>0 && consumed>0 ? asset.meter_unit==='km' ? measured/consumed : consumed/measured : null };
  });
}
