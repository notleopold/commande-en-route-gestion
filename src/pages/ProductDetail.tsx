import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Package, AlertTriangle, Ruler, Weight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  useEffect(() => {
    if (id) {
      fetchProduct();
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
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error("Erreur lors du chargement du produit");
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Layout title="Chargement..."><div>Chargement...</div></Layout>;
  }

  if (!product) {
    return <Layout title="Produit introuvable"><div>Produit introuvable</div></Layout>;
  }

  return (
    <Layout title={product.name}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/products')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{product.name}</h1>
              <p className="text-muted-foreground">SKU: {product.sku}</p>
            </div>
          </div>
          <Button onClick={() => navigate(`/products/${product.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
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
              <div>
                <label className="text-sm text-muted-foreground">Catégorie</label>
                <p className="font-medium">{product.category}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Unité</label>
                <p className="font-medium">{product.unit}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Coût</label>
                <p className="font-medium">{product.cost}€</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Statut</label>
                <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                  {product.status === 'active' ? 'Actif' : 'Archivé'}
                </Badge>
              </div>
              {product.dangerous && (
                <div>
                  <label className="text-sm text-muted-foreground">Produit dangereux</label>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Dangereux
                    </Badge>
                    {product.imdg_class && (
                      <Badge variant="outline">{product.imdg_class}</Badge>
                    )}
                  </div>
                </div>
              )}
              {product.suppliers && product.suppliers.length > 0 && (
                <div>
                  <label className="text-sm text-muted-foreground">Fournisseurs</label>
                  <div className="flex flex-wrap gap-2">
                    {product.suppliers.map((supplier, index) => (
                      <Badge key={index} variant="outline">{supplier}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {product.description && (
                <div>
                  <label className="text-sm text-muted-foreground">Description</label>
                  <p className="text-sm">{product.description}</p>
                </div>
              )}
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
              {product.units_per_package && (
                <div>
                  <label className="text-sm text-muted-foreground">Unités par paquet</label>
                  <p className="font-medium">{product.units_per_package}</p>
                </div>
              )}
              {(product.package_dimensions_length || product.package_dimensions_width || product.package_dimensions_height) && (
                <div>
                  <label className="text-sm text-muted-foreground">Dimensions (L x l x h)</label>
                  <p className="font-medium">
                    {product.package_dimensions_length || '?'} x {product.package_dimensions_width || '?'} x {product.package_dimensions_height || '?'} cm
                  </p>
                </div>
              )}
              {product.package_weight && (
                <div>
                  <label className="text-sm text-muted-foreground">Poids</label>
                  <p className="font-medium">{product.package_weight} kg</p>
                </div>
              )}
              {product.package_volume && (
                <div>
                  <label className="text-sm text-muted-foreground">Volume</label>
                  <p className="font-medium">{product.package_volume} m³</p>
                </div>
              )}
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
              {product.packages_per_carton && (
                <div>
                  <label className="text-sm text-muted-foreground">Paquets par carton</label>
                  <p className="font-medium">{product.packages_per_carton}</p>
                </div>
              )}
              {product.units_per_carton && (
                <div>
                  <label className="text-sm text-muted-foreground">Unités par carton</label>
                  <p className="font-medium">{product.units_per_carton}</p>
                </div>
              )}
              {(product.carton_dimensions_length || product.carton_dimensions_width || product.carton_dimensions_height) && (
                <div>
                  <label className="text-sm text-muted-foreground">Dimensions (L x l x h)</label>
                  <p className="font-medium">
                    {product.carton_dimensions_length || '?'} x {product.carton_dimensions_width || '?'} x {product.carton_dimensions_height || '?'} cm
                  </p>
                </div>
              )}
              {product.carton_weight && (
                <div>
                  <label className="text-sm text-muted-foreground">Poids</label>
                  <p className="font-medium">{product.carton_weight} kg</p>
                </div>
              )}
              {product.carton_volume && (
                <div>
                  <label className="text-sm text-muted-foreground">Volume</label>
                  <p className="font-medium">{product.carton_volume} m³</p>
                </div>
              )}
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
              {product.cartons_per_layer && (
                <div>
                  <label className="text-sm text-muted-foreground">Cartons par couche</label>
                  <p className="font-medium">{product.cartons_per_layer}</p>
                </div>
              )}
              {product.layers_per_palette && (
                <div>
                  <label className="text-sm text-muted-foreground">Couches par palette</label>
                  <p className="font-medium">{product.layers_per_palette}</p>
                </div>
              )}
              {product.cartons_per_palette && (
                <div>
                  <label className="text-sm text-muted-foreground">Cartons par palette</label>
                  <p className="font-medium">{product.cartons_per_palette}</p>
                </div>
              )}
              {(product.palette_dimensions_length || product.palette_dimensions_width || product.palette_dimensions_height) && (
                <div>
                  <label className="text-sm text-muted-foreground">Dimensions (L x l x h)</label>
                  <p className="font-medium">
                    {product.palette_dimensions_length || '?'} x {product.palette_dimensions_width || '?'} x {product.palette_dimensions_height || '?'} cm
                  </p>
                </div>
              )}
              {product.palette_weight && (
                <div>
                  <label className="text-sm text-muted-foreground">Poids</label>
                  <p className="font-medium">{product.palette_weight} kg</p>
                </div>
              )}
              {product.palette_type && (
                <div>
                  <label className="text-sm text-muted-foreground">Type de palette</label>
                  <p className="font-medium">{product.palette_type}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}