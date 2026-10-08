import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { Database } from '@/integrations/supabase/types';
export type FleetAsset = Database['public']['Tables']['fleet_assets']['Row'];
export type FuelRecord = Database['public']['Tables']['fleet_fuel_records']['Row'];
export type MaintenanceRecord = Database['public']['Tables']['fleet_maintenance_records']['Row'];
const identity = z.object({id:z.string().uuid().optional(), companyId:z.string().uuid()});
const date = z.string().date();
const optionalId = z.string().uuid().nullable().default(null);
const shared = identity.extend({asset_id:z.string().uuid(), meter:z.coerce.number().min(0).max(999999999999), supplier:z.string().trim().max(160).default(''), property_id:optionalId,cost_center_id:optionalId,season_id:optionalId,notes:z.string().trim().max(1000).default('')});
const assetSchema = identity.extend({name:z.string().trim().min(2).max(160),code:z.string().trim().min(1).max(60),kind:z.enum(['vehicle','machine','implement']),plate:z.string().trim().max(40).default(''),meter_unit:z.enum(['km','h']),initial_meter:z.coerce.number().min(0).max(999999999999),status:z.enum(['active','inactive']),notes:z.string().trim().max(1000).default('')});
const fuelSchema = shared.extend({recorded_at:date,liters:z.coerce.number().positive().max(999999999),unit_price:z.coerce.number().min(0).max(999999),full_tank:z.boolean().default(false)});
const maintenanceSchema = shared.extend({description:z.string().trim().min(2).max(240),scheduled_at:date,completed_at:date.nullable().default(null),next_meter:z.coerce.number().min(0).nullable().default(null),amount:z.coerce.number().min(0).max(999999999999),status:z.enum(['scheduled','completed','canceled'])}).superRefine((data,ctx)=>{
 if(data.status==='completed' && !data.completed_at) ctx.addIssue({code:'custom',message:'Informe a data da conclusão.'});
 if(data.status!=='completed' && data.completed_at) ctx.addIssue({code:'custom',message:'Apenas manutenções concluídas possuem data de conclusão.'});
 if(data.next_meter!==null && data.next_meter<=data.meter) ctx.addIssue({code:'custom',message:'A próxima leitura deve superar a leitura atual.'});
});
export const getFleetWorkspace = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({companyId:z.string().uuid()}).parse(input)).handler(async({data,context})=>{
 const db=context.supabase;
 const [{data:assets,error:ae},{data:fuel,error:fe},{data:maintenance,error:me},{data:properties,error:pe},{data:centers,error:ce},{data:seasons,error:se}]=await Promise.all([
 db.from('fleet_assets').select('*').eq('company_id',data.companyId).order('name'),
 db.from('fleet_fuel_records').select('*').eq('company_id',data.companyId).order('recorded_at'),
 db.from('fleet_maintenance_records').select('*').eq('company_id',data.companyId).order('scheduled_at'),
 db.from('rural_properties').select('id,name').eq('company_id',data.companyId).order('name'),
 db.from('cost_centers').select('id,name').eq('company_id',data.companyId).order('name'),
 db.from('crop_seasons').select('id,name,property_id').eq('company_id',data.companyId).order('name')]);
 const error=ae??fe??me??pe??ce??se; if(error) throw new Error(error.message);
 return {assets:assets??[],fuel:fuel??[],maintenance:maintenance??[],properties:properties??[],centers:centers??[],seasons:seasons??[]};
});
function friendly(error:{code?:string;message:string}) {return new Error(error.code==='23503'?'Registro vinculado: confira os vínculos da empresa; veículos com histórico não podem ser excluídos.':error.code==='23505'?'Já existe um veículo com este código.':error.code==='42501'?'Você não possui permissão para esta ação.':error.message);}
export const saveFleetAsset=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>assetSchema.parse(input)).handler(async({data,context})=>{
 const {id,companyId,...fields}=data; const payload={...fields,company_id:companyId};
 const query=id?context.supabase.from('fleet_assets').update(payload).eq('id',id).eq('company_id',companyId):context.supabase.from('fleet_assets').insert(payload);
 const {data:row,error}=await query.select('id').single(); if(error) throw friendly(error); return row;
});
export const saveFuelRecord=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>fuelSchema.parse(input)).handler(async({data,context})=>{
 const {id,companyId,...fields}=data; const payload={...fields,company_id:companyId};
 const query=id?context.supabase.from('fleet_fuel_records').update(payload).eq('id',id).eq('company_id',companyId):context.supabase.from('fleet_fuel_records').insert(payload);
 const {data:row,error}=await query.select('id').single(); if(error) throw friendly(error); return row;
});
export const saveMaintenanceRecord=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>maintenanceSchema.parse(input)).handler(async({data,context})=>{
 const {id,companyId,...fields}=data; const payload={...fields,company_id:companyId};
 const query=id?context.supabase.from('fleet_maintenance_records').update(payload).eq('id',id).eq('company_id',companyId):context.supabase.from('fleet_maintenance_records').insert(payload);
 const {data:row,error}=await query.select('id').single(); if(error) throw friendly(error); return row;
});
export const deleteFleetRecord=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({id:z.string().uuid(),companyId:z.string().uuid(),kind:z.enum(['asset','fuel','maintenance'])}).parse(input)).handler(async({data,context})=>{
 const table=data.kind==='asset'?'fleet_assets':data.kind==='fuel'?'fleet_fuel_records':'fleet_maintenance_records';
 const {data:rows,error}=await context.supabase.from(table).delete().eq('id',data.id).eq('company_id',data.companyId).select('id');
 if(error) throw friendly(error); if(!rows?.length) throw new Error('Registro não encontrado ou exclusão não permitida.'); return {ok:true};
});
