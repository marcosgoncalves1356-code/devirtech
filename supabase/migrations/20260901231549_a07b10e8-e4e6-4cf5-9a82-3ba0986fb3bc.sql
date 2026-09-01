ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url text NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS welcome_seen_at timestamp with time zone;