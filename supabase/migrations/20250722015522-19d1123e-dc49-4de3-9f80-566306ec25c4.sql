-- Créer une table dédiée pour les catégories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Politique pour lire les catégories
CREATE POLICY "Anyone can view categories" 
ON public.categories 
FOR SELECT 
USING (true);

-- Politique pour créer des catégories (authentifié)
CREATE POLICY "Authenticated users can create categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Politique pour modifier des catégories (authentifié)
CREATE POLICY "Authenticated users can update categories" 
ON public.categories 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Politique pour supprimer des catégories (authentifié)
CREATE POLICY "Authenticated users can delete categories" 
ON public.categories 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer les catégories existantes
INSERT INTO public.categories (name) VALUES 
  ('Informatique'),
  ('Chimie'), 
  ('Mécanique'),
  ('Électronique'),
  ('Mobilier')
ON CONFLICT (name) DO NOTHING;