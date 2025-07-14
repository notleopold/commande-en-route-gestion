import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Building2, Plus, Search, Filter, Edit, Archive, Eye, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Supplier {
  id: string;
  name: string;
  country: string;
  address: string;
  product_types: string[];
  status: string;
  exclusive_to_client: boolean;
  associated_clients: string[];
  main_contact_name: string;
  position: string;
  email: string;
  phone: string;
  preferred_communication: string;
  payment_method: string;
  payment_conditions: string;
  incoterm: string;
  currency: string;
  preparation_time: number;
  minimum_order_amount: number;
  minimum_order_quantity: number;
  shipping_origin: string;
  ships_themselves: boolean;
  transport_partners: string;
  packaging_specs: string;
  total_orders: number;
  delivery_rate: number;
  incidents_count: number;
  reliability_rating: number;
  last_order_date: string;
  notes: string;
  attachments: string[];
  created_at: string;
  updated_at: string;
}

interface Client {
  id: string;
  name: string;
}

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      name: "",
      country: "",
      address: "",
      product_types: [] as string[],
      status: "active",
      exclusive_to_client: false,
      associated_clients: [] as string[],
      main_contact_name: "",
      position: "",
      email: "",
      phone: "",
      preferred_communication: "Email",
      payment_method: "",
      payment_conditions: "",
      incoterm: "EXW",
      currency: "EUR",
      preparation_time: 0,
      minimum_order_amount: 0,
      minimum_order_quantity: 0,
      shipping_origin: "",
      ships_themselves: false,
      transport_partners: "",
      packaging_specs: "",
      reliability_rating: 3,
      notes: "",
    }
  });

  const productTypes = [
    "Électronique", "Textile", "Alimentaire", "Cosmétique", "Mobilier", 
    "Automobile", "Pharmaceutique", "Chimique", "Matériaux", "Jouets"
  ];

  const countries = [
    "France", "Allemagne", "Italie", "Espagne", "Belgique", "Pays-Bas",
    "Chine", "Inde", "Turquie", "Maroc", "Tunisie", "États-Unis", "Royaume-Uni"
  ];

  const currencies = ["EUR", "USD", "GBP", "CNY", "MAD", "TND"];
  const incoterms = ["EXW", "FOB", "CIF", "DDP", "FCA", "CPT"];
  const communicationChannels = ["Email", "WhatsApp", "Phone", "Other"];

  useEffect(() => {
    fetchSuppliers();
    fetchClients();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les fournisseurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleCreateSupplier = async (data: any) => {
    try {
      const supplierData = {
        ...data,
        product_types: data.product_types || [],
        associated_clients: data.exclusive_to_client ? data.associated_clients : [],
        attachments: []
      };

      const { error } = await supabase
        .from('suppliers')
        .insert([supplierData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Fournisseur créé avec succès",
      });

      setIsCreateDialogOpen(false);
      form.reset();
      fetchSuppliers();
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le fournisseur",
        variant: "destructive",
      });
    }
  };

  const handleEditSupplier = async (data: any) => {
    if (!editingSupplier) return;

    try {
      const supplierData = {
        ...data,
        product_types: data.product_types || [],
        associated_clients: data.exclusive_to_client ? data.associated_clients : [],
      };

      const { error } = await supabase
        .from('suppliers')
        .update(supplierData)
        .eq('id', editingSupplier.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Fournisseur modifié avec succès",
      });

      setEditingSupplier(null);
      form.reset();
      fetchSuppliers();
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le fournisseur",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.reset({
      name: supplier.name,
      country: supplier.country,
      address: supplier.address,
      product_types: supplier.product_types || [],
      status: supplier.status,
      exclusive_to_client: supplier.exclusive_to_client,
      associated_clients: supplier.associated_clients || [],
      main_contact_name: supplier.main_contact_name,
      position: supplier.position,
      email: supplier.email,
      phone: supplier.phone,
      preferred_communication: supplier.preferred_communication || "Email",
      payment_method: supplier.payment_method,
      payment_conditions: supplier.payment_conditions,
      incoterm: supplier.incoterm || "EXW",
      currency: supplier.currency || "EUR",
      preparation_time: supplier.preparation_time || 0,
      minimum_order_amount: supplier.minimum_order_amount || 0,
      minimum_order_quantity: supplier.minimum_order_quantity || 0,
      shipping_origin: supplier.shipping_origin,
      ships_themselves: supplier.ships_themselves,
      transport_partners: supplier.transport_partners,
      packaging_specs: supplier.packaging_specs,
      reliability_rating: supplier.reliability_rating || 3,
      notes: supplier.notes,
    });
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supplier.main_contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supplier.country?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case "inactive":
        return <Badge className="bg-red-100 text-red-800">Inactif</Badge>;
      case "under_testing":
        return <Badge className="bg-yellow-100 text-yellow-800">En test</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Fournisseurs</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos fournisseurs et partenaires commerciaux
          </p>
        </div>

        <Dialog open={isCreateDialogOpen || !!editingSupplier} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingSupplier(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau fournisseur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? "Modifier le fournisseur" : "Nouveau fournisseur"}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(editingSupplier ? handleEditSupplier : handleCreateSupplier)} className="space-y-6">
                
                {/* General Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">📌 Informations générales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom du fournisseur *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="ex: TechnoSupply Ltd" />
                            </FormControl>
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
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un pays" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {countries.map(country => (
                                  <SelectItem key={country} value={country}>
                                    {country}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresse complète</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Adresse complète du fournisseur" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
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
                                <SelectItem value="active">Actif</SelectItem>
                                <SelectItem value="inactive">Inactif</SelectItem>
                                <SelectItem value="under_testing">En test</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="exclusive_to_client"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Exclusif à un client ?</FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.watch("exclusive_to_client") && (
                      <FormField
                        control={form.control}
                        name="associated_clients"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Clients associés *</FormLabel>
                            <div className="grid grid-cols-2 gap-3 border rounded-lg p-4 max-h-40 overflow-y-auto">
                              {clients.map(client => {
                                const isChecked = field.value?.includes(client.id) || false;
                                
                                return (
                                  <div key={client.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={client.id}
                                      checked={isChecked}
                                      onCheckedChange={(checked) => {
                                        const currentValues = field.value || [];
                                        if (checked) {
                                          field.onChange([...currentValues, client.id]);
                                        } else {
                                          field.onChange(currentValues.filter((id: string) => id !== client.id));
                                        }
                                      }}
                                    />
                                    <label 
                                      htmlFor={client.id}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                      {client.name}
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                            {clients.length === 0 && (
                              <p className="text-sm text-muted-foreground">Aucun client disponible. Ajoutez d'abord des clients.</p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">📞 Informations de contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="main_contact_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom du contact principal</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="ex: John Doe" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Poste/Rôle</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="ex: Sales Manager" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="contact@supplier.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
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

                    <FormField
                      control={form.control}
                      name="preferred_communication"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Canal de communication préféré</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {communicationChannels.map(channel => (
                                <SelectItem key={channel} value={channel}>
                                  {channel}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Commercial Terms */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">💰 Conditions commerciales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="payment_method"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Méthode de paiement</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="ex: Virement bancaire" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="incoterm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Incoterm standard</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {incoterms.map(term => (
                                  <SelectItem key={term} value={term}>
                                    {term}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="payment_conditions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conditions de paiement</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="ex: 30% à la commande, 70% avant expédition" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Devise principale</FormLabel>
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

                      <FormField
                        control={form.control}
                        name="preparation_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Délai de préparation (jours)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="minimum_order_amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Commande minimum (montant)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" step="0.01" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Logistics & Shipping */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🚚 Logistique et expédition</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="shipping_origin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lieu d'expédition</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="ex: Shanghai, Chine" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ships_themselves"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Expédie lui-même ?</FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="transport_partners"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Partenaires de transport habituels</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ex: DHL, FedEx, transporteur local" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="packaging_specs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Spécifications d'emballage</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Spécifications d'emballage standard" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Rating */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">📈 Évaluation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="reliability_rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Note de fiabilité (1-5)</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map(rating => (
                                <SelectItem key={rating} value={rating.toString()}>
                                  {rating} - {rating === 1 ? "Très faible" : rating === 2 ? "Faible" : rating === 3 ? "Moyen" : rating === 4 ? "Bon" : "Excellent"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                            <Textarea {...field} placeholder="Commentaires internes et observations" rows={4} />
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
                    setEditingSupplier(null);
                    form.reset();
                  }}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingSupplier ? "Modifier" : "Créer"}
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
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="inactive">Inactif</SelectItem>
            <SelectItem value="under_testing">En test</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier) => (
          <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{supplier.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{supplier.country}</p>
                </div>
                {getStatusBadge(supplier.status)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Contact principal</p>
                <p className="text-sm text-muted-foreground">
                  {supplier.main_contact_name} - {supplier.position}
                </p>
                <p className="text-sm text-muted-foreground">{supplier.email}</p>
              </div>

              <div>
                <p className="text-sm font-medium">Conditions</p>
                <p className="text-sm text-muted-foreground">
                  {supplier.incoterm} - {supplier.currency}
                </p>
                <p className="text-sm text-muted-foreground">
                  Délai: {supplier.preparation_time} jours
                </p>
              </div>

              {supplier.exclusive_to_client && (
                <div>
                  <Badge variant="outline" className="text-xs mb-2">
                    Exclusif client
                  </Badge>
                  {supplier.associated_clients && supplier.associated_clients.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Clients: {supplier.associated_clients.map(clientId => {
                        const client = clients.find(c => c.id === clientId);
                        return client?.name;
                      }).filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">Fiabilité:</span>
                <div className="flex">
                  {getRatingStars(supplier.reliability_rating || 0)}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => openEditDialog(supplier)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun fournisseur trouvé</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== "all" 
              ? "Aucun fournisseur ne correspond à vos critères de recherche."
              : "Commencez par ajouter votre premier fournisseur."
            }
          </p>
          {(!searchQuery && statusFilter === "all") && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un fournisseur
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Suppliers;