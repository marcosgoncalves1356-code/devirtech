ALTER TABLE public.customers DROP CONSTRAINT customers_company_id_document_key;
CREATE UNIQUE INDEX customers_company_document_unique_idx
  ON public.customers(company_id, document)
  WHERE document <> '';