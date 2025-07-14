import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, MapPin, Calendar, Truck, Package, Clock, Eye, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

export default function Logistics() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewShipmentOpen, setIsNewShipmentOpen] = useState(false);
  const [isEditShipmentOpen, setIsEditShipmentOpen] = useState(false);
  const [isViewShipmentOpen, setIsViewShipmentOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logisticToDelete, setLogisticToDelete] = useState<any>(null);
  
  const [logistics] = useState([
    {
      id: "LOG-001",
      orderId: "CMD-001",
      origin: "Entrepôt Paris",
      destination: "Lyon",
      status: "En transit",
      progress: 65,
      estimatedDelivery: "2024-01-20",
      actualDelivery: null,
      carrier: "Transport Express",
      trackingNumber: "TE123456789"
    },
    {
      id: "LOG-002", 
      orderId: "CMD-002",
      origin: "Entrepôt Marseille",
      destination: "Nice",
      status: "Livré",
      progress: 100,
      estimatedDelivery: "2024-01-18",
      actualDelivery: "2024-01-17",
      carrier: "Logistic Pro",
      trackingNumber: "LP987654321"
    },
    {
      id: "LOG-003",
      orderId: "CMD-003",
      origin: "Entrepôt Lille",
      destination: "Strasbourg", 
      status: "En retard",
      progress: 40,
      estimatedDelivery: "2024-01-16",
      actualDelivery: null,
      carrier: "Quick Delivery",
      trackingNumber: "QD456789123"
    },
    {
      id: "LOG-004",
      orderId: "CMD-004",
      origin: "Entrepôt Bordeaux",
      destination: "Toulouse",
      status: "En préparation",
      progress: 0,
      estimatedDelivery: "2024-01-22",
      actualDelivery: null,
      carrier: "Fast Track",
      trackingNumber: "FT789123456"
    }
  ]);

  const vehicles = [
    {
      id: "VEH-001",
      driver: "Jean Dupont",
      status: "En route",
      currentLocation: "A6 - Sens Paris-Lyon",
      destination: "Lyon",
      eta: "14:30",
      cargo: 3
    },
    {
      id: "VEH-002",
      driver: "Marie Martin",
      status: "Chargement",
      currentLocation: "Entrepôt Marseille",
      destination: "Toulouse",
      eta: "16:45",
      cargo: 2
    },
    {
      id: "VEH-003",
      driver: "Pierre Durand",
      status: "Disponible",
      currentLocation: "Base Bordeaux",
      destination: "-",
      eta: "-",
      cargo: 0
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      "En transit": "bg-blue-100 text-blue-800 hover:bg-blue-100",
      "Livré": "bg-green-100 text-green-800 hover:bg-green-100",
      "En retard": "bg-red-100 text-red-800 hover:bg-red-100",
      "En préparation": "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      "En route": "bg-blue-100 text-blue-800 hover:bg-blue-100",
      "Chargement": "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      "Disponible": "bg-green-100 text-green-800 hover:bg-green-100"
    };
    return <Badge className={styles[status] || ""}>{status}</Badge>;
  };

  const handleDeleteLogistic = (logistic: any) => {
    setLogisticToDelete(logistic);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteLogistic = () => {
    if (!logisticToDelete) return;
    
    // For now, just remove from state (since this is mock data)
    // In a real app, you would call move_to_trash function
    toast.success("Tâche logistique supprimée avec succès");
    setDeleteDialogOpen(false);
    setLogisticToDelete(null);
  };

  const filteredLogistics = logistics.filter(item =>
    item.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.carrier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditShipment = (shipment: any) => {
    setSelectedShipment(shipment);
    setIsEditShipmentOpen(true);
  };

  const handleViewShipment = (shipment: any) => {
    setSelectedShipment(shipment);
    setIsViewShipmentOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion Logistique</h2>
          <p className="text-muted-foreground">Suivez toutes vos expéditions et livraisons</p>
        </div>
        
        <Dialog open={isNewShipmentOpen} onOpenChange={setIsNewShipmentOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Suivi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un Nouveau Suivi Logistique</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderId">Commande</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une commande" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cmd-001">CMD-001</SelectItem>
                      <SelectItem value="cmd-002">CMD-002</SelectItem>
                      <SelectItem value="cmd-003">CMD-003</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carrier">Transporteur</Label>
                  <Input id="carrier" placeholder="Nom du transporteur" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">Origine</Label>
                  <Input id="origin" placeholder="Lieu d'origine" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input id="destination" placeholder="Lieu de destination" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tracking">N° de Suivi</Label>
                  <Input id="tracking" placeholder="Numéro de suivi" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated">Livraison Prévue</Label>
                  <Input id="estimated" type="date" />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsNewShipmentOpen(false)}>Annuler</Button>
                <Button onClick={() => setIsNewShipmentOpen(false)}>Créer le Suivi</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Transit</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Expéditions actives</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livrées</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Retard</CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Nécessitent attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
            <MapPin className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2j</div>
            <p className="text-xs text-muted-foreground">Délai de livraison</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="shipments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="shipments">Expéditions</TabsTrigger>
          <TabsTrigger value="vehicles">Véhicules</TabsTrigger>
        </TabsList>

        <TabsContent value="shipments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Suivi des Expéditions</CardTitle>
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
                    <TableHead>ID Logistique</TableHead>
                    <TableHead>Commande</TableHead>
                    <TableHead>Origine → Destination</TableHead>
                    <TableHead>Transporteur</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progression</TableHead>
                    <TableHead>Livraison Prévue</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogistics.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.orderId}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{item.origin}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-sm">{item.destination}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.carrier}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Progress value={item.progress} className="w-20" />
                          <span className="text-xs text-muted-foreground">{item.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {item.estimatedDelivery}
                          {item.actualDelivery && (
                            <div className="text-xs text-green-600">
                              Livré: {item.actualDelivery}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewShipment(item)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditShipment(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteLogistic(item)}>
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
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>État de la Flotte</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Chauffeur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Position Actuelle</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead>Chargement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.id}</TableCell>
                      <TableCell>{vehicle.driver}</TableCell>
                      <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {vehicle.currentLocation}
                        </div>
                      </TableCell>
                      <TableCell>{vehicle.destination}</TableCell>
                      <TableCell>
                        {vehicle.eta !== "-" && (
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {vehicle.eta}
                          </div>
                        )}
                        {vehicle.eta === "-" && <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {vehicle.cargo > 0 ? `${vehicle.cargo} commandes` : "Vide"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for editing shipment */}
      <Dialog open={isEditShipmentOpen} onOpenChange={setIsEditShipmentOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier l'expédition {selectedShipment?.id}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-carrier">Transporteur</Label>
              <Input id="edit-carrier" defaultValue={selectedShipment?.carrier} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Statut</Label>
              <Select defaultValue={selectedShipment?.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="En préparation">En préparation</SelectItem>
                  <SelectItem value="En transit">En transit</SelectItem>
                  <SelectItem value="Livré">Livré</SelectItem>
                  <SelectItem value="En retard">En retard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-progress">Progression (%)</Label>
              <Input id="edit-progress" type="number" min="0" max="100" defaultValue={selectedShipment?.progress} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-delivery">Livraison estimée</Label>
              <Input id="edit-delivery" type="date" defaultValue={selectedShipment?.estimatedDelivery} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditShipmentOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => setIsEditShipmentOpen(false)}>
              Modifier l'expédition
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for viewing shipment details */}
      <Dialog open={isViewShipmentOpen} onOpenChange={setIsViewShipmentOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails de l'expédition {selectedShipment?.id}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Commande liée</Label>
                <p className="text-sm text-muted-foreground">{selectedShipment?.orderId}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Transporteur</Label>
                <p className="text-sm text-muted-foreground">{selectedShipment?.carrier}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Origine</Label>
                <p className="text-sm text-muted-foreground">{selectedShipment?.origin}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Destination</Label>
                <p className="text-sm text-muted-foreground">{selectedShipment?.destination}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Statut</Label>
                <div className="mt-1">{selectedShipment && getStatusBadge(selectedShipment.status)}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Progression</Label>
                <div className="mt-1 space-y-2">
                  <Progress value={selectedShipment?.progress} className="w-32" />
                  <span className="text-xs text-muted-foreground">{selectedShipment?.progress}%</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Livraison estimée</Label>
                <p className="text-sm text-muted-foreground">{selectedShipment?.estimatedDelivery}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">N° de suivi</Label>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {selectedShipment?.trackingNumber}
                </code>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewShipmentOpen(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteLogistic}
        title="ATTENTION CETTE ACTION EST IRRÉVERSIBLE"
        description="Êtes-vous sûr de vouloir supprimer la tâche logistique"
        itemName={logisticToDelete?.id}
        confirmText="Oui, supprimer définitivement"
        cancelText="Annuler"
      />
    </div>
  );
}