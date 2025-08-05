
-- 1. Mettre à jour l'enum app_role pour avoir les rôles demandés
DROP TYPE IF EXISTS app_role CASCADE;
CREATE TYPE app_role AS ENUM ('admin', 'manager', 'membre');

-- 2. Créer l'enum pour le workflow des commandes
CREATE TYPE workflow_status AS ENUM ('request', 'approve', 'procure', 'receive');

-- 3. Créer la table des permissions utilisateur
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  granted BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, module, action)
);

-- 4. Créer la table des workflows de commande
CREATE TABLE order_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  current_status workflow_status DEFAULT 'request',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(order_id)
);

-- 5. Créer la table des approbations
CREATE TABLE workflow_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES order_workflows(id) ON DELETE CASCADE,
  status workflow_status NOT NULL,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Activer RLS sur les nouvelles tables
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_approvals ENABLE ROW LEVEL SECURITY;

-- 7. Créer les politiques RLS
CREATE POLICY "Admins can manage all permissions" ON user_permissions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own permissions" ON user_permissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Managers can view member permissions" ON user_permissions
  FOR SELECT USING (
    has_role(auth.uid(), 'manager') AND 
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = user_permissions.user_id AND role = 'membre')
  );

CREATE POLICY "All authenticated users can view workflows" ON order_workflows
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and managers can manage workflows" ON order_workflows
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "All authenticated users can view approvals" ON workflow_approvals
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and managers can create approvals" ON workflow_approvals
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- 8. Recréer la table user_roles avec le nouveau type
DROP TABLE IF EXISTS user_roles CASCADE;
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 9. Recréer les politiques pour user_roles
CREATE POLICY "Admins can manage all user roles" ON user_roles
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Managers can view member roles" ON user_roles
  FOR SELECT USING (
    has_role(auth.uid(), 'manager') AND role = 'membre'
  );

-- 10. Fonction pour vérifier les permissions
CREATE OR REPLACE FUNCTION check_user_permission(user_id_param UUID, module_param TEXT, action_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role app_role;
  has_permission BOOLEAN := FALSE;
BEGIN
  -- Récupérer le rôle de l'utilisateur
  SELECT role INTO user_role 
  FROM user_roles 
  WHERE user_id = user_id_param 
  LIMIT 1;
  
  -- Admin peut tout faire
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Vérifier les permissions spécifiques
  SELECT granted INTO has_permission
  FROM user_permissions
  WHERE user_id = user_id_param 
    AND module = module_param 
    AND action = action_param;
  
  -- Si pas de permission spécifique, utiliser les permissions par défaut du rôle
  IF has_permission IS NULL THEN
    -- Manager peut approuver et gérer la plupart des choses
    IF user_role = 'manager' AND action_param IN ('read', 'create', 'update', 'approve') THEN
      has_permission := TRUE;
    -- Membre peut lire et créer des demandes
    ELSIF user_role = 'membre' AND action_param IN ('read', 'create') THEN
      has_permission := TRUE;
    ELSE
      has_permission := FALSE;
    END IF;
  END IF;
  
  RETURN COALESCE(has_permission, FALSE);
END;
$$;

-- 11. Fonction pour avancer le workflow
CREATE OR REPLACE FUNCTION advance_workflow(workflow_id_param UUID, new_status workflow_status, approver_id UUID, comments_param TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mettre à jour le workflow
  UPDATE order_workflows 
  SET current_status = new_status, updated_at = now()
  WHERE id = workflow_id_param;
  
  -- Enregistrer l'approbation
  INSERT INTO workflow_approvals (workflow_id, status, approved_by, comments)
  VALUES (workflow_id_param, new_status, approver_id, comments_param);
  
  RETURN TRUE;
END;
$$;

-- 12. Trigger pour créer automatiquement un workflow pour chaque nouvelle commande
CREATE OR REPLACE FUNCTION create_order_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO order_workflows (order_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_order_workflow
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_order_workflow();
