-- Add IMDG class field to products table
ALTER TABLE public.products 
ADD COLUMN imdg_class TEXT NULL;

-- Add comment to explain IMDG classes
COMMENT ON COLUMN public.products.imdg_class IS 'IMDG Class for dangerous goods: Classe 1, Classe 2.1, Classe 2.2, Classe 2.3, Classe 3, Classe 4.1, Classe 4.2, Classe 4.3, Classe 5.1, Classe 5.2, Classe 6.1, Classe 6.2, Classe 7, Classe 8, Classe 9';