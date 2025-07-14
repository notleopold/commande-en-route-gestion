import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, Eye, Edit, Trash2, Package, Link, Unlink, AlertTriangle, ShoppingCart, Calculator } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  dangerous: boolean;
  unit: string;
  cost: number;
  suppliers: string[];
  units_per_package?: number;
  packages_per_carton?: number;
  cartons_per_palette?: number;
  package_weight?: number;
  carton_weight?: number;
  palette_weight?: number;
  package_volume?: number;
  carton_volume?: number;
}

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Container {
  id: string;
  number: string;
  type: string;
  transitaire: string;
  etd?: string;
  eta?: string;
  max_pallets: number;
  max_weight: number;
  max_volume: number;
  dangerous_goods: boolean;
  status: string;
}

interface OrderProduct {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  palette_quantity?: number;
  carton_quantity?: number;
  product?: Product;
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
  transitaire_entry?: string;
  current_transitaire?: string;
  packaging?: string;
  weight?: number;
  volume?: number;
  cartons?: number;
  unit_price?: number;
  total_price?: number;
  container_id?: string;
  client?: Client;
  container?: Container;
  order_products?: OrderProduct[];
}

const ORDER_STATUSES = [
  "BDC ENVOYÉ ZIKETRO",
  "À COMMANDER", 
  "PAIEMENT EN ATTENTE",
  "COMMANDÉ > EN LIVRAISON",
  "PAYÉ (30%)",
  "PAYÉ (50%)", 
  "PAYÉ (100%)",
  "REÇU TRANSITAIRE SIFA",
  "REÇU TRANSITAIRE TAF",
  "REÇU TRANSITAIRE CEVA",
  "EMBARQUÉ"
];

const PAYMENT_TYPES = [
  "30% à la commande",
  "50% à la commande", 
  "100% à la commande"
];

