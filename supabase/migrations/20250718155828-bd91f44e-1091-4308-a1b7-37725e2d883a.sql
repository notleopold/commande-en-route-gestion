-- Add new fields to containers table
ALTER TABLE public.containers 
ADD COLUMN departure_port text,
ADD COLUMN arrival_port text,
ADD COLUMN port_cutoff timestamp with time zone;