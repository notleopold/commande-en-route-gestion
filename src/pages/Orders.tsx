import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Eye, Edit, Trash2, AlertTriangle, Link } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  cost: number;
  suppliers: string[];
}

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Supplier {
  id: string;
  name: string;
  status: string;
}

interface Container {
  id: string;
  number: string;
  type: string;
  transitaire: string;
}

interface Order {
  id: string;
  order_number: string;
  client_id?: string;
  supplier: string;
  order_date: string;
  payment_date?: string;
  payment_type: string;
  status: string;
  total_price?: number;
  current_transitaire?: string;
  container_id?: string;
  client?: { name: string };
}

const ORDER_STATUSES = [
  "BDC ENVOYÉ ZIKETRO",
  "À COMMANDER", 
  "PAIEMENT EN ATTENTE",
  "COMMANDÉ > EN LIVRAISON",
  "PAYÉ (30%)",
  "PAYÉ (50%)", 
  "PAYÉ (100%)",
  "LIVRÉ"
];

const PAYMENT_TYPES = [
  "30% à la commande",
  "50% à la commande", 
  "100% à la commande"
];

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Dialog states
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isLinkContainerOpen, setIsLinkContainerOpen] = useState(false);
  const [orderToLink, setOrderToLink] = useState<Order | null>(null);

  const orderForm = useForm({
    defaultValues: {
      client_id: "",
      supplier: "",
      order_date: "",
      payment_date: "",
      payment_type: "",
      status: "",
    },
  });

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchClients();
    fetchSuppliers();
    fetchContainers();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          client:clients(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error("Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, phone')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, status')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

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
    }
  };

  const handleSubmitOrder = async (data: any) => {
    try {
      const orderData = {
        order_number: `CMD-${Date.now()}`,
        client_id: data.client_id || null,
        supplier: data.supplier,
        order_date: data.order_date,
        payment_date: data.payment_date || null,
        payment_type: data.payment_type,
        status: data.status,
      };

      const { error } = await supabase
        .from('orders')
        .insert([orderData]);

      if (error) throw error;

      toast.success("Commande créée avec succès");
      setIsNewOrderOpen(false);
      orderForm.reset();
      fetchOrders();
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      // Move to trash instead of permanent delete
      const { error } = await supabase.rpc('move_to_trash', {
        p_table_name: 'orders',
        p_item_id: orderToDelete.id,
        p_reason: 'Suppression utilisateur'
      });

      if (error) throw error;

      toast.success("Commande déplacée vers la corbeille");
      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
      fetchOrders();
    } catch (error) {
      console.error('Error moving order to trash:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const openDeleteDialog = (order: Order) => {
    setOrderToDelete(order);
    setIsDeleteDialogOpen(true);
  };

  const openLinkContainerDialog = (order: Order) => {
    setOrderToLink(order);
    setIsLinkContainerOpen(true);
  };

  const handleLinkToContainer = async (containerId: string) => {
    if (!orderToLink) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ container_id: containerId })
        .eq('id', orderToLink.id);

      if (error) throw error;

      toast.success("Commande liée au conteneur avec succès");
      setIsLinkContainerOpen(false);
      setOrderToLink(null);
      fetchOrders();
    } catch (error) {
      console.error('Error linking order to container:', error);
      toast.error("Erreur lors de la liaison au conteneur");
    }
  };

  // Get containers that match the order's transitaire
  const getCompatibleContainers = (order: Order) => {
    if (!order.current_transitaire) return [];
    return containers.filter(container => container.transitaire === order.current_transitaire);
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: { [key: string]: string } = {
      "BDC ENVOYÉ ZIKETRO": "bg-blue-100 text-blue-800",
      "À COMMANDER": "bg-orange-100 text-orange-800",
      "PAIEMENT EN ATTENTE": "bg-yellow-100 text-yellow-800",
      "COMMANDÉ > EN LIVRAISON": "bg-purple-100 text-purple-800",
      "PAYÉ (30%)": "bg-green-100 text-green-600",
      "PAYÉ (50%)": "bg-green-100 text-green-700",
      "PAYÉ (100%)": "bg-green-100 text-green-800",
      "LIVRÉ": "bg-green-100 text-green-900",
    };

    return (
      <Badge className={statusStyles[status] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Layout title="Commandes">
        <div className="p-6">Chargement...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Commandes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Commandes</h1>
            <p className="text-muted-foreground mt-2">
              Gérez toutes vos commandes et leur suivi
            </p>
          </div>

          <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setSelectedOrder(null);
                orderForm.reset();
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Commande
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nouvelle Commande</DialogTitle>
              </DialogHeader>
              
              <Form {...orderForm}>
                <form onSubmit={orderForm.handleSubmit(handleSubmitOrder)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={orderForm.control}
                      name="client_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un client" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clients.map(client => (
                                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={orderForm.control}
                      name="supplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fournisseur</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un fournisseur" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {suppliers.map(supplier => (
                                <SelectItem key={supplier.id} value={supplier.name}>{supplier.name}</SelectItem>
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
                      control={orderForm.control}
                      name="order_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de commande</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={orderForm.control}
                      name="payment_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de paiement</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={orderForm.control}
                      name="payment_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de paiement</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Type de paiement" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PAYMENT_TYPES.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={orderForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Statut de la commande" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ORDER_STATUSES.map(status => (
                              <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsNewOrderOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      Créer la commande
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher par numéro ou fournisseur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {ORDER_STATUSES.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Date de commande</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.client?.name || "-"}</TableCell>
                    <TableCell>{order.supplier}</TableCell>
                    <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{order.total_price?.toFixed(2) || "-"} €</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {order.current_transitaire && getCompatibleContainers(order).length > 0 && !order.container_id && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openLinkContainerDialog(order)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Link className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openDeleteDialog(order)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all" 
                    ? "Aucune commande ne correspond à vos critères de recherche."
                    : "Aucune commande trouvée. Créez votre première commande."
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="bg-background border-destructive border-2">
            <AlertDialogHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <AlertDialogTitle className="text-destructive">
                  ATTENTION CETTE ACTION EST IRRÉVERSIBLE
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-lg">
                Êtes-vous certain de vouloir supprimer la commande{" "}
                <span className="font-bold text-destructive">
                  {orderToDelete?.order_number}
                </span>
                ?
                <br />
                <br />
                <span className="text-sm text-muted-foreground">
                  La commande sera déplacée vers la corbeille et pourra être restaurée pendant 45 jours par un administrateur.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteOrder}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Oui, déplacer vers la corbeille
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Link to Container Dialog */}
        <Dialog open={isLinkContainerOpen} onOpenChange={setIsLinkContainerOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Lier au conteneur</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Commande: <span className="font-medium">{orderToLink?.order_number}</span>
                <br />
                Transitaire: <span className="font-medium">{orderToLink?.current_transitaire}</span>
              </p>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Conteneurs compatibles:</p>
                {orderToLink && getCompatibleContainers(orderToLink).map(container => (
                  <div key={container.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{container.number}</p>
                        <p className="text-sm text-muted-foreground">{container.type}</p>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => handleLinkToContainer(container.id)}
                      >
                        Lier
                      </Button>
                    </div>
                  </div>
                ))}
                
                {orderToLink && getCompatibleContainers(orderToLink).length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    Aucun conteneur avec le même transitaire trouvé.
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Orders;