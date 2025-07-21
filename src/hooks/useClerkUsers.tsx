
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClerkUserData {
  id: string;
  first_name: string;
  last_name: string;
  email_addresses: Array<{ email_address: string; }>;
  public_metadata: {
    role?: 'admin' | 'moderator' | 'user';
  };
  created_at: number;
  last_sign_in_at?: number;
  banned: boolean;
}

export function useClerkUsers() {
  const { user: currentUser } = useUser();
  const [users, setUsers] = useState<ClerkUserData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // For now, we'll return mock data as we need the Clerk secret key configured
      // In production, this would call a Clerk API endpoint to list users
      const mockUsers: ClerkUserData[] = [
        {
          id: currentUser?.id || "current-user",
          first_name: currentUser?.firstName || "Current",
          last_name: currentUser?.lastName || "User", 
          email_addresses: [{ email_address: currentUser?.primaryEmailAddress?.emailAddress || "user@example.com" }],
          public_metadata: { role: 'admin' },
          created_at: Date.now() - 86400000,
          last_sign_in_at: Date.now() - 3600000,
          banned: false
        }
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'moderator' | 'user';
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('clerk-user-management', {
        body: {
          action: 'create',
          ...userData
        }
      });

      if (error) throw error;
      
      toast.success('Utilisateur créé avec succès');
      await fetchUsers();
      return { success: true };
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Erreur lors de la création de l\'utilisateur');
      return { success: false, error };
    }
  };

  const updateUser = async (userId: string, updates: {
    first_name?: string;
    last_name?: string;
    role?: 'admin' | 'moderator' | 'user';
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('clerk-user-management', {
        body: {
          action: 'update',
          user_id: userId,
          ...updates
        }
      });

      if (error) throw error;
      
      toast.success('Utilisateur modifié avec succès');
      await fetchUsers();
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Erreur lors de la modification de l\'utilisateur');
      return { success: false, error };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('clerk-user-management', {
        body: {
          action: 'delete',
          user_id: userId
        }
      });

      if (error) throw error;
      
      toast.success('Utilisateur supprimé avec succès');
      await fetchUsers();
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erreur lors de la suppression de l\'utilisateur');
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser
  };
}
