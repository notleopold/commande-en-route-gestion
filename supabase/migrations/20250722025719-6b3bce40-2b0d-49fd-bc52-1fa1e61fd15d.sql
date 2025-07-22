
-- Créer une fonction pour calculer les totaux d'une commande
CREATE OR REPLACE FUNCTION calculate_order_totals(order_id_param UUID)
RETURNS VOID AS $$
DECLARE
  total_ht_calculated NUMERIC := 0;
  total_ttc_calculated NUMERIC := 0;
  tva_rate_value NUMERIC := 20; -- Taux de TVA par défaut de 20%
BEGIN
  -- Calculer le total HT en additionnant tous les total_price des produits de la commande
  SELECT COALESCE(SUM(total_price), 0)
  INTO total_ht_calculated
  FROM order_products
  WHERE order_id = order_id_param;
  
  -- Récupérer le taux de TVA de la commande (ou utiliser 20% par défaut)
  SELECT COALESCE(tva_rate, 20)
  INTO tva_rate_value
  FROM orders
  WHERE id = order_id_param;
  
  -- Calculer le total TTC
  total_ttc_calculated := total_ht_calculated * (1 + tva_rate_value / 100);
  
  -- Mettre à jour la commande avec les nouveaux totaux
  UPDATE orders
  SET 
    total_ht = total_ht_calculated,
    total_ttc = total_ttc_calculated,
    updated_at = now()
  WHERE id = order_id_param;
END;
$$ LANGUAGE plpgsql;

-- Créer une fonction trigger qui recalcule automatiquement les totaux
CREATE OR REPLACE FUNCTION trigger_calculate_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer les totaux pour la commande concernée
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_order_totals(OLD.order_id);
    RETURN OLD;
  ELSE
    PERFORM calculate_order_totals(NEW.order_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur la table order_products
DROP TRIGGER IF EXISTS trigger_update_order_totals ON order_products;
CREATE TRIGGER trigger_update_order_totals
  AFTER INSERT OR UPDATE OR DELETE ON order_products
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_order_totals();

-- Mettre à jour tous les totaux existants pour les commandes qui ont des produits
DO $$
DECLARE
  order_record RECORD;
BEGIN
  FOR order_record IN 
    SELECT DISTINCT o.id
    FROM orders o
    INNER JOIN order_products op ON o.id = op.order_id
  LOOP
    PERFORM calculate_order_totals(order_record.id);
  END LOOP;
END $$;

-- Index pour améliorer les performances des calculs
CREATE INDEX IF NOT EXISTS idx_order_products_order_id_total ON order_products(order_id, total_price);
