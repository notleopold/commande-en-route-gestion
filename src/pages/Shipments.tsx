import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Eye, Ship, Plane, Truck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface Shipment {
  id: string;
  orders: string[];
  transportType: "air" | "sea" | "gp";
  forwarder: string;
  departureDate: string;
  arrivalDate: string;
  status: "preparation" | "transit" | "arrived" | "delivered";
  cost: number;
  origin: string;
  destination: string;
}

const mockShipments: Shipment[] = [
  {
    id: "SHP-001",
    orders: ["CMD-001", "CMD-002"],
    transportType: "sea",
    forwarder: "DHL Global",
    departureDate: "2024-01-20",
    arrivalDate: "2024-02-15",
    status: "transit",
    cost: 2500.00,
    origin: "Shanghai",
    destination: "Douala"
  },
  {
    id: "SHP-002",
    orders: ["CMD-003"],
    transportType: "air",
    forwarder: "Air France Cargo",
    departureDate: "2024-01-18",
    arrivalDate: "2024-01-19",
    status: "delivered",
    cost: 1200.00,
    origin: "Paris",
    destination: "Abidjan"
  },
];

const transportTypes = [
  { value: "sea", label: "Maritime", icon: Ship },
  { value: "air", label: "Aérien", icon: Plane },
  { value: "gp", label: "Colis General", icon: Truck },
];

const forwarders = ["DHL Global", "FedEx Trade", "Air France Cargo", "CMA CGM", "MSC"];

const statusMap = {
  preparation: { label: "Préparation", variant: "secondary" as const },
  transit: { label: "En transit", variant: "default" as const },
  arrived: { label: "Arrivé", variant: "outline" as const },
  delivered: { label: "Livré", variant: "default" as const },
};

function Shipments() {
  const [shipments, setShipments] = useState<Shipment[]>(mockShipments);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingShipment, setViewingShipment] = useState<Shipment | null>(null);

  const form = useForm({
    defaultValues: {
      orders: "",
      transportType: "",
      forwarder: "",
      departureDate: "",
      arrivalDate: "",
      cost: "",
      origin: "",
      destination: "",
    },
  });

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = shipment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.forwarder.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || shipment.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleAddShipment = () => {
    form.reset();
    setEditingShipment(null);
    setDialogOpen(true);
  };

  const handleEditShipment = (shipment: Shipment) => {
    form.reset({
      orders: shipment.orders.join(", "),
      transportType: shipment.transportType,
      forwarder: shipment.forwarder,
      departureDate: shipment.departureDate,
      arrivalDate: shipment.arrivalDate,
      cost: shipment.cost.toString(),
      origin: shipment.origin,
      destination: shipment.destination,
    });
    setEditingShipment(shipment);
    setDialogOpen(true);
  };

  const handleViewShipment = (shipment: Shipment) => {
    setViewingShipment(shipment);
    setViewDialogOpen(true);
  };

  const onSubmit = (data: any) => {
    const shipmentData = {
      ...data,
      cost: parseFloat(data.cost),
      orders: data.orders.split(",").map((s: string) => s.trim()),
      id: editingShipment?.id || `SHP-${Date.now()}`,
      status: editingShipment?.status || "preparation",
    };

    if (editingShipment) {
      setShipments(prev => prev.map(s => s.id === editingShipment.id ? shipmentData : s));
      toast.success("Expédition modifiée avec succès");
    } else {
      setShipments(prev => [...prev, shipmentData]);
      toast.success("Expédition créée avec succès");
    }
    
    setDialogOpen(false);
    form.reset();
  };

  const getTransportIcon = (type: string) => {
    const transport = transportTypes.find(t => t.value === type);
    return transport ? transport.icon : Ship;
  };

  return (
    <Layout title="Gestion des Expéditions">
      <div className="space-y-6">
        {/* Header avec stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expéditions</CardTitle>
              <Ship className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shipments.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Transit</CardTitle>
              <Truck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shipments.filter(s => s.status === "transit").length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maritime</CardTitle>
              <Ship className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shipments.filter(s => s.transportType === "sea").length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aérien</CardTitle>
              <Plane className="h-4 w-4 text-sky-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shipments.filter(s => s.transportType === "air").length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une expédition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(statusMap).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddShipment}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Expédition
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingShipment ? "Modifier l'expédition" : "Nouvelle expédition"}
                </DialogTitle>
                <DialogDescription>
                  {editingShipment ? "Modifiez les informations de l'expédition" : "Créez une nouvelle expédition"}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="orders"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commandes (séparées par des virgules)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="CMD-001, CMD-002" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="transportType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de transport</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {transportTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="forwarder"
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
                              {forwarders.map(forwarder => (
                                <SelectItem key={forwarder} value={forwarder}>
                                  {forwarder}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="origin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Origine</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Shanghai" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="destination"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destination</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Douala" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="departureDate"
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
                      control={form.control}
                      name="arrivalDate"
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
                    
                    <FormField
                      control={form.control}
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Coût (€)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" placeholder="0.00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {editingShipment ? "Modifier" : "Créer"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table des expéditions */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des expéditions</CardTitle>
            <CardDescription>
              Suivez vos expéditions en cours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Transport</TableHead>
                  <TableHead>Transitaire</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Coût</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map((shipment) => {
                  const TransportIcon = getTransportIcon(shipment.transportType);
                  return (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">{shipment.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TransportIcon className="h-4 w-4" />
                          {transportTypes.find(t => t.value === shipment.transportType)?.label}
                        </div>
                      </TableCell>
                      <TableCell>{shipment.forwarder}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{shipment.origin} → {shipment.destination}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Départ: {new Date(shipment.departureDate).toLocaleDateString()}</div>
                          <div>Arrivée: {new Date(shipment.arrivalDate).toLocaleDateString()}</div>
                        </div>
                      </TableCell>
                      <TableCell>{shipment.cost.toFixed(2)} €</TableCell>
                      <TableCell>
                        <Badge variant={statusMap[shipment.status].variant}>
                          {statusMap[shipment.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewShipment(shipment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditShipment(shipment)}
                          >
                            <Edit className="h-4 w-4" />
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

        {/* Dialog de visualisation */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails de l'expédition {viewingShipment?.id}</DialogTitle>
            </DialogHeader>
            {viewingShipment && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Commandes incluses</h4>
                    <p className="text-sm text-muted-foreground">{viewingShipment.orders.join(", ")}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Type de transport</h4>
                    <p className="text-sm text-muted-foreground">
                      {transportTypes.find(t => t.value === viewingShipment.transportType)?.label}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Transitaire</h4>
                    <p className="text-sm text-muted-foreground">{viewingShipment.forwarder}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Coût total</h4>
                    <p className="text-sm text-muted-foreground">{viewingShipment.cost.toFixed(2)} €</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Route</h4>
                    <p className="text-sm text-muted-foreground">
                      {viewingShipment.origin} → {viewingShipment.destination}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Statut</h4>
                    <Badge variant={statusMap[viewingShipment.status].variant}>
                      {statusMap[viewingShipment.status].label}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

export default Shipments;