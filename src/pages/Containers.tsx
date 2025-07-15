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
  type: '20ft' | '40ft';
  transitaire: string;
  shipName: string;
  maxWeight: string;
  maxVolume: string;
  cost: string;
  status: string;
  etd: string;
  eta: string;
  currentWeight: string;
  currentVolume: string;
  orders: Order[];
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
  
  const [containers] = useState<ContainerData[]>([
    {
      id: "CONT-001",
      type: "20ft",
      transitaire: "SIFA",
      shipName: "CMA CGM MARSEILLE",
      maxWeight: "24t",
      maxVolume: "28m³",
      cost: "2,450€",
      status: "En cours d'utilisation",
      etd: "2024-01-20",
      eta: "2024-02-15",
      currentWeight: "18.5t",
      currentVolume: "22m³",
      orders: [
        { 
          id: "ORDER-001", 
          order_number: "CMD-001", 
          supplier: "Sofidel", 
          status: "LIVRÉ", 
          weight: 8200, 
          volume: 12, 
          cartons: 150,
          current_transitaire: "SIFA",
          container_id: "CONT-001"
        }
      ]
    },
    {
      id: "CONT-002",
      type: "40ft",
      transitaire: "TAF",
      shipName: "MAERSK ELIZABETH",
      maxWeight: "30t",
      maxVolume: "67m³",
      cost: "3,200€",
      status: "Disponible",
      etd: "2024-01-25",
      eta: "2024-02-20",
      currentWeight: "0t",
      currentVolume: "0m³",
      orders: []
    },
    {
      id: "CONT-003",
      type: "20ft",
      transitaire: "CEVA",
      shipName: "HAPAG LLOYD AFRICA",
      maxWeight: "24t",
      maxVolume: "28m³",
      cost: "2,680€",
      status: "En transit",
      etd: "2024-01-18",
      eta: "2024-02-12",
      currentWeight: "23.8t",
      currentVolume: "26m³",
      orders: [
        { 
          id: "ORDER-002", 
          order_number: "CMD-002", 
          supplier: "ChemCorp", 
          status: "LIVRÉ", 
          weight: 15500, 
          volume: 18, 
          cartons: 80,
          current_transitaire: "CEVA",
          container_id: "CONT-003"
        }
      ]
    }
  ]);

  const transitaires = ["SIFA", "TAF", "CEVA"];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_products (
            *,
            products (*)
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

  const getStatusBadge = (status: string) => {
    const styles = {
      "Disponible": "bg-green-100 text-green-800 hover:bg-green-100",
      "En cours d'utilisation": "bg-blue-100 text-blue-800 hover:bg-blue-100",
      "En transit": "bg-orange-100 text-orange-800 hover:bg-orange-100",
      "Maintenance": "bg-red-100 text-red-800 hover:bg-red-100"
    };
    return <Badge className={styles[status] || ""}>{status}</Badge>;
  };

  const getOrderStatusBadge = (status: string) => {
    const styles = {
      "BDC ENVOYÉ ZIKETRO": "bg-blue-100 text-blue-800",
      "À COMMANDER": "bg-orange-100 text-orange-800",
      "PAIEMENT EN ATTENTE": "bg-yellow-100 text-yellow-800",
      "COMMANDÉ > EN LIVRAISON": "bg-purple-100 text-purple-800",
      "PAYÉ (30%)": "bg-green-100 text-green-600",
      "PAYÉ (50%)": "bg-green-100 text-green-700",
      "PAYÉ (100%)": "bg-green-100 text-green-800",
      "LIVRÉ": "bg-green-100 text-green-900"
    };
    return <Badge className={styles[status] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    if (type === "40ft") return "📦📦";
    return "📦";
  };

  const calculateFillPercentage = (current: string, max: string, type: 'weight' | 'volume') => {
    const currentNum = parseFloat(current.replace(/[^\d.]/g, ''));
    const maxNum = parseFloat(max.replace(/[^\d.]/g, ''));
    return Math.round((currentNum / maxNum) * 100);
  };

  const filteredContainers = containers.filter(container =>
    container.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    container.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    container.transitaire.toLowerCase().includes(searchTerm.toLowerCase()) ||
    container.shipName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditContainer = (container: ContainerData) => {
    setSelectedContainer(container);
    setIsEditContainerOpen(true);
  };

  const handleViewContainer = (container: ContainerData) => {
    setSelectedContainer(container);
    setIsViewContainerOpen(true);
  };

  const handleLoadingPlan = (container: ContainerData) => {
    setSelectedContainer(container);
    // Get available orders that match this container's transitaire and are not already assigned
    const available = orders.filter(order => 
      order.current_transitaire === container.transitaire && 
      !order.container_id
    );
    setAvailableOrders(available);
    
    // Get orders already assigned to this container
    const assigned = orders.filter(order => order.container_id === container.id);
    setContainerOrders(assigned);
    
    setIsLoadingPlanOpen(true);
  };

  const getCompatibleOrders = (transitaire: string) => {
    return orders.filter(order => 
      order.current_transitaire === transitaire && 
      !order.container_id
    );
  };

  const getIncompatibleOrders = (transitaire: string) => {
    return orders.filter(order => 
      order.current_transitaire && 
      order.current_transitaire !== transitaire && 
      !order.container_id
    );
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

  const handleDeleteContainer = (container: ContainerData) => {
    setContainerToDelete(container);
    setDeleteDialogOpen(true);
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
    } catch (error) {
      console.error('Error deleting container:', error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialogOpen(false);
      setContainerToDelete(null);
    }
  };

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
                    <Label htmlFor="type">Type de Conteneur</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20ft">20ft Standard</SelectItem>
                        <SelectItem value="40ft">40ft Standard</SelectItem>
                        <SelectItem value="groupage">Groupage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transitaire">Transitaire</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le transitaire" />
                      </SelectTrigger>
                      <SelectContent>
                        {transitaires.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="shipName">Nom du Navire</Label>
                  <Input id="shipName" placeholder="Ex: CMA CGM MARSEILLE" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxWeight">Poids Max (tonnes)</Label>
                    <Input id="maxWeight" placeholder="24" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxVolume">Volume Max (m³)</Label>
                    <Input id="maxVolume" placeholder="28" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Coût</Label>
                    <Input id="cost" placeholder="2,450€" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="etd">Date de Départ (ETD)</Label>
                    <Input id="etd" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eta">Date d'Arrivée (ETA)</Label>
                    <Input id="eta" type="date" />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsNewContainerOpen(false)}>Annuler</Button>
                  <Button onClick={() => setIsNewContainerOpen(false)}>Réserver le Conteneur</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conteneurs</CardTitle>
              <Container className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{containers.length}</div>
              <p className="text-xs text-muted-foreground">Réservés</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {containers.filter(c => c.status === "Disponible").length}
              </div>
              <p className="text-xs text-muted-foreground">Prêts à charger</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Utilisation</CardTitle>
              <Truck className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {containers.filter(c => c.status === "En cours d'utilisation").length}
              </div>
              <p className="text-xs text-muted-foreground">En cours de chargement</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Transit</CardTitle>
              <Ship className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {containers.filter(c => c.status === "En transit").length}
              </div>
              <p className="text-xs text-muted-foreground">En mer</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Liste des Conteneurs</CardTitle>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Transitaire</TableHead>
                  <TableHead>Navire</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remplissage</TableHead>
                  <TableHead>ETD/ETA</TableHead>
                  <TableHead>Coût</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContainers.map((container) => (
                  <TableRow key={container.id}>
                    <TableCell className="font-medium">{container.id}</TableCell>
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
                      <div className="flex items-center space-x-1">
                        <Ship className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{container.shipName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(container.status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-xs">
                          <Weight className="h-3 w-3" />
                          <span>{container.currentWeight} / {container.maxWeight}</span>
                        </div>
                        <Progress 
                          value={calculateFillPercentage(container.currentWeight, container.maxWeight, 'weight')} 
                          className="h-1"
                        />
                        <div className="flex items-center space-x-2 text-xs">
                          <Package2 className="h-3 w-3" />
                          <span>{container.currentVolume} / {container.maxVolume}</span>
                        </div>
                        <Progress 
                          value={calculateFillPercentage(container.currentVolume, container.maxVolume, 'volume')} 
                          className="h-1"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-green-600" />
                          <span>ETD: {container.etd}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-blue-600" />
                          <span>ETA: {container.eta}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{container.cost}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleViewContainer(container)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleLoadingPlan(container)}>
                          <Package className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditContainer(container)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteContainer(container)}>
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

        {/* Container Details Modal */}
        <Dialog open={isViewContainerOpen} onOpenChange={setIsViewContainerOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Détails du Conteneur {selectedContainer?.id}</DialogTitle>
            </DialogHeader>
            {selectedContainer && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Informations Générales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="font-medium">{selectedContainer.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transitaire:</span>
                        <Badge variant="outline">{selectedContainer.transitaire}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Navire:</span>
                        <span className="font-medium">{selectedContainer.shipName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        {getStatusBadge(selectedContainer.status)}
                      </div>
                      <div className="flex justify-between">
                        <span>Coût:</span>
                        <span className="font-medium">{selectedContainer.cost}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Capacité & Remplissage</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Poids: {selectedContainer.currentWeight} / {selectedContainer.maxWeight}</span>
                          <span>{calculateFillPercentage(selectedContainer.currentWeight, selectedContainer.maxWeight, 'weight')}%</span>
                        </div>
                        <Progress value={calculateFillPercentage(selectedContainer.currentWeight, selectedContainer.maxWeight, 'weight')} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Volume: {selectedContainer.currentVolume} / {selectedContainer.maxVolume}</span>
                          <span>{calculateFillPercentage(selectedContainer.currentVolume, selectedContainer.maxVolume, 'volume')}%</span>
                        </div>
                        <Progress value={calculateFillPercentage(selectedContainer.currentVolume, selectedContainer.maxVolume, 'volume')} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Commandes Chargées ({selectedContainer.orders.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedContainer.orders.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Commande</TableHead>
                            <TableHead>Fournisseur</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Poids</TableHead>
                            <TableHead>Volume</TableHead>
                            <TableHead>Cartons</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedContainer.orders.map((order) => (
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
              <DialogTitle>Plan de Chargement - {selectedContainer?.id}</DialogTitle>
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
                        <div>
                          <span>Poids Total: {selectedContainer.currentWeight} / {selectedContainer.maxWeight}</span>
                          <Progress value={calculateFillPercentage(selectedContainer.currentWeight, selectedContainer.maxWeight, 'weight')} className="mt-1" />
                        </div>
                        <div>
                          <span>Volume Total: {selectedContainer.currentVolume} / {selectedContainer.maxVolume}</span>
                          <Progress value={calculateFillPercentage(selectedContainer.currentVolume, selectedContainer.maxVolume, 'volume')} className="mt-1" />
                        </div>
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
          title="ATTENTION CETTE ACTION EST IRRÉVERSIBLE"
          description="Êtes-vous sûr de vouloir supprimer le conteneur"
          itemName={containerToDelete?.id}
          confirmText="Oui, supprimer définitivement"
          cancelText="Annuler"
        />
      </div>
    </Layout>
  );
}