
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'manager' | 'membre' | null;

export function useUserRole() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setUserRole(null);
          setLoading(false);
          return;
        }

        // Récupérer le rôle depuis la nouvelle table user_roles
        const { data, error } = await supabase
          .rpc('get_user_role', { _user_id: user.id });

        if (error) {
          console.error('Error fetching user role:', error);
        }

        // Si aucun rôle trouvé, assigner le rôle admin via la fonction
        if (!data) {
          try {
            const { data: assignData, error: assignError } = await supabase.functions.invoke('assign-admin-role');
            
            if (assignError) {
              console.error('Error assigning role:', assignError);
              setUserRole('membre'); // Fallback par défaut
            } else {
              setUserRole(assignData?.role || 'membre');
            }
          } catch (error) {
            console.error('Error in role assignment:', error);
            setUserRole('membre');
          }
        } else {
          setUserRole((data as UserRole) || 'membre');
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setUserRole('membre');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager' || userRole === 'admin';
  const isMembre = userRole === 'membre';
  const hasRole = (role: UserRole) => userRole === role;

  return {
    userRole,
    loading,
    isAdmin,
    isManager,
    isMembre,
    hasRole
  };
}
