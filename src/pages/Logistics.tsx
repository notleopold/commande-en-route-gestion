import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, MapPin, Calendar, Truck, Package } from "lucide-react";

export default function Logistics() {
  const [searchTerm, setSearchTerm] = useState("");
  const [logistics] = useState([
    {
      id: "LOG-001",
      orderId: "CMD-001",
      origin: "Entrepôt Paris",
      destination: "Lyon",
      status: "En transit",
      estimatedDelivery: "2024-01-20",
      actualDelivery: null,
      carrier: "Transport Express",
      trackingNumber: "TE123456789"
    },
    {
      id: "LOG-002", 
      orderId: "CMD-002",
      origin: "Entrepôt Marseille",
      destination: "Nice",
      status: "Livré",
      estimatedDelivery: "2024-01-18",
      actualDelivery: "2024-01-17",
      carrier: "Logistic Pro",
      trackingNumber: "LP987654321"
    },
    {
      id: "LOG-003",
      orderId: "CMD-003",
      origin: "Entrepôt Lille",
      destination: "Strasbourg", 
      status: "En retard",
      estimatedDelivery: "2024-01-16",
      actualDelivery: null,
      carrier: "Quick Delivery",
      trackingNumber: "QD456789123"
    },
    {
      id: "LOG-004",
      orderId: "CMD-004",
      origin: "Entrepôt Bordeaux",
      destination: "Toulouse",
      status: "En préparation",
      estimatedDelivery: "2024-01-22",
      actualDelivery: null,
      carrier: "Fast Track",
      trackingNumber: "FT789123456"
    }
  ]);

  const getStatusBadge = (status: string) => {
    const styles = {
      "En transit": "bg-blue-100 text-blue-800 hover:bg-blue-100",
      "Livré": "bg-green-100 text-green-800 hover:bg-green-100",
      "En retard": "bg-red-100 text-red-800 hover:bg-red-100",
      "En préparation": "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
    };
    return <Badge className={styles[status] || ""}>{status}</Badge>;
  };

  const filteredLogistics = logistics.filter(item =>
    item.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.carrier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion Logistique</h2>
          <p className="text-muted-foreground">Suivez toutes vos expéditions et livraisons</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Suivi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un Nouveau Suivi Logistique</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderId">Commande</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une commande" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cmd-001">CMD-001</SelectItem>
                      <SelectItem value="cmd-002">CMD-002</SelectItem>
                      <SelectItem value="cmd-003">CMD-003</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carrier">Transporteur</Label>
                  <Input id="carrier" placeholder="Nom du transporteur" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">Origine</Label>
                  <Input id="origin" placeholder="Lieu d'origine" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input id="destination" placeholder="Lieu de destination" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tracking">N° de Suivi</Label>
                  <Input id="tracking" placeholder="Numéro de suivi" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated">Livraison Prévue</Label>
                  <Input id="estimated" type="date" />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline">Annuler</Button>
                <Button>Créer le Suivi</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Transit</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Expéditions actives</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livrées</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Retard</CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Nécessitent attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
            <MapPin className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2j</div>
            <p className="text-xs text-muted-foreground">Délai de livraison</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Suivi des Expéditions</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Logistique</TableHead>
                <TableHead>Commande</TableHead>
                <TableHead>Origine → Destination</TableHead>
                <TableHead>Transporteur</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Livraison Prévue</TableHead>
                <TableHead>N° Suivi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogistics.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.orderId}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{item.origin}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-sm">{item.destination}</span>
                    </div>
                  </TableCell>
                  <TableCell>{item.carrier}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {item.estimatedDelivery}
                      {item.actualDelivery && (
                        <div className="text-xs text-green-600">
                          Livré: {item.actualDelivery}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {item.trackingNumber}
                    </code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}