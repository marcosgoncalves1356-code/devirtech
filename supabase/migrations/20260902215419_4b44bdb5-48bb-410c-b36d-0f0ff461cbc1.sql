ALTER TABLE public.financial_entries
  ADD COLUMN IF NOT EXISTS supplier text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';