import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Container, Package, MapPin, Calendar, Eye, Edit } from "lucide-react";

export default function Containers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewContainerOpen, setIsNewContainerOpen] = useState(false);
  const [isEditContainerOpen, setIsEditContainerOpen] = useState(false);
  const [isViewContainerOpen, setIsViewContainerOpen] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<any>(null);
  const [containers] = useState([
    {
      id: "CONT-001",
      number: "MSKU1234567",
      type: "20ft Standard",
      status: "En cours d'utilisation",
      location: "Port de Marseille",
      capacity: "28m³",
      weight: "2.3t / 24t",
      lastUpdate: "2024-01-15 14:30",
      orders: ["CMD-001", "CMD-003"]
    },
    {
      id: "CONT-002",
      number: "TCLU9876543", 
      type: "40ft High Cube",
      status: "Disponible",
      location: "Entrepôt Paris",
      capacity: "76m³",
      weight: "0t / 30t",
      lastUpdate: "2024-01-14 09:15",
      orders: []
    },
    {
      id: "CONT-003",
      number: "GESU5555555",
      type: "20ft Réfrigéré",
      status: "En transit",
      location: "A7 - Lyon → Nice",
      capacity: "28m³",
      weight: "15.5t / 24t",
      lastUpdate: "2024-01-15 16:45",
      orders: ["CMD-002"]
    },
    {
      id: "CONT-004",
      number: "HMMU8888888",
      type: "40ft Standard",
      status: "Maintenance",
      location: "Atelier Bordeaux",
      capacity: "67m³",
      weight: "0t / 30t",
      lastUpdate: "2024-01-13 11:20",
      orders: []
    }
  ]);

  const getStatusBadge = (status: string) => {
    const styles = {
      "Disponible": "bg-green-100 text-green-800 hover:bg-green-100",
      "En cours d'utilisation": "bg-blue-100 text-blue-800 hover:bg-blue-100",
      "En transit": "bg-orange-100 text-orange-800 hover:bg-orange-100",
      "Maintenance": "bg-red-100 text-red-800 hover:bg-red-100"
    };
    return <Badge className={styles[status] || ""}>{status}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    if (type.includes("Réfrigéré")) return "❄️";
    if (type.includes("40ft")) return "📦📦";
    return "📦";
  };

  const filteredContainers = containers.filter(container =>
    container.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    container.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    container.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditContainer = (container: any) => {
    setSelectedContainer(container);
    setIsEditContainerOpen(true);
  };

  const handleViewContainer = (container: any) => {
    setSelectedContainer(container);
    setIsViewContainerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion des Conteneurs</h2>
          <p className="text-muted-foreground">Gérez votre flotte de conteneurs et leur utilisation</p>
        </div>
        
        <Dialog open={isNewContainerOpen} onOpenChange={setIsNewContainerOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Conteneur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter un Nouveau Conteneur</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Numéro de Conteneur</Label>
                  <Input id="number" placeholder="MSKU1234567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20ft-standard">20ft Standard</SelectItem>
                      <SelectItem value="40ft-standard">40ft Standard</SelectItem>
                      <SelectItem value="40ft-high-cube">40ft High Cube</SelectItem>
                      <SelectItem value="20ft-refrigere">20ft Réfrigéré</SelectItem>
                      <SelectItem value="40ft-refrigere">40ft Réfrigéré</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacité (m³)</Label>
                  <Input id="capacity" placeholder="28" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxWeight">Poids Max (t)</Label>
                  <Input id="maxWeight" placeholder="24" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Localisation Actuelle</Label>
                <Input id="location" placeholder="Port de Marseille" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status Initial</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponible">Disponible</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsNewContainerOpen(false)}>Annuler</Button>
                <Button onClick={() => setIsNewContainerOpen(false)}>Ajouter le Conteneur</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conteneurs</CardTitle>
            <Container className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">Dans la flotte</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">Prêts à utiliser</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Utilisation</CardTitle>
            <MapPin className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">20</div>
            <p className="text-xs text-muted-foreground">Actuellement utilisés</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">En réparation</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Liste des Conteneurs</CardTitle>
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
                <TableHead>ID</TableHead>
                <TableHead>Numéro</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Capacité</TableHead>
                <TableHead>Poids</TableHead>
                <TableHead>Commandes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContainers.map((container) => (
                <TableRow key={container.id}>
                  <TableCell className="font-medium">{container.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{getTypeIcon(container.type)}</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {container.number}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell>{container.type}</TableCell>
                  <TableCell>{getStatusBadge(container.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{container.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>{container.capacity}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {container.weight}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {container.orders.length > 0 ? (
                        container.orders.map(order => (
                          <Badge key={order} variant="outline" className="text-xs">
                            {order}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">Aucune</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewContainer(container)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditContainer(container)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
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