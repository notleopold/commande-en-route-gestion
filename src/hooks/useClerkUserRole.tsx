
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";

export type UserRole = 'admin' | 'moderator' | 'user' | null;

export function useClerkUserRole() {
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      // Get role from user's public metadata
      const role = (user.publicMetadata?.role as UserRole) || 'user';
      setUserRole(role);
      setLoading(false);
    }
  }, [user, isLoaded]);

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
