import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Package, Ship, Calendar, MapPin, Euro, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Reservation {
  id: string;
  reservation_number: string | null;
  type: string;
  transitaire: string;
  status: string;
  max_pallets: number;
  max_weight: number;
  max_volume: number;
  available_pallets: number;
  available_weight: number;
  available_volume: number;
  etd: string | null;
  eta: string | null;
  departure_port: string | null;
  arrival_port: string | null;
  port_cutoff: string | null;
  dangerous_goods_accepted: boolean;
  notes: string | null;
  cost_per_palette: number;
  cost_per_kg: number;
  cost_per_m3: number;
  created_at: string;
  updated_at: string;
}

export default function ReservationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchReservation();
    }
  }, [id]);

  const fetchReservation = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setReservation(data);
    } catch (error) {
      console.error('Error fetching reservation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de la réservation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'in_transit': return 'bg-purple-500';
      case 'delivered': return 'bg-green-500';
      case 'available': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case '20_feet': return '20 pieds';
      case '40_feet': return '40 pieds';
      case 'groupage': return 'Groupage';
      default: return type;
    }
  };

  if (loading) {
    return (
      <Layout title="Chargement...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!reservation) {
    return (
      <Layout title="Réservation introuvable">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Cette réservation n'existe pas ou a été supprimée.</p>
          <Button onClick={() => navigate('/reservations')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux réservations
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Réservation ${reservation.reservation_number || 'N/A'}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate('/reservations')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {reservation.reservation_number || 'N/A'}
              </h1>
              <p className="text-muted-foreground">
                {getTypeLabel(reservation.type)} - {reservation.transitaire}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(reservation.status)}>
              {reservation.status}
            </Badge>
            <Button onClick={() => navigate(`/reservations/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p className="font-medium">{getTypeLabel(reservation.type)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Transitaire</p>
                  <p className="font-medium">{reservation.transitaire}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Max Palettes</p>
                  <p className="font-medium">{reservation.max_pallets}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Max Poids (kg)</p>
                  <p className="font-medium">{reservation.max_weight}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Max Volume (m³)</p>
                  <p className="font-medium">{reservation.max_volume}</p>
                </div>
              </div>

              {reservation.type === 'groupage' && (
                <>
                  <Separator />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Palettes Disponibles</p>
                      <p className="font-medium">{reservation.available_pallets}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Poids Disponible (kg)</p>
                      <p className="font-medium">{reservation.available_weight}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Volume Disponible (m³)</p>
                      <p className="font-medium">{reservation.available_volume}</p>
                    </div>
                  </div>
                </>
              )}

              {reservation.dangerous_goods_accepted && (
                <>
                  <Separator />
                  <div className="flex items-center space-x-2 text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Marchandises dangereuses acceptées</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Informations de transport */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Ship className="h-5 w-5 mr-2" />
                Transport
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Port de départ</p>
                  <p className="font-medium">{reservation.departure_port || 'Non spécifié'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Port d'arrivée</p>
                  <p className="font-medium">{reservation.arrival_port || 'Non spécifié'}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ETD</p>
                  <p className="font-medium">
                    {reservation.etd ? new Date(reservation.etd).toLocaleDateString('fr-FR') : 'Non spécifié'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ETA</p>
                  <p className="font-medium">
                    {reservation.eta ? new Date(reservation.eta).toLocaleDateString('fr-FR') : 'Non spécifié'}
                  </p>
                </div>
              </div>

              {reservation.port_cutoff && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date limite port</p>
                    <p className="font-medium">
                      {new Date(reservation.port_cutoff).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Coûts (pour les groupages) */}
          {reservation.type === 'groupage' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Euro className="h-5 w-5 mr-2" />
                  Tarification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Coût par palette (€)</p>
                    <p className="font-medium">{reservation.cost_per_palette}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Coût par kg (€)</p>
                    <p className="font-medium">{reservation.cost_per_kg}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Coût par m³ (€)</p>
                    <p className="font-medium">{reservation.cost_per_m3}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {reservation.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{reservation.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Informations système */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Informations système
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <p>Créé le : {new Date(reservation.created_at).toLocaleString('fr-FR')}</p>
              </div>
              <div>
                <p>Modifié le : {new Date(reservation.updated_at).toLocaleString('fr-FR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}