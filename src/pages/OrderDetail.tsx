import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ArrowLeft, Edit, Package, Truck, CalendarIcon, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OrderProductsManager } from "@/components/OrderProductsManager";
import { cn } from "@/lib/utils";
const ORDER_STATUSES = ['Demande client reçue', 'En cours d\'analyse par la centrale', 'Devis fournisseurs en cours', 'Devis validé (interne)', 'En attente de paiement fournisseur', 'Paiement fournisseur effectué', 'Commande validée – En production ou préparation', 'Prête à être expédiée / à enlever', 'Chez le transitaire', 'Plan de chargement confirmé', 'En transit (maritime / aérien)', 'Arrivée au port / dédouanement', 'Livraison finale à la filiale / au client local', 'Archivée / Clôturée'];
const SUPPLIER_PAYMENT_STATUSES = ['Pas encore demandé', 'Demande de virement envoyée', 'Virement en attente de validation', 'Virement effectué', 'Paiement partiel effectué', 'Paiement soldé'];
const PAYMENT_TYPES = ['Carte bancaire', 'Virement', 'Chèque', 'Espèces', 'Crédit', 'Autre'];
interface Order {
  id: string;
  order_number: string;
  supplier: string;
  order_date: string;
  status: string;
  payment_type: string;
  order_status?: string;
  supplier_payment_status?: string;
  weight?: number;
  volume?: number;
  cartons?: number;
  total_price?: number;
  current_transitaire?: string;
  is_received?: boolean;
  transitaire_entry_number?: string;
  container_id?: string;
  client_id?: string;
  clients?: {
    name: string;
  };
  containers?: {
    number: string;
    type: string;
  };
  order_products?: Array<{
    id?: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    palette_quantity?: number;
    carton_quantity?: number;
    products: {
      id: string;
      name: string;
      sku: string;
      dangerous: boolean;
      imdg_class?: string;
    };
  }>;
}
export default function OrderDetail() {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);
  useEffect(() => {
    if (id) {
      fetchOrder();
      fetchClients();
    }
  }, [id]);

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
  const fetchOrder = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('orders').select(`
          *,
          clients (name),
          containers (number, type),
          order_products (
            id,
            product_id,
            quantity,
            unit_price,
            total_price,
            palette_quantity,
            carton_quantity,
            products (id, name, sku, dangerous, imdg_class)
          )
        `).eq('id', id).single();
      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error("Erreur lors du chargement de la commande");
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };
  const getOrderStatusBadge = (status: string) => {
    const colorMap = {
      'Demande client reçue': 'bg-blue-100 text-blue-800',
      'En cours d\'analyse par la centrale': 'bg-blue-100 text-blue-800',
      'Devis fournisseurs en cours': 'bg-blue-100 text-blue-800',
      'Devis validé (interne)': 'bg-blue-100 text-blue-800',
      'En attente de paiement fournisseur': 'bg-orange-100 text-orange-800',
      'Paiement fournisseur effectué': 'bg-green-100 text-green-800',
      'Commande validée – En production ou préparation': 'bg-purple-100 text-purple-800',
      'Prête à être expédiée / à enlever': 'bg-purple-100 text-purple-800',
      'Chez le transitaire': 'bg-indigo-100 text-indigo-800',
      'Plan de chargement confirmé': 'bg-indigo-100 text-indigo-800',
      'En transit (maritime / aérien)': 'bg-yellow-100 text-yellow-800',
      'Arrivée au port / dédouanement': 'bg-yellow-100 text-yellow-800',
      'Livraison finale à la filiale / au client local': 'bg-green-100 text-green-800',
      'Archivée / Clôturée': 'bg-gray-100 text-gray-800'
    };
    return <Badge className={colorMap[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };
  const getSupplierPaymentStatusBadge = (status: string) => {
    const colorMap = {
      'Pas encore demandé': 'bg-gray-100 text-gray-800',
      'Demande de virement envoyée': 'bg-orange-100 text-orange-800',
      'Virement en attente de validation': 'bg-orange-100 text-orange-800',
      'Virement effectué': 'bg-green-100 text-green-800',
      'Paiement partiel effectué': 'bg-yellow-100 text-yellow-800',
      'Paiement soldé': 'bg-green-100 text-green-800'
    };
    return <Badge className={colorMap[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };
  const getStatusBadge = (status: string) => {
    const styles = {
      "BDC ENVOYÉ ZIKETRO": "bg-blue-100 text-blue-800",
      "À COMMANDER": "bg-orange-100 text-orange-800",
      "PAIEMENT EN ATTENTE": "bg-yellow-100 text-yellow-800",
      "COMMANDÉ > EN LIVRAISON": "bg-purple-100 text-purple-800",
      "PAYÉ (30%)": "bg-green-100 text-green-600",
      "PAYÉ (50%)": "bg-green-100 text-green-700",
      "PAYÉ (100%)": "bg-green-100 text-green-800",
      "LIVRÉ": "bg-green-100 text-green-900"
    };
    return <Badge className={styles[status] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
  };
  const handleOrderStatusChange = async (newStatus: string) => {
    try {
      const {
        error
      } = await supabase.from('orders').update({
        order_status: newStatus
      }).eq('id', id);
      if (error) throw error;
      setOrder(prev => prev ? {
        ...prev,
        order_status: newStatus
      } : null);
      toast.success("Statut de commande mis à jour");
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };
  const handleSupplierPaymentStatusChange = async (newStatus: string) => {
    try {
      const {
        error
      } = await supabase.from('orders').update({
        supplier_payment_status: newStatus
      }).eq('id', id);
      if (error) throw error;
      setOrder(prev => prev ? {
        ...prev,
        supplier_payment_status: newStatus
      } : null);
      toast.success("Statut de paiement fournisseur mis à jour");
    } catch (error) {
      console.error('Error updating supplier payment status:', error);
      toast.error("Erreur lors de la mise à jour du statut de paiement");
    }
  };

  const handleOrderDateChange = async (newDate: Date) => {
    try {
      const { error } = await supabase.from('orders').update({
        order_date: newDate.toISOString().split('T')[0]
      }).eq('id', id);
      if (error) throw error;
      setOrder(prev => prev ? {
        ...prev,
        order_date: newDate.toISOString().split('T')[0]
      } : null);
      toast.success("Date de commande mise à jour");
    } catch (error) {
      console.error('Error updating order date:', error);
      toast.error("Erreur lors de la mise à jour de la date");
    }
  };

  const handlePaymentTypeChange = async (newType: string) => {
    try {
      const { error } = await supabase.from('orders').update({
        payment_type: newType
      }).eq('id', id);
      if (error) throw error;
      setOrder(prev => prev ? {
        ...prev,
        payment_type: newType
      } : null);
      toast.success("Type de paiement mis à jour");
    } catch (error) {
      console.error('Error updating payment type:', error);
      toast.error("Erreur lors de la mise à jour du type de paiement");
    }
  };

  const handleFieldUpdate = async (field: string, value: any) => {
    try {
      const { error } = await supabase.from('orders').update({
        [field]: value
      }).eq('id', id);
      if (error) throw error;
      setOrder(prev => prev ? {
        ...prev,
        [field]: value
      } : null);
      toast.success("Information mise à jour");
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast.error("Erreur lors de la mise à jour");
    }
  };
  if (loading) {
    return <Layout title="Chargement..."><div>Chargement...</div></Layout>;
  }
  if (!order) {
    return <Layout title="Commande introuvable"><div>Commande introuvable</div></Layout>;
  }
  return <Layout title={`Commande ${order.order_number}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/orders')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{order.order_number}</h1>
              <p className="text-muted-foreground">Fournisseur: {order.supplier}</p>
            </div>
          </div>
          <Button onClick={() => navigate(`/orders/${order.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div>
                <label className="text-sm text-muted-foreground">Statut de commande</label>
                <Select value={order.order_status || ''} onValueChange={handleOrderStatusChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map(status => <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
                {order.order_status && <div className="mt-1">{getOrderStatusBadge(order.order_status)}</div>}
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Statut de paiement fournisseur</label>
                <Select value={order.supplier_payment_status || ''} onValueChange={handleSupplierPaymentStatusChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPLIER_PAYMENT_STATUSES.map(status => <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
                {order.supplier_payment_status && <div className="mt-1">{getSupplierPaymentStatusBadge(order.supplier_payment_status)}</div>}
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Date de commande</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !order.order_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {order.order_date ? format(new Date(order.order_date), "PPP") : <span>Sélectionner une date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={order.order_date ? new Date(order.order_date) : undefined}
                      onSelect={(date) => date && handleOrderDateChange(date)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Type de paiement</label>
                <Select value={order.payment_type || ''} onValueChange={handlePaymentTypeChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TYPES.map(type => 
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {order.total_price && <div>
                  <label className="text-sm text-muted-foreground">Prix total</label>
                  <p className="font-medium">{order.total_price.toLocaleString()} €</p>
                </div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Logistique
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Transitaire</label>
                <Input
                  value={order.current_transitaire || ''}
                  onChange={(e) => handleFieldUpdate('current_transitaire', e.target.value)}
                  placeholder="Nom du transitaire"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Statut de réception</label>
                <Select 
                  value={order.is_received !== undefined ? order.is_received.toString() : ''} 
                  onValueChange={(value) => handleFieldUpdate('is_received', value === 'true')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Non réceptionné</SelectItem>
                    <SelectItem value="true">Réceptionné</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Numéro d'entrée transitaire</label>
                <Input
                  value={order.transitaire_entry_number || ''}
                  onChange={(e) => handleFieldUpdate('transitaire_entry_number', e.target.value)}
                  placeholder="Numéro d'entrée"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Poids (kg)</label>
                <Input
                  type="number"
                  value={order.weight || ''}
                  onChange={(e) => handleFieldUpdate('weight', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Poids en kg"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Volume (m³)</label>
                <Input
                  type="number"
                  value={order.volume || ''}
                  onChange={(e) => handleFieldUpdate('volume', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Volume en m³"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Cartons</label>
                <Input
                  type="number"
                  value={order.cartons || ''}
                  onChange={(e) => handleFieldUpdate('cartons', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Nombre de cartons"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="text-sm text-muted-foreground">Client assigné</label>
                <Select 
                  value={order.client_id || ''} 
                  onValueChange={(value) => {
                    handleFieldUpdate('client_id', value || null);
                    // Update the local state to reflect the change immediately
                    const selectedClient = clients.find(c => c.id === value);
                    setOrder(prev => prev ? {
                      ...prev,
                      client_id: value || null,
                      clients: selectedClient ? { name: selectedClient.name } : undefined
                    } : null);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun client</SelectItem>
                    {clients.map(client => 
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <OrderProductsManager orderId={order.id} orderProducts={order.order_products || []} onUpdate={fetchOrder} />
      </div>
    </Layout>;
}