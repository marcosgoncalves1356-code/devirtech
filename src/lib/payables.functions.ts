import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Payable = {
  id: string;
  company_id: string;
  kind: "payable" | "receivable";
  supplier: string;
  description: string;
  category: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  notes: string;
  cost_center_id: string | null;
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

const payableSchema = z.object({
  id: z.string().uuid().optional(),
  companyId: z.string().uuid(),
  supplier: z.string().trim().min(2, "Informe o fornecedor.").max(160),
  description: z.string().trim().min(2, "Informe a descrição do título.").max(240),
  category: z.string().trim().max(120).default("geral"),
  amount: z.coerce.number().min(0, "Informe um valor válido."),
  dueDate: z.string().trim().min(1, "Informe a data de vencimento."),
  paidAt: optionalDate,
  costCenterId: optionalUuid,
  notes: z.string().trim().max(1000).default(""),
  status: z.enum(["open", "paid", "overdue", "canceled"]).default("open"),
});


/** Lista as contas a pagar da empresa (RLS isola por empresa). */
export const listPayables = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("financial_entries")
      .select("*")
      .eq("company_id", data.companyId)
      .eq("kind", "payable")
      .order("due_date", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as Payable[];
  });

/** Cria ou atualiza uma conta a pagar. */
export const savePayable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => payableSchema.parse(input))
  .handler(async ({ data, context }) => {
    const status: Payable["status"] = data.paidAt ? "paid" : data.status === "paid" ? "open" : data.status;
    const payload = {
      company_id: data.companyId,
      kind: "payable" as const,
      supplier: data.supplier,
      description: data.description,
      category: data.category || "geral",
      amount: data.amount,
      due_date: data.dueDate,
      paid_at: data.paidAt,
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

/** Registra a baixa (pagamento) de um título. */
export const settlePayable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), paidAt: z.string().trim().min(1) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("financial_entries")
      .update({ paid_at: data.paidAt, status: "paid" })
      .eq("id", data.id)
      .eq("kind", "payable");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Estorna a baixa de um título, voltando para em aberto. */
export const reopenPayable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("financial_entries")
      .update({ paid_at: null, status: "open" })
      .eq("id", data.id)
      .eq("kind", "payable");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Remove uma conta a pagar. */
export const deletePayable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("financial_entries")
      .delete()
      .eq("id", data.id)
      .eq("kind", "payable");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
