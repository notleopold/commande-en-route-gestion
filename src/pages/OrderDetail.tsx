import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Package, Truck, Calendar, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string;
  supplier: string;
  order_date: string;
  status: string;
  payment_type: string;
  weight?: number;
  volume?: number;
  cartons?: number;
  total_price?: number;
  current_transitaire?: string;
  is_received?: boolean;
  transitaire_entry_number?: string;
  container_id?: string;
  clients?: { name: string };
  containers?: { number: string; type: string };
  order_products?: Array<{
    quantity: number;
    unit_price: number;
    total_price: number;
    products: {
      name: string;
      sku: string;
      dangerous: boolean;
      imdg_class?: string;
    };
  }>;
}

export default function OrderDetail() {
  const { id } = useParams();
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
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          clients (name),
          containers (number, type),
          order_products (
            quantity,
            unit_price,
            total_price,
            products (name, sku, dangerous, imdg_class)
          )
        `)
        .eq('id', id)
        .single();

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

  if (loading) {
    return <Layout title="Chargement..."><div>Chargement...</div></Layout>;
  }

  if (!order) {
    return <Layout title="Commande introuvable"><div>Commande introuvable</div></Layout>;
  }

  return (
    <Layout title={`Commande ${order.order_number}`}>
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
                <label className="text-sm text-muted-foreground">Statut</label>
                <div>{getStatusBadge(order.status)}</div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Date de commande</label>
                <p className="font-medium">{new Date(order.order_date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Type de paiement</label>
                <p className="font-medium">{order.payment_type}</p>
              </div>
              {order.total_price && (
                <div>
                  <label className="text-sm text-muted-foreground">Prix total</label>
                  <p className="font-medium">{order.total_price.toLocaleString()} €</p>
                </div>
              )}
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
              {order.current_transitaire && (
                <div>
                  <label className="text-sm text-muted-foreground">Transitaire</label>
                  <p className="font-medium">{order.current_transitaire}</p>
                </div>
              )}
              {order.is_received !== undefined && (
                <div>
                  <label className="text-sm text-muted-foreground">Statut de réception</label>
                  <p className="font-medium">
                    {order.is_received ? (
                      <span className="text-green-600">✓ Réceptionné</span>
                    ) : (
                      <span className="text-red-600">✗ Non réceptionné</span>
                    )}
                  </p>
                </div>
              )}
              {order.transitaire_entry_number && (
                <div>
                  <label className="text-sm text-muted-foreground">Numéro d'entrée transitaire</label>
                  <p className="font-medium">{order.transitaire_entry_number}</p>
                </div>
              )}
              {order.containers && (
                <div>
                  <label className="text-sm text-muted-foreground">Conteneur</label>
                  <p className="font-medium">{order.containers.number} ({order.containers.type})</p>
                </div>
              )}
              {order.weight && (
                <div>
                  <label className="text-sm text-muted-foreground">Poids</label>
                  <p className="font-medium">{order.weight} kg</p>
                </div>
              )}
              {order.volume && (
                <div>
                  <label className="text-sm text-muted-foreground">Volume</label>
                  <p className="font-medium">{order.volume} m³</p>
                </div>
              )}
              {order.cartons && (
                <div>
                  <label className="text-sm text-muted-foreground">Cartons</label>
                  <p className="font-medium">{order.cartons}</p>
                </div>
              )}
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
              {order.clients ? (
                <p className="font-medium">{order.clients.name}</p>
              ) : (
                <p className="text-muted-foreground">Aucun client assigné</p>
              )}
            </CardContent>
          </Card>
        </div>

        {order.order_products && order.order_products.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Produits commandés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_products.map((orderProduct, index) => (
                  <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{orderProduct.products.name}</h4>
                      <p className="text-sm text-muted-foreground">SKU: {orderProduct.products.sku}</p>
                      {orderProduct.products.dangerous && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="destructive">Dangereux</Badge>
                          {orderProduct.products.imdg_class && (
                            <Badge variant="outline">{orderProduct.products.imdg_class}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Qté: {orderProduct.quantity}</p>
                      <p className="text-sm text-muted-foreground">{orderProduct.unit_price}€ / unité</p>
                      <p className="font-bold">{orderProduct.total_price}€</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}