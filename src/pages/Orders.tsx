import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Eye, Edit, Trash2 } from "lucide-react";

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isEditOrderOpen, setIsEditOrderOpen] = useState(false);
  const [isViewOrderOpen, setIsViewOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orders] = useState([
    {
      id: "CMD-001",
      client: "Entreprise Alpha",
      date: "2024-01-15",
      status: "En cours",
      amount: "€12,500",
      items: 15,
      priority: "Haute"
    },
    {
      id: "CMD-002", 
      client: "Entreprise Beta",
      date: "2024-01-14",
      status: "Livré",
      amount: "€8,750",
      items: 8,
      priority: "Normale"
    },
    {
      id: "CMD-003",
      client: "Entreprise Gamma",
      date: "2024-01-13",
      status: "En retard",
      amount: "€15,200",
      items: 22,
      priority: "Urgente"
    },
    {
      id: "CMD-004",
      client: "Entreprise Delta",
      date: "2024-01-12",
      status: "En préparation",
      amount: "€6,800",
      items: 5,
      priority: "Normale"
    }
  ]);

  const getStatusBadge = (status: string) => {
    const styles = {
      "En cours": "bg-blue-100 text-blue-800 hover:bg-blue-100",
      "Livré": "bg-green-100 text-green-800 hover:bg-green-100",
      "En retard": "bg-red-100 text-red-800 hover:bg-red-100",
      "En préparation": "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
    };
    return <Badge className={styles[status] || ""}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      "Urgente": "bg-red-100 text-red-800 hover:bg-red-100",
      "Haute": "bg-orange-100 text-orange-800 hover:bg-orange-100", 
      "Normale": "bg-gray-100 text-gray-800 hover:bg-gray-100"
    };
    return <Badge variant="outline" className={styles[priority] || ""}>{priority}</Badge>;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  return (
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
                <TableHead>ID Commande</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.client}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                  <TableCell>{order.items}</TableCell>
                  <TableCell className="font-medium">{order.amount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails de la commande {selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Client</Label>
                <p className="text-sm text-muted-foreground">{selectedOrder?.client}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Date</Label>
                <p className="text-sm text-muted-foreground">{selectedOrder?.date}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Statut</Label>
                <div className="mt-1">{selectedOrder && getStatusBadge(selectedOrder.status)}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Priorité</Label>
                <div className="mt-1">{selectedOrder && getPriorityBadge(selectedOrder.priority)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Montant</Label>
                <p className="text-sm text-muted-foreground font-medium">{selectedOrder?.amount}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Articles</Label>
                <p className="text-sm text-muted-foreground">{selectedOrder?.items} articles</p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Commande de matériel pour {selectedOrder?.client}. Comprend {selectedOrder?.items} articles 
                pour un montant total de {selectedOrder?.amount}.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewOrderOpen(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}