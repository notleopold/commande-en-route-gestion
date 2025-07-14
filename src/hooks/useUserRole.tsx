import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'moderator' | 'user' | null;

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

        // First try to get the user's role
        const { data, error } = await supabase
          .rpc('get_user_role', { _user_id: user.id });

        if (error) {
          console.error('Error fetching user role:', error);
        }

        // If no role found, call the assign-admin-role function
        if (!data) {
          try {
            const { data: assignData, error: assignError } = await supabase.functions.invoke('assign-admin-role');
            
            if (assignError) {
              console.error('Error assigning role:', assignError);
              setUserRole('user'); // Default fallback
            } else {
              setUserRole(assignData?.role || 'user');
            }
          } catch (error) {
            console.error('Error in role assignment:', error);
            setUserRole('user');
          }
        } else {
          setUserRole(data || 'user');
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setUserRole('user');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = userRole === 'admin';
  const isModerator = userRole === 'moderator' || userRole === 'admin';
  const hasRole = (role: UserRole) => userRole === role;

  return {
    userRole,
    loading,
    isAdmin,
    isModerator,
    hasRole
  };
}