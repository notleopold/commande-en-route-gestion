-- Create the new unified reservations table
CREATE TABLE public.reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_number text,
  type text NOT NULL,
  transitaire text NOT NULL,
  status text DEFAULT 'planning'::text,
  max_pallets integer DEFAULT 33,
  max_weight numeric DEFAULT 28000.00,
  max_volume numeric DEFAULT 76.00,
  available_pallets integer DEFAULT 0,
  available_weight numeric DEFAULT 0.00,
  available_volume numeric DEFAULT 0.00,
  etd date,
  eta date,
  departure_port text,
  arrival_port text,
  port_cutoff timestamp with time zone,
  dangerous_goods_accepted boolean DEFAULT false,
  notes text,
  cost_per_palette numeric DEFAULT 0.00,
  cost_per_kg numeric DEFAULT 0.00,
  cost_per_m3 numeric DEFAULT 0.00,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Allow all operations on reservations" 
ON public.reservations 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Migrate data from containers table
INSERT INTO public.reservations (
  id, reservation_number, type, transitaire, status, max_pallets, max_weight, max_volume,
  etd, eta, departure_port, arrival_port, port_cutoff, dangerous_goods_accepted,
  created_at, updated_at
)
SELECT 
  id, reservation_number, type, transitaire, status, max_pallets, max_weight, max_volume,
  etd, eta, departure_port, arrival_port, port_cutoff, dangerous_goods AS dangerous_goods_accepted,
  created_at, updated_at
FROM public.containers;

-- Migrate data from groupages table  
INSERT INTO public.reservations (
  id, reservation_number, type, transitaire, status, max_pallets, max_weight, max_volume,
  available_pallets, available_weight, available_volume, etd, eta, 
  dangerous_goods_accepted, cost_per_palette, cost_per_kg, cost_per_m3, notes,
  created_at, updated_at
)
SELECT 
  id, reservation_number, 'groupage' as type, transitaire, status, max_space_pallets, max_weight, max_volume,
  available_space_pallets, available_weight, available_volume, departure_date, arrival_date,
  allows_dangerous_goods, cost_per_palette, cost_per_kg, cost_per_m3, notes,
  created_at, updated_at
FROM public.groupages;

-- Add reservation_id column to orders table
ALTER TABLE public.orders ADD COLUMN reservation_id uuid;

-- Update orders to reference reservations instead of containers
UPDATE public.orders 
SET reservation_id = container_id 
WHERE container_id IS NOT NULL;

-- Update groupage_bookings to reference reservations
ALTER TABLE public.groupage_bookings ADD COLUMN reservation_id uuid;

UPDATE public.groupage_bookings 
SET reservation_id = groupage_id 
WHERE groupage_id IS NOT NULL;

-- Add trigger for updated_at
CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();