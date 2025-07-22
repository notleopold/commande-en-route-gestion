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

// Types pour les réservations
interface Reservation {
  id: string;
  reservation_number?: string;
  type: '20_feet' | '40_feet' | 'groupage';
  transitaire: string;
  status: string;
  max_pallets: number;
  max_weight: number;
  max_volume: number;
  available_pallets: number;
  available_weight: number;
  available_volume: number;
  etd?: string;
  eta?: string;
  departure_port?: string;
  arrival_port?: string;
  port_cutoff?: string;
  dangerous_goods_accepted?: boolean;
  cost_per_palette?: number;
  cost_per_kg?: number;
  cost_per_m3?: number;
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
  reservation_id?: string;
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoadingPlanOpen, setIsLoadingPlanOpen] = useState(false);

  // Form
  const form = useForm({
    defaultValues: {
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
      dangerous_goods: false,
      cost_per_palette: "0",
      cost_per_kg: "0",
      cost_per_m3: "0",
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
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReservations((data || []).map(item => ({
        ...item,
        type: item.type as '20_feet' | '40_feet' | 'groupage',
        dangerous_goods_accepted: item.dangerous_goods_accepted || false
      })));
    } catch (error) {
      console.error('Erreur lors de la récupération des réservations:', error);
      toast({ 
        title: "Erreur", 
        description: "Erreur lors de la récupération des réservations", 
        variant: "destructive" 
      });
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

  const generateReservationNumber = async (type: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-number', {
        body: { entityType: 'reservation' }
      });

      if (error) throw error;
      return data.number;
    } catch (error) {
      console.error('Error generating reservation number:', error);
      toast({ 
        title: "Erreur", 
        description: "Erreur lors de la génération du numéro", 
        variant: "destructive" 
      });
      return null;
    }
  };

  const handleCreateReservation = async (data: any) => {
    try {
      setLoading(true);
      
      // Générer un numéro de réservation
      const reservationNumber = await generateReservationNumber(data.type);
      
      const { error } = await supabase
        .from('reservations')
        .insert({
          reservation_number: reservationNumber,
          type: data.type,
          transitaire: data.transitaire,
          status: data.type === 'groupage' ? 'available' : 'planning',
          max_pallets: data.max_pallets || TYPE_CONFIGS[data.type as keyof typeof TYPE_CONFIGS]?.pallets || 33,
          max_weight: data.max_weight || TYPE_CONFIGS[data.type as keyof typeof TYPE_CONFIGS]?.weight || 28000,
          max_volume: data.max_volume || TYPE_CONFIGS[data.type as keyof typeof TYPE_CONFIGS]?.volume || 76,
          available_pallets: data.type === 'groupage' ? (data.max_pallets || TYPE_CONFIGS.groupage.pallets) : 0,
          available_weight: data.type === 'groupage' ? (data.max_weight || TYPE_CONFIGS.groupage.weight) : 0,
          available_volume: data.type === 'groupage' ? (data.max_volume || TYPE_CONFIGS.groupage.volume) : 0,
          etd: data.etd,
          eta: data.eta,
          departure_port: data.departure_port,
          arrival_port: data.arrival_port,
          port_cutoff: data.port_cutoff,
          dangerous_goods_accepted: data.dangerous_goods || false,
          cost_per_palette: data.type === 'groupage' ? (data.cost_per_palette || 0) : 0,
          cost_per_kg: data.type === 'groupage' ? (data.cost_per_kg || 0) : 0,
          cost_per_m3: data.type === 'groupage' ? (data.cost_per_m3 || 0) : 0,
          notes: data.notes
        });

      if (error) throw error;

      toast({ 
        title: "Succès", 
        description: "Réservation créée avec succès" 
      });
      setIsCreateDialogOpen(false);
      form.reset();
      await fetchData();
    } catch (error) {
      console.error('Erreur lors de la création de la réservation:', error);
      toast({ 
        title: "Erreur", 
        description: "Erreur lors de la création de la réservation", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: string) => {
    const config = TYPE_CONFIGS[type as keyof typeof TYPE_CONFIGS];
    if (config) {
      form.setValue('max_pallets', config.pallets.toString());
      form.setValue('max_weight', config.weight.toString());
      form.setValue('max_volume', config.volume.toString());
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
    const matchesSearch = (reservation.reservation_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      setLoading(true);
      
      const { error } = await supabase
        .from('reservations')
        .update({
          transitaire: data.transitaire,
          status: data.status,
          max_pallets: data.max_pallets,
          max_weight: data.max_weight,
          max_volume: data.max_volume,
          etd: data.etd,
          eta: data.eta,
          departure_port: data.departure_port,
          arrival_port: data.arrival_port,
          port_cutoff: data.port_cutoff,
          dangerous_goods_accepted: data.dangerous_goods,
          cost_per_palette: data.cost_per_palette || 0,
          cost_per_kg: data.cost_per_kg || 0,
          cost_per_m3: data.cost_per_m3 || 0,
          notes: data.notes
        })
        .eq('id', selectedReservation.id);

      if (error) throw error;

      toast({ 
        title: "Succès", 
        description: "Réservation mise à jour avec succès" 
      });
      setIsEditDialogOpen(false);
      setSelectedReservation(null);
      await fetchData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la réservation:', error);
      toast({ 
        title: "Erreur", 
        description: "Erreur lors de la mise à jour de la réservation", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReservation = async () => {
    if (!selectedReservation) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', selectedReservation.id);

      if (error) throw error;

      toast({ 
        title: "Succès", 
        description: "Réservation supprimée avec succès" 
      });
      setIsDeleteDialogOpen(false);
      setSelectedReservation(null);
      await fetchData();
    } catch (error) {
      console.error('Erreur lors de la suppression de la réservation:', error);
      toast({ 
        title: "Erreur", 
        description: "Erreur lors de la suppression de la réservation", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Réservations">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Réservations</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Réservation
          </Button>
        </div>

        {/* Filtres */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {RESERVATION_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {RESERVATION_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={transitaireFilter} onValueChange={setTransitaireFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Transitaire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les transitaires</SelectItem>
                  {transitaires.map(transitaire => (
                    <SelectItem key={transitaire.name} value={transitaire.name}>
                      {transitaire.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tableau des réservations */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Réservations ({filteredReservations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Réservation</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Transitaire</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Palettes</TableHead>
                    <TableHead>Poids (kg)</TableHead>
                    <TableHead>Volume (m³)</TableHead>
                    <TableHead>ETD</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : filteredReservations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        Aucune réservation trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell>{reservation.reservation_number}</TableCell>
                        <TableCell>{getTypeLabel(reservation.type)}</TableCell>
                        <TableCell>{reservation.transitaire}</TableCell>
                        <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                        <TableCell>
                          {reservation.type === 'groupage' ? 
                            `${reservation.available_pallets}/${reservation.max_pallets}` : 
                            reservation.max_pallets
                          }
                        </TableCell>
                        <TableCell>
                          {reservation.type === 'groupage' ? 
                            `${reservation.available_weight}/${reservation.max_weight}` : 
                            reservation.max_weight
                          }
                        </TableCell>
                        <TableCell>
                          {reservation.type === 'groupage' ? 
                            `${reservation.available_volume}/${reservation.max_volume}` : 
                            reservation.max_volume
                          }
                        </TableCell>
                        <TableCell>{reservation.etd ? new Date(reservation.etd).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{reservation.eta ? new Date(reservation.eta).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedReservation(reservation);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedReservation(reservation);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLoadingPlan(reservation)}
                            >
                              <Package className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedReservation(reservation);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog de création */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une Nouvelle Réservation</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleCreateReservation)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type de Réservation</Label>
                  <Select 
                    onValueChange={(value) => {
                      form.setValue('type', value);
                      handleTypeChange(value);
                    }}
                    defaultValue={form.watch('type')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESERVATION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="transitaire">Transitaire</Label>
                  <Select onValueChange={(value) => form.setValue('transitaire', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un transitaire" />
                    </SelectTrigger>
                    <SelectContent>
                      {transitaires.map(transitaire => (
                        <SelectItem key={transitaire.name} value={transitaire.name}>
                          {transitaire.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="max_pallets">Max Palettes</Label>
                  <Input
                    {...form.register('max_pallets')}
                    type="number"
                  />
                </div>
                <div>
                  <Label htmlFor="max_weight">Max Poids (kg)</Label>
                  <Input
                    {...form.register('max_weight')}
                    type="number"
                  />
                </div>
                <div>
                  <Label htmlFor="max_volume">Max Volume (m³)</Label>
                  <Input
                    {...form.register('max_volume')}
                    type="number"
                    step="0.01"
                  />
                </div>
              </div>

              {form.watch('type') === 'groupage' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="cost_per_palette">Coût par Palette (€)</Label>
                    <Input
                      {...form.register('cost_per_palette')}
                      type="number"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost_per_kg">Coût par Kg (€)</Label>
                    <Input
                      {...form.register('cost_per_kg')}
                      type="number"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost_per_m3">Coût par m³ (€)</Label>
                    <Input
                      {...form.register('cost_per_m3')}
                      type="number"
                      step="0.01"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="etd">ETD</Label>
                  <Input
                    {...form.register('etd')}
                    type="date"
                  />
                </div>
                <div>
                  <Label htmlFor="eta">ETA</Label>
                  <Input
                    {...form.register('eta')}
                    type="date"
                  />
                </div>
              </div>

              {form.watch('type') !== 'groupage' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="departure_port">Port de Départ</Label>
                      <Input {...form.register('departure_port')} />
                    </div>
                    <div>
                      <Label htmlFor="arrival_port">Port d'Arrivée</Label>
                      <Input {...form.register('arrival_port')} />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="port_cutoff">Date Limite Port</Label>
                    <Input
                      {...form.register('port_cutoff')}
                      type="datetime-local"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dangerous_goods"
                  {...form.register('dangerous_goods')}
                />
                <Label htmlFor="dangerous_goods">Marchandises Dangereuses</Label>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea {...form.register('notes')} />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Création..." : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog d'édition */}
        {selectedReservation && (
          <EditReservationForm
            reservation={{
              ...selectedReservation,
              container_number: selectedReservation.reservation_number || 'N/A',
              type: selectedReservation.type,
              dangerous_goods_accepted: selectedReservation.dangerous_goods_accepted || false
            }}
            transitaires={transitaires}
            onSave={handleUpdateReservation}
            onCancel={() => setIsEditDialogOpen(false)}
            onOpenLoadingPlan={() => {
              setIsEditDialogOpen(false);
              setIsLoadingPlanOpen(true);
            }}
          />
        )}

        {/* Dialog de confirmation de suppression */}
        <ConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteReservation}
          title="Confirmer la suppression"
          description="Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible."
        />

        {/* Dialog du plan de chargement */}
        {selectedReservation && (
          <LoadingPlan
            isOpen={isLoadingPlanOpen}
            onClose={() => setIsLoadingPlanOpen(false)}
            type={selectedReservation.type === 'groupage' ? 'groupage' : 'container'}
            container={selectedReservation.type !== 'groupage' ? {
              id: selectedReservation.id,
              number: selectedReservation.reservation_number || 'N/A',
              type: selectedReservation.type,
              transitaire: selectedReservation.transitaire,
              max_weight: selectedReservation.max_weight,
              max_volume: selectedReservation.max_volume,
              max_pallets: selectedReservation.max_pallets,
              dangerous_goods: selectedReservation.dangerous_goods_accepted || false
            } : undefined}
            groupage={selectedReservation.type === 'groupage' ? {
              id: selectedReservation.id,
              container_id: selectedReservation.id, // Use reservation id as container_id
              transitaire: selectedReservation.transitaire,
              max_space_pallets: selectedReservation.max_pallets,
              available_space_pallets: selectedReservation.available_pallets,
              max_weight: selectedReservation.max_weight,
              available_weight: selectedReservation.available_weight,
              max_volume: selectedReservation.max_volume,
              available_volume: selectedReservation.available_volume,
              allows_dangerous_goods: selectedReservation.dangerous_goods_accepted || false,
              status: selectedReservation.status
            } : undefined}
          />
        )}
      </div>
    </Layout>
  );
}