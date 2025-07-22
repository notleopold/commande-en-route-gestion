
-- Vérifier les contraintes de clé étrangère sur la table containers
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (ccu.table_name = 'containers' OR tc.table_name = 'containers');

-- Vérifier s'il y a des commandes qui référencent le conteneur
SELECT 
    o.id,
    o.order_number,
    o.container_id,
    c.number as container_number
FROM orders o
JOIN containers c ON o.container_id = c.id
LIMIT 10;
