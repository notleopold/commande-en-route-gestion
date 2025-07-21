-- Créer une table pour stocker les compteurs de numéros
CREATE TABLE public.number_counters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL UNIQUE, -- 'reservation' ou 'order'
  current_number INTEGER NOT NULL DEFAULT 0,
  prefix TEXT NOT NULL DEFAULT '', -- préfixe pour le numéro (ex: 'RES', 'CMD')
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insérer les compteurs initiaux
INSERT INTO public.number_counters (entity_type, current_number, prefix) VALUES 
('reservation', 0, 'RES'),
('order', 0, 'CMD');

-- Activer RLS
ALTER TABLE public.number_counters ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture à tous
CREATE POLICY "Allow all operations on number_counters" 
ON public.number_counters 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Fonction pour générer le prochain numéro
CREATE OR REPLACE FUNCTION public.generate_next_number(entity_type_param TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  prefix_value TEXT;
  formatted_number TEXT;
BEGIN
  -- Incrémenter le compteur et récupérer la nouvelle valeur
  UPDATE public.number_counters 
  SET current_number = current_number + 1,
      updated_at = now()
  WHERE entity_type = entity_type_param
  RETURNING current_number, prefix INTO next_number, prefix_value;
  
  -- Formater le numéro avec le préfixe et un padding de zéros
  formatted_number := prefix_value || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN formatted_number;
END;
$$;

-- Créer un trigger pour mettre à jour updated_at
CREATE TRIGGER update_number_counters_updated_at
BEFORE UPDATE ON public.number_counters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();