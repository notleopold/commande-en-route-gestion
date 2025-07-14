import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { UserCheck, Plus, Search, Filter, Edit, Eye, CalendarIcon, Euro, Package, TrendingUp, Clock, AlertCircle, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
  type: string;
  status: string;
  country: string;
  city: string;
  address: string;
  delivery_address: string;
  time_zone: string;
  preferred_language: string;
  email: string;
  phone: string;
  main_contact_name: string;
  contact_role: string;
  contact_email: string;
  contact_phone: string;
  secondary_contact: string;
  communication_preferences: string;
  notes: string;
  documents: string[];
  pricing_terms: string;
  payment_conditions: string;
  preferred_transporters: string;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: string;
  order_number: string;
  supplier: string;
  status: string;
  order_date: string;
  payment_date: string;
  total_price: number;
  client_id: string;
}

interface Payment {
  id: string;
  payment_id: string;
  client_id: string;
  order_id: string;
  payment_date: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  notes: string;
  order?: {
    order_number: string;
    supplier: string;
    total_price: number;
  };
}

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientOrders, setClientOrders] = useState<Order[]>([]);
  const [clientPayments, setClientPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      name: "",
      type: "External",
      status: "Active",
      country: "",
      city: "",
      address: "",
      delivery_address: "",
      time_zone: "",
      preferred_language: "French",
      email: "",
      phone: "",
      main_contact_name: "",
      contact_role: "",
      contact_email: "",
      contact_phone: "",
      secondary_contact: "",
      communication_preferences: "email",
      notes: "",
      pricing_terms: "",
      payment_conditions: "",
      preferred_transporters: "",
    }
  });

  const paymentForm = useForm({
    defaultValues: {
      payment_id: "",
      order_id: "",
      payment_date: new Date(),
      amount: 0,
      currency: "EUR",
      payment_method: "Bank Transfer",
      payment_status: "Pending",
      notes: "",
    }
  });

  const clientTypes = ["Subsidiary", "Hotel", "Group", "External", "Other"];
  const languages = ["French", "English", "Spanish", "German", "Italian"];
  const currencies = ["EUR", "USD", "GBP", "MAD", "TND"];
  const paymentMethods = ["Bank Transfer", "Cash", "Mobile Money", "Check", "Other"];
  const communicationMethods = ["email", "WhatsApp", "phone", "SMS"];

  useEffect(() => {
    fetchClients();
    fetchOrders();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchClientOrders(selectedClient.id);
      fetchClientPayments(selectedClient.id);
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchClientOrders = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientOrders(data || []);
    } catch (error) {
      console.error('Error fetching client orders:', error);
    }
  };

  const fetchClientPayments = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          order:orders(order_number, supplier, total_price)
        `)
        .eq('client_id', clientId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setClientPayments(data || []);
    } catch (error) {
      console.error('Error fetching client payments:', error);
    }
  };

  const handleCreateClient = async (data: any) => {
    try {
      const { error } = await supabase
        .from('clients')
        .insert([data]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Client créé avec succès",
      });

      setIsCreateDialogOpen(false);
      form.reset();
      fetchClients();
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le client",
        variant: "destructive",
      });
    }
  };

  const handleEditClient = async (data: any) => {
    if (!editingClient) return;

    try {
      const { error } = await supabase
        .from('clients')
        .update(data)
        .eq('id', editingClient.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Client modifié avec succès",
      });

      setEditingClient(null);
      form.reset();
      fetchClients();
      if (selectedClient && selectedClient.id === editingClient.id) {
        setSelectedClient({...selectedClient, ...data});
      }
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le client",
        variant: "destructive",
      });
    }
  };

  const handleCreatePayment = async (data: any) => {
    if (!selectedClient) return;

    try {
      const paymentData = {
        ...data,
        client_id: selectedClient.id,
        order_id: data.order_id || null,
        payment_date: format(data.payment_date, 'yyyy-MM-dd'),
      };

      const { error } = await supabase
        .from('payments')
        .insert([paymentData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Paiement enregistré avec succès",
      });

      setIsPaymentDialogOpen(false);
      paymentForm.reset();
      fetchClientPayments(selectedClient.id);
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le paiement",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    form.reset({
      name: client.name,
      type: client.type || "External",
      status: client.status || "Active",
      country: client.country || "",
      city: client.city || "",
      address: client.address || "",
      delivery_address: client.delivery_address || "",
      time_zone: client.time_zone || "",
      preferred_language: client.preferred_language || "French",
      email: client.email || "",
      phone: client.phone || "",
      main_contact_name: client.main_contact_name || "",
      contact_role: client.contact_role || "",
      contact_email: client.contact_email || "",
      contact_phone: client.contact_phone || "",
      secondary_contact: client.secondary_contact || "",
      communication_preferences: client.communication_preferences || "email",
      notes: client.notes || "",
      pricing_terms: client.pricing_terms || "",
      payment_conditions: client.payment_conditions || "",
      preferred_transporters: client.preferred_transporters || "",
    });
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Client supprimé avec succès",
      });

      setIsDeleteDialogOpen(false);
      setClientToDelete(null);
      fetchClients();
      
      // Si le client supprimé était sélectionné, revenir à la liste
      if (selectedClient && selectedClient.id === clientToDelete.id) {
        setSelectedClient(null);
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le client",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteDialogOpen(true);
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.main_contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.country?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    const matchesType = typeFilter === "all" || client.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case "Inactive":
        return <Badge className="bg-red-100 text-red-800">Inactif</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      "Subsidiary": "bg-blue-100 text-blue-800",
      "Hotel": "bg-purple-100 text-purple-800",
      "Group": "bg-orange-100 text-orange-800",
      "External": "bg-gray-100 text-gray-800",
      "Other": "bg-yellow-100 text-yellow-800"
    };
    return <Badge className={colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"}>{type}</Badge>;
  };

  const calculateClientStats = (clientId: string) => {
    const clientOrderList = orders.filter(order => order.client_id === clientId);
    const totalOrders = clientOrderList.length;
    const ordersThisMonth = clientOrderList.filter(order => {
      const orderDate = new Date(order.order_date);
      const now = new Date();
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    }).length;
    
    const totalValue = clientOrderList.reduce((sum, order) => sum + (order.total_price || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;
    
    const delayedOrders = clientOrderList.filter(order => {
      if (!order.payment_date || order.status !== 'completed') return false;
      const orderDate = new Date(order.order_date);
      const paymentDate = new Date(order.payment_date);
      const diffDays = (paymentDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays > 30; // Consider delayed if payment is more than 30 days after order
    }).length;
    
    const delayedPercentage = totalOrders > 0 ? (delayedOrders / totalOrders) * 100 : 0;

    return { totalOrders, ordersThisMonth, avgOrderValue, delayedPercentage, totalValue };
  };

  if (loading) {
    return (
      <Layout title="Clients">
        <div>Chargement...</div>
      </Layout>
    );
  }

  if (selectedClient) {
    const stats = calculateClientStats(selectedClient.id);
    const clientPaymentStats = clientPayments.reduce((acc, payment) => {
      acc.totalReceived += payment.amount;
      if (!acc.lastPaymentDate || payment.payment_date > acc.lastPaymentDate) {
        acc.lastPaymentDate = payment.payment_date;
      }
      return acc;
    }, { totalReceived: 0, lastPaymentDate: null as string | null });

    return (
      <Layout title={`Client - ${selectedClient.name}`}>
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <Button variant="outline" onClick={() => setSelectedClient(null)} className="mb-4">
                ← Retour à la liste
              </Button>
              <h1 className="text-3xl font-bold">{selectedClient.name}</h1>
              <div className="flex gap-2 mt-2">
                {getTypeBadge(selectedClient.type)}
                {getStatusBadge(selectedClient.status)}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => openEditDialog(selectedClient)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button onClick={() => setIsPaymentDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau paiement
              </Button>
              <Button 
                variant="outline" 
                onClick={() => openDeleteDialog(selectedClient)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="flex items-center p-6">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Commandes</p>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-6">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Ce Mois</p>
                  <p className="text-2xl font-bold">{stats.ordersThisMonth}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-6">
                <Euro className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Valeur Moyenne</p>
                  <p className="text-2xl font-bold">{stats.avgOrderValue.toFixed(0)}€</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-6">
                <Clock className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">% Retards</p>
                  <p className="text-2xl font-bold">{stats.delayedPercentage.toFixed(1)}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="info" className="space-y-4">
            <TabsList>
              <TabsTrigger value="info">Informations</TabsTrigger>
              <TabsTrigger value="orders">Commandes ({clientOrders.length})</TabsTrigger>
              <TabsTrigger value="payments">Paiements ({clientPayments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations générales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Pays / Ville</p>
                      <p className="text-sm text-muted-foreground">{selectedClient.country} - {selectedClient.city}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Adresse de livraison</p>
                      <p className="text-sm text-muted-foreground">{selectedClient.delivery_address || selectedClient.address}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Langue préférée</p>
                      <p className="text-sm text-muted-foreground">{selectedClient.preferred_language}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contact principal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Contact</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedClient.main_contact_name} - {selectedClient.contact_role}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{selectedClient.contact_email || selectedClient.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Téléphone</p>
                      <p className="text-sm text-muted-foreground">{selectedClient.contact_phone || selectedClient.phone}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedClient.notes && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedClient.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Historique des commandes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Commande</TableHead>
                        <TableHead>Fournisseur</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date Commande</TableHead>
                        <TableHead>Valeur</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.order_number}</TableCell>
                          <TableCell>{order.supplier}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.status}</Badge>
                          </TableCell>
                          <TableCell>{format(new Date(order.order_date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{order.total_price?.toFixed(2)}€</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {clientOrders.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Aucune commande trouvée pour ce client</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="flex items-center p-6">
                    <Euro className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Reçu</p>
                      <p className="text-2xl font-bold">{clientPaymentStats.totalReceived.toFixed(2)}€</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center p-6">
                    <AlertCircle className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Solde Restant</p>
                      <p className="text-2xl font-bold">{(stats.totalValue - clientPaymentStats.totalReceived).toFixed(2)}€</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center p-6">
                    <Clock className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Dernier Paiement</p>
                      <p className="text-2xl font-bold">
                        {clientPaymentStats.lastPaymentDate ? format(new Date(clientPaymentStats.lastPaymentDate), 'dd/MM') : 'N/A'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Historique des paiements</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID Paiement</TableHead>
                        <TableHead>Commande Liée</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Méthode</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.payment_id || payment.id.slice(0, 8)}</TableCell>
                          <TableCell>{payment.order?.order_number || 'N/A'}</TableCell>
                          <TableCell>{format(new Date(payment.payment_date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{payment.amount.toFixed(2)} {payment.currency}</TableCell>
                          <TableCell>{payment.payment_method}</TableCell>
                          <TableCell>
                            <Badge variant={payment.payment_status === 'Confirmed' ? 'default' : 'secondary'}>
                              {payment.payment_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {clientPayments.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Aucun paiement enregistré pour ce client</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Payment Dialog */}
          <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nouveau paiement - {selectedClient.name}</DialogTitle>
              </DialogHeader>
              <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit(handleCreatePayment)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={paymentForm.control}
                      name="payment_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID Paiement (optionnel)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ex: PAY-001" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="order_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commande liée (optionnel)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une commande" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clientOrders.map(order => (
                                <SelectItem key={order.id} value={order.id}>
                                  {order.order_number} - {order.supplier}
                                </SelectItem>
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
                      control={paymentForm.control}
                      name="payment_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date de paiement</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy")
                                  ) : (
                                    <span>Date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Montant</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" min="0" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Devise</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {currencies.map(currency => (
                                <SelectItem key={currency} value={currency}>
                                  {currency}
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
                      control={paymentForm.control}
                      name="payment_method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Méthode de paiement</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {paymentMethods.map(method => (
                                <SelectItem key={method} value={method}>
                                  {method}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="payment_status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Statut</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Pending">En attente</SelectItem>
                              <SelectItem value="Confirmed">Confirmé</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={paymentForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (optionnel)</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Informations supplémentaires sur le paiement" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      Enregistrer le paiement
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Clients">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-muted-foreground mt-2">
              Gérez vos clients, filiales, hôtels et groupes
            </p>
          </div>

          <Dialog open={isCreateDialogOpen || !!editingClient} onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false);
              setEditingClient(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? "Modifier le client" : "Nouveau client"}
                </DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(editingClient ? handleEditClient : handleCreateClient)} className="space-y-6">
                  
                  {/* General Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">🧾 Informations générales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom du client *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="ex: Hôtel Luxe International" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {clientTypes.map(type => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
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
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Statut</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Active">Actif</SelectItem>
                                  <SelectItem value="Inactive">Inactif</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pays</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="France" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ville</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Paris" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="delivery_address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Adresse de livraison</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Adresse complète de livraison" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="preferred_language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Langue préférée</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {languages.map(lang => (
                                    <SelectItem key={lang} value={lang}>
                                      {lang}
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
                          name="time_zone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fuseau horaire</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Europe/Paris" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">📞 Contact principal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="main_contact_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom du contact</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="ex: Marie Dupont" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contact_role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fonction</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="ex: Directeur des Achats" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="contact_email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" placeholder="contact@client.com" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contact_phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Téléphone</FormLabel>
                              <FormControl>
                                <Input {...field} type="tel" placeholder="+33 1 23 45 67 89" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="secondary_contact"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact secondaire</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Nom et coordonnées" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="communication_preferences"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Préférence de communication</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {communicationMethods.map(method => (
                                    <SelectItem key={method} value={method}>
                                      {method}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Commercial Terms */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">💰 Conditions commerciales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="pricing_terms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conditions tarifaires</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Conditions spécifiques de tarification" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="payment_conditions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conditions de paiement</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="ex: 30 jours net, acompte de 30%" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="preferred_transporters"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Transporteurs préférés</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="ex: DHL, UPS, transporteur local" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">📁 Notes et observations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes internes</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Commentaires internes et alertes" rows={4} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setIsCreateDialogOpen(false);
                      setEditingClient(null);
                      form.reset();
                    }}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {editingClient ? "Modifier" : "Créer"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher par nom, contact, pays..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
              <SelectItem value="Active">Actif</SelectItem>
              <SelectItem value="Inactive">Inactif</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrer par type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {clientTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => {
            const stats = calculateClientStats(client.id);
            return (
              <Card key={client.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedClient(client)}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{client.country} - {client.city}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {getTypeBadge(client.type)}
                      {getStatusBadge(client.status)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Contact principal</p>
                    <p className="text-sm text-muted-foreground">
                      {client.main_contact_name || client.name} - {client.contact_role}
                    </p>
                    <p className="text-sm text-muted-foreground">{client.contact_email || client.email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{stats.totalOrders}</p>
                      <p className="text-xs text-muted-foreground">Commandes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.totalValue.toFixed(0)}€</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(client);
                    }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClient(client);
                    }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={(e) => {
                      e.stopPropagation();
                      openDeleteDialog(client);
                    }} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun client trouvé</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                ? "Aucun client ne correspond à vos critères de recherche."
                : "Commencez par ajouter votre premier client."
              }
            </p>
            {(!searchQuery && statusFilter === "all" && typeFilter === "all") && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un client
              </Button>
            )}
          </div>
        )}
      </div>

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
              Êtes-vous absolument certain de vouloir supprimer le client{" "}
              <span className="font-bold text-destructive">
                {clientToDelete?.name}
              </span>
              ?
              <br />
              <br />
              <span className="text-sm text-muted-foreground">
                Cette action ne peut pas être annulée. Toutes les données liées à ce client (commandes, paiements, etc.) seront définitivement perdues.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteClient}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Oui, supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Clients;