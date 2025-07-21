import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Truck, Container, TrendingUp, AlertCircle, CheckCircle, Users, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    orders: { total: 0, active: 0, completed: 0, pending: 0 },
    products: { total: 0, active: 0 },
    clients: { total: 0, active: 0 },
    suppliers: { total: 0, active: 0 },
    containers: { total: 0, available: 0, inTransit: 0 },
    groupages: { total: 0, available: 0 }
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentContainers, setRecentContainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        ordersRes,
        productsRes,
        clientsRes,
        suppliersRes,
        containersRes,
        groupagesRes
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact' }),
        supabase.from('products').select('*', { count: 'exact' }),
        supabase.from('clients').select('*', { count: 'exact' }),
        supabase.from('suppliers').select('*', { count: 'exact' }),
        supabase.from('containers').select('*', { count: 'exact' }),
        supabase.from('groupages').select('*', { count: 'exact' })
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (productsRes.error) throw productsRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (suppliersRes.error) throw suppliersRes.error;
      if (containersRes.error) throw containersRes.error;
      if (groupagesRes.error) throw groupagesRes.error;

      // Calculer les statistiques
      const orders = ordersRes.data || [];
      const products = productsRes.data || [];
      const clients = clientsRes.data || [];
      const suppliers = suppliersRes.data || [];
      const containers = containersRes.data || [];
      const groupages = groupagesRes.data || [];

      setStats({
        orders: {
          total: orders.length,
          active: orders.filter(o => ['Demande client reçue', 'En cours', 'Confirmé'].includes(o.order_status)).length,
          completed: orders.filter(o => o.order_status === 'Livré').length,
          pending: orders.filter(o => o.order_status === 'Demande client reçue').length
        },
        products: {
          total: products.length,
          active: products.filter(p => p.status === 'active').length
        },
        clients: {
          total: clients.length,
          active: clients.filter(c => c.status === 'Active').length
        },
        suppliers: {
          total: suppliers.length,
          active: suppliers.filter(s => s.status === 'active').length
        },
        containers: {
          total: containers.length,
          available: containers.filter(c => c.status === 'planning').length,
          inTransit: containers.filter(c => ['loading', 'transit'].includes(c.status)).length
        },
        groupages: {
          total: groupages.length,
          available: groupages.filter(g => g.status === 'available').length
        }
      });

      // Récupérer les commandes récentes avec les détails
      const { data: recentOrdersData } = await supabase
        .from('orders')
        .select(`
          *,
          client:clients(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentOrders(recentOrdersData || []);

      // Récupérer les conteneurs récents
      const { data: recentContainersData } = await supabase
        .from('containers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentContainers(recentContainersData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error("Erreur lors du chargement des données du dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "Livré":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Livré</Badge>;
      case "En retard":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><AlertCircle className="w-3 h-3 mr-1" />En retard</Badge>;
      case "En cours":
      case "Confirmé":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">En cours</Badge>;
      case "Demande client reçue":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">En attente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getContainerStatusBadge = (status: string) => {
    switch (status) {
      case "planning":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Planification</Badge>;
      case "loading":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Chargement</Badge>;
      case "transit":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">En transit</Badge>;
      case "arrived":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Arrivé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Vue d'ensemble de vos opérations de procurement</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders.total}</div>
            <p className="text-xs text-muted-foreground">{stats.orders.active} actives</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.products.total}</div>
            <p className="text-xs text-muted-foreground">{stats.products.active} actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conteneurs</CardTitle>
            <Container className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.containers.total}</div>
            <p className="text-xs text-muted-foreground">{stats.containers.available} disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients.total}</div>
            <p className="text-xs text-muted-foreground">{stats.clients.active} actifs</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Commandes Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.slice(0, 4).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                     onClick={() => navigate(`/orders/${order.id}`)}>
                  <div className="space-y-1">
                    <p className="font-medium">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">{order.client?.name || 'Client non défini'}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="text-right space-y-1">
                    {getOrderStatusBadge(order.order_status)}
                    {order.total_ttc && (
                      <p className="text-sm font-medium">€{order.total_ttc.toLocaleString('fr-FR')}</p>
                    )}
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/orders')}>
                Voir toutes les commandes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conteneurs Récents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentContainers.map((container) => (
                <div key={container.id} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate('/reservations')}>
                  <div className="space-y-1">
                    <p className="font-medium">{container.number}</p>
                    <p className="text-sm text-muted-foreground">{container.type}</p>
                    <p className="text-xs text-muted-foreground">{container.transitaire}</p>
                  </div>
                  <div className="text-right space-y-1">
                    {getContainerStatusBadge(container.status)}
                    {container.eta && (
                      <p className="text-xs text-muted-foreground">ETA: {new Date(container.eta).toLocaleDateString('fr-FR')}</p>
                    )}
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/reservations')}>
                Voir tous les conteneurs
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/orders')}>
              <Package className="mr-2 h-4 w-4" />
              Nouvelle Commande
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/reservations')}>
              <Truck className="mr-2 h-4 w-4" />
              Transport Maritime
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/products')}>
              <Container className="mr-2 h-4 w-4" />
              Gestion Produits
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/reports')}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Rapports
            </Button>
            <div className="pt-4 border-t">
              <h4 className="font-medium text-sm mb-2">Statistiques Rapides</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700">Commandes en attente</span>
                  <span className="font-medium text-blue-800">{stats.orders.pending}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                  <span className="text-sm text-green-700">Groupages disponibles</span>
                  <span className="font-medium text-green-800">{stats.groupages.available}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}