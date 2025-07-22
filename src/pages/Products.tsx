import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Archive, FileText, AlertTriangle, Package, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import CategoryManager from "@/components/CategoryManager";
import { useCategories } from "@/hooks/useCategories";

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
  transitaire?: string;
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


const units = ["pièce", "kg", "litre", "mètre", "boîte"];
const imdgClasses = [
  "Classe 1 – Explosifs", "Classe 2.1 – Gaz inflammables", "Classe 2.2 – Gaz non inflammables", 
  "Classe 2.3 – Gaz toxiques", "Classe 3 – Liquides inflammables", 
  "Classe 4.1 – Solides inflammables", "Classe 4.2 – Matières auto-inflammables", 
  "Classe 4.3 – Réagissant dangereusement à l'eau", "Classe 5.1 – Comburants", 
  "Classe 5.2 – Peroxydes organiques", "Classe 6.1 – Substances toxiques", 
  "Classe 6.2 – Substances infectieuses", "Classe 7 – Radioactifs", 
  "Classe 8 – Corrosifs", "Classe 9 – Divers"
];

export default function Products() {
  const navigate = useNavigate();
  const { categories } = useCategories();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [productToArchive, setProductToArchive] = useState<Product | null>(null);


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
    navigate('/products/new');
  };

  const handleEditProduct = (product: Product) => {
    navigate(`/products/${product.id}`);
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

  const confirmArchiveProduct = async () => {
    if (!productToArchive) return;
    
    try {
      await handleArchiveProduct(productToArchive.id);
      setArchiveDialogOpen(false);
      setProductToArchive(null);
    } catch (error) {
      console.error('Error archiving product:', error);
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

        {/* Gestionnaire de catégories */}
        <CategoryManager />
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
          
          <Button onClick={handleAddProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau Produit
          </Button>
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
                  <TableRow 
                    key={product.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProduct(product);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductToArchive(product);
                            setArchiveDialogOpen(true);
                          }}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductToDelete(product);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
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

        <ConfirmationDialog
          open={archiveDialogOpen}
          onOpenChange={setArchiveDialogOpen}
          onConfirm={confirmArchiveProduct}
          title={productToArchive?.status === "active" ? "Archiver le produit" : "Réactiver le produit"}
          description={`Êtes-vous sûr de vouloir ${productToArchive?.status === "active" ? "archiver" : "réactiver"} le produit`}
          itemName={productToArchive?.name}
          confirmText={productToArchive?.status === "active" ? "Oui, archiver" : "Oui, réactiver"}
          cancelText="Annuler"
        />
      </div>
    </Layout>
  );
}