const TRANSITAIRES = ["SIFA", "TAF", "CEVA"];

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isEditOrderOpen, setIsEditOrderOpen] = useState(false);
  const [isViewOrderOpen, setIsViewOrderOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isContainerLinkOpen, setIsContainerLinkOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Selected products for order
  const [selectedProducts, setSelectedProducts] = useState<{[key: string]: {quantity: number, palettes?: number, cartons?: number}}>({});

  const orderForm = useForm({
    defaultValues: {
      client_id: "",
      supplier: "",
      order_date: "",
      payment_date: "",
      payment_type: "",
      status: "",
      transitaire_entry: "",
      current_transitaire: "",
      packaging: "",
      weight: "",
      volume: "",
      cartons: "",
      unit_price: "",
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes, clientsRes, containersRes] = await Promise.all([
        supabase.from('orders').select(`
          *,
          client:clients(*),
          container:containers(*),
          order_products(*, product:products(*))
        `).order('created_at', { ascending: false }),
        supabase.from('products').select('*').eq('status', 'active'),
        supabase.from('clients').select('*').order('name'),
        supabase.from('containers').select('*').order('created_at', { ascending: false })
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (productsRes.error) throw productsRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (containersRes.error) throw containersRes.error;

      setOrders(ordersRes.data || []);
      setProducts(productsRes.data || []);
      setClients(clientsRes.data || []);
      setContainers(containersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const calculateOrderTotals = () => {
    let totalCost = 0;
    let totalPalettes = 0;
    let totalWeight = 0;
    let totalVolume = 0;

    Object.entries(selectedProducts).forEach(([productId, details]) => {
      const product = products.find(p => p.id === productId);
      if (product && details.quantity > 0) {
        const productTotal = product.cost * details.quantity;
        totalCost += productTotal;

        // Calculate palettes based on packaging info
        if (product.cartons_per_palette && details.cartons) {
          totalPalettes += Math.ceil(details.cartons / product.cartons_per_palette);
        }

        // Calculate weight and volume
        if (product.palette_weight && details.palettes) {
          totalWeight += product.palette_weight * details.palettes;
        }
        if (product.carton_volume && details.cartons) {
          totalVolume += product.carton_volume * details.cartons;
        }
      }
    });

    return { totalCost, totalPalettes, totalWeight, totalVolume };
  };

  const handleProductQuantityChange = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    let palettes = 0;
    let cartons = 0;

    // Calculate cartons needed
    if (product.units_per_package && product.packages_per_carton) {
      const unitsPerCarton = product.units_per_package * product.packages_per_carton;
      cartons = Math.ceil(quantity / unitsPerCarton);
    }

    // Calculate palettes needed
    if (product.cartons_per_palette && cartons > 0) {
      palettes = Math.ceil(cartons / product.cartons_per_palette);
    }

    setSelectedProducts(prev => ({
      ...prev,
      [productId]: { quantity, palettes, cartons }
    }));
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      "BDC ENVOYÉ ZIKETRO": "bg-blue-100 text-blue-800 hover:bg-blue-100",
      "À COMMANDER": "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      "PAIEMENT EN ATTENTE": "bg-orange-100 text-orange-800 hover:bg-orange-100",
      "COMMANDÉ > EN LIVRAISON": "bg-purple-100 text-purple-800 hover:bg-purple-100",
      "PAYÉ (30%)": "bg-green-100 text-green-800 hover:bg-green-100",
      "PAYÉ (50%)": "bg-green-100 text-green-800 hover:bg-green-100",
      "PAYÉ (100%)": "bg-green-100 text-green-800 hover:bg-green-100",
      "REÇU TRANSITAIRE SIFA": "bg-cyan-100 text-cyan-800 hover:bg-cyan-100",
      "REÇU TRANSITAIRE TAF": "bg-cyan-100 text-cyan-800 hover:bg-cyan-100",
      "REÇU TRANSITAIRE CEVA": "bg-cyan-100 text-cyan-800 hover:bg-cyan-100",
      "EMBARQUÉ": "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
    };
    return <Badge className={styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
  };

  const canLinkToContainer = (order: Order, container: Container) => {
    if (!order.current_transitaire || !container.transitaire) {
      return { canLink: false, reason: "Informations transitaire manquantes" };
    }
    
    if (order.current_transitaire !== container.transitaire) {
      return { canLink: false, reason: `Commande chez ${order.current_transitaire}, conteneur chez ${container.transitaire}` };
    }
    
    return { canLink: true, reason: "" };
  };

  const getContainerUsage = (container: Container) => {
    const ordersInContainer = orders.filter(o => o.container_id === container.id);
    const usedPallets = ordersInContainer.reduce((sum, order) => {
      return sum + (order.order_products?.reduce((productSum, op) => 
        productSum + (op.palette_quantity || 0), 0) || 0);
    }, 0);
    
    const hasDangerous = ordersInContainer.some(order => 
      order.order_products?.some(op => op.product?.dangerous)
    );
    
    return { usedPallets, hasDangerous };
  };

  const handleSubmitOrder = async (data: any) => {
    try {
      const { totalCost } = calculateOrderTotals();
      
      const orderData = {
        order_number: `CMD-${Date.now()}`,
        client_id: data.client_id || null,
        supplier: data.supplier,
        order_date: data.order_date,
        payment_date: data.payment_date || null,
        payment_type: data.payment_type,
        status: data.status,
        transitaire_entry: data.transitaire_entry,
        current_transitaire: data.current_transitaire,
        packaging: data.packaging,
        weight: data.weight ? parseFloat(data.weight) : null,
        volume: data.volume ? parseFloat(data.volume) : null,
        cartons: data.cartons ? parseInt(data.cartons) : null,
        unit_price: data.unit_price ? parseFloat(data.unit_price) : null,
        total_price: totalCost
      };

      let orderId;
      
      if (selectedOrder) {
        // Update existing order
        const { error } = await supabase
          .from('orders')
          .update(orderData)
          .eq('id', selectedOrder.id);
        
        if (error) throw error;
        orderId = selectedOrder.id;
        
        // Delete existing order products
        await supabase
          .from('order_products')
          .delete()
          .eq('order_id', selectedOrder.id);
      } else {
        // Create new order
        const { data: newOrder, error } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single();
        
        if (error) throw error;
        orderId = newOrder.id;
      }

      // Insert order products
      const orderProducts = Object.entries(selectedProducts)
        .filter(([_, details]) => details.quantity > 0)
        .map(([productId, details]) => {
          const product = products.find(p => p.id === productId);
          return {
            order_id: orderId,
            product_id: productId,
            quantity: details.quantity,
            unit_price: product?.cost || 0,
            total_price: (product?.cost || 0) * details.quantity,
            palette_quantity: details.palettes || 0,
            carton_quantity: details.cartons || 0
          };
        });

      if (orderProducts.length > 0) {
        const { error } = await supabase
          .from('order_products')
          .insert(orderProducts);
        
        if (error) throw error;
      }

      toast.success(selectedOrder ? "Commande modifiée avec succès" : "Commande créée avec succès");
      setIsNewOrderOpen(false);
      setIsEditOrderOpen(false);
      setSelectedProducts({});
      orderForm.reset();
      fetchData();
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    orderForm.reset({
      client_id: order.client_id || "",
      supplier: order.supplier,
      order_date: order.order_date,
      payment_date: order.payment_date || "",
      payment_type: order.payment_type,
      status: order.status,
      transitaire_entry: order.transitaire_entry || "",
      current_transitaire: order.current_transitaire || "",
      packaging: order.packaging || "",
      weight: order.weight?.toString() || "",
      volume: order.volume?.toString() || "",
      cartons: order.cartons?.toString() || "",
      unit_price: order.unit_price?.toString() || "",
    });

    // Set selected products from order
    const productsMap: {[key: string]: {quantity: number, palettes?: number, cartons?: number}} = {};
    order.order_products?.forEach(op => {
      productsMap[op.product_id] = {
        quantity: op.quantity,
        palettes: op.palette_quantity,
        cartons: op.carton_quantity
      };
    });
    setSelectedProducts(productsMap);
    setIsEditOrderOpen(true);
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
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Chargement...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Commandes">
      <div className="space-y-6">
        {/* Header avec stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Attente</CardTitle>
              <Package className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders.filter(o => o.status === "PAIEMENT EN ATTENTE" || o.status === "À COMMANDER").length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Embarquées</CardTitle>
              <Package className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders.filter(o => o.status === "EMBARQUÉ").length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders.reduce((sum, o) => sum + (o.total_price || 0), 0).toFixed(0)} €
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
                placeholder="Rechercher une commande..."
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
                {ORDER_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setSelectedOrder(null);
                setSelectedProducts({});
                orderForm.reset();
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Commande
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouvelle Commande</DialogTitle>
              </DialogHeader>
              
              <Form {...orderForm}>
                <form onSubmit={orderForm.handleSubmit(handleSubmitOrder)} className="space-y-6">
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="details">Détails</TabsTrigger>
                      <TabsTrigger value="products">Produits</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details" className="space-y-4">
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
                              <FormControl>
                                <Input {...field} placeholder="Nom du fournisseur" />
                              </FormControl>
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
                      
                      <div className="grid grid-cols-2 gap-4">
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
                        
                        <FormField
                          control={orderForm.control}
                          name="current_transitaire"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Transitaire actuel</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Transitaire" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {TRANSITAIRES.map(transitaire => (
                                    <SelectItem key={transitaire} value={transitaire}>{transitaire}</SelectItem>
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
                          control={orderForm.control}
                          name="transitaire_entry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Numéro d'entrée transitaire</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="ENT-001" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={orderForm.control}
                          name="packaging"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Colisage</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Palette, Carton..." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={orderForm.control}
                          name="weight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Poids (kg)</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" placeholder="1200" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={orderForm.control}
                          name="volume"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Volume (m³)</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.1" placeholder="8.0" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={orderForm.control}
                          name="cartons"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre de cartons</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" placeholder="24" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="products" className="space-y-4">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Sélectionner les produits</h3>
                        
                        <ScrollArea className="h-64 border rounded-lg p-4">
                          <div className="space-y-3">
                            {products.map(product => (
                              <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{product.name}</span>
                                    {product.dangerous && (
                                      <Badge variant="destructive" className="text-xs">
                                        <AlertTriangle className="mr-1 h-3 w-3" />
                                        Dangereux
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {product.sku} - {product.cost.toFixed(2)} €/{product.unit}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    placeholder="Qté"
                                    className="w-20"
                                    value={selectedProducts[product.id]?.quantity || ""}
                                    onChange={(e) => handleProductQuantityChange(product.id, parseInt(e.target.value) || 0)}
                                  />
                                  <span className="text-sm text-muted-foreground">{product.unit}</span>
                                </div>
                                
                                {selectedProducts[product.id]?.quantity > 0 && (
                                  <div className="text-sm text-muted-foreground ml-2">
                                    {selectedProducts[product.id]?.cartons && (
                                      <div>{selectedProducts[product.id].cartons} cartons</div>
                                    )}
                                    {selectedProducts[product.id]?.palettes && (
                                      <div>{selectedProducts[product.id].palettes} palettes</div>
                                    )}
                                    <div className="font-medium">
                                      {((selectedProducts[product.id]?.quantity || 0) * product.cost).toFixed(2)} €
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        
                        <div className="bg-muted p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Récapitulatif</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>Total produits: {Object.values(selectedProducts).reduce((sum, p) => sum + p.quantity, 0)}</div>
                            <div>Total palettes: {calculateOrderTotals().totalPalettes}</div>
                            <div>Poids estimé: {calculateOrderTotals().totalWeight.toFixed(2)} kg</div>
                            <div>Volume estimé: {calculateOrderTotals().totalVolume.toFixed(2)} m³</div>
                          </div>
                          <div className="text-lg font-bold mt-2">
                            Total: {calculateOrderTotals().totalCost.toFixed(2)} €
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsNewOrderOpen(false)}>
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

        {/* Table des commandes */}
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
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Transitaire</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Conteneur</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const compatibility = order.container_id 
                    ? canLinkToContainer(order, containers.find(c => c.id === order.container_id) || {} as Container)
                    : { canLink: true, reason: "" };

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.client?.name || "-"}</TableCell>
                      <TableCell>{order.supplier}</TableCell>
                      <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{order.current_transitaire || "-"}</TableCell>
                      <TableCell>{order.total_price?.toFixed(2) || "-"} €</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {order.container?.number ? (
                            <Badge variant="outline">{order.container.number}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Aucun</span>
                          )}
                          {!compatibility.canLink && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsViewOrderOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditOrder(order)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsProductsOpen(true);
                            }}
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsContainerLinkOpen(true);
                            }}
                          >
                            {order.container_id ? <Unlink className="h-4 w-4" /> : <Link className="h-4 w-4" />}
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

        {/* Dialog pour voir les détails d'une commande */}
        <Dialog open={isViewOrderOpen} onOpenChange={setIsViewOrderOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails de la commande {selectedOrder?.order_number}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Client</Label>
                    <p className="text-sm">{selectedOrder.client?.name || "Non assigné"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Fournisseur</Label>
                    <p className="text-sm">{selectedOrder.supplier}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Date de commande</Label>
                    <p className="text-sm">{new Date(selectedOrder.order_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Date de paiement</Label>
                    <p className="text-sm">{selectedOrder.payment_date ? new Date(selectedOrder.payment_date).toLocaleDateString() : "Non payé"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Type de paiement</Label>
                    <p className="text-sm">{selectedOrder.payment_type}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Statut</Label>
                    <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Transitaire actuel</Label>
                    <p className="text-sm">{selectedOrder.current_transitaire || "-"}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">N° entrée transitaire</Label>
                    <p className="text-sm">{selectedOrder.transitaire_entry || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Colisage</Label>
                    <p className="text-sm">{selectedOrder.packaging || "-"}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Poids</Label>
                    <p className="text-sm">{selectedOrder.weight ? `${selectedOrder.weight} kg` : "-"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Volume</Label>
                    <p className="text-sm">{selectedOrder.volume ? `${selectedOrder.volume} m³` : "-"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Cartons</Label>
                    <p className="text-sm">{selectedOrder.cartons || "-"}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Prix unitaire</Label>
                    <p className="text-sm">{selectedOrder.unit_price ? `${selectedOrder.unit_price.toFixed(2)} €` : "-"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Prix total</Label>
                    <p className="text-sm font-bold">{selectedOrder.total_price ? `${selectedOrder.total_price.toFixed(2)} €` : "-"}</p>
                  </div>
                </div>
                
                {selectedOrder.container && (
                  <div>
                    <Label className="text-sm font-medium">Conteneur lié</Label>
                    <p className="text-sm">{selectedOrder.container.number} ({selectedOrder.container.type})</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog pour modifier une commande */}
        <Dialog open={isEditOrderOpen} onOpenChange={setIsEditOrderOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier la commande {selectedOrder?.order_number}</DialogTitle>
            </DialogHeader>
            
            <Form {...orderForm}>
              <form onSubmit={orderForm.handleSubmit(handleSubmitOrder)} className="space-y-6">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Détails</TabsTrigger>
                    <TabsTrigger value="products">Produits</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4">
                    {/* Same form fields as in new order */}
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
                            <FormControl>
                              <Input {...field} placeholder="Nom du fournisseur" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* ... rest of form fields same as new order */}
                  </TabsContent>
                  
                  <TabsContent value="products" className="space-y-4">
                    {/* Same products selection as in new order */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Modifier les produits</h3>
                      
                      <ScrollArea className="h-64 border rounded-lg p-4">
                        <div className="space-y-3">
                          {products.map(product => (
                            <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{product.name}</span>
                                  {product.dangerous && (
                                    <Badge variant="destructive" className="text-xs">
                                      <AlertTriangle className="mr-1 h-3 w-3" />
                                      Dangereux
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {product.sku} - {product.cost.toFixed(2)} €/{product.unit}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  placeholder="Qté"
                                  className="w-20"
                                  value={selectedProducts[product.id]?.quantity || ""}
                                  onChange={(e) => handleProductQuantityChange(product.id, parseInt(e.target.value) || 0)}
                                />
                                <span className="text-sm text-muted-foreground">{product.unit}</span>
                              </div>
                              
                              {selectedProducts[product.id]?.quantity > 0 && (
                                <div className="text-sm text-muted-foreground ml-2">
                                  {selectedProducts[product.id]?.cartons && (
                                    <div>{selectedProducts[product.id].cartons} cartons</div>
                                  )}
                                  {selectedProducts[product.id]?.palettes && (
                                    <div>{selectedProducts[product.id].palettes} palettes</div>
                                  )}
                                  <div className="font-medium">
                                    {((selectedProducts[product.id]?.quantity || 0) * product.cost).toFixed(2)} €
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditOrderOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    Modifier la commande
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Dialog pour voir les produits d'une commande */}
        <Dialog open={isProductsOpen} onOpenChange={setIsProductsOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Produits de la commande {selectedOrder?.order_number}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Prix unitaire</TableHead>
                      <TableHead>Palettes</TableHead>
                      <TableHead>Cartons</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.order_products?.map((orderProduct) => (
                      <TableRow key={orderProduct.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{orderProduct.product?.name}</span>
                            {orderProduct.product?.dangerous && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Dangereux
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{orderProduct.quantity} {orderProduct.product?.unit}</TableCell>
                        <TableCell>{orderProduct.unit_price.toFixed(2)} €</TableCell>
                        <TableCell>{orderProduct.palette_quantity || 0}</TableCell>
                        <TableCell>{orderProduct.carton_quantity || 0}</TableCell>
                        <TableCell>{orderProduct.total_price.toFixed(2)} €</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="text-right">
                  <div className="text-lg font-bold">
                    Total commande: {selectedOrder.total_price?.toFixed(2)} €
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog pour lier/délier un conteneur */}
        <Dialog open={isContainerLinkOpen} onOpenChange={setIsContainerLinkOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {selectedOrder?.container_id ? "Délier ou changer le conteneur" : "Lier à un conteneur"}
              </DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                {selectedOrder.container_id && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium">Conteneur actuel</h4>
                    <p>{selectedOrder.container?.number} ({selectedOrder.container?.type})</p>
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={async () => {
                        try {
                          const { error } = await supabase
                            .from('orders')
                            .update({ container_id: null })
                            .eq('id', selectedOrder.id);
                          
                          if (error) throw error;
                          toast.success("Commande déliée du conteneur");
                          setIsContainerLinkOpen(false);
                          fetchData();
                        } catch (error) {
                          toast.error("Erreur lors de la suppression du lien");
                        }
                      }}
                    >
                      <Unlink className="mr-2 h-4 w-4" />
                      Délier du conteneur
                    </Button>
                  </div>
                )}
                
                <div className="space-y-2">
                  <h4 className="font-medium">Conteneurs disponibles</h4>
                  <div className="grid gap-3">
                    {containers.map((container) => {
                      const compatibility = canLinkToContainer(selectedOrder, container);
                      const usage = getContainerUsage(container);
                      const usagePercentage = (usage.usedPallets / container.max_pallets) * 100;

                      return (
                        <div key={container.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{container.number}</span>
                                <Badge variant="outline">{container.type}</Badge>
                                <Badge variant="outline">{container.transitaire}</Badge>
                                {usage.hasDangerous && (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="mr-1 h-3 w-3" />
                                    Dangereux
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="text-sm text-muted-foreground mt-1">
                                ETD: {container.etd ? new Date(container.etd).toLocaleDateString() : "Non défini"} | 
                                ETA: {container.eta ? new Date(container.eta).toLocaleDateString() : "Non défini"}
                              </div>
                              
                              <div className="mt-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <span>Palettes: {usage.usedPallets}/{container.max_pallets}</span>
                                  <Progress value={usagePercentage} className="w-20 h-2" />
                                  <span>{usagePercentage.toFixed(0)}%</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="ml-4">
                              {compatibility.canLink ? (
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      const { error } = await supabase
                                        .from('orders')
                                        .update({ container_id: container.id })
                                        .eq('id', selectedOrder.id);
                                      
                                      if (error) throw error;
                                      toast.success("Commande liée au conteneur");
                                      setIsContainerLinkOpen(false);
                                      fetchData();
                                    } catch (error) {
                                      toast.error("Erreur lors de la liaison");
                                    }
                                  }}
                                >
                                  <Link className="mr-2 h-4 w-4" />
                                  Lier
                                </Button>
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  <AlertTriangle className="h-4 w-4 text-orange-500 inline mr-1" />
                                  {compatibility.reason}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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