import { useState } from "react";
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
  XCircle, PlusCircle, MinusCircle, Trash2
} from "lucide-react";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  quantity: string;
  supplier: string;
  status: 'expected' | 'received' | 'loaded';
  location: string;
  weight: string;
  volume: string;
  dangerous?: boolean;
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
  products: Product[];
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
      products: [
        { id: "P001", name: "Bobines 450", quantity: "12 palettes", supplier: "Sofidel", status: "loaded", location: "SIFA", weight: "8.2t", volume: "12m³" },
        { id: "P002", name: "Emballages carton", quantity: "45 unités", supplier: "Smurfit", status: "loaded", location: "SIFA", weight: "10.3t", volume: "10m³" }
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
      products: []
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
      products: [
        { id: "P003", name: "Produits chimiques", quantity: "8 fûts", supplier: "ChemCorp", status: "loaded", location: "CEVA", weight: "15.5t", volume: "18m³", dangerous: true },
        { id: "P004", name: "Machines industrielles", quantity: "2 unités", supplier: "TechPro", status: "loaded", location: "CEVA", weight: "8.3t", volume: "8m³" }
      ]
    }
  ]);

  const [availableProducts] = useState<Product[]>([
    { id: "P005", name: "Tubes PVC", quantity: "25 unités", supplier: "PlasticCorp", status: "received", location: "SIFA", weight: "5.2t", volume: "8m³" },
    { id: "P006", name: "Matériel électrique", quantity: "15 colis", supplier: "ElecTech", status: "received", location: "TAF", weight: "3.1t", volume: "4m³" },
    { id: "P007", name: "Produits dangereux", quantity: "6 containers", supplier: "DangerCorp", status: "received", location: "CEVA", weight: "12t", volume: "15m³", dangerous: true },
    { id: "P008", name: "Textile", quantity: "30 balles", supplier: "TextilePro", status: "expected", location: "SIFA", weight: "8t", volume: "12m³" }
  ]);

  const transitaires = ["SIFA", "TAF", "CEVA"];

  const getStatusBadge = (status: string) => {
    const styles = {
      "Disponible": "bg-green-100 text-green-800 hover:bg-green-100",
      "En cours d'utilisation": "bg-blue-100 text-blue-800 hover:bg-blue-100",
      "En transit": "bg-orange-100 text-orange-800 hover:bg-orange-100",
      "Maintenance": "bg-red-100 text-red-800 hover:bg-red-100"
    };
    return <Badge className={styles[status] || ""}>{status}</Badge>;
  };

  const getProductStatusBadge = (status: string) => {
    const styles = {
      "expected": "bg-yellow-100 text-yellow-800",
      "received": "bg-blue-100 text-blue-800",
      "loaded": "bg-green-100 text-green-800"
    };
    return <Badge className={styles[status] || ""}>{status}</Badge>;
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
    setIsLoadingPlanOpen(true);
  };

  const getCompatibleProducts = (transitaire: string) => {
    return availableProducts.filter(product => 
      product.status === 'received' && product.location === transitaire
    );
  };

  const getIncompatibleProducts = (transitaire: string) => {
    return availableProducts.filter(product => 
      product.status === 'received' && product.location !== transitaire
    );
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
                    <CardTitle className="text-sm">Produits Chargés ({selectedContainer.products.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedContainer.products.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produit</TableHead>
                            <TableHead>Quantité</TableHead>
                            <TableHead>Fournisseur</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Poids</TableHead>
                            <TableHead>Volume</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedContainer.products.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {product.dangerous && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                  <span>{product.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>{product.quantity}</TableCell>
                              <TableCell>{product.supplier}</TableCell>
                              <TableCell>{getProductStatusBadge(product.status)}</TableCell>
                              <TableCell>{product.weight}</TableCell>
                              <TableCell>{product.volume}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">Aucun produit chargé</p>
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
                  {/* Compatible Products */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-green-700">
                        Produits Compatibles ({selectedContainer.transitaire})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-64 overflow-y-auto">
                      {getCompatibleProducts(selectedContainer.transitaire).map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-2 border rounded mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {product.dangerous && <AlertTriangle className="h-4 w-4 text-red-500" />}
                              <span className="font-medium">{product.name}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {product.quantity} - {product.supplier} - {product.weight} - {product.volume}
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            <PlusCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Incompatible Products */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-red-700">
                        Produits Incompatibles (Autres transitaires)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-64 overflow-y-auto">
                      {getIncompatibleProducts(selectedContainer.transitaire).map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-2 border rounded mb-2 bg-red-50">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="font-medium text-red-700">{product.name}</span>
                            </div>
                            <div className="text-xs text-red-600">
                              {product.quantity} - {product.supplier} - Stocké chez {product.location}
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
                      {selectedContainer.products.map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-2 border rounded bg-green-50">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {product.dangerous && <AlertTriangle className="h-4 w-4 text-red-500" />}
                            <span className="font-medium">{product.name}</span>
                            <span className="text-sm text-muted-foreground">- {product.quantity}</span>
                          </div>
                          <Button size="sm" variant="outline">
                            <MinusCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
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