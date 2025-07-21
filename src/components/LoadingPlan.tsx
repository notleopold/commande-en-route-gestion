import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Check, X, Package, Weight, Gauge } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";

interface Order {
  id: string;
  order_number: string;
  client_id?: string;
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

interface ContainerData {
  id: string;
  number: string;
  type: string;
  transitaire: string;
  max_weight: number;
  max_volume: number;
  max_pallets: number;
  dangerous_goods: boolean;
}

interface Groupage {
  id: string;
  transitaire: string;
  max_space_pallets: number;
  available_space_pallets: number;
  max_weight: number;
  available_weight: number;
  max_volume: number;
  available_volume: number;
  allows_dangerous_goods: boolean;
  status: string;
  container_id: string;
}

interface GroupageBooking {
  id: string;
  order_id: string;
  palettes_booked: number;
  weight_booked: number;
  volume_booked: number;
  booking_status: string;
  confirmed_by_transitaire: boolean;
  orders?: Order;
}

interface LoadingPlanProps {
  isOpen: boolean;
  onClose: () => void;
  container?: ContainerData;
  groupage?: Groupage;
  type: 'container' | 'groupage';
}

export const LoadingPlan: React.FC<LoadingPlanProps> = ({
  isOpen,
  onClose,
  container,
  groupage,
  type
}) => {
  const { toast } = useToast();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [groupageBookings, setGroupageBookings] = useState<GroupageBooking[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const bookingForm = useForm({
    defaultValues: {
      palettes_booked: '',
      weight_booked: '',
      volume_booked: ''
    }
  });

  const fetchOrders = async () => {
    if (!container && !groupage) return;
    
    setLoading(true);
    try {
      const transitaire = container?.transitaire || groupage?.transitaire;
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_products(
            quantity,
            total_price,
            palette_quantity,
            products(
              id, name, dangerous, imdg_class
            )
          )
        `)
        .eq('is_received', true)
        .eq('current_transitaire', transitaire)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (type === 'container') {
        // Pour les conteneurs
        const available = data?.filter(order => !order.container_id) || [];
        const assigned = data?.filter(order => order.container_id === container?.id) || [];
        setAvailableOrders(available);
        setAssignedOrders(assigned);
      } else {
        // Pour les groupages - récupérer les réservations
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('groupage_bookings')
          .select(`
            *,
            orders!inner(
              *,
              order_products(
                quantity,
                total_price,
                palette_quantity,
                products(
                  id, name, dangerous, imdg_class
                )
              )
            )
          `)
          .eq('groupage_id', groupage?.id);

        if (bookingsError) throw bookingsError;

        const bookedOrderIds = bookingsData?.map(b => b.order_id) || [];
        const available = data?.filter(order => !bookedOrderIds.includes(order.id)) || [];
        
        setAvailableOrders(available);
        setGroupageBookings(bookingsData || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({ title: "Erreur", description: "Erreur lors du chargement des commandes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen, container, groupage]);

  const canAddOrder = (order: Order) => {
    if (type === 'container' && container) {
      const transitaireMatch = order.current_transitaire === container.transitaire;
      const hasDangerous = order.order_products?.some(op => op.products?.dangerous);
      const dangerousAllowed = !hasDangerous || container.dangerous_goods;
      
      return {
        canAdd: transitaireMatch && dangerousAllowed,
        reason: !transitaireMatch ? 'Transitaire différent' : 
                !dangerousAllowed ? 'Produits dangereux non autorisés' : ''
      };
    } else if (type === 'groupage' && groupage) {
      const transitaireMatch = order.current_transitaire === groupage.transitaire;
      const hasDangerous = order.order_products?.some(op => op.products?.dangerous);
      const dangerousAllowed = !hasDangerous || groupage.allows_dangerous_goods;
      const statusOk = groupage.status === 'available';
      
      return {
        canAdd: transitaireMatch && dangerousAllowed && statusOk,
        reason: !transitaireMatch ? 'Transitaire différent' : 
                !dangerousAllowed ? 'Produits dangereux non autorisés' :
                !statusOk ? 'Groupage non disponible' : ''
      };
    }
    return { canAdd: false, reason: 'Configuration invalide' };
  };

  const handleAddOrder = async (data: any) => {
    if (!selectedOrder) return;

    try {
      if (type === 'container' && container) {
        // Ajouter au conteneur
        const { error } = await supabase
          .from('orders')
          .update({ container_id: container.id })
          .eq('id', selectedOrder.id);

        if (error) throw error;
        toast({ title: "Succès", description: "Commande ajoutée au conteneur" });
      } else if (type === 'groupage' && groupage) {
        // Ajouter au groupage
        const palettes = parseInt(data.palettes_booked) || 0;
        const weight = parseFloat(data.weight_booked) || 0;
        const volume = parseFloat(data.volume_booked) || 0;
        
        const hasDangerous = selectedOrder.order_products?.some(op => op.products?.dangerous) || false;

        const { error: bookingError } = await supabase
          .from('groupage_bookings')
          .insert([{
            groupage_id: groupage.id,
            order_id: selectedOrder.id,
            palettes_booked: palettes,
            weight_booked: weight,
            volume_booked: volume,
            cost_calculated: 0,
            has_dangerous_goods: hasDangerous,
            booking_status: 'pending'
          }]);

        if (bookingError) throw bookingError;

        // Mettre à jour les espaces disponibles
        const { error: updateError } = await supabase
          .from('groupages')
          .update({
            available_space_pallets: groupage.available_space_pallets - palettes,
            available_weight: groupage.available_weight - weight,
            available_volume: groupage.available_volume - volume
          })
          .eq('id', groupage.id);

        if (updateError) throw updateError;
        toast({ title: "Succès", description: "Commande réservée dans le groupage" });
      }

      setIsAddOrderOpen(false);
      setSelectedOrder(null);
      bookingForm.reset();
      fetchOrders();
    } catch (error) {
      console.error('Error adding order:', error);
      toast({ title: "Erreur", description: "Erreur lors de l'ajout", variant: "destructive" });
    }
  };

  const handleRemoveOrder = async (orderId: string) => {
    try {
      if (type === 'container') {
        const { error } = await supabase
          .from('orders')
          .update({ container_id: null })
          .eq('id', orderId);

        if (error) throw error;
        toast({ title: "Succès", description: "Commande retirée du conteneur" });
      } else if (type === 'groupage') {
        // Trouver la réservation
        const booking = groupageBookings.find(b => b.order_id === orderId);
        if (!booking) return;

        const { error: deleteError } = await supabase
          .from('groupage_bookings')
          .delete()
          .eq('id', booking.id);

        if (deleteError) throw deleteError;

        // Restaurer les espaces disponibles
        if (groupage) {
          const { error: updateError } = await supabase
            .from('groupages')
            .update({
              available_space_pallets: groupage.available_space_pallets + booking.palettes_booked,
              available_weight: groupage.available_weight + booking.weight_booked,
              available_volume: groupage.available_volume + booking.volume_booked
            })
            .eq('id', groupage.id);

          if (updateError) throw updateError;
        }
        
        toast({ title: "Succès", description: "Réservation supprimée" });
      }

      fetchOrders();
    } catch (error) {
      console.error('Error removing order:', error);
      toast({ title: "Erreur", description: "Erreur lors de la suppression", variant: "destructive" });
    }
  };

  const handleConfirmBooking = async (bookingId: string, confirm: boolean) => {
    try {
      const { error } = await supabase
        .from('groupage_bookings')
        .update({
          booking_status: confirm ? 'confirmed' : 'cancelled',
          confirmed_by_transitaire: confirm
        })
        .eq('id', bookingId);

      if (error) throw error;
      toast({ title: "Succès", description: confirm ? "Réservation confirmée" : "Réservation annulée" });
      fetchOrders();
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast({ title: "Erreur", description: "Erreur lors de la confirmation", variant: "destructive" });
    }
  };

  const calculateTotals = () => {
    if (type === 'container') {
      const totalWeight = assignedOrders.reduce((sum, order) => sum + (order.weight || 0), 0);
      const totalVolume = assignedOrders.reduce((sum, order) => sum + (order.volume || 0), 0);
      const totalValue = assignedOrders.reduce((sum, order) => sum + (order.total_ttc || 0), 0);
      const totalPallets = assignedOrders.reduce((sum, order) => {
        return sum + (order.cartons ? Math.ceil(order.cartons / 20) : 1);
      }, 0);
      
      return { totalWeight, totalVolume, totalValue, totalPallets };
    } else {
      const totalWeight = groupageBookings.reduce((sum, booking) => sum + booking.weight_booked, 0);
      const totalVolume = groupageBookings.reduce((sum, booking) => sum + booking.volume_booked, 0);
      const totalValue = groupageBookings.reduce((sum, booking) => sum + (booking.orders?.total_ttc || 0), 0);
      const totalPallets = groupageBookings.reduce((sum, booking) => sum + booking.palettes_booked, 0);
      
      return { totalWeight, totalVolume, totalValue, totalPallets };
    }
  };

  const { totalWeight, totalVolume, totalValue, totalPallets } = calculateTotals();
  const title = type === 'container' 
    ? `Plan de chargement - Conteneur ${container?.number}`
    : `Plan de chargement - Groupage`;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Statistiques */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Package className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold">{totalPallets}</div>
                    <div className="text-sm text-muted-foreground">Palettes</div>
                    {(container || groupage) && (
                      <div className="text-xs text-muted-foreground">
                        / {container?.max_pallets || groupage?.max_space_pallets}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Weight className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold">{(totalWeight / 1000).toFixed(1)}T</div>
                    <div className="text-sm text-muted-foreground">Poids</div>
                    {(container || groupage) && (
                      <div className="text-xs text-muted-foreground">
                        / {((container?.max_weight || groupage?.max_weight || 0) / 1000).toFixed(1)}T
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Gauge className="h-5 w-5 text-purple-500" />
                    </div>
                    <div className="text-2xl font-bold">{totalVolume.toFixed(1)}m³</div>
                    <div className="text-sm text-muted-foreground">Volume</div>
                    {(container || groupage) && (
                      <div className="text-xs text-muted-foreground">
                        / {(container?.max_volume || groupage?.max_volume || 0).toFixed(1)}m³
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{totalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
                    <div className="text-sm text-muted-foreground">Valeur totale</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Commandes assignées */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Commandes {type === 'container' ? 'assignées' : 'réservées'}</span>
                    <Button onClick={() => setIsAddOrderOpen(true)} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div>Chargement...</div>
                  ) : type === 'container' ? (
                    assignedOrders.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">Aucune commande assignée</p>
                    ) : (
                      <div className="space-y-3">
                        {assignedOrders.map(order => (
                          <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{order.order_number}</div>
                              <div className="text-sm text-muted-foreground">{order.supplier}</div>
                              <div className="text-xs text-muted-foreground">
                                {order.weight ? `${(order.weight / 1000).toFixed(1)}T` : ''} • 
                                {order.volume ? ` ${order.volume.toFixed(1)}m³` : ''} • 
                                {order.cartons ? ` ${order.cartons} cartons` : ''}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveOrder(order.id)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    groupageBookings.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">Aucune réservation</p>
                    ) : (
                      <div className="space-y-3">
                        {groupageBookings.map(booking => (
                          <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{booking.orders?.order_number}</div>
                              <div className="text-sm text-muted-foreground">{booking.orders?.supplier}</div>
                              <div className="text-xs text-muted-foreground">
                                {booking.palettes_booked} pal • {(booking.weight_booked / 1000).toFixed(1)}T • {booking.volume_booked.toFixed(1)}m³
                              </div>
                              <Badge variant={booking.booking_status === 'confirmed' ? 'default' : 'secondary'}>
                                {booking.booking_status}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              {booking.booking_status === 'pending' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleConfirmBooking(booking.id, true)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleConfirmBooking(booking.id, false)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveOrder(booking.order_id)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Commandes disponibles */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Commandes disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                  {availableOrders.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Aucune commande disponible</p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {availableOrders.map(order => {
                        const { canAdd, reason } = canAddOrder(order);
                        return (
                          <div
                            key={order.id}
                            className={`p-2 border rounded cursor-pointer transition-colors ${
                              canAdd ? 'hover:bg-muted' : 'bg-muted/50 cursor-not-allowed'
                            }`}
                            onClick={() => canAdd && (setSelectedOrder(order), setIsAddOrderOpen(true))}
                          >
                            <div className="text-sm font-medium">{order.order_number}</div>
                            <div className="text-xs text-muted-foreground">{order.supplier}</div>
                            {!canAdd && (
                              <div className="text-xs text-red-500 mt-1">{reason}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog d'ajout de commande */}
      <Dialog open={isAddOrderOpen} onOpenChange={setIsAddOrderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter la commande {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>

          <form onSubmit={bookingForm.handleSubmit(handleAddOrder)} className="space-y-4">
            {type === 'groupage' && (
              <>
                <div>
                  <Label htmlFor="palettes_booked">Palettes réservées</Label>
                  <Input
                    id="palettes_booked"
                    type="number"
                    {...bookingForm.register('palettes_booked', { required: true })}
                    placeholder="Nombre de palettes"
                  />
                </div>

                <div>
                  <Label htmlFor="weight_booked">Poids réservé (kg)</Label>
                  <Input
                    id="weight_booked"
                    type="number"
                    step="0.1"
                    {...bookingForm.register('weight_booked', { required: true })}
                    placeholder="Poids en kg"
                  />
                </div>

                <div>
                  <Label htmlFor="volume_booked">Volume réservé (m³)</Label>
                  <Input
                    id="volume_booked"
                    type="number"
                    step="0.1"
                    {...bookingForm.register('volume_booked', { required: true })}
                    placeholder="Volume en m³"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOrderOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {type === 'container' ? 'Assigner' : 'Réserver'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};