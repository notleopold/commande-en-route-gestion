import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Truck, Container, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

export function Dashboard() {
  const stats = [
    {
      title: "Commandes Actives",
      value: "24",
      icon: Package,
      trend: "+12% ce mois",
      color: "text-blue-600"
    },
    {
      title: "En Transit",
      value: "8",
      icon: Truck,
      trend: "3 en retard",
      color: "text-orange-600"
    },
    {
      title: "Conteneurs",
      value: "156",
      icon: Container,
      trend: "12 disponibles",
      color: "text-green-600"
    },
    {
      title: "Livraisons",
      value: "89%",
      icon: TrendingUp,
      trend: "À temps",
      color: "text-purple-600"
    }
  ];

  const recentOrders = [
    { id: "CMD-001", client: "Entreprise A", status: "En cours", amount: "€12,500", date: "2024-01-15" },
    { id: "CMD-002", client: "Entreprise B", status: "Livré", amount: "€8,750", date: "2024-01-14" },
    { id: "CMD-003", client: "Entreprise C", status: "En retard", amount: "€15,200", date: "2024-01-12" },
    { id: "CMD-004", client: "Entreprise D", status: "En préparation", amount: "€6,800", date: "2024-01-16" },
    { id: "CMD-005", client: "Entreprise E", status: "Validé", amount: "€22,300", date: "2024-01-17" },
  ];

  const recentLogistics = [
    { id: "LOG-001", orderId: "CMD-001", status: "En transit", destination: "Lyon", eta: "2024-01-20" },
    { id: "LOG-002", orderId: "CMD-002", status: "Livré", destination: "Nice", eta: "Livré le 17/01" },
    { id: "LOG-003", orderId: "CMD-003", status: "En retard", destination: "Strasbourg", eta: "Retard 2 jours" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Livré":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Livré</Badge>;
      case "En retard":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><AlertCircle className="w-3 h-3 mr-1" />En retard</Badge>;
      case "En cours":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">En cours</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Vue d'ensemble de vos opérations de procurement</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Commandes Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.slice(0, 4).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{order.id}</p>
                    <p className="text-sm text-muted-foreground">{order.client}</p>
                    <p className="text-xs text-muted-foreground">{order.date}</p>
                  </div>
                  <div className="text-right space-y-1">
                    {getStatusBadge(order.status)}
                    <p className="text-sm font-medium">{order.amount}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4">
                Voir toutes les commandes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suivi Logistique</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLogistics.map((logistic) => (
                <div key={logistic.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{logistic.id}</p>
                    <p className="text-sm text-muted-foreground">Commande: {logistic.orderId}</p>
                    <p className="text-xs text-muted-foreground">→ {logistic.destination}</p>
                  </div>
                  <div className="text-right space-y-1">
                    {getStatusBadge(logistic.status)}
                    <p className="text-xs text-muted-foreground">{logistic.eta}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4">
                Voir toute la logistique
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Package className="mr-2 h-4 w-4" />
              Nouvelle Commande
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Truck className="mr-2 h-4 w-4" />
              Suivi Logistique
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Container className="mr-2 h-4 w-4" />
              Gestion Conteneurs
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <TrendingUp className="mr-2 h-4 w-4" />
              Rapports
            </Button>
            <div className="pt-4 border-t">
              <h4 className="font-medium text-sm mb-2">Alertes</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700">3 commandes en retard</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700">5 conteneurs en maintenance</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}