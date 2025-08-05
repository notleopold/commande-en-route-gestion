import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

export type Permission = {
  module: string;
  action: string;
  granted: boolean;
};

export type UserRole = 'admin' | 'manager' | 'membre';

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const { userRole } = useUserRole();

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Pour l'instant, utiliser les permissions par défaut basées sur les rôles
      console.log('Permission system loading...');
      
      setPermissions([]);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (module: string, action: string): boolean => {
    // Admin a toutes les permissions
    if (userRole === 'admin') return true;

    // Chercher une permission spécifique
    const specific = permissions.find(p => p.module === module && p.action === action);
    if (specific !== undefined) return specific.granted;

    // Permissions par défaut selon le rôle
    if (userRole === 'manager') {
      return ['read', 'create', 'update', 'approve', 'procure', 'receive'].includes(action);
    }
    
    if (userRole === 'membre') {
      return ['read', 'create'].includes(action);
    }

    return false;
  };

  const updatePermission = async (userId: string, module: string, action: string, granted: boolean) => {
    try {
      // Pour l'instant, juste simuler le succès
      return true;
    } catch (error) {
      console.error('Error updating permission:', error);
      return false;
    }
  };

  return {
    permissions,
    loading,
    hasPermission,
    updatePermission,
    refetch: fetchPermissions
  };
}