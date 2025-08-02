-- Étendre l'enum app_role pour inclure les rôles du département achats
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'purchaser';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'purchase_manager';  
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'purchase_director';

-- Créer la table approval_limits pour définir les limites d'approbation
CREATE TABLE IF NOT EXISTS public.approval_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role app_role NOT NULL,
  max_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role)
);

-- Ajouter des colonnes utiles à la table profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS approval_limit NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS can_approve_orders BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS disabled BOOLEAN DEFAULT false;

-- Insérer les limites d'approbation par défaut pour les nouveaux rôles
INSERT INTO public.approval_limits (role, max_amount, currency) VALUES
  ('user', 0, 'EUR'),
  ('moderator', 5000, 'EUR'),
  ('admin', 50000, 'EUR'),
  ('purchaser', 1000, 'EUR'),
  ('purchase_manager', 10000, 'EUR'),
  ('purchase_director', 100000, 'EUR')
ON CONFLICT (role) DO NOTHING;

-- Activer RLS sur approval_limits
ALTER TABLE public.approval_limits ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour approval_limits
CREATE POLICY "Admin users can manage approval limits" 
ON public.approval_limits 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All users can view approval limits" 
ON public.approval_limits 
FOR SELECT 
USING (true);

-- Créer un trigger pour mettre à jour updated_at sur approval_limits
CREATE TRIGGER update_approval_limits_updated_at
  BEFORE UPDATE ON public.approval_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();