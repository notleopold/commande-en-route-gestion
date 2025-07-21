import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Package, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  dangerous: boolean;
  imdg_class?: string;
  unit: string;
  cost: number;
  suppliers: string[];
  status: string;
  description?: string;
  // Packaging details
  units_per_package?: number;
  package_dimensions_length?: number;
  package_dimensions_width?: number;
  package_dimensions_height?: number;
  package_weight?: number;
  package_volume?: number;
  package_material_code?: string;
  package_signage?: string;
  packages_per_carton?: number;
  units_per_carton?: number;
  carton_dimensions_length?: number;
  carton_dimensions_width?: number;
  carton_dimensions_height?: number;
  carton_weight?: number;
  carton_volume?: number;
  carton_material_code?: string;
  carton_signage?: string;
  cartons_per_layer?: number;
  cartons_per_palette?: number;
  layers_per_palette?: number;
  palette_dimensions_length?: number;
  palette_dimensions_width?: number;
  palette_dimensions_height?: number;
  palette_weight?: number;
  palette_type?: string;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<{id: string, name: string}[]>([]);
  const [transitaires, setTransitaires] = useState<{id: string, name: string}[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");

  const form = useForm<Product>({
    defaultValues: {
      name: "",
      category: "",
      sku: "",
      dangerous: false,
      imdg_class: "",
      unit: "",
      cost: 0,
      suppliers: [],
      status: "active",
      description: "",
      units_per_package: 0,
      package_dimensions_length: 0,
      package_dimensions_width: 0,
      package_dimensions_height: 0,
      package_weight: 0,
      package_volume: 0,
      package_material_code: "",
      package_signage: "",
      packages_per_carton: 0,
      units_per_carton: 0,
      carton_dimensions_length: 0,
      carton_dimensions_width: 0,
      carton_dimensions_height: 0,
      carton_weight: 0,
      carton_volume: 0,
      carton_material_code: "",
      carton_signage: "",
      cartons_per_layer: 0,
      cartons_per_palette: 0,
      layers_per_palette: 0,
      palette_dimensions_length: 0,
      palette_dimensions_width: 0,
      palette_dimensions_height: 0,
      palette_weight: 0,
      palette_type: "",
    }
  });

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchSuppliers();
      fetchTransitaires();
      fetchCategories();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);
      form.reset(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error("Erreur lors du chargement du produit");
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchTransitaires = async () => {
    try {
      const { data, error } = await supabase
        .from('transitaires')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setTransitaires(data || []);
    } catch (error) {
      console.error('Error fetching transitaires:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null);

      if (error) throw error;
      
      const uniqueCategories = [...new Set(data?.map(item => item.category) || [])];
      setCategories(uniqueCategories.sort());
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const addNewCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updatedCategories = [...categories, newCategory.trim()].sort();
      setCategories(updatedCategories);
      form.setValue('category', newCategory.trim());
      setNewCategory("");
    }
  };

  const onSubmit = async (data: Product) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('products')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast.success("Produit mis à jour avec succès");
      fetchProduct();
      fetchCategories(); // Refresh categories in case a new one was added
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error("Erreur lors de la mise à jour du produit");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Layout title="Chargement..."><div>Chargement...</div></Layout>;
  }

  if (!product) {
    return <Layout title="Produit introuvable"><div>Produit introuvable</div></Layout>;
  }

  return (
    <Layout title={product?.name || "Produit"}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/products')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{form.watch('name') || 'Nouveau produit'}</h1>
                <p className="text-muted-foreground">SKU: {form.watch('sku')}</p>
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du produit</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie</FormLabel>
                      <div className="flex gap-2">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Sélectionnez une catégorie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="Nouvelle catégorie"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addNewCategory())}
                        />
                        <Button type="button" onClick={addNewCategory} size="sm">
                          Ajouter
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unité</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une unité" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Pièce">Pièce</SelectItem>
                          <SelectItem value="Kg">Kg</SelectItem>
                          <SelectItem value="Litre">Litre</SelectItem>
                          <SelectItem value="Mètre">Mètre</SelectItem>
                          <SelectItem value="Carton">Carton</SelectItem>
                          <SelectItem value="Palette">Palette</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coût (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="archived">Archivé</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dangerous"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Produit dangereux</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch('dangerous') && (
                  <FormField
                    control={form.control}
                    name="imdg_class"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Classe IMDG</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Class 3" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Package Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Emballage - Paquet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="units_per_package"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unités par paquet</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="package_dimensions_length"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longueur (cm)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="package_dimensions_width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Largeur (cm)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="package_dimensions_height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hauteur (cm)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="package_weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poids (kg)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.001"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="package_volume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume (m³)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.001"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Carton Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Emballage - Carton
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="packages_per_carton"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paquets par carton</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="units_per_carton"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unités par carton</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="carton_dimensions_length"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longueur (cm)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="carton_dimensions_width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Largeur (cm)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="carton_dimensions_height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hauteur (cm)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="carton_weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poids (kg)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.001"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="carton_volume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume (m³)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.001"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Palette Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Emballage - Palette
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="cartons_per_layer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cartons par couche</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="layers_per_palette"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Couches par palette</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cartons_per_palette"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cartons par palette</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="palette_dimensions_length"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longueur (cm)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="palette_dimensions_width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Largeur (cm)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="palette_dimensions_height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hauteur (cm)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="palette_weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poids (kg)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.001"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="palette_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de palette</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="US">US</SelectItem>
                          <SelectItem value="UK">UK</SelectItem>
                          <SelectItem value="Asia">Asia</SelectItem>
                          <SelectItem value="Custom">Personnalisée</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </Layout>
  );
}