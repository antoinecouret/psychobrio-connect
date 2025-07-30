import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Theme {
  id: string;
  name: string;
  order_index: number;
}

interface Subtheme {
  id: string;
  name: string;
  theme_id: string;
  order_index: number;
  created_at: string;
  catalog_themes?: Theme;
}

const SubthemeManager = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSubtheme, setEditingSubtheme] = useState<Subtheme | null>(null);
  const [subthemeName, setSubthemeName] = useState('');
  const [selectedThemeId, setSelectedThemeId] = useState('');
  const queryClient = useQueryClient();

  // Fetch themes for dropdown
  const { data: themes } = useQuery({
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

  // Fetch subthemes
  const { data: subthemes, isLoading } = useQuery({
    queryKey: ['catalog-subthemes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_subthemes')
        .select(`
          *,
          catalog_themes!theme_id (
            id,
            name,
            order_index
          )
        `)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as Subtheme[];
    },
  });

  // Create subtheme mutation
  const createSubthemeMutation = useMutation({
    mutationFn: async ({ name, themeId }: { name: string; themeId: string }) => {
      const maxOrder = subthemes
        ?.filter(s => s.theme_id === themeId)
        .reduce((max, subtheme) => Math.max(max, subtheme.order_index), 0) || 0;
      
      const { data, error } = await supabase
        .from('catalog_subthemes')
        .insert([{ name, theme_id: themeId, order_index: maxOrder + 1 }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-subthemes'] });
      setIsCreateDialogOpen(false);
      setSubthemeName('');
      setSelectedThemeId('');
      toast({
        title: "Succès",
        description: "Sous-thème créé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création du sous-thème",
        variant: "destructive",
      });
    },
  });

  // Update subtheme mutation
  const updateSubthemeMutation = useMutation({
    mutationFn: async ({ id, name, themeId }: { id: string; name: string; themeId: string }) => {
      const { data, error } = await supabase
        .from('catalog_subthemes')
        .update({ name, theme_id: themeId })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-subthemes'] });
      setEditingSubtheme(null);
      setSubthemeName('');
      setSelectedThemeId('');
      toast({
        title: "Succès",
        description: "Sous-thème modifié avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification du sous-thème",
        variant: "destructive",
      });
    },
  });

  // Delete subtheme mutation
  const deleteSubthemeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('catalog_subthemes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-subthemes'] });
      toast({
        title: "Succès",
        description: "Sous-thème supprimé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du sous-thème",
        variant: "destructive",
      });
    },
  });

  // Reorder subtheme mutation
  const reorderSubthemeMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from('catalog_subthemes')
        .update({ order_index: newOrder })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-subthemes'] });
    },
  });

  const handleCreateSubtheme = () => {
    if (subthemeName.trim() && selectedThemeId) {
      createSubthemeMutation.mutate({ name: subthemeName.trim(), themeId: selectedThemeId });
    }
  };

  const handleUpdateSubtheme = () => {
    if (editingSubtheme && subthemeName.trim() && selectedThemeId) {
      updateSubthemeMutation.mutate({ 
        id: editingSubtheme.id, 
        name: subthemeName.trim(), 
        themeId: selectedThemeId 
      });
    }
  };

  const handleDeleteSubtheme = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce sous-thème ?')) {
      deleteSubthemeMutation.mutate(id);
    }
  };

  const handleMoveSubtheme = (subtheme: Subtheme, direction: 'up' | 'down') => {
    if (!subthemes) return;
    
    // Only consider subthemes in the same theme
    const sameThemeSubthemes = subthemes.filter(s => s.theme_id === subtheme.theme_id);
    const currentIndex = sameThemeSubthemes.findIndex(s => s.id === subtheme.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= sameThemeSubthemes.length) return;
    
    const targetSubtheme = sameThemeSubthemes[targetIndex];
    
    // Swap order_index values
    reorderSubthemeMutation.mutate({ id: subtheme.id, newOrder: targetSubtheme.order_index });
    reorderSubthemeMutation.mutate({ id: targetSubtheme.id, newOrder: subtheme.order_index });
  };

  const openEditDialog = (subtheme: Subtheme) => {
    setEditingSubtheme(subtheme);
    setSubthemeName(subtheme.name);
    setSelectedThemeId(subtheme.theme_id);
  };

  const closeEditDialog = () => {
    setEditingSubtheme(null);
    setSubthemeName('');
    setSelectedThemeId('');
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestion des sous-thèmes</CardTitle>
            <CardDescription>
              Créer, modifier et organiser les sous-thèmes par thème
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau sous-thème
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau sous-thème</DialogTitle>
                <DialogDescription>
                  Entrez le nom du nouveau sous-thème et sélectionnez son thème parent
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="theme-select">Thème parent</Label>
                  <Select value={selectedThemeId} onValueChange={setSelectedThemeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un thème" />
                    </SelectTrigger>
                    <SelectContent>
                      {themes?.map((theme) => (
                        <SelectItem key={theme.id} value={theme.id}>
                          {theme.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subtheme-name">Nom du sous-thème</Label>
                  <Input
                    id="subtheme-name"
                    value={subthemeName}
                    onChange={(e) => setSubthemeName(e.target.value)}
                    placeholder="Ex: Coordination oculo-manuelle"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleCreateSubtheme}
                    disabled={!subthemeName.trim() || !selectedThemeId || createSubthemeMutation.isPending}
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
              <TableHead>Ordre</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Thème parent</TableHead>
              <TableHead>Date de création</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subthemes?.map((subtheme) => {
              const sameThemeSubthemes = subthemes.filter(s => s.theme_id === subtheme.theme_id);
              const indexInTheme = sameThemeSubthemes.findIndex(s => s.id === subtheme.id);
              
              return (
                <TableRow key={subtheme.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{subtheme.order_index}</Badge>
                      <div className="flex flex-col">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveSubtheme(subtheme, 'up')}
                          disabled={indexInTheme === 0}
                          className="h-6 w-6 p-0"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveSubtheme(subtheme, 'down')}
                          disabled={indexInTheme === sameThemeSubthemes.length - 1}
                          className="h-6 w-6 p-0"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{subtheme.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {subtheme.catalog_themes?.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(subtheme.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(subtheme)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSubtheme(subtheme.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Edit Dialog */}
        <Dialog open={!!editingSubtheme} onOpenChange={closeEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le sous-thème</DialogTitle>
              <DialogDescription>
                Modifiez le nom du sous-thème et son thème parent
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-theme-select">Thème parent</Label>
                <Select value={selectedThemeId} onValueChange={setSelectedThemeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un thème" />
                  </SelectTrigger>
                  <SelectContent>
                    {themes?.map((theme) => (
                      <SelectItem key={theme.id} value={theme.id}>
                        {theme.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-subtheme-name">Nom du sous-thème</Label>
                <Input
                  id="edit-subtheme-name"
                  value={subthemeName}
                  onChange={(e) => setSubthemeName(e.target.value)}
                  placeholder="Ex: Coordination oculo-manuelle"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={closeEditDialog}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleUpdateSubtheme}
                  disabled={!subthemeName.trim() || !selectedThemeId || updateSubthemeMutation.isPending}
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

export default SubthemeManager;