import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  cost: number;
  dangerous: boolean;
  imdg_class?: string;
  suppliers: string[];
  units_per_package?: number;
  packages_per_carton?: number;
  cartons_per_palette?: number;
  palette_weight?: number;
  carton_weight?: number;
  package_weight?: number;
  description?: string;
}

interface OrderProduct {
  id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  palette_quantity?: number;
  carton_quantity?: number;
  products?: {
    id: string;
    name: string;
    sku: string;
    dangerous: boolean;
    imdg_class?: string;
  };
}

interface OrderProductsManagerProps {
  orderId: string;
  orderProducts: OrderProduct[];
  onUpdate: () => void;
}

export function OrderProductsManager({ orderId, orderProducts, onUpdate }: OrderProductsManagerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [paletteQuantity, setPaletteQuantity] = useState<number>(0);
  const [cartonQuantity, setCartonQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      setUnitPrice(selectedProduct.cost);
      calculateQuantities();
    }
  }, [selectedProduct, quantity]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error("Erreur lors du chargement des produits");
    }
  };

  const calculateQuantities = () => {
    if (!selectedProduct) return;

    const unitsPerPackage = selectedProduct.units_per_package || 1;
    const packagesPerCarton = selectedProduct.packages_per_carton || 1;
    const cartonsPerPalette = selectedProduct.cartons_per_palette || 1;

    // Calculer le nombre de cartons nécessaires
    const totalPackages = Math.ceil(quantity / unitsPerPackage);
    const cartonsNeeded = Math.ceil(totalPackages / packagesPerCarton);
    setCartonQuantity(cartonsNeeded);

    // Calculer le nombre de palettes nécessaires
    const palettesNeeded = Math.ceil(cartonsNeeded / cartonsPerPalette);
    setPaletteQuantity(palettesNeeded);
  };

  const handleAddProduct = async () => {
    if (!selectedProduct) return;

    setLoading(true);
    try {
      const totalPrice = quantity * unitPrice;

      const { error } = await supabase
        .from('order_products')
        .insert({
          order_id: orderId,
          product_id: selectedProduct.id,
          quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          palette_quantity: paletteQuantity,
          carton_quantity: cartonQuantity
        });

      if (error) throw error;

      toast.success("Produit ajouté à la commande");
      setIsAddDialogOpen(false);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error("Erreur lors de l'ajout du produit");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProduct = async (orderProductId: string) => {
    try {
      const { error } = await supabase
        .from('order_products')
        .delete()
        .eq('id', orderProductId);

      if (error) throw error;

      toast.success("Produit retiré de la commande");
      onUpdate();
    } catch (error) {
      console.error('Error removing product:', error);
      toast.error("Erreur lors de la suppression du produit");
    }
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setQuantity(1);
    setUnitPrice(0);
    setPaletteQuantity(0);
    setCartonQuantity(0);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produits commandés
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un produit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Ajouter un produit à la commande</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="product">Produit</Label>
                  <Select value={selectedProduct?.id || ""} onValueChange={(value) => {
                    const product = products.find(p => p.id === value);
                    setSelectedProduct(product || null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-64">
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{product.name}</span>
                              <span className="text-sm text-muted-foreground">
                                SKU: {product.sku} | {product.cost}€/{product.unit}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>

                {selectedProduct && (
                  <Card className="p-4 bg-muted/50">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Catégorie:</strong> {selectedProduct.category}
                      </div>
                      <div>
                        <strong>Unité:</strong> {selectedProduct.unit}
                      </div>
                      <div>
                        <strong>Fournisseurs:</strong> {selectedProduct.suppliers?.join(', ') || 'N/A'}
                      </div>
                      <div>
                        <strong>Prix coûtant:</strong> {selectedProduct.cost}€
                      </div>
                      {selectedProduct.units_per_package && (
                        <div>
                          <strong>Unités/paquet:</strong> {selectedProduct.units_per_package}
                        </div>
                      )}
                      {selectedProduct.packages_per_carton && (
                        <div>
                          <strong>Paquets/carton:</strong> {selectedProduct.packages_per_carton}
                        </div>
                      )}
                      {selectedProduct.cartons_per_palette && (
                        <div>
                          <strong>Cartons/palette:</strong> {selectedProduct.cartons_per_palette}
                        </div>
                      )}
                      {selectedProduct.dangerous && (
                        <div className="col-span-2">
                          <Badge variant="destructive">Produit dangereux</Badge>
                          {selectedProduct.imdg_class && (
                            <Badge variant="outline" className="ml-2">{selectedProduct.imdg_class}</Badge>
                          )}
                        </div>
                      )}
                      {selectedProduct.description && (
                        <div className="col-span-2">
                          <strong>Description:</strong> {selectedProduct.description}
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantité</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unitPrice">Prix unitaire (€)</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      step="0.01"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(Number(e.target.value))}
                    />
                  </div>
                </div>

                {selectedProduct && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cartons nécessaires</Label>
                      <Input value={cartonQuantity} readOnly className="bg-muted" />
                    </div>
                    <div>
                      <Label>Palettes nécessaires</Label>
                      <Input value={paletteQuantity} readOnly className="bg-muted" />
                    </div>
                  </div>
                )}

                <div className="text-right">
                  <p className="text-lg font-semibold">
                    Total: {(quantity * unitPrice).toLocaleString()}€
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleAddProduct} 
                    disabled={!selectedProduct || loading}
                  >
                    {loading ? "Ajout..." : "Ajouter"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orderProducts.map((orderProduct, index) => (
            <div key={orderProduct.id || index} className="flex justify-between items-center p-4 border rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium">{orderProduct.products?.name}</h4>
                <p className="text-sm text-muted-foreground">SKU: {orderProduct.products?.sku}</p>
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  {orderProduct.carton_quantity && (
                    <span>Cartons: {orderProduct.carton_quantity}</span>
                  )}
                  {orderProduct.palette_quantity && (
                    <span>Palettes: {orderProduct.palette_quantity}</span>
                  )}
                </div>
                {orderProduct.products?.dangerous && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="destructive">Dangereux</Badge>
                    {orderProduct.products?.imdg_class && (
                      <Badge variant="outline">{orderProduct.products.imdg_class}</Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="font-medium">Qté: {orderProduct.quantity}</p>
                <p className="text-sm text-muted-foreground">{orderProduct.unit_price}€ / unité</p>
                <p className="font-bold">{orderProduct.total_price.toLocaleString()}€</p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-2"
                  onClick={() => orderProduct.id && handleRemoveProduct(orderProduct.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {orderProducts.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Aucun produit dans cette commande
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}