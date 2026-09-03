import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MonthPoint = {
  month: string;
  faturamento: number;
  despesas: number;
  saldo: number;
};

export type DashboardData = {
  companyId: string;
  revenue: number;
  expenses: number;
  balance: number;
  receivableOpen: number;
  receivableOverdue: number;
  payableOpen: number;
  payableOverdue: number;
  salesTotal: number;
  salesCount: number;
  purchasesTotal: number;
  purchasesCount: number;
  inventoryValue: number;
  inventoryItems: number;
  inventoryLow: number;
  payrollNet: number;
  payrollEmployees: number;
  margin: number;
  ticket: number;
  monthly: MonthPoint[];
  expensesByCategory: { category: string; value: number }[];
  salesVsPurchases: { month: string; vendas: number; compras: number }[];
  upcoming: { id: string; description: string; amount: number; dueDate: string; kind: string; status: string }[];
  lowStock: { id: string; name: string; quantity: number; minQuantity: number; unit: string }[];
};

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const MONTH_LABELS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export const getDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { companyId: string; from?: string | null; to?: string | null }) => input)
  .handler(async ({ data, context }): Promise<DashboardData> => {
    const { supabase } = context;
    const companyId = data.companyId;

    const today = new Date();
    const isDate = (v?: string | null) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
    const custom = isDate(data.from) && isDate(data.to);
    const startISO = custom ? (data.from as string) : null;
    const endISO = custom ? (data.to as string) : null;
    const todayISO = today.toISOString().slice(0, 10);
    const in7 = new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10);

    // Sem filtro ativo: mantém a visão padrão (todos os lançamentos da empresa).
    const range = <T extends { gte: (c: string, v: string) => T; lte: (c: string, v: string) => T }>(
      q: T,
      column: string,
    ) => (startISO && endISO ? q.gte(column, startISO).lte(column, endISO) : q);

    const [entriesRes, salesRes, purchasesRes, invRes, payrollRes] = await Promise.all([
      range(
        supabase
          .from("financial_entries")
          .select("id, kind, description, category, amount, due_date, paid_at, status")
          .eq("company_id", companyId),
        "due_date",
      ),
      range(supabase.from("sales").select("total, sold_at, status").eq("company_id", companyId), "sold_at"),
      range(
        supabase.from("purchases").select("total, purchased_at, status").eq("company_id", companyId),
        "purchased_at",
      ),
      supabase.from("inventory_items").select("id, name, unit, quantity, min_quantity, unit_cost").eq("company_id", companyId),
      range(
        supabase
          .from("payroll_entries")
          .select("reference_month, employees_count, net_total, status")
          .eq("company_id", companyId),
        "reference_month",
      ),
    ]);


    const entries = entriesRes.data ?? [];
    const sales = (salesRes.data ?? []).filter((s) => s.status !== "canceled");
    const purchases = (purchasesRes.data ?? []).filter((p) => p.status !== "canceled");
    const inventory = invRes.data ?? [];
    const payroll = (payrollRes.data ?? []).filter((p) => p.status !== "canceled");

    const months: string[] = [];
    {
      const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      const last = new Date(end.getFullYear(), end.getMonth(), 1);
      while (cursor <= last && months.length < 36) {
        months.push(monthKey(cursor));
        cursor.setMonth(cursor.getMonth() + 1);
      }
      if (months.length === 0) months.push(monthKey(start));
    }

    const bucket = new Map<string, MonthPoint>();
    const svp = new Map<string, { month: string; vendas: number; compras: number }>();
    for (const m of months) {
      const label = `${MONTH_LABELS[Number(m.slice(5, 7)) - 1]}/${m.slice(2, 4)}`;
      bucket.set(m, { month: label, faturamento: 0, despesas: 0, saldo: 0 });
      svp.set(m, { month: label, vendas: 0, compras: 0 });
    }

    let revenue = 0;
    let expenses = 0;
    let receivableOpen = 0;
    let receivableOverdue = 0;
    let payableOpen = 0;
    let payableOverdue = 0;
    const byCategory = new Map<string, number>();

    for (const e of entries) {
      const amount = Number(e.amount) || 0;
      const paid = e.status === "paid";
      const key = (e.paid_at ?? e.due_date).slice(0, 7);
      const point = bucket.get(key);
      if (e.kind === "receivable") {
        if (paid) {
          revenue += amount;
          if (point) point.faturamento += amount;
        } else if (e.status !== "canceled") {
          receivableOpen += amount;
          if (e.due_date < todayISO) receivableOverdue += amount;
        }
      } else {
        if (paid) {
          expenses += amount;
          if (point) point.despesas += amount;
          byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + amount);
        } else if (e.status !== "canceled") {
          payableOpen += amount;
          if (e.due_date < todayISO) payableOverdue += amount;
        }
      }
    }
    for (const p of bucket.values()) p.saldo = p.faturamento - p.despesas;

    let salesTotal = 0;
    for (const s of sales) {
      const v = Number(s.total) || 0;
      salesTotal += v;
      const row = svp.get(s.sold_at.slice(0, 7));
      if (row) row.vendas += v;
    }
    let purchasesTotal = 0;
    for (const p of purchases) {
      const v = Number(p.total) || 0;
      purchasesTotal += v;
      const row = svp.get(p.purchased_at.slice(0, 7));
      if (row) row.compras += v;
    }

    const inventoryValue = inventory.reduce((acc, i) => acc + Number(i.quantity) * Number(i.unit_cost), 0);
    const lowStockRows = inventory.filter((i) => Number(i.quantity) <= Number(i.min_quantity));

    const lastPayroll = [...payroll].sort((a, b) => (a.reference_month < b.reference_month ? 1 : -1))[0];

    const upcoming = entries
      .filter((e) => e.status !== "paid" && e.status !== "canceled" && e.due_date <= in7)
      .sort((a, b) => (a.due_date < b.due_date ? -1 : 1))
      .slice(0, 6)
      .map((e) => ({
        id: e.id,
        description: e.description,
        amount: Number(e.amount) || 0,
        dueDate: e.due_date,
        kind: e.kind as string,
        status: e.due_date < todayISO ? "overdue" : "open",
      }));

    return {
      companyId,
      revenue,
      expenses,
      balance: revenue - expenses,
      receivableOpen,
      receivableOverdue,
      payableOpen,
      payableOverdue,
      salesTotal,
      salesCount: sales.length,
      purchasesTotal,
      purchasesCount: purchases.length,
      inventoryValue,
      inventoryItems: inventory.length,
      inventoryLow: lowStockRows.length,
      payrollNet: Number(lastPayroll?.net_total ?? 0),
      payrollEmployees: Number(lastPayroll?.employees_count ?? 0),
      margin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0,
      ticket: sales.length > 0 ? salesTotal / sales.length : 0,
      monthly: months.map((m) => bucket.get(m)!),
      expensesByCategory: [...byCategory.entries()]
        .map(([category, value]) => ({ category, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
      salesVsPurchases: months.map((m) => svp.get(m)!),
      upcoming,
      lowStock: lowStockRows.slice(0, 6).map((i) => ({
        id: i.id,
        name: i.name,
        quantity: Number(i.quantity),
        minQuantity: Number(i.min_quantity),
        unit: i.unit,
      })),
    };
  });
