
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermissions } from "@/hooks/usePermissions";
import { Separator } from "@/components/ui/separator";

interface PermissionsManagerProps {
  userId: string;
  userRole: 'admin' | 'manager' | 'membre';
  onPermissionChange?: (module: string, action: string, granted: boolean) => void;
}

const modules = [
  {
    name: 'orders',
    label: 'Commandes',
    actions: [
      { name: 'read', label: 'Consulter' },
      { name: 'create', label: 'Créer' },
      { name: 'update', label: 'Modifier' },
      { name: 'delete', label: 'Supprimer' },
      { name: 'approve', label: 'Approuver' },
      { name: 'procure', label: 'Passer commande' },
      { name: 'receive', label: 'Réceptionner' }
    ]
  },
  {
    name: 'products',
    label: 'Produits',
    actions: [
      { name: 'read', label: 'Consulter' },
      { name: 'create', label: 'Créer' },
      { name: 'update', label: 'Modifier' },
      { name: 'delete', label: 'Supprimer' }
    ]
  },
  {
    name: 'clients',
    label: 'Clients',
    actions: [
      { name: 'read', label: 'Consulter' },
      { name: 'create', label: 'Créer' },
      { name: 'update', label: 'Modifier' },
      { name: 'delete', label: 'Supprimer' }
    ]
  },
  {
    name: 'suppliers',
    label: 'Fournisseurs',
    actions: [
      { name: 'read', label: 'Consulter' },
      { name: 'create', label: 'Créer' },
      { name: 'update', label: 'Modifier' },
      { name: 'delete', label: 'Supprimer' }
    ]
  },
  {
    name: 'reports',
    label: 'Rapports',
    actions: [
      { name: 'read', label: 'Consulter' },
      { name: 'create', label: 'Générer' }
    ]
  }
];

export function PermissionsManager({ userId, userRole, onPermissionChange }: PermissionsManagerProps) {
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  const { updatePermission } = usePermissions();

  useEffect(() => {
    fetchUserPermissions();
  }, [userId]);

  const fetchUserPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('module, action, granted')
        .eq('user_id', userId);

      if (error) throw error;

      const permissionsMap: Record<string, boolean> = {};
      data?.forEach(perm => {
        permissionsMap[`${perm.module}.${perm.action}`] = perm.granted;
      });

      setUserPermissions(permissionsMap);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
    }
  };

  const getPermissionValue = (module: string, action: string): boolean => {
    const key = `${module}.${action}`;
    
    // Si une permission spécifique existe, l'utiliser
    if (key in userPermissions) {
      return userPermissions[key];
    }

    // Sinon, utiliser les permissions par défaut du rôle
    if (userRole === 'admin') return true;
    if (userRole === 'manager') return ['read', 'create', 'update', 'approve', 'procure', 'receive'].includes(action);
    if (userRole === 'membre') return ['read', 'create'].includes(action);
    
    return false;
  };

  const handlePermissionChange = async (module: string, action: string, granted: boolean) => {
    const key = `${module}.${action}`;
    
    // Mettre à jour localement
    setUserPermissions(prev => ({ ...prev, [key]: granted }));
    
    // Mettre à jour en base
    const success = await updatePermission(userId, module, action, granted);
    if (!success) {
      // Revenir en arrière en cas d'erreur
      setUserPermissions(prev => ({ ...prev, [key]: !granted }));
    }
    
    onPermissionChange?.(module, action, granted);
  };

  if (userRole === 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Les administrateurs ont accès à toutes les fonctionnalités par défaut.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions spécifiques</CardTitle>
        <p className="text-sm text-muted-foreground">
          Personnalisez les permissions pour ce {userRole === 'manager' ? 'manager' : 'membre'}.
          Les permissions cochées remplacent les permissions par défaut du rôle.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {modules.map((module, moduleIndex) => (
          <div key={module.name}>
            <h4 className="font-medium text-sm text-gray-900 mb-3">{module.label}</h4>
            <div className="grid grid-cols-2 gap-3">
              {module.actions.map(action => {
                const isGranted = getPermissionValue(module.name, action.name);
                const isDefaultPermission = !((`${module.name}.${action.name}`) in userPermissions);
                
                return (
                  <div key={action.name} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${module.name}-${action.name}`}
                      checked={isGranted}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(module.name, action.name, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`${module.name}-${action.name}`}
                      className={`text-sm ${isDefaultPermission ? 'text-muted-foreground' : 'font-medium'}`}
                    >
                      {action.label}
                      {isDefaultPermission && (
                        <span className="text-xs text-blue-600 ml-1">(défaut)</span>
                      )}
                    </Label>
                  </div>
                );
              })}
            </div>
            {moduleIndex < modules.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
