import React, { useState, useEffect } from 'react';
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Plus, Edit, Eye, Trash2, Search, Ship, Package, Users, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { LoadingPlan } from "@/components/LoadingPlan";
import { EditReservationForm } from "@/components/EditReservationForm";

// Types unifiés pour les réservations
interface Reservation {
  id: string;
  container_number: string;
  type: '20_feet' | '40_feet' | 'groupage';
  transitaire: string;
  max_pallets: number;
  max_weight: number;
  max_volume: number;
  etd?: string;
  eta?: string;
  departure_port?: string;
  arrival_port?: string;
  port_cutoff?: string;
  dangerous_goods_accepted: boolean;
  available_pallets: number;
  available_weight: number;
  available_volume: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: string;
  order_number: string;
  supplier: string;
  current_transitaire?: string;
  weight?: number;
  volume?: number;
  cartons?: number;
  total_ttc?: number;
  is_received: boolean;
  order_products?: any[];
  container_id?: string;
}

const RESERVATION_TYPES = [
  { value: '20_feet', label: '20 Pieds' },
  { value: '40_feet', label: '40 Pieds' },
  { value: 'groupage', label: 'Groupage' }
] as const;

const RESERVATION_STATUSES = [
  "available",
  "planning", 
  "loading",
  "full",
  "departed",
  "in_transit",
  "arrived",
  "completed"
] as const;

const TYPE_CONFIGS = {
  '20_feet': { pallets: 11, weight: 21000, volume: 33 },
  '40_feet': { pallets: 25, weight: 27000, volume: 67 },
  'groupage': { pallets: 33, weight: 28000, volume: 76 }
};

