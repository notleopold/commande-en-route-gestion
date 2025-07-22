-- Mettre à jour les compteurs pour commencer à 10
UPDATE public.number_counters 
SET current_number = 10 
WHERE entity_type IN ('reservation', 'order');

-- Ajouter une colonne reservation_number à la table containers
ALTER TABLE public.containers 
ADD COLUMN reservation_number TEXT;

-- Ajouter une colonne reservation_number à la table groupages
ALTER TABLE public.groupages 
ADD COLUMN reservation_number TEXT;