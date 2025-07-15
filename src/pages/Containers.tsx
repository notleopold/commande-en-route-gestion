import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, Search, Container, Package, MapPin, Calendar, Eye, Edit, Ship, 
  Weight, Ruler, AlertTriangle, Truck, Package2, Clock, CheckCircle,
  XCircle, PlusCircle, MinusCircle, Trash2, Link, Unlink
} from "lucide-react";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkContainerCompatibility } from "@/lib/imdg-compatibility";

interface Order {
  id: string;
  order_number: string;
  supplier: string;
  status: string;
  weight?: number;
  volume?: number;
  cartons?: number;
  current_transitaire?: string;
  container_id?: string;
  total_price?: number;
  order_products?: Array<{
    products: Product;
    quantity: number;
    total_price: number;
  }>;
}

interface Product {
  id: string;
  name: string;
  dangerous: boolean;
  imdg_class?: string;
  carton_weight?: number;
  carton_volume?: number;
  cartons_per_palette?: number;
}

interface ContainerData {
  id: string;
  number: string;
  type: string;
  transitaire: string;
  max_weight: number;
  max_volume: number;
  max_pallets: number;
  status: string;
  etd: string | null;
  eta: string | null;
  dangerous_goods: boolean;
  created_at: string;
}

export default function Containers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewContainerOpen, setIsNewContainerOpen] = useState(false);
  const [isEditContainerOpen, setIsEditContainerOpen] = useState(false);
  const [isViewContainerOpen, setIsViewContainerOpen] = useState(false);
  const [isLoadingPlanOpen, setIsLoadingPlanOpen] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<ContainerData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [containerToDelete, setContainerToDelete] = useState<ContainerData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [containerOrders, setContainerOrders] = useState<Order[]>([]);
  const [containers, setContainers] = useState<ContainerData[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchContainers();
    fetchOrders();
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

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_products(
            quantity,
            total_price,
            products(
              id, name, dangerous, imdg_class, carton_weight, carton_volume, cartons_per_palette
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error("Erreur lors du chargement des commandes");
    }
  };

  const filteredContainers = containers.filter(container =>
    container.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    container.transitaire.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditContainer = (container: ContainerData, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setSelectedContainer(container);
    setIsEditContainerOpen(true);
  };

  const handleViewContainer = (container: ContainerData, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setSelectedContainer(container);
    setIsViewContainerOpen(true);
  };

  const handleLoadingPlan = (container: ContainerData, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setSelectedContainer(container);
    
    // Use real orders from database
    if (orders && orders.length > 0) {
      // Get available orders that match this container's transitaire and are not already assigned
      const available = orders.filter(order => 
        order.current_transitaire === container.transitaire && 
        !order.container_id
      );
      
      // Get orders already assigned to this container
      const assigned = orders.filter(order => 
        order.container_id === container.id
      );
      
      setAvailableOrders(available);
      setContainerOrders(assigned);
    }
    
    setIsLoadingPlanOpen(true);
  };

  const getIncompatibleOrders = (transitaire: string) => {
    return orders.filter(order => {
      if (!order.current_transitaire || order.current_transitaire === transitaire) return false;
      
      // Check IMDG compatibility
      const currentImdgClasses = containerOrders
        .flatMap(o => o.order_products?.flatMap(op => op.products?.imdg_class ? [op.products.imdg_class] : []) || []);
      
      const orderImdgClasses = order.order_products
        ?.flatMap(op => op.products?.imdg_class ? [op.products.imdg_class] : []) || [];
      
      const allClasses = [...currentImdgClasses, ...orderImdgClasses];
      const compatibility = checkContainerCompatibility(allClasses);
      
      return !compatibility.compatible;
    });
  };

  const handleLinkOrderToContainer = async (orderId: string, containerId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ container_id: containerId })
        .eq('id', orderId);

      if (error) throw error;

      toast.success("Commande liée au conteneur avec succès");
      fetchOrders();
      
      // Refresh the loading plan
      if (selectedContainer) {
        handleLoadingPlan(selectedContainer);
      }
    } catch (error) {
      console.error('Error linking order to container:', error);
      toast.error("Erreur lors de la liaison");
    }
  };

  const handleUnlinkOrderFromContainer = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ container_id: null })
        .eq('id', orderId);

      if (error) throw error;

      toast.success("Commande déliée du conteneur avec succès");
      fetchOrders();
      
      // Refresh the loading plan
      if (selectedContainer) {
        handleLoadingPlan(selectedContainer);
      }
    } catch (error) {
      console.error('Error unlinking order from container:', error);
      toast.error("Erreur lors de la déliaison");
    }
  };

  const checkOrderCompatibility = (orderProducts: any[]): { compatible: boolean; conflicts: any[] } => {
    const imdgClasses = orderProducts
      .flatMap(op => op.products?.imdg_class ? [op.products.imdg_class] : [])
      .filter(Boolean);
    
    return checkContainerCompatibility(imdgClasses);
  };

  const handleDeleteContainer = (container: ContainerData, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setContainerToDelete(container);
    setDeleteDialogOpen(true);
  };

  const calculateTotalWeight = () => {
    return containerOrders.reduce((total, order) => total + (order.weight || 0), 0);
  };

  const calculateTotalVolume = () => {
    return containerOrders.reduce((total, order) => total + (order.volume || 0), 0);
  };

  const calculateTotalValue = () => {
    return containerOrders.reduce((total, order) => {
      if (order.order_products && order.order_products.length > 0) {
        return total + order.order_products.reduce((sum, op) => sum + op.total_price, 0);
      }
      return total + (order.total_price || 0);
    }, 0);
  };

  const calculateTotalPalettes = () => {
    return containerOrders.reduce((total, order) => {
      if (!order.order_products) return total;
      return total + order.order_products.reduce((orderTotal, op) => {
        const cartons = op.products?.cartons_per_palette || 1;
        const orderCartons = order.cartons || 0;
        return orderTotal + Math.ceil(orderCartons / cartons);
      }, 0);
    }, 0);
  };

  const getContainerCapacity = (type: string) => {
    if (type === "40ft" || type === "40") {
      return { maxWeight: 30000, maxVolume: 67, maxPalettes: 58 };
    }
    return { maxWeight: 24000, maxVolume: 28, maxPalettes: 33 };
  };

  const getCapacityColor = (current: number, max: number, isValue = false) => {
    const percentage = (current / max) * 100;
    
    if (isValue) {
      const threshold = selectedContainer?.type === "40ft" ? 60000 : 45000;
      return current >= threshold ? "text-green-600" : "text-red-600";
    }
    
    if (current > max) return "text-red-600";
    if (percentage < 60) return "text-orange-600";
    if (percentage >= 60 && percentage <= 80) return "text-green-600";
    return "text-yellow-600";
  };

  const confirmDeleteContainer = async () => {
    if (!containerToDelete) return;

    try {
      const { error } = await supabase.rpc('move_to_trash', {
        p_table_name: 'containers',
        p_item_id: containerToDelete.id,
        p_reason: 'Suppression via interface utilisateur'
      });

      if (error) throw error;

      toast.success("Conteneur déplacé vers la corbeille");
      fetchContainers();
    } catch (error) {
      console.error('Error deleting container:', error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialogOpen(false);
      setContainerToDelete(null);
    }
  };

  const getOrderStatusBadge = (status: string) => {
    const colors = {
      "LIVRÉ": "bg-green-100 text-green-800",
      "EN TRANSIT": "bg-blue-100 text-blue-800", 
      "COMMANDÉ > EN LIVRAISON": "bg-purple-100 text-purple-800",
      "À COMMANDER": "bg-orange-100 text-orange-800",
      "PAYÉ (100%)": "bg-green-100 text-green-900"
    };
    
    return (
      <Badge className={colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    return type === "40ft" || type === "40" ? (
      <Container className="h-4 w-4 text-blue-600" />
    ) : (
      <Package className="h-4 w-4 text-green-600" />
    );
  };

  if (loading) {
    return (
      <Layout title="Gestion des Conteneurs">
        <div className="p-6">Chargement...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Gestion des Conteneurs">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Gestion des Conteneurs</h2>
            <p className="text-muted-foreground">Réservez et gérez vos conteneurs auprès des transitaires</p>
          </div>
          
          <Dialog open={isNewContainerOpen} onOpenChange={setIsNewContainerOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Réserver un Conteneur
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Réserver un Nouveau Conteneur</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="number">Numéro de conteneur</Label>
                    <Input id="number" placeholder="CONT-001" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20ft">20ft</SelectItem>
                        <SelectItem value="40ft">40ft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transitaire">Transitaire</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le transitaire" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SIFA">SIFA</SelectItem>
                        <SelectItem value="TAF">TAF</SelectItem>
                        <SelectItem value="TLF">TLF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">En planification</SelectItem>
                        <SelectItem value="loading">En chargement</SelectItem>
                        <SelectItem value="transit">En transit</SelectItem>
                        <SelectItem value="delivered">Livré</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="etd">Date de départ (ETD)</Label>
                    <Input id="etd" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eta">Date d'arrivée (ETA)</Label>
                    <Input id="eta" type="date" />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsNewContainerOpen(false)}>
                  Annuler
                </Button>
                <Button>Réserver</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher par numéro ou transitaire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Containers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Conteneurs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Conteneur</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Transitaire</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Capacités</TableHead>
                  <TableHead>ETD/ETA</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContainers.map((container) => (
                  <TableRow key={container.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{container.number}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{getTypeIcon(container.type)}</span>
                        <span>{container.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{container.transitaire}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800">{container.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center space-x-1">
                          <Weight className="h-3 w-3 text-gray-500" />
                          <span>Max: {(container.max_weight/1000).toFixed(1)}t</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Ruler className="h-3 w-3 text-gray-500" />
                          <span>Max: {container.max_volume}m³</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-red-600" />
                          <span>ETD: {container.etd ? new Date(container.etd).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-blue-600" />
                          <span>ETA: {container.eta ? new Date(container.eta).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => handleViewContainer(container, e)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => handleLoadingPlan(container, e)}
                        >
                          <Package className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => handleEditContainer(container, e)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => handleDeleteContainer(container, e)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* View Container Modal */}
        <Dialog open={isViewContainerOpen} onOpenChange={setIsViewContainerOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Détails du Conteneur - {selectedContainer?.number}</DialogTitle>
            </DialogHeader>
            {selectedContainer && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informations générales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium">{selectedContainer.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transitaire:</span>
                        <Badge variant="outline">{selectedContainer.transitaire}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className="bg-blue-100 text-blue-800">{selectedContainer.status}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Marchandises dangereuses:</span>
                        <span className={selectedContainer.dangerous_goods ? "text-red-600" : "text-green-600"}>
                          {selectedContainer.dangerous_goods ? "Autorisées" : "Non autorisées"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Capacités</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Poids max:</span>
                        <span className="font-medium">{(selectedContainer.max_weight/1000).toFixed(1)}t</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Volume max:</span>
                        <span className="font-medium">{selectedContainer.max_volume}m³</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Palettes max:</span>
                        <span className="font-medium">{selectedContainer.max_pallets}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Commandes assignées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {containerOrders && containerOrders.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>N° Commande</TableHead>
                            <TableHead>Fournisseur</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Poids</TableHead>
                            <TableHead>Volume</TableHead>
                            <TableHead>Cartons</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {containerOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">{order.order_number}</TableCell>
                              <TableCell>{order.supplier}</TableCell>
                              <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                              <TableCell>{order.weight ? `${order.weight/1000}t` : '-'}</TableCell>
                              <TableCell>{order.volume ? `${order.volume}m³` : '-'}</TableCell>
                              <TableCell>{order.cartons || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">Aucune commande chargée</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Loading Plan Modal */}
        <Dialog open={isLoadingPlanOpen} onOpenChange={setIsLoadingPlanOpen}>
          <DialogContent className="max-w-6xl">
            <DialogHeader>
              <DialogTitle>Plan de Chargement - {selectedContainer?.number}</DialogTitle>
            </DialogHeader>
            {selectedContainer && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Compatible Orders */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-green-700">
                        Commandes Compatibles ({selectedContainer.transitaire})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-64 overflow-y-auto">
                      {availableOrders.map((order) => {
                        const compatibility = order.order_products ? checkOrderCompatibility(order.order_products) : { compatible: true, conflicts: [] };
                        return (
                          <div key={order.id} className="flex items-center justify-between p-2 border rounded mb-2">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                {!compatibility.compatible && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                <span className="font-medium">{order.order_number}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {order.supplier} - {order.weight ? `${order.weight/1000}t` : 'N/A'} - {order.volume ? `${order.volume}m³` : 'N/A'}
                              </div>
                              {order.order_products && order.order_products.length > 0 && (
                                <div className="text-xs text-blue-600">
                                  {order.order_products.length} produit(s): {order.order_products.map(op => op.products.name).join(', ')}
                                </div>
                              )}
                              {!compatibility.compatible && (
                                <div className="text-xs text-red-600">
                                  ⚠️ Incompatibilités IMDG détectées
                                </div>
                              )}
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleLinkOrderToContainer(order.id, selectedContainer.id)}
                              disabled={!compatibility.compatible}
                            >
                              <Link className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                      {availableOrders.length === 0 && (
                        <p className="text-muted-foreground text-center py-4">
                          Aucune commande compatible disponible
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Incompatible Orders */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-red-700">
                        Commandes Incompatibles (Autres transitaires)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-64 overflow-y-auto">
                      {getIncompatibleOrders(selectedContainer.transitaire).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-2 border rounded mb-2 bg-red-50">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="font-medium text-red-700">{order.order_number}</span>
                            </div>
                            <div className="text-xs text-red-600">
                              {order.supplier} - Transitaire: {order.current_transitaire}
                            </div>
                          </div>
                          <Alert className="ml-2">
                            <AlertTriangle className="h-3 w-3" />
                            <AlertDescription className="text-xs">
                              Incompatible
                            </AlertDescription>
                          </Alert>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Current Loading */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Chargement Actuel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {containerOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-2 border rounded bg-green-50">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="font-medium">{order.order_number}</span>
                            <span className="text-sm text-muted-foreground">- {order.supplier}</span>
                            {order.order_products && order.order_products.length > 0 && (
                              <span className="text-xs text-blue-600">
                                ({order.order_products.length} produit(s))
                              </span>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUnlinkOrderFromContainer(order.id)}
                          >
                            <Unlink className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      
                      {containerOrders.length === 0 && (
                        <p className="text-muted-foreground text-center py-4">
                          Aucune commande chargée
                        </p>
                      )}
                    </div>

                    <div className="mt-4 p-4 bg-gray-50 rounded">
                      <h4 className="font-medium mb-2">Résumé du Chargement</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {(() => {
                          const totalWeight = calculateTotalWeight();
                          const totalVolume = calculateTotalVolume();
                          const totalValue = calculateTotalValue();
                          const totalPalettes = calculateTotalPalettes();
                          const capacity = getContainerCapacity(selectedContainer.type);
                          
                          return (
                            <>
                              <div>
                                <span className={getCapacityColor(totalWeight, capacity.maxWeight)}>
                                  Poids embarqué: {(totalWeight/1000).toFixed(1)}t / {capacity.maxWeight/1000}t
                                </span>
                                <Progress 
                                  value={Math.min((totalWeight / capacity.maxWeight) * 100, 100)} 
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <span className={getCapacityColor(totalVolume, capacity.maxVolume)}>
                                  Volume embarqué: {totalVolume}m³ / {capacity.maxVolume}m³
                                </span>
                                <Progress 
                                  value={Math.min((totalVolume / capacity.maxVolume) * 100, 100)} 
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <span className={getCapacityColor(totalValue, 0, true)}>
                                  Valeur de la marchandise: {totalValue.toFixed(0)}€
                                </span>
                              </div>
                              <div>
                                <span className={getCapacityColor(totalPalettes, capacity.maxPalettes)}>
                                  Nombre de palettes embarquées: {totalPalettes} / {capacity.maxPalettes}
                                </span>
                                <Progress 
                                  value={Math.min((totalPalettes / capacity.maxPalettes) * 100, 100)} 
                                  className="mt-1"
                                />
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={confirmDeleteContainer}
          title="Supprimer le conteneur"
          description={`Êtes-vous sûr de vouloir supprimer le conteneur ${containerToDelete?.number} ? Cette action ne peut pas être annulée.`}
          confirmText="Supprimer"
          cancelText="Annuler"
        />
      </div>
    </Layout>
  );
}