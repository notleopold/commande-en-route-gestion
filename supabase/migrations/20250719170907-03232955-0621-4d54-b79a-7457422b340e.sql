-- Add new status fields to orders table
ALTER TABLE public.orders 
ADD COLUMN order_status TEXT DEFAULT 'Demande client reçue',
ADD COLUMN supplier_payment_status TEXT DEFAULT 'Pas encore demandé';

-- Add check constraints for valid values
ALTER TABLE public.orders 
ADD CONSTRAINT order_status_check 
CHECK (order_status IN (
  'Demande client reçue',
  'En cours d''analyse par la centrale',
  'Devis fournisseurs en cours',
  'Devis validé (interne)',
  'En attente de paiement fournisseur',
  'Paiement fournisseur effectué',
  'Commande validée – En production ou préparation',
  'Prête à être expédiée / à enlever',
  'Chez le transitaire',
  'Plan de chargement confirmé',
  'En transit (maritime / aérien)',
  'Arrivée au port / dédouanement',
  'Livraison finale à la filiale / au client local',
  'Archivée / Clôturée'
));

ALTER TABLE public.orders 
ADD CONSTRAINT supplier_payment_status_check 
CHECK (supplier_payment_status IN (
  'Pas encore demandé',
  'Demande de virement envoyée',
  'Virement en attente de validation',
  'Virement effectué',
  'Paiement partiel effectué',
  'Paiement soldé'
));