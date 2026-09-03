import { useEffect, useState } from "react";
import { CalendarIcon, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type PeriodPreset = "default" | "today" | "7d" | "30d" | "month" | "year" | "custom";

export type PeriodFilter = {
  preset: PeriodPreset;
  from: string | null;
  to: string | null;
};

export const DEFAULT_PERIOD: PeriodFilter = { preset: "default", from: null, to: null };

const iso = (d: Date) => {
  const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return t.toISOString().slice(0, 10);
};

const PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "month", label: "Este mês" },
  { value: "year", label: "Este ano" },
  { value: "custom", label: "Período personalizado" },
];

export function resolvePeriod(p: PeriodFilter): { from: string | null; to: string | null } {
  const today = new Date();
  switch (p.preset) {
    case "today":
      return { from: iso(today), to: iso(today) };
    case "7d":
      return { from: iso(new Date(today.getTime() - 6 * 86400000)), to: iso(today) };
    case "30d":
      return { from: iso(new Date(today.getTime() - 29 * 86400000)), to: iso(today) };
    case "month":
      return { from: iso(new Date(today.getFullYear(), today.getMonth(), 1)), to: iso(today) };
    case "year":
      return { from: iso(new Date(today.getFullYear(), 0, 1)), to: iso(today) };
    case "custom":
      return p.from && p.to ? { from: p.from, to: p.to } : { from: null, to: null };
    default:
      return { from: null, to: null };
  }
}

const fmt = (v: string) => new Date(`${v}T00:00:00`).toLocaleDateString("pt-BR");

export function periodLabel(p: PeriodFilter) {
  if (p.preset === "default") return "Últimos 12 meses";
  if (p.preset === "custom") {
    const r = resolvePeriod(p);
    return r.from && r.to ? `${fmt(r.from)} — ${fmt(r.to)}` : "Período personalizado";
  }
  return PRESETS.find((x) => x.value === p.preset)?.label ?? "Período";
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}
          >
            <CalendarIcon className="h-4 w-4" />
            {value ? fmt(value) : "Selecionar"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ? new Date(`${value}T00:00:00`) : undefined}
            onSelect={(d) => d && onChange(iso(d))}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function DashboardPeriodFilter({
  value,
  onChange,
}: {
  value: PeriodFilter;
  onChange: (v: PeriodFilter) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PeriodFilter>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const customInvalid = draft.preset === "custom" && (!draft.from || !draft.to || draft.from > draft.to);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 rounded-xl border-border/60 bg-card/70 backdrop-blur">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Filtros
          <span className="hidden text-xs text-muted-foreground sm:inline">• {periodLabel(value)}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl border-border/60 bg-card/95 backdrop-blur">
        <DialogHeader>
          <DialogTitle>Filtros do Dashboard</DialogTitle>
          <DialogDescription>Selecione o período que deseja analisar.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PRESETS.map((p) => {
            const active = draft.preset === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setDraft({ ...draft, preset: p.value })}
                className={cn(
                  "rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
                  active
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-border/60 bg-background/40 text-muted-foreground hover:border-primary/40",
                  p.value === "custom" && "col-span-2 sm:col-span-3",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {draft.preset === "custom" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <DateField label="Data inicial" value={draft.from} onChange={(v) => setDraft({ ...draft, from: v })} />
            <DateField label="Data final" value={draft.to} onChange={(v) => setDraft({ ...draft, to: v })} />
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setDraft(DEFAULT_PERIOD);
              onChange(DEFAULT_PERIOD);
              setOpen(false);
            }}
          >
            Limpar
          </Button>
          <Button
            type="button"
            disabled={customInvalid}
            onClick={() => {
              onChange(draft);
              setOpen(false);
            }}
          >
            Aplicar filtro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
