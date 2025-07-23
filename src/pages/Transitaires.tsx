import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Truck, Phone, Mail, Edit, Trash2, Plus, MapPin, Package } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { TransitaireDashboard } from "@/components/TransitaireDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3 } from "lucide-react";

interface Transitaire {
  id: string;
  name: string;
  code?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  country?: string;
  services?: string[];
  specialties?: string[];
  max_container_capacity?: number;
  dangerous_goods_certified?: boolean;
  tracking_system_url?: string;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const SERVICES_OPTIONS = ["FCL", "LCL", "Groupage", "Rail", "Aérien", "Routier"];
const SPECIALTIES_OPTIONS = ["Afrique", "Europe", "Asie", "Amérique", "Worldwide", "Digital", "Méditerranée", "Marchandises dangereuses"];

export default function Transitaires() {
  const [transitaires, setTransitaires] = useState<Transitaire[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransitaire, setEditingTransitaire] = useState<Transitaire | null>(null);
  const [deletingTransitaire, setDeletingTransitaire] = useState<Transitaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    city: "",
    country: "",
    services: [] as string[],
    specialties: [] as string[],
    max_container_capacity: "",
    dangerous_goods_certified: false,
    tracking_system_url: "",
    notes: "",
    status: "active"
  });

  useEffect(() => {
    fetchTransitaires();
  }, []);

  const fetchTransitaires = async () => {
    try {
      const { data, error } = await supabase
        .from('transitaires')
        .select('*')
        .order('name');

      if (error) throw error;
      setTransitaires(data || []);
    } catch (error) {
      console.error('Error fetching transitaires:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les transitaires",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTransitaires = transitaires.filter(transitaire => {
    const matchesSearch = transitaire.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transitaire.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transitaire.contact_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || transitaire.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      address: "",
      city: "",
      country: "",
      services: [],
      specialties: [],
      max_container_capacity: "",
      dangerous_goods_certified: false,
      tracking_system_url: "",
      notes: "",
      status: "active"
    });
    setEditingTransitaire(null);
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (transitaire: Transitaire) => {
    setFormData({
      name: transitaire.name,
      code: transitaire.code || "",
      contact_name: transitaire.contact_name || "",
      contact_email: transitaire.contact_email || "",
      contact_phone: transitaire.contact_phone || "",
      address: transitaire.address || "",
      city: transitaire.city || "",
      country: transitaire.country || "",
      services: transitaire.services || [],
      specialties: transitaire.specialties || [],
      max_container_capacity: transitaire.max_container_capacity?.toString() || "",
      dangerous_goods_certified: transitaire.dangerous_goods_certified || false,
      tracking_system_url: transitaire.tracking_system_url || "",
      notes: transitaire.notes || "",
      status: transitaire.status
    });
    setEditingTransitaire(transitaire);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        max_container_capacity: formData.max_container_capacity ? parseInt(formData.max_container_capacity) : null
      };

      if (editingTransitaire) {
        const { error } = await supabase
          .from('transitaires')
          .update(submitData)
          .eq('id', editingTransitaire.id);
        
        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Transitaire modifié avec succès",
        });
      } else {
        const { error } = await supabase
          .from('transitaires')
          .insert([submitData]);
        
        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Transitaire ajouté avec succès",
        });
      }
      
      fetchTransitaires();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving transitaire:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le transitaire",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingTransitaire) return;

    try {
      const { error } = await supabase
        .from('transitaires')
        .delete()
        .eq('id', deletingTransitaire.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Transitaire supprimé avec succès",
      });
      
      fetchTransitaires();
      setDeletingTransitaire(null);
    } catch (error) {
      console.error('Error deleting transitaire:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le transitaire",
        variant: "destructive",
      });
    }
  };

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <Layout title="Transitaires">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Transitaires</h1>
            <p className="text-muted-foreground mt-2">
              Gérez vos partenaires de transport et logistique
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un transitaire
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTransitaire ? "Modifier le transitaire" : "Ajouter un transitaire"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="code">Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_name">Nom du contact</Label>
                    <Input
                      id="contact_name"
                      value={formData.contact_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_email">Email du contact</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_phone">Téléphone</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_container_capacity">Capacité max conteneurs</Label>
                    <Input
                      id="max_container_capacity"
                      type="number"
                      value={formData.max_container_capacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_container_capacity: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Pays</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Services</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SERVICES_OPTIONS.map(service => (
                      <Badge
                        key={service}
                        variant={formData.services.includes(service) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleService(service)}
                      >
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Spécialités</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SPECIALTIES_OPTIONS.map(specialty => (
                      <Badge
                        key={specialty}
                        variant={formData.specialties.includes(specialty) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleSpecialty(specialty)}
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tracking_system_url">URL système de suivi</Label>
                    <Input
                      id="tracking_system_url"
                      type="url"
                      value={formData.tracking_system_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, tracking_system_url: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Statut</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="inactive">Inactif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dangerous_goods_certified"
                    checked={formData.dangerous_goods_certified}
                    onChange={(e) => setFormData(prev => ({ ...prev, dangerous_goods_certified: e.target.checked }))}
                  />
                  <Label htmlFor="dangerous_goods_certified">Certifié marchandises dangereuses</Label>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingTransitaire ? "Modifier" : "Ajouter"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Liste des transitaires</TabsTrigger>
            <TabsTrigger value="dashboard">
              <BarChart3 className="h-4 w-4 mr-2" />
              Tableau de bord
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <TransitaireDashboard />
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            <div className="flex gap-4 mb-6">
              <Input
                placeholder="Rechercher un transitaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTransitaires.map(transitaire => (
                <Card key={transitaire.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{transitaire.name}</CardTitle>
                        {transitaire.code && (
                          <Badge variant="secondary" className="mt-1">
                            {transitaire.code}
                          </Badge>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(transitaire)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingTransitaire(transitaire)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {transitaire.contact_name && (
                      <div className="flex items-center text-sm">
                        <Truck className="h-4 w-4 mr-2 text-muted-foreground" />
                        {transitaire.contact_name}
                      </div>
                    )}
                    {transitaire.contact_email && (
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        {transitaire.contact_email}
                      </div>
                    )}
                    {transitaire.contact_phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        {transitaire.contact_phone}
                      </div>
                    )}
                    {(transitaire.city || transitaire.country) && (
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        {[transitaire.city, transitaire.country].filter(Boolean).join(', ')}
                      </div>
                    )}
                    {transitaire.max_container_capacity && (
                      <div className="flex items-center text-sm">
                        <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                        Capacité: {transitaire.max_container_capacity} conteneurs
                      </div>
                    )}
                    {transitaire.services && transitaire.services.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Services:</p>
                        <div className="flex flex-wrap gap-1">
                          {transitaire.services.map(service => (
                            <Badge key={service} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {transitaire.specialties && transitaire.specialties.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Spécialités:</p>
                        <div className="flex flex-wrap gap-1">
                          {transitaire.specialties.map(specialty => (
                            <Badge key={specialty} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                      <Badge variant={transitaire.status === 'active' ? 'default' : 'secondary'}>
                        {transitaire.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                      {transitaire.dangerous_goods_certified && (
                        <Badge variant="destructive" className="text-xs">
                          Marchandises dangereuses
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <ConfirmationDialog
          open={!!deletingTransitaire}
          onOpenChange={() => setDeletingTransitaire(null)}
          onConfirm={handleDelete}
          title="Supprimer le transitaire"
          description="Êtes-vous sûr de vouloir supprimer le transitaire"
          itemName={deletingTransitaire?.name}
        />
      </div>
    </Layout>
  );
}
