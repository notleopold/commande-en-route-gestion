
import { useState } from "react";
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
import { ClerkProtectedRoute } from "@/components/ClerkProtectedRoute";
import { useClerkUserRole } from "@/hooks/useClerkUserRole";
import { useClerkUsers, ClerkUserData } from "@/hooks/useClerkUsers";
import { useUser } from "@clerk/clerk-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Search, Edit, Trash2, UserPlus, Shield, Mail, AlertCircle } from "lucide-react";

const ClerkUsers = () => {
  const { user: currentUser } = useUser();
  const { isAdmin, loading: roleLoading } = useClerkUserRole();
  const { users, loading, createUser, updateUser, deleteUser } = useClerkUsers();
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ClerkUserData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [newUserForm, setNewUserForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "user" as 'admin' | 'moderator' | 'user'
  });

  const [editUserForm, setEditUserForm] = useState({
    first_name: "",
    last_name: "",
    role: "user" as 'admin' | 'moderator' | 'user'
  });

  const handleCreateUser = async () => {
    if (!newUserForm.first_name || !newUserForm.last_name || !newUserForm.email || !newUserForm.password) {
      return;
    }

    setSubmitting(true);
    const result = await createUser(newUserForm);
    
    if (result.success) {
      setIsNewUserOpen(false);
      setNewUserForm({ first_name: "", last_name: "", email: "", password: "", role: "user" });
    }
    
    setSubmitting(false);
  };

  const handleEditUser = (user: ClerkUserData) => {
    setSelectedUser(user);
    setEditUserForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      role: user.public_metadata?.role || "user"
    });
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setSubmitting(true);
    const result = await updateUser(selectedUser.id, editUserForm);
    
    if (result.success) {
      setIsEditUserOpen(false);
      setSelectedUser(null);
    }
    
    setSubmitting(false);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${userName}" ?`)) {
      return;
    }

    await deleteUser(userId);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="destructive"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case "moderator":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Manager</Badge>;
      case "user":
        return <Badge variant="outline">Membre</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatLastLogin = (timestamp?: number) => {
    if (!timestamp) return "Jamais";
    try {
      return format(new Date(timestamp), "dd/MM/yyyy à HH:mm", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  const filteredUsers = users.filter(user =>
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email_addresses[0]?.email_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.public_metadata?.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeUsers = users.filter(u => !u.banned).length;
  const bannedUsers = users.filter(u => u.banned).length;
  const adminUsers = users.filter(u => u.public_metadata?.role === "admin").length;

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
    <ClerkProtectedRoute>
      <Layout title="Gestion des Utilisateurs">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Utilisateurs (Clerk)</h1>
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
                      onValueChange={(value: 'admin' | 'moderator' | 'user') => 
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

          {/* Stats cards */}
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
                <CardTitle className="text-sm font-medium">Bannis</CardTitle>
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100 px-1 py-0 text-xs">{bannedUsers}</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bannedUsers}</div>
                <p className="text-xs text-muted-foreground">Utilisateurs bannis</p>
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

          {/* Users table */}
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
                    <TableRow key={user.id} className={user.banned ? "opacity-50" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" />
                            <AvatarFallback>{getInitials(user.first_name, user.last_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium">{user.first_name} {user.last_name}</span>
                            {user.banned && (
                              <div className="text-xs text-red-600">Banni</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-2 text-muted-foreground" />
                          {user.email_addresses[0]?.email_address}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.public_metadata?.role || 'user')}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatLastLogin(user.last_sign_in_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!user.banned && user.id !== currentUser?.id && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-800"
                              onClick={() => handleDeleteUser(user.id, `${user.first_name} ${user.last_name}`)}
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

          {/* Edit user dialog */}
          <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Modifier l'utilisateur {selectedUser?.first_name} {selectedUser?.last_name}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-first-name">Prénom</Label>
                  <Input 
                    id="edit-first-name" 
                    value={editUserForm.first_name}
                    onChange={(e) => setEditUserForm(prev => ({...prev, first_name: e.target.value}))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-last-name">Nom</Label>
                  <Input 
                    id="edit-last-name" 
                    value={editUserForm.last_name}
                    onChange={(e) => setEditUserForm(prev => ({...prev, last_name: e.target.value}))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-role">Rôle</Label>
                  <Select 
                    value={editUserForm.role} 
                    onValueChange={(value: 'admin' | 'moderator' | 'user') => 
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
    </ClerkProtectedRoute>
  );
};

export default ClerkUsers;
