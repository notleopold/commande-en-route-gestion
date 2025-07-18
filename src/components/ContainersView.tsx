
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  departure_port?: string;
  arrival_port?: string;
  port_cutoff?: string;
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
  const [isBookOrderOpen, setIsBookOrderOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const bookingForm = useForm({
    defaultValues: {
      order_id: "",
      palettes_booked: "",
      weight_booked: "",
      volume_booked: "",
    },
  });

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
      departure_port: "",
      arrival_port: "",
      port_cutoff: "",
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
      departure_port: "",
      arrival_port: "",
      port_cutoff: "",
    },
  });

  useEffect(() => {
    fetchContainers();
    fetchOrders();
  }, []);

  const fetchContainers = async () => {
    try {
      const { data, error } = await supabase
        .from('containers')
        .select('*')
        .neq('type', 'groupage') // Exclure les groupages
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

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          client:clients(name),
          order_products(*, product:products(*))
        `)
        .is('container_id', null);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const canBookOrderInContainer = (order: any, container: Container) => {
    // Check if same transitaire
    if (order.current_transitaire !== container.transitaire) {
      return { canBook: false, reason: `Commande chez ${order.current_transitaire}, conteneur chez ${container.transitaire}` };
    }

    return { canBook: true, reason: null };
  };

  const handleBookOrder = async (data: any) => {
    if (!selectedContainer || !selectedOrder) return;

    try {
      const palettes = parseInt(data.palettes_booked);
      const weight = parseFloat(data.weight_booked);
      const volume = parseFloat(data.volume_booked);

      // Assign the order to the container
      const { error: orderError } = await supabase
        .from('orders')
        .update({ container_id: selectedContainer.id })
        .eq('id', selectedOrder.id);

      if (orderError) throw orderError;

      toast.success("Commande assignée au conteneur avec succès");
      setIsBookOrderOpen(false);
      setSelectedOrder(null);
      bookingForm.reset();
      fetchOrders();
      fetchContainers();
    } catch (error) {
      console.error('Error booking order:', error);
      toast.error("Erreur lors de l'assignation de la commande");
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
        departure_port: data.departure_port || null,
        arrival_port: data.arrival_port || null,
        port_cutoff: data.port_cutoff || null,
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
        departure_port: data.departure_port || null,
        arrival_port: data.arrival_port || null,
        port_cutoff: data.port_cutoff || null,
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
                          editForm.setValue("departure_port", container.departure_port || "");
                          editForm.setValue("arrival_port", container.arrival_port || "");
                          editForm.setValue("port_cutoff", container.port_cutoff || "");
                          setIsEditOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedContainer(container);
                          setIsBookOrderOpen(true);
                        }}
                        disabled={container.status !== 'planning'}
                      >
                        <Plus className="h-4 w-4" />
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="departure_port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Port de départ</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Le Havre, Terminal De France" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="arrival_port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Port d'arrivée</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Dakar, DP World Terminal" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="port_cutoff"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cut-off portuaire</FormLabel>
                    <FormControl>
                      <Input {...field} type="datetime-local" />
                    </FormControl>
                    <div className="text-sm text-muted-foreground">
                      Date et heure limite à laquelle les marchandises doivent être déposées au port (ex : 31-JUL-2025, 11:30 AM)
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="departure_port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Port de départ</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Le Havre, Terminal De France" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="arrival_port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Port d'arrivée</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Dakar, DP World Terminal" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="port_cutoff"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cut-off portuaire</FormLabel>
                    <FormControl>
                      <Input {...field} type="datetime-local" />
                    </FormControl>
                    <div className="text-sm text-muted-foreground">
                      Date et heure limite à laquelle les marchandises doivent être déposées au port (ex : 31-JUL-2025, 11:30 AM)
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      <div>Cut-off: {selectedContainer.port_cutoff ? new Date(selectedContainer.port_cutoff).toLocaleString() : "Non défini"}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Ports</h4>
                    <div className="space-y-2 text-sm">
                      <div>Départ: {selectedContainer.departure_port || "Non défini"}</div>
                      <div>Arrivée: {selectedContainer.arrival_port || "Non défini"}</div>
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

      {/* Dialog pour réserver une commande */}
      <Dialog open={isBookOrderOpen} onOpenChange={setIsBookOrderOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Assigner une commande au conteneur - {selectedContainer?.number}</DialogTitle>
          </DialogHeader>
          {selectedContainer && (
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Capacité du conteneur</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>Palettes: {selectedContainer.max_pallets}</div>
                  <div>Poids: {(selectedContainer.max_weight/1000).toFixed(1)}T</div>
                  <div>Volume: {selectedContainer.max_volume}m³</div>
                </div>
              </div>

              <Form {...bookingForm}>
                <form onSubmit={bookingForm.handleSubmit(handleBookOrder)} className="space-y-4">
                  <FormField
                    control={bookingForm.control}
                    name="order_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commande à assigner</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          const order = orders.find(o => o.id === value);
                          setSelectedOrder(order || null);
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une commande" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <ScrollArea className="h-64">
                              {orders.map(order => {
                                const compatibility = canBookOrderInContainer(order, selectedContainer);
                                const orderPalettes = order.order_products?.reduce((sum: number, op: any) => sum + (op.palette_quantity || 0), 0) || 0;
                                
                                return (
                                  <SelectItem 
                                    key={order.id} 
                                    value={order.id}
                                    disabled={!compatibility.canBook}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <div>
                                        <div className="font-medium">{order.order_number}</div>
                                        <div className="text-sm text-muted-foreground">
                                          {order.supplier} | {orderPalettes} palettes
                                        </div>
                                      </div>
                                      {!compatibility.canBook && (
                                        <div className="text-xs text-red-600 ml-2">
                                          {compatibility.reason}
                                        </div>
                                      )}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedOrder && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h5 className="font-medium mb-2">Détails de la commande sélectionnée</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>Client: {selectedOrder.client?.name || "Non assigné"}</div>
                        <div>Fournisseur: {selectedOrder.supplier}</div>
                        <div>Transitaire: {selectedOrder.current_transitaire}</div>
                        <div>
                          Palettes totales: {selectedOrder.order_products?.reduce((sum: number, op: any) => sum + (op.palette_quantity || 0), 0) || 0}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={bookingForm.control}
                      name="palettes_booked"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Palettes utilisées</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="1" max={selectedContainer.max_pallets} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={bookingForm.control}
                      name="weight_booked"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Poids (kg)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.1" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={bookingForm.control}
                      name="volume_booked"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Volume (m³)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.1" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsBookOrderOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={!selectedOrder}>
                      Assigner
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
