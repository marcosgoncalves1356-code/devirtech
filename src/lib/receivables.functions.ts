import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Receivable = {
  id: string;
  company_id: string;
  kind: "payable" | "receivable";
  /** coluna reutilizada para armazenar o cliente do título */
  supplier: string;
  description: string;
  category: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  notes: string;
  cost_center_id: string | null;
  season_id: string | null;
  status: "open" | "paid" | "overdue" | "canceled";
  created_at: string;
  updated_at: string;
};

const optionalDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

const optionalUuid = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || z.string().uuid().safeParse(v).success, "Centro de custo inválido.");

const receivableSchema = z.object({
  id: z.string().uuid().optional(),
  companyId: z.string().uuid(),
  customer: z.string().trim().min(2, "Informe o cliente.").max(160),
  description: z.string().trim().min(2, "Informe a descrição do título.").max(240),
  category: z.string().trim().max(120).default("geral"),
  amount: z.coerce.number().min(0, "Informe um valor válido."),
  dueDate: z.string().trim().min(1, "Informe a data de vencimento."),
  receivedAt: optionalDate,
  costCenterId: optionalUuid,
  seasonId: optionalUuid,
  notes: z.string().trim().max(1000).default(""),
  status: z.enum(["open", "paid", "overdue", "canceled"]).default("open"),
});

/** Lista as contas a receber da empresa (RLS isola por empresa). */
export const listReceivables = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("financial_entries")
      .select("*")
      .eq("company_id", data.companyId)
      .eq("kind", "receivable")
      .order("due_date", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as Receivable[];
  });

/** Cria ou atualiza uma conta a receber. */
export const saveReceivable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => receivableSchema.parse(input))
  .handler(async ({ data, context }) => {
    const status: Receivable["status"] = data.receivedAt
      ? "paid"
      : data.status === "paid"
        ? "open"
        : data.status;
    const payload = {
      company_id: data.companyId,
      kind: "receivable" as const,
      supplier: data.customer,
      description: data.description,
      category: data.category || "geral",
      amount: data.amount,
      due_date: data.dueDate,
      paid_at: data.receivedAt,
      cost_center_id: data.costCenterId,
      season_id: data.seasonId,
      notes: data.notes,
      status,
    };

    const query = data.id
      ? context.supabase.from("financial_entries").update(payload).eq("id", data.id)
      : context.supabase.from("financial_entries").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Registra o recebimento de um título. */
export const settleReceivable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), receivedAt: z.string().trim().min(1) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("financial_entries")
      .update({ paid_at: data.receivedAt, status: "paid" })
      .eq("id", data.id)
      .eq("kind", "receivable");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Estorna o recebimento de um título. */
export const reopenReceivable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("financial_entries")
      .update({ paid_at: null, status: "open" })
      .eq("id", data.id)
      .eq("kind", "receivable");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Remove uma conta a receber. */
export const deleteReceivable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("financial_entries")
      .delete()
      .eq("id", data.id)
      .eq("kind", "receivable");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
