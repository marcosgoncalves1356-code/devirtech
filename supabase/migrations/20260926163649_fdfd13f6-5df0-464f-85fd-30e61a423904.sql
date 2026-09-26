REVOKE EXECUTE ON FUNCTION public.can_access_submodule(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_submodule_write_access() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_financial_entry_access() FROM anon, authenticated;