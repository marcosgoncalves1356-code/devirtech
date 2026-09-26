UPDATE public.companies
SET enabled_modules = array_append(enabled_modules, 'cadastros')
WHERE NOT ('cadastros' = ANY(enabled_modules));
UPDATE public.companies
SET enabled_submodules = array_append(enabled_submodules, 'cadastros.products-services')
WHERE NOT ('cadastros.products-services' = ANY(enabled_submodules));