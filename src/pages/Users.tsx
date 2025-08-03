import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Search, Edit, Trash2, UserPlus, Shield, Mail, AlertCircle } from "lucide-react";

type UserRole = 'admin' | 'moderator' | 'user' | 'purchaser' | 'purchase_manager' | 'purchase_director';
type BasicRole = 'admin' | 'moderator' | 'user';

interface UserData {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  department?: string;
  role: UserRole;
  disabled?: boolean;
  last_login_at?: string;
  created_at: string;
  approval_limit?: number;
  can_approve_orders?: boolean;
}

const Users = () => {
  const { user: currentUser } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [newUserForm, setNewUserForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    department: "",
    role: "user" as UserRole
  });

  const [editUserForm, setEditUserForm] = useState({
    full_name: "",
    phone: "",
    department: "",
    role: "user" as UserRole
  });

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      // Get profiles first
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get user roles separately
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Create a map of user roles
      const roleMap = new Map();
      userRoles?.forEach(ur => {
        roleMap.set(ur.user_id, ur.role);
      });

      // Transform the data to match expected format  
      const users = profiles?.map(profile => ({
        ...profile,
        role: roleMap.get(profile.id) || profile.role || 'user', // Use user_roles first, then fallback to profile.role
        disabled: (profile as any).disabled || false, // Cast to any since disabled might not exist yet
        approval_limit: (profile as any).approval_limit,
        can_approve_orders: (profile as any).can_approve_orders || false
      })) || [];

      setUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserForm.first_name || !newUserForm.last_name || !newUserForm.email || !newUserForm.password || !newUserForm.department || !newUserForm.role) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'create',
          email: newUserForm.email,
          password: newUserForm.password,
          full_name: `${newUserForm.first_name} ${newUserForm.last_name}`,
          role: newUserForm.role,
          department: newUserForm.department
        }
      });

      if (error) throw error;

      toast.success('Utilisateur créé avec succès');
      setIsNewUserOpen(false);
      setNewUserForm({ first_name: "", last_name: "", email: "", password: "", department: "", role: "user" });
      await fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Erreur lors de la création de l\'utilisateur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setEditUserForm({
      full_name: user.full_name || "",
      phone: user.phone || "",
      department: user.department || "",
      role: user.role
    });
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'update',
          user_id: selectedUser.id,
          full_name: editUserForm.full_name,
          phone: editUserForm.phone,
          department: editUserForm.department,
          role: editUserForm.role
        }
      });

      if (error) throw error;

      toast.success('Utilisateur modifié avec succès');
      setIsEditUserOpen(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Erreur lors de la modification de l\'utilisateur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir désactiver l'utilisateur "${userName}" ?`)) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { 
          action: 'delete',
          user_id: userId 
        }
      });

      if (error) throw error;

      toast.success('Utilisateur désactivé avec succès');
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erreur lors de la désactivation de l\'utilisateur');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="destructive"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case "moderator":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Manager</Badge>;
      case "user":
        return <Badge variant="outline">Membre</Badge>;
      case "purchaser":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Acheteur</Badge>;
      case "purchase_manager":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Manager Achats</Badge>;
      case "purchase_director":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Directeur Achats</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return "Jamais";
    try {
      return format(new Date(lastLogin), "dd/MM/yyyy à HH:mm", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeUsers = users.filter(u => !u.disabled).length;
  const inactiveUsers = users.filter(u => u.disabled).length;
  const adminUsers = users.filter(u => u.role === "admin").length;

  // Redirect if not admin
  if (!roleLoading && !isAdmin) {
    return (
      <Layout title="Accès refusé">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Accès refusé</h2>
            <p className="text-muted-foreground">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (roleLoading || loading) {
    return (
      <Layout title="Gestion des Utilisateurs">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Chargement...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <ProtectedRoute>
      <Layout title="Gestion des Utilisateurs">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Utilisateurs</h1>
              <p className="text-muted-foreground">Gérez les utilisateurs et leurs permissions</p>
            </div>
            <Dialog open={isNewUserOpen} onOpenChange={setIsNewUserOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Nouvel Utilisateur
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="first_name">Prénom *</Label>
                      <Input 
                        id="first_name" 
                        value={newUserForm.first_name}
                        onChange={(e) => setNewUserForm(prev => ({...prev, first_name: e.target.value}))}
                        placeholder="Jean" 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="last_name">Nom *</Label>
                      <Input 
                        id="last_name" 
                        value={newUserForm.last_name}
                        onChange={(e) => setNewUserForm(prev => ({...prev, last_name: e.target.value}))}
                        placeholder="Dupont" 
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm(prev => ({...prev, email: e.target.value}))}
                      placeholder="jean.dupont@entreprise.fr" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Mot de passe *</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm(prev => ({...prev, password: e.target.value}))}
                      placeholder="••••••••" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Rôle *</Label>
                    <Select 
                      value={newUserForm.role} 
                      onValueChange={(value: UserRole) => 
                        setNewUserForm(prev => ({...prev, role: value}))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Membre</SelectItem>
                        <SelectItem value="moderator">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="purchaser">Acheteur</SelectItem>
                        <SelectItem value="purchase_manager">Manager Achats</SelectItem>
                        <SelectItem value="purchase_director">Directeur Achats</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="department">Département</Label>
                    <Select
                      value={newUserForm.department}
                      onValueChange={(value) =>
                        setNewUserForm(prev => ({ ...prev, department: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le département" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="informatique">Direction</SelectItem>
                        <SelectItem value="rh">Achats</SelectItem>
                        <SelectItem value="logistique">Logistique</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsNewUserOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateUser} disabled={submitting}>
                    {submitting ? 'Création...' : 'Créer l\'utilisateur'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
                <UserPlus className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">Utilisateurs enregistrés</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actifs</CardTitle>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 px-1 py-0 text-xs">{activeUsers}</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeUsers}</div>
                <p className="text-xs text-muted-foreground">Utilisateurs actifs</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Désactivés</CardTitle>
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100 px-1 py-0 text-xs">{inactiveUsers}</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inactiveUsers}</div>
                <p className="text-xs text-muted-foreground">Utilisateurs désactivés</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administrateurs</CardTitle>
                <Shield className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminUsers}</div>
                <p className="text-xs text-muted-foreground">Avec privilèges admin</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <CardTitle>Liste des Utilisateurs</CardTitle>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un utilisateur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Dernière Connexion</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className={user.disabled ? "opacity-50" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" />
                            <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium">{user.full_name}</span>
                            {user.disabled && (
                              <div className="text-xs text-red-600">Désactivé</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-2 text-muted-foreground" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatLastLogin(user.last_login_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!user.disabled && user.id !== currentUser?.id && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-800"
                              onClick={() => handleDeleteUser(user.id, user.full_name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Dialog for editing user */}
          <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Modifier l'utilisateur {selectedUser?.full_name}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Nom complet</Label>
                  <Input 
                    id="edit-name" 
                    value={editUserForm.full_name}
                    onChange={(e) => setEditUserForm(prev => ({...prev, full_name: e.target.value}))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Téléphone</Label>
                  <Input 
                    id="edit-phone" 
                    value={editUserForm.phone}
                    onChange={(e) => setEditUserForm(prev => ({...prev, phone: e.target.value}))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-department">Département</Label>
                  <Select
                    value={editUserForm.department}
                    onValueChange={(value: string) =>
                      setEditUserForm((prev) => ({ ...prev, department: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="informatique">Direction</SelectItem>
                      <SelectItem value="rh">Achats</SelectItem>
                      <SelectItem value="logistique">Logistique</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-role">Rôle</Label>
                  <Select 
                    value={editUserForm.role} 
                    onValueChange={(value: UserRole) => 
                      setEditUserForm(prev => ({...prev, role: value}))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Membre</SelectItem>
                      <SelectItem value="moderator">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="purchaser">Acheteur</SelectItem>
                      <SelectItem value="purchase_manager">Manager Achats</SelectItem>
                      <SelectItem value="purchase_director">Directeur Achats</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleUpdateUser} disabled={submitting}>
                  {submitting ? 'Modification...' : 'Modifier l\'utilisateur'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Users;