-- Ajouter les champs manquants à la table orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS estimated_arrival_date date,
ADD COLUMN IF NOT EXISTS is_arrived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pallets_received integer,
ADD COLUMN IF NOT EXISTS reception_number text;

-- Créer la table order_products si elle n'existe pas déjà (pour les produits dans chaque commande)
-- Cette table fait déjà partie du schéma donc on n'a pas besoin de la créer

-- Ajouter un trigger pour mettre à jour updated_at
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();