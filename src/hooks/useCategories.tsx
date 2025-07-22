import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .order('name');

      if (error) throw error;
      
      setCategories(data?.map(item => item.name) || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error("Erreur lors du chargement des catégories");
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryName: string) => {
    if (!categoryName.trim()) {
      toast.error("Le nom de la catégorie ne peut pas être vide");
      return false;
    }

    const trimmedCategory = categoryName.trim();
    
    if (categories.includes(trimmedCategory)) {
      toast.error("Cette catégorie existe déjà");
      return false;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .insert({ name: trimmedCategory });

      if (error) throw error;

      await fetchCategories(); // Refresh the list
      toast.success(`Catégorie "${trimmedCategory}" créée avec succès`);
      return true;
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error("Erreur lors de la création de la catégorie");
      return false;
    }
  };

  const updateCategory = async (oldName: string, newName: string) => {
    if (!newName.trim()) {
      toast.error("Le nom de la catégorie ne peut pas être vide");
      return false;
    }

    const trimmedNewName = newName.trim();
    
    if (oldName === trimmedNewName) {
      return true; // No change needed
    }

    if (categories.includes(trimmedNewName)) {
      toast.error("Cette catégorie existe déjà");
      return false;
    }

    try {
      // Update the category in the categories table
      const { error: categoryError } = await supabase
        .from('categories')
        .update({ name: trimmedNewName })
        .eq('name', oldName);

      if (categoryError) throw categoryError;

      // Update all products that use this category
      const { error: productsError } = await supabase
        .from('products')
        .update({ category: trimmedNewName })
        .eq('category', oldName);

      if (productsError) throw productsError;

      await fetchCategories(); // Refresh the list
      toast.success(`Catégorie "${oldName}" renommée en "${trimmedNewName}"`);
      return true;
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error("Erreur lors de la modification de la catégorie");
      return false;
    }
  };

  const deleteCategory = async (categoryName: string) => {
    try {
      // Check if any products use this category
      const { data: productsWithCategory, error: checkError } = await supabase
        .from('products')
        .select('id')
        .eq('category', categoryName);

      if (checkError) throw checkError;

      if (productsWithCategory && productsWithCategory.length > 0) {
        toast.error(`Impossible de supprimer la catégorie "${categoryName}" car ${productsWithCategory.length} produit(s) l'utilisent encore.`);
        return false;
      }

      // Delete from categories table
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('name', categoryName);

      if (error) throw error;

      await fetchCategories(); // Refresh the list
      toast.success(`Catégorie "${categoryName}" supprimée avec succès`);
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error("Erreur lors de la suppression de la catégorie");
      return false;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshCategories: fetchCategories
  };
}