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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Eye, Boxes, Users, DollarSign } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface GroupageRequest {
  id: string;
  orders: string[];
  destination: string;
  totalWeight: number;
  totalVolume: number;
  requestDate: string;
  status: "pending" | "quoted" | "accepted" | "shipped" | "delivered";
  quotedPrice?: number;
  forwarder?: string;
  estimatedDeparture?: string;
  notes?: string;
}

const mockGroupageRequests: GroupageRequest[] = [
  {
    id: "GRP-001",
    orders: ["CMD-001", "CMD-003"],
    destination: "Dakar",
    totalWeight: 450,
    totalVolume: 2.5,
    requestDate: "2024-01-15",
    status: "quoted",
    quotedPrice: 890.00,
    forwarder: "CMA CGM",
    estimatedDeparture: "2024-02-01",
    notes: "Groupage avec autres clients vers Dakar"
  },
  {
    id: "GRP-002",
    orders: ["CMD-004", "CMD-005"],
    destination: "Abidjan",
    totalWeight: 320,
    totalVolume: 1.8,
    requestDate: "2024-01-18",
    status: "pending",
    notes: "En attente de cotation"
  },
];

const destinations = ["Dakar", "Abidjan", "Douala", "Lagos", "Casablanca", "Tunis"];
const forwarders = ["CMA CGM", "MSC", "Maersk", "Hapag-Lloyd", "COSCO"];

const statusMap = {
  pending: { label: "En attente", variant: "secondary" as const },
  quoted: { label: "Cotation reçue", variant: "default" as const },
  accepted: { label: "Accepté", variant: "default" as const },
  shipped: { label: "Expédié", variant: "outline" as const },
  delivered: { label: "Livré", variant: "default" as const },
};

export default function Groupage() {
  const [groupageRequests, setGroupageRequests] = useState<GroupageRequest[]>(mockGroupageRequests);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<GroupageRequest | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<GroupageRequest | null>(null);

  const form = useForm({
    defaultValues: {
      orders: "",
      destination: "",
      totalWeight: "",
      totalVolume: "",
      notes: "",
    },
  });

  const filteredRequests = groupageRequests.filter(request => {
    const matchesSearch = request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || request.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleAddRequest = () => {
    form.reset();
    setEditingRequest(null);
    setDialogOpen(true);
  };

  const handleEditRequest = (request: GroupageRequest) => {
    form.reset({
      orders: request.orders.join(", "),
      destination: request.destination,
      totalWeight: request.totalWeight.toString(),
      totalVolume: request.totalVolume.toString(),
      notes: request.notes || "",
    });
    setEditingRequest(request);
    setDialogOpen(true);
  };

  const handleViewRequest = (request: GroupageRequest) => {
    setViewingRequest(request);
    setViewDialogOpen(true);
  };

  const handleAcceptQuote = (requestId: string) => {
    setGroupageRequests(prev => prev.map(r => 
      r.id === requestId 
        ? { ...r, status: "accepted" as const }
        : r
    ));
    toast.success("Cotation acceptée");
  };

  const onSubmit = (data: any) => {
    const requestData = {
      ...data,
      totalWeight: parseFloat(data.totalWeight),
      totalVolume: parseFloat(data.totalVolume),
      orders: data.orders.split(",").map((s: string) => s.trim()),
      id: editingRequest?.id || `GRP-${Date.now()}`,
      status: editingRequest?.status || "pending",
      requestDate: editingRequest?.requestDate || new Date().toISOString().split('T')[0],
    };

    if (editingRequest) {
      setGroupageRequests(prev => prev.map(r => r.id === editingRequest.id ? requestData : r));
      toast.success("Demande de groupage modifiée avec succès");
    } else {
      setGroupageRequests(prev => [...prev, requestData]);
      toast.success("Demande de groupage créée avec succès");
    }
    
    setDialogOpen(false);
    form.reset();
  };

  const totalPendingWeight = groupageRequests
    .filter(r => r.status === "pending" || r.status === "quoted")
    .reduce((sum, r) => sum + r.totalWeight, 0);

  return (
    <Layout title="Gestion des Groupages">
      <div className="space-y-6">
        {/* Header avec stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Demandes</CardTitle>
              <Boxes className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groupageRequests.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Attente</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {groupageRequests.filter(r => r.status === "pending").length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cotations Reçues</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {groupageRequests.filter(r => r.status === "quoted").length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Poids Total (kg)</CardTitle>
              <Boxes className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPendingWeight}</div>
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
              <Button onClick={handleAddRequest}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Demande
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingRequest ? "Modifier la demande de groupage" : "Nouvelle demande de groupage"}
                </DialogTitle>
                <DialogDescription>
                  {editingRequest ? "Modifiez les informations de la demande" : "Créez une nouvelle demande de groupage"}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="orders"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commandes à grouper (séparées par des virgules)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="CMD-001, CMD-002" />
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une destination" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {destinations.map(destination => (
                              <SelectItem key={destination} value={destination}>
                                {destination}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="totalWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Poids total (kg)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.1" placeholder="0.0" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="totalVolume"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Volume total (m³)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.1" placeholder="0.0" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Informations complémentaires..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {editingRequest ? "Modifier" : "Créer"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table des demandes de groupage */}
        <Card>
          <CardHeader>
            <CardTitle>Demandes de groupage</CardTitle>
            <CardDescription>
              Gérez vos demandes de groupage pour optimiser les coûts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead>Poids/Volume</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Prix Coté</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.id}</TableCell>
                    <TableCell>{request.destination}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {request.orders.join(", ")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{request.totalWeight} kg</div>
                        <div>{request.totalVolume} m³</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(request.requestDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {request.quotedPrice ? `${request.quotedPrice.toFixed(2)} €` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusMap[request.status].variant}>
                        {statusMap[request.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewRequest(request)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRequest(request)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {request.status === "quoted" && (
                          <Button
                            size="sm"
                            onClick={() => handleAcceptQuote(request.id)}
                          >
                            Accepter
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

        {/* Dialog de visualisation */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails de la demande {viewingRequest?.id}</DialogTitle>
            </DialogHeader>
            {viewingRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Commandes incluses</h4>
                    <p className="text-sm text-muted-foreground">{viewingRequest.orders.join(", ")}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Destination</h4>
                    <p className="text-sm text-muted-foreground">{viewingRequest.destination}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Poids total</h4>
                    <p className="text-sm text-muted-foreground">{viewingRequest.totalWeight} kg</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Volume total</h4>
                    <p className="text-sm text-muted-foreground">{viewingRequest.totalVolume} m³</p>
                  </div>
                </div>
                {viewingRequest.quotedPrice && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold">Prix coté</h4>
                      <p className="text-sm text-muted-foreground">{viewingRequest.quotedPrice.toFixed(2)} €</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Transitaire</h4>
                      <p className="text-sm text-muted-foreground">{viewingRequest.forwarder || "-"}</p>
                    </div>
                  </div>
                )}
                {viewingRequest.estimatedDeparture && (
                  <div>
                    <h4 className="font-semibold">Départ estimé</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(viewingRequest.estimatedDeparture).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {viewingRequest.notes && (
                  <div>
                    <h4 className="font-semibold">Notes</h4>
                    <p className="text-sm text-muted-foreground">{viewingRequest.notes}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold">Statut</h4>
                  <Badge variant={statusMap[viewingRequest.status].variant}>
                    {statusMap[viewingRequest.status].label}
                  </Badge>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}