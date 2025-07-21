import React from 'react';
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

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
}

interface EditReservationFormProps {
  reservation: Reservation;
  transitaires: {name: string}[];
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  onOpenLoadingPlan: () => void;
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

export function EditReservationForm({ 
  reservation, 
  transitaires, 
  onSave, 
  onCancel, 
  onOpenLoadingPlan 
}: EditReservationFormProps) {
  const form = useForm({
    defaultValues: {
      container_number: reservation.container_number,
      type: reservation.type,
      transitaire: reservation.transitaire,
      max_pallets: reservation.max_pallets.toString(),
      max_weight: reservation.max_weight.toString(),
      max_volume: reservation.max_volume.toString(),
      etd: reservation.etd ? reservation.etd.split('T')[0] : '',
      eta: reservation.eta ? reservation.eta.split('T')[0] : '',
      departure_port: reservation.departure_port || '',
      arrival_port: reservation.arrival_port || '',
      port_cutoff: reservation.port_cutoff ? reservation.port_cutoff.slice(0, 16) : '',
      dangerous_goods_accepted: reservation.dangerous_goods_accepted,
      status: reservation.status,
      notes: reservation.notes || '',
      confirm_reservation: false
    }
  });

  const hasLoadingPlan = reservation.available_pallets < reservation.max_pallets;

  const handleSubmit = async (data: any) => {
    console.log('EditReservationForm - handleSubmit called with data:', data);
    try {
      await onSave({
        ...data,
        max_pallets: parseInt(data.max_pallets),
        max_weight: parseFloat(data.max_weight),
        max_volume: parseFloat(data.max_volume),
      });
      console.log('EditReservationForm - onSave completed successfully');
    } catch (error) {
      console.error('EditReservationForm - Error in handleSubmit:', error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="container_number">Numéro de conteneur</Label>
          <Input
            id="container_number"
            {...form.register('container_number', { required: true })}
          />
        </div>

        <div>
          <Label htmlFor="type">Type</Label>
          <Select 
            value={form.watch('type')} 
            onValueChange={(value) => form.setValue('type', value as any)}
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
          value={form.watch('transitaire')} 
          onValueChange={(value) => form.setValue('transitaire', value)}
        >
          <SelectTrigger>
            <SelectValue />
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
            {...form.register('max_pallets', { required: true })}
          />
        </div>
        <div>
          <Label htmlFor="max_weight">Poids max (kg)</Label>
          <Input
            id="max_weight"
            type="number"
            {...form.register('max_weight', { required: true })}
          />
        </div>
        <div>
          <Label htmlFor="max_volume">Volume max (m³)</Label>
          <Input
            id="max_volume"
            type="number"
            step="0.1"
            {...form.register('max_volume', { required: true })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Palettes disponibles</Label>
          <div className="font-medium text-muted-foreground">
            {reservation.available_pallets}/{reservation.max_pallets}
          </div>
        </div>
        <div>
          <Label>Poids disponible</Label>
          <div className="font-medium text-muted-foreground">
            {(reservation.available_weight/1000).toFixed(1)}T / {(reservation.max_weight/1000).toFixed(1)}T
          </div>
        </div>
        <div>
          <Label>Volume disponible</Label>
          <div className="font-medium text-muted-foreground">
            {reservation.available_volume.toFixed(1)}m³ / {reservation.max_volume}m³
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="etd">Date de départ (ETD)</Label>
          <Input
            id="etd"
            type="date"
            {...form.register('etd')}
          />
        </div>
        <div>
          <Label htmlFor="eta">Date d'arrivée (ETA)</Label>
          <Input
            id="eta"
            type="date"
            {...form.register('eta')}
          />
        </div>
      </div>

      {reservation.type !== 'groupage' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="departure_port">Port de départ</Label>
            <Input
              id="departure_port"
              placeholder="Ex: Le Havre, Terminal De France"
              {...form.register('departure_port')}
            />
          </div>
          <div>
            <Label htmlFor="arrival_port">Port d'arrivée</Label>
            <Input
              id="arrival_port"
              placeholder="Ex: Dakar, DP World Terminal"
              {...form.register('arrival_port')}
            />
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="port_cutoff">Cut-off portuaire</Label>
        <Input
          id="port_cutoff"
          type="datetime-local"
          {...form.register('port_cutoff')}
        />
      </div>

      <div>
        <Label htmlFor="status">Statut</Label>
        <Select 
          value={form.watch('status')} 
          onValueChange={(value) => form.setValue('status', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RESERVATION_STATUSES.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="dangerous_goods_accepted"
          checked={form.watch('dangerous_goods_accepted')}
          onCheckedChange={(checked) => form.setValue('dangerous_goods_accepted', !!checked)}
        />
        <Label htmlFor="dangerous_goods_accepted" className="text-sm">
          Produits dangereux acceptés
        </Label>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Remarques particulières..."
          {...form.register('notes')}
        />
      </div>

      {/* Champ de confirmation - seulement si le plan de chargement n'est pas vide */}
      {hasLoadingPlan && (
        <div className="border-t pt-4">
          <div className="flex items-center space-x-2 mb-2">
            <Checkbox
              id="confirm_reservation"
              checked={form.watch('confirm_reservation')}
              onCheckedChange={(checked) => form.setValue('confirm_reservation', !!checked)}
            />
            <Label htmlFor="confirm_reservation" className="text-sm font-medium">
              Confirmer la réservation
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Cette option n'est disponible que lorsque le plan de chargement contient des commandes.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="button" variant="outline" onClick={onOpenLoadingPlan}>
          Plan de chargement
        </Button>
        <Button type="submit">
          Enregistrer
        </Button>
      </div>
    </form>
  );
}