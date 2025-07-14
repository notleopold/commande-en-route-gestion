import { useState } from "react";
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
import { Plus, Search, Edit, Archive, FileText, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  dangerous: boolean;
  unit: string;
  cost: number;
  suppliers: string[];
  status: "active" | "archived";
  description?: string;
}

const mockProducts: Product[] = [
  {
    id: "PRD-001",
    name: "Ordinateur Portable Dell",
    category: "Informatique",
    sku: "DELL-LAP-001",
    dangerous: false,
    unit: "pièce",
    cost: 899.99,
    suppliers: ["Dell Direct", "Tech Solutions"],
    status: "active",
    description: "Ordinateur portable professionnel 15 pouces"
  },
  {
    id: "PRD-002",
    name: "Produit Chimique X",
    category: "Chimie",
    sku: "CHEM-X-001",
    dangerous: true,
    unit: "litre",
    cost: 45.50,
    suppliers: ["ChemCorp"],
    status: "active",
    description: "Produit chimique industriel - manipulation spéciale requise"
  },
];

const categories = ["Informatique", "Chimie", "Mécanique", "Électronique", "Mobilier"];
const units = ["pièce", "kg", "litre", "mètre", "boîte"];

export default function Products() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const form = useForm({
    defaultValues: {
      name: "",
      category: "",
      sku: "",
      dangerous: false,
      unit: "",
      cost: "",
      suppliers: "",
      description: "",
    },
  });

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
      unit: product.unit,
      cost: product.cost.toString(),
      suppliers: product.suppliers.join(", "),
      description: product.description || "",
    });
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleArchiveProduct = (productId: string) => {
    setProducts(prev => prev.map(p => 
      p.id === productId 
        ? { ...p, status: p.status === "active" ? "archived" : "active" }
        : p
    ));
    toast.success("Statut du produit mis à jour");
  };

  const onSubmit = (data: any) => {
    const productData = {
      ...data,
      cost: parseFloat(data.cost),
      suppliers: data.suppliers.split(",").map((s: string) => s.trim()),
      id: editingProduct?.id || `PRD-${Date.now()}`,
      status: editingProduct?.status || "active",
    };

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? productData : p));
      toast.success("Produit modifié avec succès");
    } else {
      setProducts(prev => [...prev, productData]);
      toast.success("Produit ajouté avec succès");
    }
    
    setDialogOpen(false);
    form.reset();
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Modifier le produit" : "Nouveau produit"}
                </DialogTitle>
                <DialogDescription>
                  {editingProduct ? "Modifiez les informations du produit" : "Ajoutez un nouveau produit au catalogue"}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Dangereux
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell>{product.cost.toFixed(2)} €</TableCell>
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
      </div>
    </Layout>
  );
}