import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit, Package, Truck, Calendar, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OrderProductsManager } from "@/components/OrderProductsManager";
const ORDER_STATUSES = ['Demande client reçue', 'En cours d\'analyse par la centrale', 'Devis fournisseurs en cours', 'Devis validé (interne)', 'En attente de paiement fournisseur', 'Paiement fournisseur effectué', 'Commande validée – En production ou préparation', 'Prête à être expédiée / à enlever', 'Chez le transitaire', 'Plan de chargement confirmé', 'En transit (maritime / aérien)', 'Arrivée au port / dédouanement', 'Livraison finale à la filiale / au client local', 'Archivée / Clôturée'];
const SUPPLIER_PAYMENT_STATUSES = ['Pas encore demandé', 'Demande de virement envoyée', 'Virement en attente de validation', 'Virement effectué', 'Paiement partiel effectué', 'Paiement soldé'];
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
  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);
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
                <p className="font-medium">{new Date(order.order_date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Type de paiement</label>
                <p className="font-medium">{order.payment_type}</p>
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
              {order.current_transitaire && <div>
                  <label className="text-sm text-muted-foreground">Transitaire</label>
                  <p className="font-medium">{order.current_transitaire}</p>
                </div>}
              {order.is_received !== undefined && <div>
                  <label className="text-sm text-muted-foreground">Statut de réception</label>
                  <p className="font-medium">
                    {order.is_received ? <span className="text-green-600">✓ Réceptionné</span> : <span className="text-red-600">✗ Non réceptionné</span>}
                  </p>
                </div>}
              {order.transitaire_entry_number && <div>
                  <label className="text-sm text-muted-foreground">Numéro d'entrée transitaire</label>
                  <p className="font-medium">{order.transitaire_entry_number}</p>
                </div>}
              {order.containers && <div>
                  <label className="text-sm text-muted-foreground">Conteneur</label>
                  <p className="font-medium">{order.containers.number} ({order.containers.type})</p>
                </div>}
              {order.weight && <div>
                  <label className="text-sm text-muted-foreground">Poids</label>
                  <p className="font-medium">{order.weight} kg</p>
                </div>}
              {order.volume && <div>
                  <label className="text-sm text-muted-foreground">Volume</label>
                  <p className="font-medium">{order.volume} m³</p>
                </div>}
              {order.cartons && <div>
                  <label className="text-sm text-muted-foreground">Cartons</label>
                  <p className="font-medium">{order.cartons}</p>
                </div>}
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
              {order.clients ? <p className="font-medium">{order.clients.name}</p> : <p className="text-muted-foreground">Aucun client assigné</p>}
            </CardContent>
          </Card>
        </div>

        <OrderProductsManager orderId={order.id} orderProducts={order.order_products || []} onUpdate={fetchOrder} />
      </div>
    </Layout>;
}