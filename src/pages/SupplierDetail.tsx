import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Building2, Phone, Mail, MapPin, Package, Star, Truck, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";

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

const SupplierDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchSupplier(id);
      fetchClients();
    }
  }, [id]);

  const fetchSupplier = async (supplierId: string) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', supplierId)
        .single();

      if (error) throw error;
      setSupplier(data);
    } catch (error) {
      console.error('Error fetching supplier:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les informations du fournisseur",
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

  const getAssociatedClientNames = () => {
    if (!supplier?.associated_clients) return [];
    return supplier.associated_clients.map(clientId => {
      const client = clients.find(c => c.id === clientId);
      return client?.name || clientId;
    }).filter(Boolean);
  };

  if (loading) {
    return (
      <Layout title="Détails du fournisseur">
        <div className="p-6">Chargement...</div>
      </Layout>
    );
  }

  if (!supplier) {
    return (
      <Layout title="Fournisseur non trouvé">
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Fournisseur non trouvé</h3>
          <p className="text-muted-foreground mb-4">
            Le fournisseur demandé n'existe pas ou a été supprimé.
          </p>
          <Button onClick={() => navigate('/suppliers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux fournisseurs
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Fournisseur - ${supplier.name}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/suppliers')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{supplier.name}</h1>
              <p className="text-muted-foreground">{supplier.country}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(supplier.status)}
            <Button onClick={() => navigate(`/suppliers/edit/${supplier.id}`)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* General Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">Adresse</p>
                <p className="text-muted-foreground">{supplier.address || "Non renseignée"}</p>
              </div>

              <div>
                <p className="font-medium">Types de produits</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {supplier.product_types?.length > 0 ? (
                    supplier.product_types.map((type, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">Non renseigné</p>
                  )}
                </div>
              </div>

              {supplier.exclusive_to_client && (
                <div>
                  <p className="font-medium">Clients associés</p>
                  <div className="mt-1">
                    {getAssociatedClientNames().length > 0 ? (
                      getAssociatedClientNames().map((clientName, index) => (
                        <Badge key={index} variant="secondary" className="mr-1 mb-1">
                          {clientName}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">Aucun client associé</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <p className="font-medium">Note de fiabilité</p>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {getRatingStars(supplier.reliability_rating || 0)}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({supplier.reliability_rating || 0}/5)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">Contact principal</p>
                <p className="text-muted-foreground">
                  {supplier.main_contact_name || "Non renseigné"}
                </p>
                {supplier.position && (
                  <p className="text-sm text-muted-foreground">{supplier.position}</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {supplier.email || "Non renseigné"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {supplier.phone || "Non renseigné"}
                  </span>
                </div>
              </div>

              <div>
                <p className="font-medium">Communication préférée</p>
                <p className="text-muted-foreground">
                  {supplier.preferred_communication || "Non renseignée"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Commercial Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Conditions commerciales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Incoterm</p>
                  <p className="text-muted-foreground">{supplier.incoterm || "Non renseigné"}</p>
                </div>
                <div>
                  <p className="font-medium">Devise</p>
                  <p className="text-muted-foreground">{supplier.currency || "Non renseignée"}</p>
                </div>
              </div>

              <div>
                <p className="font-medium">Méthode de paiement</p>
                <p className="text-muted-foreground">
                  {supplier.payment_method || "Non renseignée"}
                </p>
              </div>

              <div>
                <p className="font-medium">Conditions de paiement</p>
                <p className="text-muted-foreground text-sm">
                  {supplier.payment_conditions || "Non renseignées"}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-sm">Délai préparation</p>
                  <p className="text-muted-foreground">
                    {supplier.preparation_time} jours
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm">Commande minimum</p>
                  <p className="text-muted-foreground">
                    {supplier.minimum_order_amount || 0} {supplier.currency}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Logistique
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">Lieu d'expédition</p>
                <p className="text-muted-foreground">
                  {supplier.shipping_origin || "Non renseigné"}
                </p>
              </div>

              <div>
                <p className="font-medium">Expédition propre</p>
                <p className="text-muted-foreground">
                  {supplier.ships_themselves ? "Oui" : "Non"}
                </p>
              </div>

              <div>
                <p className="font-medium">Partenaires transport</p>
                <p className="text-muted-foreground text-sm">
                  {supplier.transport_partners || "Non renseignés"}
                </p>
              </div>

              <div>
                <p className="font-medium">Spécifications emballage</p>
                <p className="text-muted-foreground text-sm">
                  {supplier.packaging_specs || "Non renseignées"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-sm">Total commandes</p>
                  <p className="text-2xl font-bold">{supplier.total_orders || 0}</p>
                </div>
                <div>
                  <p className="font-medium text-sm">Taux livraison</p>
                  <p className="text-2xl font-bold">{supplier.delivery_rate || 0}%</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-sm">Incidents</p>
                  <p className="text-xl font-bold text-red-600">{supplier.incidents_count || 0}</p>
                </div>
                <div>
                  <p className="font-medium text-sm">Dernière commande</p>
                  <p className="text-sm text-muted-foreground">
                    {supplier.last_order_date 
                      ? new Date(supplier.last_order_date).toLocaleDateString('fr-FR')
                      : "Aucune"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes internes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {supplier.notes || "Aucune note"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SupplierDetail;