export default function Reservations() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [transitaireFilter, setTransitaireFilter] = useState<string>("all");
  
  // State pour les réservations
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transitaires, setTransitaires] = useState<{name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isCreateReservationOpen, setIsCreateReservationOpen] = useState(false);
  const [isEditReservationOpen, setIsEditReservationOpen] = useState(false);
  const [isViewReservationOpen, setIsViewReservationOpen] = useState(false);
  const [isBookOrderOpen, setIsBookOrderOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLoadingPlanOpen, setIsLoadingPlanOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<Reservation | null>(null);

  // Forms
  const createReservationForm = useForm({
    defaultValues: {
      container_number: "",
      type: "40_feet",
      transitaire: "",
      max_pallets: "33",
      max_weight: "28000",
      max_volume: "76",
      etd: "",
      eta: "",
      departure_port: "",
      arrival_port: "",
      port_cutoff: "",
      dangerous_goods_accepted: false,
      notes: ""
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchReservations(),
        fetchOrders(), 
        fetchTransitaires()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      // Pour l'instant, on récupère depuis containers et groupages existants
      const { data: containers, error: containersError } = await supabase
        .from('containers')
        .select('*')
        .order('created_at', { ascending: false });

      if (containersError) throw containersError;

      const { data: groupages, error: groupagesError } = await supabase
        .from('groupages')
        .select(`
          *,
          containers!inner(*)
        `)
        .order('created_at', { ascending: false });

      if (groupagesError) throw groupagesError;

      // Transformer en format unifié
      const containerReservations: Reservation[] = containers?.map(container => ({
        id: container.id,
        container_number: container.number,
        type: container.type === '20_feet' ? '20_feet' : '40_feet',
        transitaire: container.transitaire,
        max_pallets: container.max_pallets || 33,
        max_weight: container.max_weight || 28000,
        max_volume: container.max_volume || 76,
        etd: container.etd,
        eta: container.eta,
        departure_port: container.departure_port,
        arrival_port: container.arrival_port,
        port_cutoff: container.port_cutoff,
        dangerous_goods_accepted: container.dangerous_goods || false,
        available_pallets: container.max_pallets || 33,
        available_weight: container.max_weight || 28000,
        available_volume: container.max_volume || 76,
        status: container.status || 'available',
        notes: '',
        created_at: container.created_at,
        updated_at: container.updated_at
      })) || [];

      const groupageReservations: Reservation[] = groupages?.map(groupage => ({
        id: groupage.id,
        container_number: groupage.containers?.number || 'N/A',
        type: 'groupage' as const,
        transitaire: groupage.transitaire,
        max_pallets: groupage.max_space_pallets,
        max_weight: groupage.max_weight,
        max_volume: groupage.max_volume,
        etd: groupage.departure_date,
        eta: groupage.arrival_date,
        departure_port: '',
        arrival_port: '',
        port_cutoff: '',
        dangerous_goods_accepted: groupage.allows_dangerous_goods,
        available_pallets: groupage.available_space_pallets,
        available_weight: groupage.available_weight,
        available_volume: groupage.available_volume,
        status: groupage.status,
        notes: groupage.notes,
        created_at: groupage.created_at,
        updated_at: groupage.updated_at
      })) || [];

      setReservations([...containerReservations, ...groupageReservations]);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast({ title: "Erreur", description: "Erreur lors du chargement des réservations", variant: "destructive" });
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchTransitaires = async () => {
    try {
      const { data, error } = await supabase
        .from('transitaires')
        .select('name')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setTransitaires(data || []);
    } catch (error) {
      console.error('Error fetching transitaires:', error);
    }
  };

  const handleCreateReservation = async (data: any) => {
    try {
      const maxPallets = parseInt(data.max_pallets);
      const maxWeight = parseFloat(data.max_weight);
      const maxVolume = parseFloat(data.max_volume);

      if (data.type === 'groupage') {
        // Créer le conteneur d'abord
        const { data: containerData, error: containerError } = await supabase
          .from('containers')
          .insert([{
            number: data.container_number,
            type: 'groupage',
            transitaire: data.transitaire,
            status: 'planning',
            etd: data.etd || null,
            eta: data.eta || null,
            max_pallets: maxPallets,
            max_weight: maxWeight,
            max_volume: maxVolume,
            dangerous_goods: data.dangerous_goods_accepted
          }])
          .select()
          .single();

        if (containerError) throw containerError;

        // Puis créer le groupage
        const { error: groupageError } = await supabase
          .from('groupages')
          .insert([{
            container_id: containerData.id,
            transitaire: data.transitaire,
            max_space_pallets: maxPallets,
            available_space_pallets: maxPallets,
            max_weight: maxWeight,
            available_weight: maxWeight,
            max_volume: maxVolume,
            available_volume: maxVolume,
            allows_dangerous_goods: data.dangerous_goods_accepted,
            cost_per_palette: 0,
            departure_date: data.etd || null,
            arrival_date: data.eta || null,
            notes: data.notes,
            status: 'available'
          }]);

        if (groupageError) throw groupageError;
      } else {
        // Créer un conteneur classique
        const { error } = await supabase
          .from('containers')
          .insert([{
            number: data.container_number,
            type: data.type,
            transitaire: data.transitaire,
            status: 'planning',
            etd: data.etd || null,
            eta: data.eta || null,
            departure_port: data.departure_port || null,
            arrival_port: data.arrival_port || null,
            port_cutoff: data.port_cutoff || null,
            max_pallets: maxPallets,
            max_weight: maxWeight,
            max_volume: maxVolume,
            dangerous_goods: data.dangerous_goods_accepted
          }]);

        if (error) throw error;
      }

      toast({ title: "Succès", description: "Réservation créée avec succès" });
      setIsCreateReservationOpen(false);
      createReservationForm.reset();
      fetchData();
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast({ title: "Erreur", description: "Erreur lors de la création", variant: "destructive" });
    }
  };

  const handleTypeChange = (type: string) => {
    const config = TYPE_CONFIGS[type as keyof typeof TYPE_CONFIGS];
    if (config) {
      createReservationForm.setValue('max_pallets', config.pallets.toString());
      createReservationForm.setValue('max_weight', config.weight.toString());
      createReservationForm.setValue('max_volume', config.volume.toString());
    }
  };

  const getTypeLabel = (type: string) => {
    return RESERVATION_TYPES.find(t => t.value === type)?.label || type;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      "available": "bg-green-100 text-green-800 hover:bg-green-100",
      "planning": "bg-blue-100 text-blue-800 hover:bg-blue-100",
      "loading": "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      "full": "bg-orange-100 text-orange-800 hover:bg-orange-100",
      "departed": "bg-purple-100 text-purple-800 hover:bg-purple-100",
      "in_transit": "bg-indigo-100 text-indigo-800 hover:bg-indigo-100",
      "arrived": "bg-green-100 text-green-800 hover:bg-green-100",
      "completed": "bg-gray-100 text-gray-800 hover:bg-gray-100"
    };
    return <Badge className={styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
  };

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = reservation.container_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reservation.transitaire.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter;
    const matchesType = typeFilter === "all" || reservation.type === typeFilter;
    const matchesTransitaire = transitaireFilter === "all" || reservation.transitaire === transitaireFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesTransitaire;
  });

  const handleLoadingPlan = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsLoadingPlanOpen(true);
  };

  const handleUpdateReservation = async (data: any) => {
    if (!selectedReservation) return;

    try {
      if (selectedReservation.type === 'groupage') {
        // Mettre à jour le groupage
        const { error: groupageError } = await supabase
          .from('groupages')
          .update({
            transitaire: data.transitaire,
            max_space_pallets: data.max_pallets,
            available_space_pallets: data.max_pallets, // Reset available pallets
            max_weight: data.max_weight,
            available_weight: data.max_weight, // Reset available weight
            max_volume: data.max_volume,
            available_volume: data.max_volume, // Reset available volume
            allows_dangerous_goods: data.dangerous_goods_accepted,
            departure_date: data.etd || null,
            arrival_date: data.eta || null,
            notes: data.notes,
            status: data.status
          })
          .eq('id', selectedReservation.id);

        if (groupageError) throw groupageError;

        // Mettre à jour le conteneur associé si nécessaire
        const { data: groupageData } = await supabase
          .from('groupages')
          .select('container_id')
          .eq('id', selectedReservation.id)
          .single();

        if (groupageData?.container_id) {
          const { error: containerError } = await supabase
            .from('containers')
            .update({
              number: data.container_number,
              transitaire: data.transitaire,
              max_pallets: data.max_pallets,
              max_weight: data.max_weight,
              max_volume: data.max_volume,
              dangerous_goods: data.dangerous_goods_accepted,
              etd: data.etd || null,
              eta: data.eta || null,
              status: data.status
            })
            .eq('id', groupageData.container_id);

          if (containerError) throw containerError;
        }
      } else {
        // Mettre à jour le conteneur classique
        const { error } = await supabase
          .from('containers')
          .update({
            number: data.container_number,
            type: data.type,
            transitaire: data.transitaire,
            max_pallets: data.max_pallets,
            max_weight: data.max_weight,
            max_volume: data.max_volume,
            etd: data.etd || null,
            eta: data.eta || null,
            departure_port: data.departure_port || null,
            arrival_port: data.arrival_port || null,
            port_cutoff: data.port_cutoff || null,
            dangerous_goods: data.dangerous_goods_accepted,
            status: data.status
          })
          .eq('id', selectedReservation.id);

        if (error) throw error;
      }

      toast({ title: "Succès", description: "Réservation mise à jour avec succès" });
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating reservation:', error);
      toast({ title: "Erreur", description: "Erreur lors de la mise à jour", variant: "destructive" });
    }
  };


  const handleDeleteReservation = async () => {
    if (!reservationToDelete) return;

    try {
      if (reservationToDelete.type === 'groupage') {
        // Supprimer le groupage d'abord
        const { error: groupageError } = await supabase
          .from('groupages')
          .delete()
          .eq('id', reservationToDelete.id);

        if (groupageError) throw groupageError;

        // Puis supprimer le conteneur associé
        const { data: groupages } = await supabase
          .from('groupages')
          .select('container_id')
          .eq('id', reservationToDelete.id)
          .single();

        if (groupages?.container_id) {
          const { error: containerError } = await supabase
            .from('containers')
            .delete()
            .eq('id', groupages.container_id);

          if (containerError) throw containerError;
        }
      } else {
        // Supprimer le conteneur classique
        const { error } = await supabase
          .from('containers')
          .delete()
          .eq('id', reservationToDelete.id);

        if (error) throw error;
      }

      toast({ title: "Succès", description: "Réservation supprimée avec succès" });
      setDeleteDialogOpen(false);
      setReservationToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast({ title: "Erreur", description: "Erreur lors de la suppression", variant: "destructive" });
    }
  };

  return (
    <Layout title="Réservations de Transport">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Réservations de Transport</h1>
          <Button onClick={() => setIsCreateReservationOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Réservation
          </Button>
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  {RESERVATION_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  {RESERVATION_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={transitaireFilter} onValueChange={setTransitaireFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Transitaire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous transitaires</SelectItem>
                  {transitaires.map(t => (
                    <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="text-sm text-muted-foreground flex items-center">
                {filteredReservations.length} réservation(s)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table des réservations */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Conteneur</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Transitaire</TableHead>
                  <TableHead>Capacités</TableHead>
                  <TableHead>Disponible</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredReservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucune réservation trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReservations.map((reservation) => {
                    const usedPallets = reservation.max_pallets - reservation.available_pallets;
                    const usagePercentage = reservation.max_pallets > 0 ? (usedPallets / reservation.max_pallets) * 100 : 0;

                    return (
                      <TableRow key={reservation.id}>
                        <TableCell>
                          <div className="font-medium">{reservation.container_number}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getTypeLabel(reservation.type)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{reservation.transitaire}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{reservation.max_pallets} pal</div>
                            <div className="text-muted-foreground">
                              {(reservation.max_weight/1000).toFixed(1)}T • {reservation.max_volume}m³
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <span>{reservation.available_pallets}/{reservation.max_pallets}</span>
                              <Progress value={100 - usagePercentage} className="w-20 h-2" />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(reservation.available_weight/1000).toFixed(1)}T • {reservation.available_volume.toFixed(1)}m³
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>ETD: {reservation.etd ? new Date(reservation.etd).toLocaleDateString() : "TBD"}</div>
                            <div className="text-muted-foreground">
                              ETA: {reservation.eta ? new Date(reservation.eta).toLocaleDateString() : "TBD"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 setSelectedReservation(reservation);
                                 setIsViewReservationOpen(true);
                               }}
                               title="Voir et modifier la réservation"
                             >
                               <Eye className="h-4 w-4" />
                             </Button>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleLoadingPlan(reservation)}
                               title="Plan de chargement"
                             >
                               <Package className="h-4 w-4" />
                             </Button>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 setReservationToDelete(reservation);
                                 setDeleteDialogOpen(true);
                               }}
                               title="Supprimer la réservation"
                               className="text-red-600 hover:text-red-700 hover:bg-red-50"
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog de création */}
        <Dialog open={isCreateReservationOpen} onOpenChange={setIsCreateReservationOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nouvelle Réservation</DialogTitle>
            </DialogHeader>

            <form onSubmit={createReservationForm.handleSubmit(handleCreateReservation)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="container_number">Numéro de conteneur</Label>
                  <Input
                    id="container_number"
                    placeholder="ex: CONT-001"
                    {...createReservationForm.register('container_number', { required: true })}
                  />
                </div>

                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select 
                    value={createReservationForm.watch('type')} 
                    onValueChange={(value) => {
                      createReservationForm.setValue('type', value as any);
                      handleTypeChange(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESERVATION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="transitaire">Transitaire</Label>
                <Select 
                  value={createReservationForm.watch('transitaire')} 
                  onValueChange={(value) => createReservationForm.setValue('transitaire', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un transitaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {transitaires.map(t => (
                      <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="max_pallets">Palettes max</Label>
                  <Input
                    id="max_pallets"
                    type="number"
                    {...createReservationForm.register('max_pallets', { required: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="max_weight">Poids max (kg)</Label>
                  <Input
                    id="max_weight"
                    type="number"
                    {...createReservationForm.register('max_weight', { required: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="max_volume">Volume max (m³)</Label>
                  <Input
                    id="max_volume"
                    type="number"
                    step="0.1"
                    {...createReservationForm.register('max_volume', { required: true })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="etd">Date de départ (ETD)</Label>
                  <Input
                    id="etd"
                    type="date"
                    {...createReservationForm.register('etd')}
                  />
                </div>
                <div>
                  <Label htmlFor="eta">Date d'arrivée (ETA)</Label>
                  <Input
                    id="eta"
                    type="date"
                    {...createReservationForm.register('eta')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="departure_port">Port de départ</Label>
                  <Input
                    id="departure_port"
                    placeholder="Ex: Le Havre, Terminal De France"
                    {...createReservationForm.register('departure_port')}
                  />
                </div>
                <div>
                  <Label htmlFor="arrival_port">Port d'arrivée</Label>
                  <Input
                    id="arrival_port"
                    placeholder="Ex: Dakar, DP World Terminal"
                    {...createReservationForm.register('arrival_port')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="port_cutoff">Cut-off portuaire</Label>
                <Input
                  id="port_cutoff"
                  type="datetime-local"
                  {...createReservationForm.register('port_cutoff')}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Date et heure limite à laquelle les marchandises doivent être déposées au port
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dangerous_goods_accepted"
                  checked={createReservationForm.watch('dangerous_goods_accepted')}
                  onCheckedChange={(checked) => createReservationForm.setValue('dangerous_goods_accepted', !!checked)}
                />
                <Label htmlFor="dangerous_goods_accepted" className="text-sm">
                  Ce conteneur peut-il transporter des marchandises dangereuses ?
                </Label>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Remarques particulières..."
                  {...createReservationForm.register('notes')}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateReservationOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Créer la réservation</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <LoadingPlan
          isOpen={isLoadingPlanOpen}
          onClose={() => setIsLoadingPlanOpen(false)}
          container={selectedReservation?.type !== 'groupage' ? {
            id: selectedReservation?.id || '',
            number: selectedReservation?.container_number || '',
            type: selectedReservation?.type || '',
            transitaire: selectedReservation?.transitaire || '',
            max_weight: selectedReservation?.max_weight || 0,
            max_volume: selectedReservation?.max_volume || 0,
            max_pallets: selectedReservation?.max_pallets || 0,
            dangerous_goods: selectedReservation?.dangerous_goods_accepted || false
          } : undefined}
          groupage={selectedReservation?.type === 'groupage' ? {
            id: selectedReservation?.id || '',
            transitaire: selectedReservation?.transitaire || '',
            max_space_pallets: selectedReservation?.max_pallets || 0,
            available_space_pallets: selectedReservation?.available_pallets || 0,
            max_weight: selectedReservation?.max_weight || 0,
            available_weight: selectedReservation?.available_weight || 0,
            max_volume: selectedReservation?.max_volume || 0,
            available_volume: selectedReservation?.available_volume || 0,
            allows_dangerous_goods: selectedReservation?.dangerous_goods_accepted || false,
            status: selectedReservation?.status || '',
            container_id: selectedReservation?.id || ''
          } : undefined}
          type={selectedReservation?.type === 'groupage' ? 'groupage' : 'container'}
        />

        {/* Dialog de vue/modification de réservation */}
        <Dialog open={isViewReservationOpen} onOpenChange={setIsViewReservationOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier la réservation - {selectedReservation?.container_number}</DialogTitle>
            </DialogHeader>

            {selectedReservation && (
              <EditReservationForm
                reservation={selectedReservation}
                transitaires={transitaires}
                onSave={async (data) => {
                  await handleUpdateReservation(data);
                  setIsViewReservationOpen(false);
                }}
                onCancel={() => setIsViewReservationOpen(false)}
                onOpenLoadingPlan={() => {
                  setIsViewReservationOpen(false);
                  handleLoadingPlan(selectedReservation);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation de suppression */}
        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteReservation}
          title="Supprimer la réservation"
          description={`Êtes-vous sûr de vouloir supprimer la réservation ${reservationToDelete?.container_number} ? Cette action est irréversible.`}
          confirmText="Supprimer"
          cancelText="Annuler"
        />
      </div>
    </Layout>
  );
}