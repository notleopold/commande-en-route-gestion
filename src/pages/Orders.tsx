import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Eye, Edit, Trash2, Package, Link, Unlink } from "lucide-react";

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isEditOrderOpen, setIsEditOrderOpen] = useState(false);
  const [isViewOrderOpen, setIsViewOrderOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isContainerLinkOpen, setIsContainerLinkOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orders] = useState([
    {
      id: "CMD-001",
      supplier: "Lucart",
      orderDate: "2024-01-10",
      paymentDate: "2024-01-15",
      paymentType: "30% à la commande",
      status: "BDC ENVOYÉ ZIKETRO",
      transitaireEntry: "ENT-001",
      currentTransitaire: "SIFA",
      packaging: "Palette",
      weight: "1200kg",
      volume: "8m³",
      cartons: 24,
      unitPrice: 125.50,
      totalPrice: 3012.00,
      containerId: null,
      products: [
        { id: "P001", name: "Papier toilette 3 plis", quantity: 48, status: "Reçu" },
        { id: "P002", name: "Essuie-tout", quantity: 24, status: "Reçu" }
      ]
    },
    {
      id: "CMD-002", 
      supplier: "Sofidel",
      orderDate: "2024-01-08",
      paymentDate: null,
      paymentType: "50% à la commande",
      status: "PAIEMENT EN ATTENTE",
      transitaireEntry: "ENT-002",
      currentTransitaire: "TAF",
      packaging: "Carton",
      weight: "800kg",
      volume: "5m³",
      cartons: 16,
      unitPrice: 98.75,
      totalPrice: 1580.00,
      containerId: "CONT-001",
      products: [
        { id: "P003", name: "Bobines 450", quantity: 32, status: "Commandé" }
      ]
    },
    {
      id: "CMD-003",
      supplier: "Kimberly Clark",
      orderDate: "2024-01-05",
      paymentDate: "2024-01-06",
      paymentType: "100% à la commande",
      status: "EMBARQUÉ",
      transitaireEntry: "ENT-003",
      currentTransitaire: "CEVA",
      packaging: "Palette",
      weight: "1500kg",
      volume: "12m³",
      cartons: 30,
      unitPrice: 156.80,
      totalPrice: 4704.00,
      containerId: "CONT-002",
      products: [
        { id: "P004", name: "Mouchoirs", quantity: 60, status: "Embarqué" },
        { id: "P005", name: "Serviettes", quantity: 40, status: "Embarqué" }
      ]
    }
  ]);

  const getStatusBadge = (status: string) => {
    const styles = {
      "BDC ENVOYÉ ZIKETRO": "bg-blue-100 text-blue-800 hover:bg-blue-100",
      "À COMMANDER": "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      "PAIEMENT EN ATTENTE": "bg-orange-100 text-orange-800 hover:bg-orange-100",
      "COMMANDÉ > EN LIVRAISON": "bg-purple-100 text-purple-800 hover:bg-purple-100",
      "PAYÉ": "bg-green-100 text-green-800 hover:bg-green-100",
      "REÇU TRANSITAIRE SIFA": "bg-cyan-100 text-cyan-800 hover:bg-cyan-100",
      "REÇU TRANSITAIRE TAF": "bg-cyan-100 text-cyan-800 hover:bg-cyan-100",
      "REÇU TRANSITAIRE CEVA": "bg-cyan-100 text-cyan-800 hover:bg-cyan-100",
      "EMBARQUÉ": "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
    };
    return <Badge className={styles[status] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
  };

  const containers = [
    { id: "CONT-001", name: "Container SIFA 20ft", transitaire: "SIFA" },
    { id: "CONT-002", name: "Container CEVA 40ft", transitaire: "CEVA" },
    { id: "CONT-003", name: "Container TAF 20ft", transitaire: "TAF" }
  ];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEditOrder = (order: any) => {
    setSelectedOrder(order);
    setIsEditOrderOpen(true);
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsViewOrderOpen(true);
  };

  const handleViewProducts = (order: any) => {
    setSelectedOrder(order);
    setIsProductsOpen(true);
  };

  const handleContainerLink = (order: any) => {
    setSelectedOrder(order);
    setIsContainerLinkOpen(true);
  };

  const canLinkToContainer = (order: any, container: any) => {
    return order.currentTransitaire === container.transitaire;
  };

  return (
    <Layout title="Gestion des Commandes">
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion des Commandes</h2>
          <p className="text-muted-foreground">Gérez toutes vos commandes et leur statut</p>
        </div>
        
        <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Commande
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une Nouvelle Commande</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Input id="client" placeholder="Nom du client" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priorité</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner la priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normale">Normale</SelectItem>
                      <SelectItem value="haute">Haute</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Description de la commande" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Montant (€)</Label>
                  <Input id="amount" type="number" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="items">Nombre d'articles</Label>
                  <Input id="items" type="number" placeholder="0" />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsNewOrderOpen(false)}>Annuler</Button>
                <Button onClick={() => setIsNewOrderOpen(false)}>Créer la Commande</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Liste des Commandes</CardTitle>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filtres
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Date Commande</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Transitaire</TableHead>
                <TableHead>Cartons</TableHead>
                <TableHead>Prix Total</TableHead>
                <TableHead>Container</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.supplier}</TableCell>
                  <TableCell>{order.orderDate}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{order.currentTransitaire}</TableCell>
                  <TableCell>{order.cartons}</TableCell>
                  <TableCell className="font-medium">€{order.totalPrice.toLocaleString()}</TableCell>
                  <TableCell>
                    {order.containerId ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {order.containerId}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-500">
                        Non assigné
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => handleViewProducts(order)} title="Voir les produits">
                        <Package className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleContainerLink(order)} title="Gérer le container">
                        {order.containerId ? <Unlink className="h-4 w-4" /> : <Link className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleViewOrder(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditOrder(order)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
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

      {/* Dialog for editing order */}
      <Dialog open={isEditOrderOpen} onOpenChange={setIsEditOrderOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier la commande {selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-client">Client</Label>
              <Input id="edit-client" defaultValue={selectedOrder?.client} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Statut</Label>
              <Select defaultValue={selectedOrder?.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="En préparation">En préparation</SelectItem>
                  <SelectItem value="Validé">Validé</SelectItem>
                  <SelectItem value="En cours">En cours</SelectItem>
                  <SelectItem value="Livré">Livré</SelectItem>
                  <SelectItem value="En retard">En retard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-priority">Priorité</Label>
              <Select defaultValue={selectedOrder?.priority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normale">Normale</SelectItem>
                  <SelectItem value="Haute">Haute</SelectItem>
                  <SelectItem value="Critique">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-amount">Montant</Label>
              <Input id="edit-amount" defaultValue={selectedOrder?.amount} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-items">Nombre d'articles</Label>
              <Input id="edit-items" type="number" defaultValue={selectedOrder?.items} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditOrderOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => setIsEditOrderOpen(false)}>
              Modifier la commande
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for viewing order details */}
      <Dialog open={isViewOrderOpen} onOpenChange={setIsViewOrderOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Détails de la commande {selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Fournisseur</Label>
                <p className="text-sm text-muted-foreground">{selectedOrder?.supplier}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Date de commande</Label>
                <p className="text-sm text-muted-foreground">{selectedOrder?.orderDate}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Date de paiement</Label>
                <p className="text-sm text-muted-foreground">{selectedOrder?.paymentDate || "Non payé"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Type de paiement</Label>
                <p className="text-sm text-muted-foreground">{selectedOrder?.paymentType}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Statut</Label>
                <div className="mt-1">{selectedOrder && getStatusBadge(selectedOrder.status)}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Transitaire actuel</Label>
                <p className="text-sm text-muted-foreground">{selectedOrder?.currentTransitaire}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Numéro d'entrée transitaire</Label>
                <p className="text-sm text-muted-foreground">{selectedOrder?.transitaireEntry}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Colisage</Label>
                <p className="text-sm text-muted-foreground">{selectedOrder?.packaging}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Poids</Label>
                <p className="text-sm text-muted-foreground">{selectedOrder?.weight}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium">Volume</Label>
                <p className="text-sm text-muted-foreground">{selectedOrder?.volume}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Cartons</Label>
                <p className="text-sm text-muted-foreground">{selectedOrder?.cartons}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Prix unitaire</Label>
                <p className="text-sm text-muted-foreground">€{selectedOrder?.unitPrice}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Prix total</Label>
                <p className="text-sm text-muted-foreground font-medium">€{selectedOrder?.totalPrice.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewOrderOpen(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for viewing products */}
      <Dialog open={isProductsOpen} onOpenChange={setIsProductsOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Produits de la commande {selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Produit</TableHead>
                  <TableHead>Nom du produit</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedOrder?.products?.map((product: any) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.id}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        product.status === "Reçu" ? "bg-green-50 text-green-700" :
                        product.status === "Commandé" ? "bg-blue-50 text-blue-700" :
                        product.status === "Embarqué" ? "bg-purple-50 text-purple-700" :
                        "bg-gray-50 text-gray-700"
                      }>
                        {product.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsProductsOpen(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for container linking */}
      <Dialog open={isContainerLinkOpen} onOpenChange={setIsContainerLinkOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedOrder?.containerId ? "Délier" : "Lier"} la commande {selectedOrder?.id}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedOrder?.containerId ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    Cette commande est actuellement liée au container <strong>{selectedOrder.containerId}</strong>
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsContainerLinkOpen(false)}>
                    Annuler
                  </Button>
                  <Button variant="destructive">
                    Délier du container
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Commande chez le transitaire: <strong>{selectedOrder?.currentTransitaire}</strong>
                </p>
                <div className="space-y-2">
                  <Label>Containers disponibles</Label>
                  <div className="space-y-2">
                    {containers.map((container) => (
                      <div key={container.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{container.name}</p>
                          <p className="text-sm text-muted-foreground">Transitaire: {container.transitaire}</p>
                        </div>
                        <Button 
                          size="sm" 
                          disabled={!canLinkToContainer(selectedOrder, container)}
                          className={!canLinkToContainer(selectedOrder, container) ? "opacity-50" : ""}
                        >
                          {canLinkToContainer(selectedOrder, container) ? "Lier" : "Incompatible"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                {containers.filter(c => !canLinkToContainer(selectedOrder, c)).length > 0 && (
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-800">
                      ⚠️ Certains containers ne sont pas compatibles car ils sont chez un autre transitaire.
                    </p>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setIsContainerLinkOpen(false)}>
                    Fermer
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
}