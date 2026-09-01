ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;

UPDATE public.profiles
SET username = regexp_replace(lower(split_part(email, '@', 1)), '[^a-z0-9._-]', '', 'g')
WHERE username IS NULL;

UPDATE public.profiles SET username = 'devitech_admin' WHERE email = 'admin@devitech.com.br';

UPDATE public.profiles p
SET username = p.username || '_' || substr(p.id::text, 1, 4)
WHERE EXISTS (
  SELECT 1 FROM public.profiles q
  WHERE lower(q.username) = lower(p.username) AND q.id <> p.id AND q.created_at < p.created_at
);

UPDATE public.profiles SET username = 'user_' || substr(id::text, 1, 8) WHERE username IS NULL OR username = '';

ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx ON public.profiles (lower(username));