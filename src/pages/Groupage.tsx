import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ContainersView } from "@/components/ContainersView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, Filter, Eye, Edit, Package, Calculator, AlertTriangle, CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { LoadingPlan } from "@/components/LoadingPlan";

interface Groupage {
  id: string;
  container_id: string;
  transitaire: string;
  available_space_pallets: number;
  max_space_pallets: number;
  available_weight: number;
  max_weight: number;
  available_volume: number;
  max_volume: number;
  allows_dangerous_goods: boolean;
  cost_per_palette: number;
  cost_per_kg: number;
  cost_per_m3: number;
  departure_date?: string;
  arrival_date?: string;
  status: string;
  notes?: string;
  container?: {
    number: string;
    type: string;
    etd?: string;
    eta?: string;
  };
  groupage_bookings?: GroupageBooking[];
}

interface GroupageBooking {
  id: string;
  groupage_id: string;
  order_id: string;
  palettes_booked: number;
  weight_booked: number;
  volume_booked: number;
  cost_calculated: number;
  has_dangerous_goods: boolean;
  booking_status: string;
  confirmed_by_transitaire: boolean;
  transitaire_notes?: string;
  order?: {
    order_number: string;
    supplier: string;
    client?: { name: string };
  };
}

interface Order {
  id: string;
  order_number: string;
  supplier: string;
  current_transitaire?: string;
  order_products?: Array<{
    palette_quantity?: number;
    carton_quantity?: number;
    product?: { dangerous: boolean };
  }>;
  client?: { name: string };
}

const GROUPAGE_STATUSES = ["available", "full", "departed", "arrived"];
const BOOKING_STATUSES = ["pending", "confirmed", "cancelled"];

