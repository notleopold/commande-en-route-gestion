
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Edit, Trash2, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkflowStepper } from "@/components/WorkflowStepper";
import { WorkflowActions } from "@/components/WorkflowActions";
import { usePermissions } from "@/hooks/usePermissions";

interface Order {
  id: string;
  order_number: string;
  supplier: string;
  client_id: string;
  order_date: string;
  status: string;
  total_ht: number;
  total_ttc: number;
  workflow?: {
    id: string;
    current_status: 'request' | 'approve' | 'procure' | 'receive';
  };
  clients?: {
    name: string;
  };
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          clients (name),
          order_workflows (
            id,
            current_status
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const ordersWithWorkflow = data?.map(order => ({
        ...order,
        workflow: order.order_workflows?.[0]
      })) || [];

      setOrders(ordersWithWorkflow);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      const { error } = await supabase.rpc('move_to_trash', {
        p_table_name: 'orders',
        p_item_id: id,
        p_reason: 'Suppression depuis la liste des commandes'
      });

      if (error) throw error;

      toast.success("Commande déplacée vers la corbeille");
      fetchOrders();
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getStatusBadge = (workflow?: Order['workflow']) => {
    if (!workflow) {
      return <Badge variant="outline">Sans workflow</Badge>;
    }

    switch (workflow.current_status) {
      case 'request':
        return <Badge variant="outline" className="text-orange-600 border-orange-300">Demande</Badge>;
      case 'approve':
        return <Badge variant="outline" className="text-blue-600 border-blue-300">À approuver</Badge>;
      case 'procure':
        return <Badge variant="outline" className="text-purple-600 border-purple-300">En commande</Badge>;
      case 'receive':
        return <Badge variant="outline" className="text-green-600 border-green-300">Reçu</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const filteredOrders = orders.filter((order) =>
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.clients?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Chargement des commandes...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Commandes</h1>
            <p className="text-muted-foreground">
              Gérez les commandes et suivez leur workflow de validation
            </p>
          </div>
          {hasPermission('orders', 'create') && (
            <Button onClick={() => navigate("/orders/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle commande
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des commandes</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher une commande..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Total HT</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">
                      {order.order_number}
                    </TableCell>
                    <TableCell>{order.clients?.name || "Client supprimé"}</TableCell>
                    <TableCell>{order.supplier}</TableCell>
                    <TableCell>
                      {format(new Date(order.order_date), "dd/MM/yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {getStatusBadge(order.workflow)}
                        {order.workflow && (
                          <WorkflowActions 
                            orderId={order.id}
                            currentStatus={order.workflow.current_status}
                            workflowId={order.workflow.id}
                            onStatusChange={fetchOrders}
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.total_ht ? `${order.total_ht.toFixed(2)} €` : "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Ouvrir le menu</span>
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v.01M12 12v.01M12 18v.01"
                              />
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {hasPermission('orders', 'read') && (
                            <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir
                            </DropdownMenuItem>
                          )}
                          {hasPermission('orders', 'update') && (
                            <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            Générer PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {hasPermission('orders', 'delete') && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteOrder(order.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredOrders.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? "Aucune commande trouvée." : "Aucune commande pour le moment."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Orders;
