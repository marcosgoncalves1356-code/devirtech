import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fleetMetrics } from './fleet-metrics';
const asset={id:'a',name:'Trator',initial_meter:0,meter_unit:'h'};
const fuel=[{id:'1',asset_id:'a',recorded_at:'2026-10-01',meter:100,liters:30,total:180,full_tank:true},{id:'2',asset_id:'a',recorded_at:'2026-10-02',meter:110,liters:10,total:60,full_tank:false},{id:'3',asset_id:'a',recorded_at:'2026-10-03',meter:120,liters:30,total:180,full_tank:true}];
test('full-to-full consumption includes intermediate partial fills',()=>{
 assert.equal(fleetMetrics([asset],fuel,[])[0]?.consumption,2);
 assert.equal(fleetMetrics([{...asset,meter_unit:'km'}],fuel,[])[0]?.consumption,0.5);
});
test('single fill does not invent consumption',()=>assert.equal(fleetMetrics([asset],fuel.slice(0,1),[])[0]?.consumption,null));
test('costs include completed maintenance only',()=>{
 const rows=['scheduled','completed','canceled'].map(status=>({asset_id:'a',scheduled_at:'2026-10-01',completed_at:status==='completed'?'2026-10-03':null,meter:120,amount:100,status}));
 assert.equal(fleetMetrics([asset],fuel,rows)[0]?.total,520);
});
test('date filter uses previous meter reading and excludes previous costs',()=>{
 const metric=fleetMetrics([asset],fuel,[],'2026-10-02','2026-10-03')[0];
 assert.equal(metric?.distance,20);assert.equal(metric?.fuelCost,240);assert.equal(metric?.costPerUnit,12);assert.equal(metric?.consumption,null);
});
test('missing period baseline does not invent usage or cost per unit',()=>{
 assert.equal(fleetMetrics([asset],fuel,[],'2026-10-01','2026-10-03')[0]?.costPerUnit,null);
});
