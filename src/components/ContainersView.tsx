
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, Edit, Trash2, Container, Ship, Package, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

interface Container {
  id: string;
  number: string;
  type: string;
  transitaire: string;
  status: string;
  max_pallets: number;
  max_weight: number;
  max_volume: number;
  dangerous_goods: boolean;
  etd?: string;
  eta?: string;
  created_at: string;
}

interface ContainersViewProps {
  transitaires: { name: string }[];
}

const CONTAINER_STATUSES = ["planning", "loading", "departed", "arrived", "completed"];

export function ContainersView({ transitaires }: ContainersViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [transitaireFilter, setTransitaireFilter] = useState("all");
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [containerToDelete, setContainerToDelete] = useState<Container | null>(null);

  const createForm = useForm({
    defaultValues: {
      number: "",
      type: "40HC",
      transitaire: "",
      max_pallets: "33",
      max_weight: "28000",
      max_volume: "76",
      dangerous_goods: false,
      etd: "",
      eta: "",
    },
  });

  const editForm = useForm({
    defaultValues: {
      number: "",
      type: "40HC",
      transitaire: "",
      max_pallets: "33",
      max_weight: "28000",
      max_volume: "76",
      dangerous_goods: false,
      etd: "",
      eta: "",
    },
  });

  useEffect(() => {
    fetchContainers();
  }, []);

  const fetchContainers = async () => {
    try {
      const { data, error } = await supabase
        .from('containers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContainers(data || []);
    } catch (error) {
      console.error('Error fetching containers:', error);
      toast.error("Erreur lors du chargement des conteneurs");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContainer = async (data: any) => {
    try {
      const containerData = {
        number: data.number,
        type: data.type,
        transitaire: data.transitaire,
        max_pallets: parseInt(data.max_pallets),
        max_weight: parseFloat(data.max_weight),
        max_volume: parseFloat(data.max_volume),
        dangerous_goods: data.dangerous_goods,
        etd: data.etd || null,
        eta: data.eta || null,
        status: 'planning'
      };

      const { error } = await supabase
        .from('containers')
        .insert([containerData]);

      if (error) throw error;

      toast.success("Conteneur créé avec succès");
      setIsCreateOpen(false);
      createForm.reset();
      fetchContainers();
    } catch (error) {
      console.error('Error creating container:', error);
      toast.error("Erreur lors de la création du conteneur");
    }
  };

  const handleEditContainer = async (data: any) => {
    if (!selectedContainer) return;

    try {
      const containerData = {
        number: data.number,
        type: data.type,
        transitaire: data.transitaire,
        max_pallets: parseInt(data.max_pallets),
        max_weight: parseFloat(data.max_weight),
        max_volume: parseFloat(data.max_volume),
        dangerous_goods: data.dangerous_goods,
        etd: data.etd || null,
        eta: data.eta || null,
      };

      const { error } = await supabase
        .from('containers')
        .update(containerData)
        .eq('id', selectedContainer.id);

      if (error) throw error;

      toast.success("Conteneur modifié avec succès");
      setIsEditOpen(false);
      setSelectedContainer(null);
      editForm.reset();
      fetchContainers();
    } catch (error) {
      console.error('Error updating container:', error);
      toast.error("Erreur lors de la modification du conteneur");
    }
  };

  const handleDeleteContainer = (container: Container) => {
    setContainerToDelete(container);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteContainer = async () => {
    if (!containerToDelete) return;

    try {
      const { error } = await supabase
        .from('containers')
        .delete()
        .eq('id', containerToDelete.id);

      if (error) throw error;

      setContainers(prev => prev.filter(c => c.id !== containerToDelete.id));
      toast.success("Conteneur supprimé avec succès");
    } catch (error) {
      console.error('Error deleting container:', error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialogOpen(false);
      setContainerToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      "planning": "bg-gray-100 text-gray-800 hover:bg-gray-100",
      "loading": "bg-blue-100 text-blue-800 hover:bg-blue-100",
      "departed": "bg-orange-100 text-orange-800 hover:bg-orange-100",
      "arrived": "bg-green-100 text-green-800 hover:bg-green-100",
      "completed": "bg-purple-100 text-purple-800 hover:bg-purple-100"
    };
    return <Badge className={styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
  };

  const filteredContainers = containers.filter(container => {
    const matchesSearch = container.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         container.transitaire?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || container.status === statusFilter;
    const matchesTransitaire = transitaireFilter === "all" || container.transitaire === transitaireFilter;
    return matchesSearch && matchesStatus && matchesTransitaire;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conteneurs</CardTitle>
            <Container className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{containers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Planification</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {containers.filter(c => c.status === "planning").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Transit</CardTitle>
            <Ship className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {containers.filter(c => ["loading", "departed"].includes(c.status)).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arrivés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {containers.filter(c => ["arrived", "completed"].includes(c.status)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un conteneur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {CONTAINER_STATUSES.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={transitaireFilter} onValueChange={setTransitaireFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Transitaire" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les transitaires</SelectItem>
              {transitaires.map(transitaire => (
                <SelectItem key={transitaire.name} value={transitaire.name}>{transitaire.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un conteneur
        </Button>
      </div>

      {/* Table des conteneurs */}
      <Card>
        <CardHeader>
          <CardTitle>Conteneurs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Transitaire</TableHead>
                <TableHead>Capacité</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContainers.map((container) => (
                <TableRow key={container.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{container.number}</span>
                      {container.dangerous_goods && (
                        <Badge variant="destructive" className="text-xs">Dangereux</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{container.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{container.transitaire}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{container.max_pallets} palettes</div>
                      <div className="text-muted-foreground">
                        {(container.max_weight/1000).toFixed(1)}T | {container.max_volume}m³
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>ETD: {container.etd ? new Date(container.etd).toLocaleDateString() : "TBD"}</div>
                      <div className="text-muted-foreground">
                        ETA: {container.eta ? new Date(container.eta).toLocaleDateString() : "TBD"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(container.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedContainer(container);
                          setIsViewOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedContainer(container);
                          editForm.setValue("number", container.number);
                          editForm.setValue("type", container.type);
                          editForm.setValue("transitaire", container.transitaire);
                          editForm.setValue("max_pallets", container.max_pallets.toString());
                          editForm.setValue("max_weight", container.max_weight.toString());
                          editForm.setValue("max_volume", container.max_volume.toString());
                          editForm.setValue("dangerous_goods", container.dangerous_goods);
                          editForm.setValue("etd", container.etd || "");
                          editForm.setValue("eta", container.eta || "");
                          setIsEditOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteContainer(container)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog pour créer un conteneur */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau conteneur</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateContainer)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de conteneur</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ex: CONT-001" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="20DC">20' Dry Container</SelectItem>
                          <SelectItem value="40DC">40' Dry Container</SelectItem>
                          <SelectItem value="40HC">40' High Cube</SelectItem>
                          <SelectItem value="45HC">45' High Cube</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="transitaire"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transitaire</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un transitaire" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {transitaires.map(transitaire => (
                          <SelectItem key={transitaire.name} value={transitaire.name}>
                            {transitaire.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={createForm.control}
                  name="max_pallets"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Palettes max</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="33" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="max_weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poids max (kg)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="28000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="max_volume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume max (m³)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.1" placeholder="76" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="etd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de départ (ETD)</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="eta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d'arrivée (ETA)</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="dangerous_goods"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Produits dangereux acceptés</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Ce conteneur peut-il transporter des marchandises dangereuses ?
                      </div>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  Créer le conteneur
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog pour modifier un conteneur */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le conteneur</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditContainer)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de conteneur</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="20DC">20' Dry Container</SelectItem>
                          <SelectItem value="40DC">40' Dry Container</SelectItem>
                          <SelectItem value="40HC">40' High Cube</SelectItem>
                          <SelectItem value="45HC">45' High Cube</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="transitaire"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transitaire</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {transitaires.map(transitaire => (
                          <SelectItem key={transitaire.name} value={transitaire.name}>
                            {transitaire.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="max_pallets"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Palettes max</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="max_weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poids max (kg)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="max_volume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume max (m³)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="etd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de départ (ETD)</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="eta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d'arrivée (ETA)</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="dangerous_goods"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Accepte les produits dangereux</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Modifier</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog pour voir les détails d'un conteneur */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du conteneur - {selectedContainer?.number}</DialogTitle>
          </DialogHeader>
          {selectedContainer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Informations générales</h4>
                    <div className="space-y-2 text-sm">
                      <div>Type: {selectedContainer.type}</div>
                      <div>Transitaire: {selectedContainer.transitaire}</div>
                      <div>Statut: {getStatusBadge(selectedContainer.status)}</div>
                      <div>Produits dangereux: {selectedContainer.dangerous_goods ? "Autorisés" : "Interdits"}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Capacités</h4>
                    <div className="space-y-2 text-sm">
                      <div>Palettes: {selectedContainer.max_pallets}</div>
                      <div>Poids: {(selectedContainer.max_weight/1000).toFixed(1)} T</div>
                      <div>Volume: {selectedContainer.max_volume} m³</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Dates</h4>
                    <div className="space-y-2 text-sm">
                      <div>ETD: {selectedContainer.etd ? new Date(selectedContainer.etd).toLocaleDateString() : "Non défini"}</div>
                      <div>ETA: {selectedContainer.eta ? new Date(selectedContainer.eta).toLocaleDateString() : "Non défini"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteContainer}
        title="ATTENTION CETTE ACTION EST IRRÉVERSIBLE"
        description="Êtes-vous sûr de vouloir supprimer le conteneur"
        itemName={containerToDelete?.number}
        confirmText="Oui, supprimer définitivement"
        cancelText="Annuler"
      />
    </div>
  );
}
