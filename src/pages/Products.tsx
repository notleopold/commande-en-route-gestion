import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Edit, Archive, FileText, AlertTriangle, Package, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

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

const categories = ["Informatique", "Chimie", "Mécanique", "Électronique", "Mobilier"];
const units = ["pièce", "kg", "litre", "mètre", "boîte"];
const imdgClasses = [
  "Classe 1", "Classe 2.1", "Classe 2.2", "Classe 2.3", "Classe 3", 
  "Classe 4.1", "Classe 4.2", "Classe 4.3", "Classe 5.1", "Classe 5.2", 
  "Classe 6.1", "Classe 6.2", "Classe 7", "Classe 8", "Classe 9"
];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const form = useForm({
    defaultValues: {
      name: "",
      category: "",
      sku: "",
      dangerous: false,
      imdg_class: "",
      unit: "",
      cost: "",
      suppliers: "",
      description: "",
      // Package level
      units_per_package: "",
      package_dimensions_length: "",
      package_dimensions_width: "",
      package_dimensions_height: "",
      package_weight: "",
      package_volume: "",
      package_material_code: "",
      package_signage: "",
      // Carton level
      packages_per_carton: "",
      units_per_carton: "",
      carton_dimensions_length: "",
      carton_dimensions_width: "",
      carton_dimensions_height: "",
      carton_weight: "",
      carton_volume: "",
      carton_material_code: "",
      carton_signage: "",
      // Palette level
      cartons_per_layer: "",
      cartons_per_palette: "",
      layers_per_palette: "",
      palette_dimensions_length: "",
      palette_dimensions_width: "",
      palette_dimensions_height: "",
      palette_weight: "",
      palette_type: "",
    },
  });

  // Fetch products from Supabase
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error("Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesArchived = showArchived || product.status === "active";
    
    return matchesSearch && matchesCategory && matchesArchived;
  });

  const handleAddProduct = () => {
    form.reset();
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    form.reset({
      name: product.name,
      category: product.category,
      sku: product.sku,
      dangerous: product.dangerous,
      imdg_class: product.imdg_class || "",
      unit: product.unit,
      cost: product.cost.toString(),
      suppliers: product.suppliers.join(", "),
      description: product.description || "",
      // Package level
      units_per_package: product.units_per_package?.toString() || "",
      package_dimensions_length: product.package_dimensions_length?.toString() || "",
      package_dimensions_width: product.package_dimensions_width?.toString() || "",
      package_dimensions_height: product.package_dimensions_height?.toString() || "",
      package_weight: product.package_weight?.toString() || "",
      package_volume: product.package_volume?.toString() || "",
      package_material_code: product.package_material_code || "",
      package_signage: product.package_signage || "",
      // Carton level
      packages_per_carton: product.packages_per_carton?.toString() || "",
      units_per_carton: product.units_per_carton?.toString() || "",
      carton_dimensions_length: product.carton_dimensions_length?.toString() || "",
      carton_dimensions_width: product.carton_dimensions_width?.toString() || "",
      carton_dimensions_height: product.carton_dimensions_height?.toString() || "",
      carton_weight: product.carton_weight?.toString() || "",
      carton_volume: product.carton_volume?.toString() || "",
      carton_material_code: product.carton_material_code || "",
      carton_signage: product.carton_signage || "",
      // Palette level
      cartons_per_layer: product.cartons_per_layer?.toString() || "",
      cartons_per_palette: product.cartons_per_palette?.toString() || "",
      layers_per_palette: product.layers_per_palette?.toString() || "",
      palette_dimensions_length: product.palette_dimensions_length?.toString() || "",
      palette_dimensions_width: product.palette_dimensions_width?.toString() || "",
      palette_dimensions_height: product.palette_dimensions_height?.toString() || "",
      palette_weight: product.palette_weight?.toString() || "",
      palette_type: product.palette_type || "",
    });
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleArchiveProduct = async (productId: string) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const newStatus = product.status === "active" ? "archived" : "active";
      
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, status: newStatus }
          : p
      ));
      toast.success("Statut du produit mis à jour");
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      const { error } = await supabase.rpc('move_to_trash', {
        p_table_name: 'products',
        p_item_id: productToDelete.id,
        p_reason: 'Suppression via interface utilisateur'
      });

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      toast.success("Produit déplacé vers la corbeille");
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const productData = {
        name: data.name,
        category: data.category,
        sku: data.sku,
        dangerous: data.dangerous,
        imdg_class: data.dangerous && data.imdg_class ? data.imdg_class : null,
        unit: data.unit,
        cost: parseFloat(data.cost),
        suppliers: data.suppliers.split(",").map((s: string) => s.trim()),
        description: data.description,
        status: editingProduct?.status || "active",
        // Package level
        units_per_package: data.units_per_package ? parseInt(data.units_per_package) : null,
        package_dimensions_length: data.package_dimensions_length ? parseFloat(data.package_dimensions_length) : null,
        package_dimensions_width: data.package_dimensions_width ? parseFloat(data.package_dimensions_width) : null,
        package_dimensions_height: data.package_dimensions_height ? parseFloat(data.package_dimensions_height) : null,
        package_weight: data.package_weight ? parseFloat(data.package_weight) : null,
        package_volume: data.package_volume ? parseFloat(data.package_volume) : null,
        package_material_code: data.package_material_code || null,
        package_signage: data.package_signage || null,
        // Carton level
        packages_per_carton: data.packages_per_carton ? parseInt(data.packages_per_carton) : null,
        units_per_carton: data.units_per_carton ? parseInt(data.units_per_carton) : null,
        carton_dimensions_length: data.carton_dimensions_length ? parseFloat(data.carton_dimensions_length) : null,
        carton_dimensions_width: data.carton_dimensions_width ? parseFloat(data.carton_dimensions_width) : null,
        carton_dimensions_height: data.carton_dimensions_height ? parseFloat(data.carton_dimensions_height) : null,
        carton_weight: data.carton_weight ? parseFloat(data.carton_weight) : null,
        carton_volume: data.carton_volume ? parseFloat(data.carton_volume) : null,
        carton_material_code: data.carton_material_code || null,
        carton_signage: data.carton_signage || null,
        // Palette level
        cartons_per_layer: data.cartons_per_layer ? parseInt(data.cartons_per_layer) : null,
        cartons_per_palette: data.cartons_per_palette ? parseInt(data.cartons_per_palette) : null,
        layers_per_palette: data.layers_per_palette ? parseInt(data.layers_per_palette) : null,
        palette_dimensions_length: data.palette_dimensions_length ? parseFloat(data.palette_dimensions_length) : null,
        palette_dimensions_width: data.palette_dimensions_width ? parseFloat(data.palette_dimensions_width) : null,
        palette_dimensions_height: data.palette_dimensions_height ? parseFloat(data.palette_dimensions_height) : null,
        palette_weight: data.palette_weight ? parseFloat(data.palette_weight) : null,
        palette_type: data.palette_type || null,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success("Produit modifié avec succès");
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
        toast.success("Produit ajouté avec succès");
      }
      
      setDialogOpen(false);
      form.reset();
      fetchProducts(); // Refresh the list
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  return (
    <Layout title="Catalogue Produits">
      <div className="space-y-6">
        {/* Header avec stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.filter(p => p.status === "active").length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits Dangereux</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.filter(p => p.dangerous && p.status === "active").length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Catégories</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{new Set(products.map(p => p.category)).size}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Archivés</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.filter(p => p.status === "archived").length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={showArchived}
                onCheckedChange={setShowArchived}
              />
              <label className="text-sm">Afficher archivés</label>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddProduct}>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Produit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Modifier le produit" : "Nouveau produit"}
                </DialogTitle>
                <DialogDescription>
                  {editingProduct ? "Modifiez les informations du produit" : "Ajoutez un nouveau produit au catalogue"}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="general">Général</TabsTrigger>
                      <TabsTrigger value="package">Paquet</TabsTrigger>
                      <TabsTrigger value="carton">Carton</TabsTrigger>
                      <TabsTrigger value="palette">Palette</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="general" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom du produit</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Nom du produit" />
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
                                <Input {...field} placeholder="SKU-001" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Catégorie</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner une catégorie" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map(category => (
                                    <SelectItem key={category} value={category}>{category}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner une unité" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {units.map(unit => (
                                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="cost"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Coût unitaire (€)</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" placeholder="0.00" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="dangerous"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Produit dangereux</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Nécessite des déclarations spéciales
                                </div>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {form.watch("dangerous") && (
                        <FormField
                          control={form.control}
                          name="imdg_class"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Classe IMDG</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner une classe IMDG" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {imdgClasses.map(imdgClass => (
                                    <SelectItem key={imdgClass} value={imdgClass}>{imdgClass}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      <FormField
                        control={form.control}
                        name="suppliers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fournisseurs (séparés par des virgules)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Fournisseur 1, Fournisseur 2" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Description du produit..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    
                    <TabsContent value="package" className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Conditionnement Paquet
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="units_per_package"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unités par paquet</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" placeholder="50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="package_weight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Poids brut paquet (kg)</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" placeholder="0.59" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="package_dimensions_length"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Longueur (cm)</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.1" placeholder="10.0" />
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
                                <Input {...field} type="number" step="0.1" placeholder="23.0" />
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
                                <Input {...field} type="number" step="0.1" placeholder="21.5" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="package_volume"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Volume paquet (m³)</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.000001" placeholder="0.004945" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="package_material_code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Code matière/recyclage</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="97/129/CE OPP 5" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="package_signage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Signage</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Triman + Info-Tri" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    
                    <TabsContent value="carton" className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Conditionnement Carton
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="packages_per_carton"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Paquets par carton</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" placeholder="14" />
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
                                <Input {...field} type="number" placeholder="700" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="carton_dimensions_length"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Longueur (cm)</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.1" placeholder="24.5" />
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
                                <Input {...field} type="number" step="0.1" placeholder="74.0" />
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
                                <Input {...field} type="number" step="0.1" placeholder="48.0" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="carton_weight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Poids brut carton (kg)</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" placeholder="8.26" />
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
                              <FormLabel>Volume carton (m³)</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.000001" placeholder="0.087024" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="carton_material_code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Code matière/recyclage</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="97/129/CE PAP 20" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="carton_signage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Signage</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Triman + Info-Tri" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="palette" className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Conditionnement Palette
                      </h3>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="cartons_per_layer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cartons par couche</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" placeholder="4" />
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
                                <Input {...field} type="number" placeholder="12" />
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
                              <FormLabel>Couches</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" placeholder="3" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="palette_dimensions_length"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Longueur (cm)</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.1" placeholder="120.0" />
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
                                <Input {...field} type="number" step="0.1" placeholder="80.0" />
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
                                <Input {...field} type="number" step="0.1" placeholder="164.0" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="palette_weight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Poids total palette (kg)</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" placeholder="123.12" />
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
                              <FormControl>
                                <Input {...field} placeholder="E159" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {editingProduct ? "Modifier" : "Ajouter"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table des produits */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des produits</CardTitle>
            <CardDescription>
              Gérez votre catalogue de produits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Unité</TableHead>
                  <TableHead>Coût</TableHead>
                  <TableHead>Colisage</TableHead>
                  <TableHead>Palettes</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.dangerous && (
                            <div className="flex gap-1">
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Dangereux
                              </Badge>
                              {product.imdg_class && (
                                <Badge variant="outline" className="text-xs">
                                  {product.imdg_class}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell>{product.cost.toFixed(2)} €</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {product.units_per_package && (
                          <div>{product.units_per_package} {product.unit}/paquet</div>
                        )}
                        {product.packages_per_carton && (
                          <div>{product.packages_per_carton} paquets/carton</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {product.cartons_per_palette && (
                          <div>{product.cartons_per_palette} cartons/palette</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.status === "active" ? "default" : "secondary"}>
                        {product.status === "active" ? "Actif" : "Archivé"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleArchiveProduct(product.id)}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProduct(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={confirmDeleteProduct}
          title="ATTENTION CETTE ACTION EST IRRÉVERSIBLE"
          description="Êtes-vous sûr de vouloir supprimer le produit"
          itemName={productToDelete?.name}
          confirmText="Oui, supprimer définitivement"
          cancelText="Annuler"
        />
      </div>
    </Layout>
  );
}