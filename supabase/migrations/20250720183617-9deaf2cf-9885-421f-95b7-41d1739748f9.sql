-- Add new fields for order totals
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS total_ht numeric(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_ttc numeric(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS tva_rate numeric(5,2) DEFAULT 20.00;