function Groupage() {
  const [activeTab, setActiveTab] = useState("groupages");
  const [transitaires, setTransitaires] = useState<{name: string}[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [transitaireFilter, setTransitaireFilter] = useState("all");
  const [groupages, setGroupages] = useState<Groupage[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [containers, setContainers] = useState<any[]>([]);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isViewGroupageOpen, setIsViewGroupageOpen] = useState(false);
  const [isBookOrderOpen, setIsBookOrderOpen] = useState(false);
  const [isCreateGroupageOpen, setIsCreateGroupageOpen] = useState(false);
  const [selectedGroupage, setSelectedGroupage] = useState<Groupage | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLoadingPlanOpen, setIsLoadingPlanOpen] = useState(false);
  const [groupageToDelete, setGroupageToDelete] = useState<Groupage | null>(null);
  const [isEditGroupageOpen, setIsEditGroupageOpen] = useState(false);
  const [editingGroupage, setEditingGroupage] = useState<Groupage | null>(null);

  const bookingForm = useForm({
    defaultValues: {
      order_id: "",
      palettes_booked: "",
      weight_booked: "",
      volume_booked: "",
    },
  });

  const createGroupageForm = useForm({
    defaultValues: {
      container_number: "",
      transitaire: "",
      clients: [] as string[],
      max_space_pallets: "",
      max_weight: "",
      max_volume: "",
      allows_dangerous_goods: false,
      departure_date: "",
      arrival_date: "",
      notes: "",
    },
  });

  const editGroupageForm = useForm({
    defaultValues: {
      container_number: "",
      transitaire: "",
      clients: [] as string[],
      max_space_pallets: "",
      max_weight: "",
      max_volume: "",
      allows_dangerous_goods: false,
      departure_date: "",
      arrival_date: "",
      notes: "",
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [groupagesRes, ordersRes, containersRes, transitairesRes, clientsRes] = await Promise.all([
        supabase.from('groupages').select(`
          *,
          container:containers(*),
          groupage_bookings(*, order:orders(*, client:clients(*)))
        `).order('created_at', { ascending: false }),
        supabase.from('orders').select(`
          *,
          client:clients(*),
          order_products(*, product:products(*))
        `).is('container_id', null).eq('is_received', true).order('created_at', { ascending: false }),
        supabase.from('containers').select('*').order('created_at', { ascending: false }),
        supabase.from('transitaires').select('name').eq('status', 'active').order('name'),
        supabase.from('clients').select('id, name').eq('status', 'Active').order('name')
      ]);

      if (groupagesRes.error) throw groupagesRes.error;
      if (ordersRes.error) throw ordersRes.error;
      if (containersRes.error) throw containersRes.error;
      if (transitairesRes.error) throw transitairesRes.error;
      if (clientsRes.error) throw clientsRes.error;

      setGroupages(groupagesRes.data || []);
      setOrders(ordersRes.data || []);
      setContainers(containersRes.data || []);
      setTransitaires(transitairesRes.data || []);
      setClients(clientsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      "available": "bg-green-100 text-green-800 hover:bg-green-100",
      "full": "bg-orange-100 text-orange-800 hover:bg-orange-100",
      "departed": "bg-blue-100 text-blue-800 hover:bg-blue-100",
      "arrived": "bg-purple-100 text-purple-800 hover:bg-purple-100"
    };
    return <Badge className={styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
  };

  const getBookingStatusBadge = (status: string) => {
    const styles = {
      "pending": "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      "confirmed": "bg-green-100 text-green-800 hover:bg-green-100",
      "cancelled": "bg-red-100 text-red-800 hover:bg-red-100"
    };
    return <Badge className={styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
  };

  const canBookOrder = (order: Order, groupage: Groupage) => {
    // Check if same transitaire
    if (order.current_transitaire !== groupage.transitaire) {
      return { canBook: false, reason: `Commande chez ${order.current_transitaire}, groupage chez ${groupage.transitaire}` };
    }

    // Check if has dangerous goods and groupage allows them
    const hasDangerous = order.order_products?.some(op => op.product?.dangerous);
    if (hasDangerous && !groupage.allows_dangerous_goods) {
      return { canBook: false, reason: "Groupage n'accepte pas les produits dangereux" };
    }

    // Check if groupage is available
    if (groupage.status !== 'available') {
      return { canBook: false, reason: `Groupage ${groupage.status}` };
    }

    // Check if enough space
    const orderPalettes = order.order_products?.reduce((sum, op) => sum + (op.palette_quantity || 0), 0) || 0;
    if (orderPalettes > groupage.available_space_pallets) {
      return { canBook: false, reason: `Pas assez de place (${orderPalettes} palettes demandées, ${groupage.available_space_pallets} disponibles)` };
    }

    return { canBook: true, reason: "" };
  };

  const calculateBookingCost = (groupage: Groupage, palettes: number, weight: number, volume: number) => {
    // Pour les groupages, pas de calcul automatique des coûts
    return 0;
  };

  const handleBookOrder = async (data: any) => {
    if (!selectedGroupage || !selectedOrder) return;

    try {
      const palettes = parseInt(data.palettes_booked);
      const weight = parseFloat(data.weight_booked);
      const volume = parseFloat(data.volume_booked);
      const cost = calculateBookingCost(selectedGroupage, palettes, weight, volume);
      
      const hasDangerous = selectedOrder.order_products?.some(op => op.product?.dangerous) || false;

      const bookingData = {
        groupage_id: selectedGroupage.id,
        order_id: selectedOrder.id,
        palettes_booked: palettes,
        weight_booked: weight,
        volume_booked: volume,
        cost_calculated: cost,
        has_dangerous_goods: hasDangerous,
        booking_status: 'pending'
      };

      const { error } = await supabase
        .from('groupage_bookings')
        .insert([bookingData]);

      if (error) throw error;

      // Update groupage available space
      const { error: updateError } = await supabase
        .from('groupages')
        .update({
          available_space_pallets: selectedGroupage.available_space_pallets - palettes,
          available_weight: selectedGroupage.available_weight - weight,
          available_volume: selectedGroupage.available_volume - volume
        })
        .eq('id', selectedGroupage.id);

      if (updateError) throw updateError;

      toast.success("Réservation créée avec succès");
      setIsBookOrderOpen(false);
      bookingForm.reset();
      fetchData();
    } catch (error) {
      console.error('Error booking order:', error);
      toast.error("Erreur lors de la réservation");
    }
  };

  const handleConfirmBooking = async (bookingId: string, confirm: boolean) => {
    try {
      const { error } = await supabase
        .from('groupage_bookings')
        .update({
          booking_status: confirm ? 'confirmed' : 'cancelled',
          confirmed_by_transitaire: confirm
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success(confirm ? "Réservation confirmée" : "Réservation annulée");
      fetchData();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleCreateGroupage = async (data: any) => {
    try {
      const maxPallets = parseInt(data.max_space_pallets);
      const maxWeight = parseFloat(data.max_weight);
      const maxVolume = parseFloat(data.max_volume);

      // Créer d'abord le conteneur s'il n'existe pas
      let containerId = data.container_id;
      if (!containerId && data.container_number) {
        const { data: containerData, error: containerError } = await supabase
          .from('containers')
          .insert([{
            number: data.container_number,
            type: 'groupage',
            transitaire: data.transitaire,
            status: 'planning'
          }])
          .select()
          .single();

        if (containerError) throw containerError;
        containerId = containerData.id;
      }

      const groupageData = {
        container_id: containerId,
        transitaire: data.transitaire,
        max_space_pallets: maxPallets,
        available_space_pallets: maxPallets,
        max_weight: maxWeight,
        available_weight: maxWeight,
        max_volume: maxVolume,
        available_volume: maxVolume,
        allows_dangerous_goods: data.allows_dangerous_goods,
        cost_per_palette: 0, // Pas de tarification pour les groupages
        cost_per_kg: null,
        cost_per_m3: null,
        departure_date: data.departure_date || null,
        arrival_date: data.arrival_date || null,
        notes: data.notes || null,
        status: 'available'
      };

      const { error } = await supabase
        .from('groupages')
        .insert([groupageData]);

      if (error) throw error;

      toast.success("Groupage créé avec succès");
      setIsCreateGroupageOpen(false);
      createGroupageForm.reset();
      fetchData();
    } catch (error) {
      console.error('Error creating groupage:', error);
      toast.error("Erreur lors de la création du groupage");
    }
  };

  const handleEditGroupage = async (data: any) => {
    if (!editingGroupage) return;

    try {
      const maxPallets = parseInt(data.max_space_pallets);
      const maxWeight = parseFloat(data.max_weight);
      const maxVolume = parseFloat(data.max_volume);

      const groupageData = {
        transitaire: data.transitaire,
        max_space_pallets: maxPallets,
        max_weight: maxWeight,
        max_volume: maxVolume,
        allows_dangerous_goods: data.allows_dangerous_goods,
        departure_date: data.departure_date || null,
        arrival_date: data.arrival_date || null,
        notes: data.notes || null,
      };

      const { error } = await supabase
        .from('groupages')
        .update(groupageData)
        .eq('id', editingGroupage.id);

      if (error) throw error;

      toast.success("Groupage modifié avec succès");
      setIsEditGroupageOpen(false);
      setEditingGroupage(null);
      editGroupageForm.reset();
      fetchData();
    } catch (error) {
      console.error('Error updating groupage:', error);
      toast.error("Erreur lors de la modification du groupage");
    }
  };

  const getUsagePercentage = (used: number, total: number) => {
    return total > 0 ? (used / total) * 100 : 0;
  };

  const handleDeleteGroupage = (groupage: Groupage) => {
    setGroupageToDelete(groupage);
    setDeleteDialogOpen(true);
  };

  const handleLoadingPlan = (groupage: Groupage) => {
    setSelectedGroupage(groupage);
    setIsLoadingPlanOpen(true);
  };

  const confirmDeleteGroupage = async () => {
    if (!groupageToDelete) return;

    try {
      // Suppression directe du groupage
      const { error } = await supabase
        .from('groupages')
        .delete()
        .eq('id', groupageToDelete.id);

      if (error) throw error;

      setGroupages(prev => prev.filter(g => g.id !== groupageToDelete.id));
      toast.success("Groupage supprimé avec succès");
    } catch (error) {
      console.error('Error deleting groupage:', error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialogOpen(false);
      setGroupageToDelete(null);
    }
  };

  const filteredGroupages = groupages.filter(groupage => {
    const matchesSearch = groupage.container?.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         groupage.transitaire.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || groupage.status === statusFilter;
    const matchesTransitaire = transitaireFilter === "all" || groupage.transitaire === transitaireFilter;
    return matchesSearch && matchesStatus && matchesTransitaire;
  });

  if (loading) {
    return (
      <Layout title="Transport Maritime">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Chargement...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Transport Maritime">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="conteneurs">Conteneurs</TabsTrigger>
          <TabsTrigger value="groupages">Groupages</TabsTrigger>
        </TabsList>
        
        <TabsContent value="groupages" className="space-y-6">
          {/* Header avec stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Groupages</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{groupages.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {groupages.filter(g => g.status === "available").length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {groupages.reduce((sum, g) => sum + (g.groupage_bookings?.filter(b => b.booking_status === 'pending').length || 0), 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenus Estimés</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {groupages.reduce((sum, g) => 
                    sum + (g.groupage_bookings?.reduce((bookingSum, b) => bookingSum + b.cost_calculated, 0) || 0), 0
                  ).toFixed(0)} €
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
                  placeholder="Rechercher un groupage..."
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
                  {GROUPAGE_STATUSES.map(status => (
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

            <Button onClick={() => setIsCreateGroupageOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un groupage
            </Button>
          </div>

          {/* Table des groupages */}
          <Card>
            <CardHeader>
              <CardTitle>Espaces de groupage disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conteneur</TableHead>
                    <TableHead>Transitaire</TableHead>
                    <TableHead>Capacité</TableHead>
                    <TableHead>Disponible</TableHead>
                    <TableHead>Tarification</TableHead>
                    <TableHead>Départ/Arrivée</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroupages.map((groupage) => {
                    const usedPallets = groupage.max_space_pallets - groupage.available_space_pallets;
                    const usagePercentage = getUsagePercentage(usedPallets, groupage.max_space_pallets);

                    return (
                      <TableRow key={groupage.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{groupage.container?.number}</span>
                            <Badge variant="outline">{groupage.container?.type}</Badge>
                            {groupage.allows_dangerous_goods && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Dangereux OK
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{groupage.transitaire}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{groupage.max_space_pallets} palettes max</div>
                            <div className="text-muted-foreground">
                              {groupage.max_weight/1000}T | {groupage.max_volume}m³
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <span>{groupage.available_space_pallets}/{groupage.max_space_pallets}</span>
                              <Progress value={100 - usagePercentage} className="w-20 h-2" />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(groupage.available_weight/1000).toFixed(1)}T | {groupage.available_volume.toFixed(1)}m³
                            </div>
                          </div>
                        </TableCell>
                         <TableCell>
                           <div className="text-sm">
                             <div className="font-medium">-</div>
                             <div className="text-muted-foreground text-xs">Voir transitaire</div>
                           </div>
                         </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Départ: {groupage.departure_date ? new Date(groupage.departure_date).toLocaleDateString() : "TBD"}</div>
                            <div className="text-muted-foreground">
                              Arrivée: {groupage.arrival_date ? new Date(groupage.arrival_date).toLocaleDateString() : "TBD"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(groupage.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedGroupage(groupage);
                                setIsViewGroupageOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 setEditingGroupage(groupage);
                                 editGroupageForm.setValue("container_number", groupage.container?.number || "");
                                 editGroupageForm.setValue("transitaire", groupage.transitaire);
                                 editGroupageForm.setValue("max_space_pallets", groupage.max_space_pallets.toString());
                                 editGroupageForm.setValue("max_weight", groupage.max_weight.toString());
                                 editGroupageForm.setValue("max_volume", groupage.max_volume.toString());
                                 editGroupageForm.setValue("allows_dangerous_goods", groupage.allows_dangerous_goods);
                                 editGroupageForm.setValue("departure_date", groupage.departure_date || "");
                                 editGroupageForm.setValue("arrival_date", groupage.arrival_date || "");
                                 editGroupageForm.setValue("notes", groupage.notes || "");
                                 setIsEditGroupageOpen(true);
                               }}
                             >
                               <Edit className="h-4 w-4" />
                             </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLoadingPlan(groupage)}
                              >
                                <Package className="h-4 w-4 mr-1" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedGroupage(groupage);
                                  setIsBookOrderOpen(true);
                                }}
                                disabled={groupage.status !== 'available'}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleDeleteGroupage(groupage)}
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Dialog pour voir les détails d'un groupage */}
          <Dialog open={isViewGroupageOpen} onOpenChange={setIsViewGroupageOpen}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Détails du groupage - {selectedGroupage?.container?.number}</DialogTitle>
              </DialogHeader>
              {selectedGroupage && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Informations générales</h4>
                        <div className="space-y-2 text-sm">
                          <div>Transitaire: {selectedGroupage.transitaire}</div>
                          <div>Statut: {getStatusBadge(selectedGroupage.status)}</div>
                          <div>Produits dangereux: {selectedGroupage.allows_dangerous_goods ? "Autorisés" : "Interdits"}</div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Capacités</h4>
                        <div className="space-y-2 text-sm">
                          <div>Palettes: {selectedGroupage.available_space_pallets}/{selectedGroupage.max_space_pallets}</div>
                          <div>Poids: {(selectedGroupage.available_weight/1000).toFixed(1)}/{(selectedGroupage.max_weight/1000).toFixed(1)} T</div>
                          <div>Volume: {selectedGroupage.available_volume.toFixed(1)}/{selectedGroupage.max_volume.toFixed(1)} m³</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                       <div>
                         <h4 className="font-medium mb-2">Tarification</h4>
                         <div className="space-y-2 text-sm">
                           <div>Voir avec le transitaire pour les tarifs</div>
                         </div>
                       </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Dates</h4>
                        <div className="space-y-2 text-sm">
                          <div>Départ: {selectedGroupage.departure_date ? new Date(selectedGroupage.departure_date).toLocaleDateString() : "Non défini"}</div>
                          <div>Arrivée: {selectedGroupage.arrival_date ? new Date(selectedGroupage.arrival_date).toLocaleDateString() : "Non défini"}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Réservations */}
                  <div>
                    <h4 className="font-medium mb-4">Réservations ({selectedGroupage.groupage_bookings?.length || 0})</h4>
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Commande</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Palettes</TableHead>
                            <TableHead>Coût</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedGroupage.groupage_bookings?.map((booking) => (
                            <TableRow key={booking.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{booking.order?.order_number}</div>
                                  <div className="text-sm text-muted-foreground">{booking.order?.supplier}</div>
                                </div>
                              </TableCell>
                              <TableCell>{booking.order?.client?.name || "-"}</TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>{booking.palettes_booked} palettes</div>
                                  <div className="text-muted-foreground">
                                    {(booking.weight_booked/1000).toFixed(1)}T | {booking.volume_booked.toFixed(1)}m³
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{booking.cost_calculated.toFixed(2)} €</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getBookingStatusBadge(booking.booking_status)}
                                  {booking.has_dangerous_goods && (
                                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {booking.booking_status === 'pending' && (
                                  <div className="flex gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleConfirmBooking(booking.id, true)}
                                    >
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleConfirmBooking(booking.id, false)}
                                    >
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Dialog pour réserver une commande */}
          <Dialog open={isBookOrderOpen} onOpenChange={setIsBookOrderOpen}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Réserver dans le groupage - {selectedGroupage?.container?.number}</DialogTitle>
              </DialogHeader>
              {selectedGroupage && (
                <div className="space-y-6">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Espace disponible</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>Palettes: {selectedGroupage.available_space_pallets}/{selectedGroupage.max_space_pallets}</div>
                      <div>Poids: {(selectedGroupage.available_weight/1000).toFixed(1)}T disponibles</div>
                      <div>Volume: {selectedGroupage.available_volume.toFixed(1)}m³ disponibles</div>
                    </div>
                  </div>

                  <Form {...bookingForm}>
                    <form onSubmit={bookingForm.handleSubmit(handleBookOrder)} className="space-y-4">
                      <FormField
                        control={bookingForm.control}
                        name="order_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Commande à réserver</FormLabel>
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
                                    const compatibility = canBookOrder(order, selectedGroupage);
                                    const orderPalettes = order.order_products?.reduce((sum, op) => sum + (op.palette_quantity || 0), 0) || 0;
                                    
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
                              Palettes totales: {selectedOrder.order_products?.reduce((sum, op) => sum + (op.palette_quantity || 0), 0) || 0}
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
                              <FormLabel>Palettes à réserver</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" min="1" max={selectedGroupage.available_space_pallets} />
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
                          Réserver
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Dialog pour créer un nouveau groupage */}
          <Dialog open={isCreateGroupageOpen} onOpenChange={setIsCreateGroupageOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau groupage</DialogTitle>
              </DialogHeader>
              <Form {...createGroupageForm}>
                <form onSubmit={createGroupageForm.handleSubmit(handleCreateGroupage)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createGroupageForm.control}
                      name="container_number"
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
                      control={createGroupageForm.control}
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
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={createGroupageForm.control}
                      name="max_space_pallets"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Palettes maximum</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="1" placeholder="ex: 33" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createGroupageForm.control}
                      name="max_weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Poids max (kg)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.1" placeholder="ex: 28000" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createGroupageForm.control}
                      name="max_volume"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Volume max (m³)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.1" placeholder="ex: 76" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                   {/* Les champs de prix ont été supprimés pour les groupages */}

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createGroupageForm.control}
                      name="departure_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de départ</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createGroupageForm.control}
                      name="arrival_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date d'arrivée</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={createGroupageForm.control}
                    name="allows_dangerous_goods"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Accepter les produits dangereux</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Le transitaire accepte-t-il les marchandises dangereuses ?
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

                  <FormField
                    control={createGroupageForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Notes additionnelles..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateGroupageOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      Créer le groupage
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Dialog Modification Groupage */}
          <Dialog open={isEditGroupageOpen} onOpenChange={setIsEditGroupageOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Modifier le groupage</DialogTitle>
              </DialogHeader>
              <Form {...editGroupageForm}>
                <form onSubmit={editGroupageForm.handleSubmit(handleEditGroupage)} className="space-y-6">
                  
                  <FormField
                    control={editGroupageForm.control}
                    name="container_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro de conteneur</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editGroupageForm.control}
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
                      control={editGroupageForm.control}
                      name="max_space_pallets"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Palettes max</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="ex: 33" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editGroupageForm.control}
                      name="max_weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Poids max (kg)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="ex: 28000" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editGroupageForm.control}
                      name="max_volume"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Volume max (m³)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.1" placeholder="ex: 76.0" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={editGroupageForm.control}
                    name="allows_dangerous_goods"
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editGroupageForm.control}
                      name="departure_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de départ</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editGroupageForm.control}
                      name="arrival_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date d'arrivée</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={editGroupageForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Informations complémentaires..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditGroupageOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">Modifier</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <ConfirmationDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={confirmDeleteGroupage}
            title="ATTENTION CETTE ACTION EST IRRÉVERSIBLE"
            description="Êtes-vous sûr de vouloir supprimer le groupage"
            itemName={groupageToDelete?.container?.number}
            confirmText="Oui, supprimer définitivement"
            cancelText="Annuler"
          />
        </TabsContent>
        
        <TabsContent value="conteneurs">
          <ContainersView transitaires={transitaires} />
        </TabsContent>
      </Tabs>

      <LoadingPlan
        isOpen={isLoadingPlanOpen}
        onClose={() => setIsLoadingPlanOpen(false)}
        groupage={selectedGroupage}
        type="groupage"
      />
    </Layout>
  );
}

export default Groupage;
