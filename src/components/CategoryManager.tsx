import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Check, X, Tag } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";

export default function CategoryManager() {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleCreateCategory = async () => {
    if (await createCategory(newCategoryName)) {
      setNewCategoryName("");
    }
  };

  const startEditing = (categoryName: string) => {
    setEditingCategory(categoryName);
    setEditingName(categoryName);
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setEditingName("");
  };

  const handleUpdateCategory = async () => {
    if (editingCategory && await updateCategory(editingCategory, editingName)) {
      setEditingCategory(null);
      setEditingName("");
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" ?`)) {
      await deleteCategory(categoryName);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Gestion des catégories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>Chargement des catégories...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Gestion des catégories
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create new category */}
        <div className="space-y-2">
          <Label htmlFor="new-category">Nouvelle catégorie</Label>
          <div className="flex gap-2">
            <Input
              id="new-category"
              placeholder="Nom de la catégorie"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateCategory();
                }
              }}
            />
            <Button onClick={handleCreateCategory} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Créer
            </Button>
          </div>
        </div>

        {/* Categories list */}
        <div className="space-y-2">
          <Label>Catégories existantes ({categories.length})</Label>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune catégorie disponible</p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category} className="flex items-center gap-2 p-2 border rounded-lg">
                  {editingCategory === category ? (
                    <>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleUpdateCategory();
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            cancelEditing();
                          }
                        }}
                        autoFocus
                      />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleUpdateCategory}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={cancelEditing}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Badge variant="secondary" className="flex-1 justify-start">
                        {category}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(category)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category)}
                        className="hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}