import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, RotateCcw, Search, Filter, AlertTriangle, Clock, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { useUserRole } from "@/hooks/useUserRole";

interface DeletedItem {
  id: string;
  table_name: string;
  item_id: string;
  item_data: any;
  deleted_at: string;
  deleted_by: string | null;
  reason: string | null;
}

const TrashManagement = () => {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<DeletedItem | null>(null);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isPermanentDeleteDialogOpen, setIsPermanentDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDeletedItems();
  }, []);

  const fetchDeletedItems = async () => {
    try {
      const { data, error } = await supabase
        .from('deleted_items')
        .select('*')
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      setDeletedItems(data || []);
    } catch (error) {
      console.error('Error fetching deleted items:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la corbeille",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedItem) return;

    try {
      const { error } = await supabase.rpc('restore_from_trash', {
        p_trash_id: selectedItem.id
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Élément restauré avec succès`,
      });

      setIsRestoreDialogOpen(false);
      setSelectedItem(null);
      fetchDeletedItems();
    } catch (error) {
      console.error('Error restoring item:', error);
      toast({
        title: "Erreur",
        description: "Impossible de restaurer l'élément",
        variant: "destructive",
      });
    }
  };

  const handlePermanentDelete = async () => {
    if (!selectedItem) return;

    try {
      const { error } = await supabase
        .from('deleted_items')
        .delete()
        .eq('id', selectedItem.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Élément supprimé définitivement",
      });

      setIsPermanentDeleteDialogOpen(false);
      setSelectedItem(null);
      fetchDeletedItems();
    } catch (error) {
      console.error('Error permanently deleting item:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer définitivement l'élément",
        variant: "destructive",
      });
    }
  };

  const getTableDisplayName = (tableName: string) => {
    const names: { [key: string]: string } = {
      'orders': 'Commandes',
      'suppliers': 'Fournisseurs',
      'clients': 'Clients',
      'products': 'Produits'
    };
    return names[tableName] || tableName;
  };

  const getItemDisplayName = (item: DeletedItem) => {
    const data = item.item_data;
    switch (item.table_name) {
      case 'orders':
        return data.order_number || `Commande ${item.item_id.slice(0, 8)}`;
      case 'suppliers':
        return data.name || `Fournisseur ${item.item_id.slice(0, 8)}`;
      case 'clients':
        return data.name || `Client ${item.item_id.slice(0, 8)}`;
      case 'products':
        return data.name || `Produit ${item.item_id.slice(0, 8)}`;
      default:
        return item.item_id.slice(0, 8);
    }
  };

  const getDaysUntilExpiry = (deletedAt: string) => {
    const deleteDate = new Date(deletedAt);
    const expiryDate = new Date(deleteDate);
    expiryDate.setDate(expiryDate.getDate() + 45);
    
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, daysLeft);
  };

  const getExpiryBadge = (deletedAt: string) => {
    const daysLeft = getDaysUntilExpiry(deletedAt);
    
    if (daysLeft <= 3) {
      return <Badge variant="destructive">Expire dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}</Badge>;
    } else if (daysLeft <= 7) {
      return <Badge className="bg-orange-100 text-orange-800">Expire dans {daysLeft} jours</Badge>;
    } else {
      return <Badge variant="secondary">{daysLeft} jours restants</Badge>;
    }
  };

  const filteredItems = deletedItems.filter(item => {
    const matchesSearch = getItemDisplayName(item).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTable = tableFilter === "all" || item.table_name === tableFilter;
    return matchesSearch && matchesTable;
  });

  if (roleLoading) {
    return (
      <Layout title="Gestion de la corbeille">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Vérification des permissions...</div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout title="Gestion de la corbeille">
        <div className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Accès refusé. Seuls les administrateurs peuvent accéder à la gestion de la corbeille.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout title="Gestion de la corbeille">
        <div className="p-6">Chargement...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Gestion de la corbeille">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Corbeille</h1>
            <p className="text-muted-foreground mt-2">
              Les éléments supprimés sont conservés 45 jours avant suppression automatique
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <span className="text-lg font-semibold">{filteredItems.length} élément{filteredItems.length > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher par nom ou raison..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrer par type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="orders">Commandes</SelectItem>
              <SelectItem value="suppliers">Fournisseurs</SelectItem>
              <SelectItem value="clients">Clients</SelectItem>
              <SelectItem value="products">Produits</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Trash Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Éléments dans la corbeille
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Supprimé le</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Raison</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {getItemDisplayName(item)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getTableDisplayName(item.table_name)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{format(new Date(item.deleted_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.deleted_at), { addSuffix: true, locale: fr })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getExpiryBadge(item.deleted_at)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {item.reason || "Aucune raison spécifiée"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedItem(item);
                            setIsRestoreDialogOpen(true);
                          }}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedItem(item);
                            setIsPermanentDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <Trash2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Corbeille vide</h3>
                <p className="text-muted-foreground">
                  {searchTerm || tableFilter !== "all" 
                    ? "Aucun élément ne correspond à vos critères de recherche."
                    : "Aucun élément dans la corbeille."
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Restore Confirmation Dialog */}
        <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-6 w-6 text-green-600" />
                <AlertDialogTitle>Restaurer l'élément</AlertDialogTitle>
              </div>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir restaurer{" "}
                <span className="font-bold">
                  {selectedItem ? getItemDisplayName(selectedItem) : ""}
                </span>
                ?
                <br />
                <br />
                L'élément sera restauré dans sa table d'origine et retiré de la corbeille.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleRestore}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                Oui, restaurer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Permanent Delete Confirmation Dialog */}
        <AlertDialog open={isPermanentDeleteDialogOpen} onOpenChange={setIsPermanentDeleteDialogOpen}>
          <AlertDialogContent className="bg-background border-destructive border-2">
            <AlertDialogHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <AlertDialogTitle className="text-destructive">
                  ATTENTION CETTE ACTION EST IRRÉVERSIBLE
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-lg">
                Êtes-vous absolument certain de vouloir supprimer définitivement{" "}
                <span className="font-bold text-destructive">
                  {selectedItem ? getItemDisplayName(selectedItem) : ""}
                </span>
                ?
                <br />
                <br />
                <span className="text-sm text-muted-foreground">
                  Cette action supprimera l'élément de la corbeille de façon permanente. Il ne sera plus possible de le restaurer.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handlePermanentDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Oui, supprimer définitivement
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default TrashManagement;