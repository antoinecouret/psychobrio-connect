import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useSortableData } from '@/hooks/useSortableData';
import { SortableTableHead } from '@/components/ui/sortable-table-head';

interface Theme {
  id: string;
  name: string;
  order_index: number;
  created_at: string;
}

const ThemeManager = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [themeName, setThemeName] = useState('');
  const queryClient = useQueryClient();

  // Fetch themes
  const { data: themes, isLoading } = useQuery({
    queryKey: ['catalog-themes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_themes')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as Theme[];
    },
  });

  // Create theme mutation
  const createThemeMutation = useMutation({
    mutationFn: async (name: string) => {
      const maxOrder = themes?.reduce((max, theme) => Math.max(max, theme.order_index), 0) || 0;
      const { data, error } = await supabase
        .from('catalog_themes')
        .insert([{ name, order_index: maxOrder + 1 }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-themes'] });
      setIsCreateDialogOpen(false);
      setThemeName('');
      toast({
        title: "Succès",
        description: "Thème créé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création du thème",
        variant: "destructive",
      });
    },
  });

  // Update theme mutation
  const updateThemeMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from('catalog_themes')
        .update({ name })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-themes'] });
      setEditingTheme(null);
      setThemeName('');
      toast({
        title: "Succès",
        description: "Thème modifié avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification du thème",
        variant: "destructive",
      });
    },
  });

  // Delete theme mutation
  const deleteThemeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('catalog_themes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-themes'] });
      toast({
        title: "Succès",
        description: "Thème supprimé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du thème",
        variant: "destructive",
      });
    },
  });

  // Reorder theme mutation
  const reorderThemeMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from('catalog_themes')
        .update({ order_index: newOrder })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-themes'] });
    },
  });

  const handleCreateTheme = () => {
    if (themeName.trim()) {
      createThemeMutation.mutate(themeName.trim());
    }
  };

  const handleUpdateTheme = () => {
    if (editingTheme && themeName.trim()) {
      updateThemeMutation.mutate({ id: editingTheme.id, name: themeName.trim() });
    }
  };

  const handleDeleteTheme = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce thème ?')) {
      deleteThemeMutation.mutate(id);
    }
  };

  const handleMoveTheme = (theme: Theme, direction: 'up' | 'down') => {
    if (!themes) return;
    
    const currentIndex = themes.findIndex(t => t.id === theme.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= themes.length) return;
    
    const targetTheme = themes[targetIndex];
    
    // Swap order_index values
    reorderThemeMutation.mutate({ id: theme.id, newOrder: targetTheme.order_index });
    reorderThemeMutation.mutate({ id: targetTheme.id, newOrder: theme.order_index });
  };

  const openEditDialog = (theme: Theme) => {
    setEditingTheme(theme);
    setThemeName(theme.name);
  };

  const closeEditDialog = () => {
    setEditingTheme(null);
    setThemeName('');
  };

  // Use sortable data
  const { items: sortedThemes, requestSort, sortConfig } = useSortableData(themes, { key: 'order_index', direction: 'asc' });

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestion des thèmes</CardTitle>
            <CardDescription>
              Créer, modifier et organiser les thèmes du catalogue
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau thème
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau thème</DialogTitle>
                <DialogDescription>
                  Entrez le nom du nouveau thème
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="theme-name">Nom du thème</Label>
                  <Input
                    id="theme-name"
                    value={themeName}
                    onChange={(e) => setThemeName(e.target.value)}
                    placeholder="Ex: Motricité globale"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleCreateTheme}
                    disabled={!themeName.trim() || createThemeMutation.isPending}
                  >
                    Créer
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead sortKey="order_index" onSort={requestSort} sortConfig={sortConfig}>
                Ordre
              </SortableTableHead>
              <SortableTableHead sortKey="name" onSort={requestSort} sortConfig={sortConfig}>
                Nom
              </SortableTableHead>
              <SortableTableHead sortKey="created_at" onSort={requestSort} sortConfig={sortConfig}>
                Date de création
              </SortableTableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedThemes?.map((theme, index) => (
              <TableRow key={theme.id}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{theme.order_index}</Badge>
                    <div className="flex flex-col">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveTheme(theme, 'up')}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveTheme(theme, 'down')}
                        disabled={index === sortedThemes.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{theme.name}</TableCell>
                <TableCell>
                  {new Date(theme.created_at).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(theme)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTheme(theme.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Edit Dialog */}
        <Dialog open={!!editingTheme} onOpenChange={closeEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le thème</DialogTitle>
              <DialogDescription>
                Modifiez le nom du thème
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-theme-name">Nom du thème</Label>
                <Input
                  id="edit-theme-name"
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  placeholder="Ex: Motricité globale"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={closeEditDialog}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleUpdateTheme}
                  disabled={!themeName.trim() || updateThemeMutation.isPending}
                >
                  Modifier
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ThemeManager;