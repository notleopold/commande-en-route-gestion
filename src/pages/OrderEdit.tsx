import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string;
  supplier: string;
  order_date: string;
  payment_date?: string;
  status: string;
  payment_type: string;
  client_id?: string;
  current_transitaire?: string;
  is_received?: boolean;
  transitaire_entry_number?: string;
  weight?: number;
  volume?: number;
  cartons?: number;
  total_price?: number;
  container_id?: string;
}

interface Client {
  id: string;
  name: string;
}

const ORDER_STATUSES = [
  "BDC ENVOYÉ ZIKETRO",
  "À COMMANDER", 
  "PAIEMENT EN ATTENTE",
  "COMMANDÉ > EN LIVRAISON",
  "PAYÉ (30%)",
  "PAYÉ (50%)", 
  "PAYÉ (100%)",
  "LIVRÉ"
];

const PAYMENT_TYPES = [
  "30% à la commande",
  "50% à la commande", 
  "100% à la commande"
];

const TRANSITAIRES = [
  "BOLLORÉ",
  "MAERSK",
  "MSC",
  "CMA CGM",
  "HAPAG-LLOYD"
];

export default function OrderEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Order>>({});

  useEffect(() => {
    if (id) {
      fetchOrder();
      fetchClients();
    }
  }, [id]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setOrder(data);
      setFormData(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error("Erreur lors du chargement de la commande");
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          client_id: formData.client_id || null,
          supplier: formData.supplier || order.supplier,
          order_date: formData.order_date || order.order_date,
          payment_date: formData.payment_date || null,
          status: formData.status || order.status,
          payment_type: formData.payment_type || order.payment_type,
          current_transitaire: formData.current_transitaire || null,
          is_received: formData.is_received || false,
          transitaire_entry_number: formData.transitaire_entry_number || null,
          weight: formData.weight || null,
          volume: formData.volume || null,
          cartons: formData.cartons || null,
          total_price: formData.total_price || null,
        })
        .eq('id', order.id);

      if (error) throw error;

      toast.success("Commande mise à jour avec succès");
      navigate(`/orders/${order.id}`);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof Order, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return <Layout title="Chargement..."><div>Chargement...</div></Layout>;
  }

  if (!order) {
    return <Layout title="Commande introuvable"><div>Commande introuvable</div></Layout>;
  }

  return (
    <Layout title={`Modifier ${order.order_number}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate(`/orders/${order.id}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Modifier {order.order_number}</h1>
              <p className="text-muted-foreground">Modifiez les informations de la commande</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="client_id">Client</Label>
                  <Select 
                    value={formData.client_id || ""} 
                    onValueChange={(value) => handleInputChange('client_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucun client</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="supplier">Fournisseur</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier || ""}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="order_date">Date de commande</Label>
                  <Input
                    id="order_date"
                    type="date"
                    value={formData.order_date || ""}
                    onChange={(e) => handleInputChange('order_date', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="payment_date">Date de paiement</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={formData.payment_date || ""}
                    onChange={(e) => handleInputChange('payment_date', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select 
                    value={formData.status || ""} 
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="payment_type">Type de paiement</Label>
                  <Select 
                    value={formData.payment_type || ""} 
                    onValueChange={(value) => handleInputChange('payment_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type de paiement" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_TYPES.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Logistique et Transitaire */}
            <Card>
              <CardHeader>
                <CardTitle>Logistique et Transitaire</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="current_transitaire">Transitaire de livraison</Label>
                  <Select 
                    value={formData.current_transitaire || ""} 
                    onValueChange={(value) => handleInputChange('current_transitaire', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un transitaire" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucun transitaire</SelectItem>
                      {TRANSITAIRES.map(transitaire => (
                        <SelectItem key={transitaire} value={transitaire}>
                          {transitaire}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Champs conditionnels pour le transitaire */}
                {formData.current_transitaire && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-medium">Informations de réception</h4>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_received"
                        checked={formData.is_received || false}
                        onCheckedChange={(checked) => handleInputChange('is_received', checked)}
                      />
                      <Label htmlFor="is_received">
                        Commande réceptionnée chez le transitaire
                      </Label>
                    </div>

                    {formData.is_received && (
                      <div>
                        <Label htmlFor="transitaire_entry_number">Numéro d'entrée du transitaire</Label>
                        <Input
                          id="transitaire_entry_number"
                          value={formData.transitaire_entry_number || ""}
                          onChange={(e) => handleInputChange('transitaire_entry_number', e.target.value)}
                          placeholder="Ex: ENT-2024-001"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="weight">Poids (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight || ""}
                    onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || null)}
                  />
                </div>

                <div>
                  <Label htmlFor="volume">Volume (m³)</Label>
                  <Input
                    id="volume"
                    type="number"
                    step="0.1"
                    value={formData.volume || ""}
                    onChange={(e) => handleInputChange('volume', parseFloat(e.target.value) || null)}
                  />
                </div>

                <div>
                  <Label htmlFor="cartons">Nombre de cartons</Label>
                  <Input
                    id="cartons"
                    type="number"
                    value={formData.cartons || ""}
                    onChange={(e) => handleInputChange('cartons', parseInt(e.target.value) || null)}
                  />
                </div>

                <div>
                  <Label htmlFor="total_price">Prix total (€)</Label>
                  <Input
                    id="total_price"
                    type="number"
                    step="0.01"
                    value={formData.total_price || ""}
                    onChange={(e) => handleInputChange('total_price', parseFloat(e.target.value) || null)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}