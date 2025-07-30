import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Subtheme {
  id: string;
  name: string;
  theme_id: string;
  catalog_themes?: {
    id: string;
    name: string;
  };
}

interface Item {
  id: string;
  name: string;
  code: string;
  description?: string;
  unit?: string;
  direction: 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER';
  subtheme_id: string;
  version: string;
  created_at: string;
  catalog_subthemes?: Subtheme;
}

type ItemFormData = {
  name: string;
  code: string;
  description: string;
  unit: string;
  direction: 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER';
  subtheme_id: string;
};

const ItemManager = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemData, setItemData] = useState<ItemFormData>({
    name: '',
    code: '',
    description: '',
    unit: '',
    direction: 'HIGHER_IS_BETTER',
    subtheme_id: '',
  });
  const queryClient = useQueryClient();

  // Fetch subthemes for dropdown
  const { data: subthemes } = useQuery({
    queryKey: ['catalog-subthemes-with-themes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_subthemes')
        .select(`
          *,
          catalog_themes!catalog_subthemes_theme_id_fkey (
            id,
            name
          )
        `)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as Subtheme[];
    },
  });

  // Fetch items
  const { data: items, isLoading } = useQuery({
    queryKey: ['catalog-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_items')
        .select(`
          *,
          catalog_subthemes!catalog_items_subtheme_id_fkey (
            id,
            name,
            theme_id,
            catalog_themes!catalog_subthemes_theme_id_fkey (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Item[];
    },
  });

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (formData: ItemFormData) => {
      const { data, error } = await supabase
        .from('catalog_items')
        .insert([{
          name: formData.name,
          code: formData.code,
          description: formData.description || null,
          unit: formData.unit || null,
          direction: formData.direction,
          subtheme_id: formData.subtheme_id,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-items'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Succès",
        description: "Item créé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de l'item",
        variant: "destructive",
      });
    },
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: ItemFormData }) => {
      const { data, error } = await supabase
        .from('catalog_items')
        .update({
          name: formData.name,
          code: formData.code,
          description: formData.description || null,
          unit: formData.unit || null,
          direction: formData.direction,
          subtheme_id: formData.subtheme_id,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-items'] });
      setEditingItem(null);
      resetForm();
      toast({
        title: "Succès",
        description: "Item modifié avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification de l'item",
        variant: "destructive",
      });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('catalog_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-items'] });
      toast({
        title: "Succès",
        description: "Item supprimé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de l'item",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setItemData({
      name: '',
      code: '',
      description: '',
      unit: '',
      direction: 'HIGHER_IS_BETTER',
      subtheme_id: '',
    });
  };

  const handleCreateItem = () => {
    if (itemData.name.trim() && itemData.code.trim() && itemData.subtheme_id) {
      createItemMutation.mutate(itemData);
    }
  };

  const handleUpdateItem = () => {
    if (editingItem && itemData.name.trim() && itemData.code.trim() && itemData.subtheme_id) {
      updateItemMutation.mutate({ id: editingItem.id, formData: itemData });
    }
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet item ?')) {
      deleteItemMutation.mutate(id);
    }
  };

  const openEditDialog = (item: Item) => {
    setEditingItem(item);
    setItemData({
      name: item.name,
      code: item.code,
      description: item.description || '',
      unit: item.unit || '',
      direction: item.direction,
      subtheme_id: item.subtheme_id,
    });
  };

  const closeEditDialog = () => {
    setEditingItem(null);
    resetForm();
  };

  const handleDirectionChange = (value: string) => {
    setItemData({
      ...itemData,
      direction: value as 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER'
    });
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestion des items</CardTitle>
            <CardDescription>
              Créer, modifier et organiser les items de test par sous-thème
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un nouvel item</DialogTitle>
                <DialogDescription>
                  Entrez les informations du nouvel item de test
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <Label htmlFor="subtheme-select">Sous-thème</Label>
                  <Select value={itemData.subtheme_id} onValueChange={(value) => setItemData({...itemData, subtheme_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un sous-thème" />
                    </SelectTrigger>
                    <SelectContent>
                      {subthemes?.map((subtheme) => (
                        <SelectItem key={subtheme.id} value={subtheme.id}>
                          {subtheme.catalog_themes?.name} / {subtheme.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="item-name">Nom de l'item</Label>
                    <Input
                      id="item-name"
                      value={itemData.name}
                      onChange={(e) => setItemData({...itemData, name: e.target.value})}
                      placeholder="Ex: Lancer de précision"
                    />
                  </div>
                  <div>
                    <Label htmlFor="item-code">Code</Label>
                    <Input
                      id="item-code"
                      value={itemData.code}
                      onChange={(e) => setItemData({...itemData, code: e.target.value})}
                      placeholder="Ex: COORD_001"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="item-description">Description</Label>
                  <Textarea
                    id="item-description"
                    value={itemData.description}
                    onChange={(e) => setItemData({...itemData, description: e.target.value})}
                    placeholder="Description de l'item de test..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="item-unit">Unité</Label>
                    <Input
                      id="item-unit"
                      value={itemData.unit}
                      onChange={(e) => setItemData({...itemData, unit: e.target.value})}
                      placeholder="Ex: secondes, points, cm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="item-direction">Direction du score</Label>
                    <Select value={itemData.direction} onValueChange={handleDirectionChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HIGHER_IS_BETTER">Plus élevé = mieux</SelectItem>
                        <SelectItem value="LOWER_IS_BETTER">Plus bas = mieux</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleCreateItem}
                    disabled={!itemData.name.trim() || !itemData.code.trim() || !itemData.subtheme_id || createItemMutation.isPending}
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
              <TableHead>Code</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Sous-thème</TableHead>
              <TableHead>Unité</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items?.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Badge variant="outline">{item.code}</Badge>
                </TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">{item.catalog_subthemes?.catalog_themes?.name}</div>
                    <div className="text-muted-foreground">{item.catalog_subthemes?.name}</div>
                  </div>
                </TableCell>
                <TableCell>{item.unit || '-'}</TableCell>
                <TableCell>
                  <Badge variant={item.direction === 'HIGHER_IS_BETTER' ? 'default' : 'secondary'}>
                    {item.direction === 'HIGHER_IS_BETTER' ? '↑ Mieux' : '↓ Mieux'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
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
        <Dialog open={!!editingItem} onOpenChange={closeEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier l'item</DialogTitle>
              <DialogDescription>
                Modifiez les informations de l'item de test
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <Label htmlFor="edit-subtheme-select">Sous-thème</Label>
                <Select value={itemData.subtheme_id} onValueChange={(value) => setItemData({...itemData, subtheme_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un sous-thème" />
                  </SelectTrigger>
                  <SelectContent>
                    {subthemes?.map((subtheme) => (
                      <SelectItem key={subtheme.id} value={subtheme.id}>
                        {subtheme.catalog_themes?.name} / {subtheme.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-item-name">Nom de l'item</Label>
                  <Input
                    id="edit-item-name"
                    value={itemData.name}
                    onChange={(e) => setItemData({...itemData, name: e.target.value})}
                    placeholder="Ex: Lancer de précision"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-item-code">Code</Label>
                  <Input
                    id="edit-item-code"
                    value={itemData.code}
                    onChange={(e) => setItemData({...itemData, code: e.target.value})}
                    placeholder="Ex: COORD_001"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-item-description">Description</Label>
                <Textarea
                  id="edit-item-description"
                  value={itemData.description}
                  onChange={(e) => setItemData({...itemData, description: e.target.value})}
                  placeholder="Description de l'item de test..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-item-unit">Unité</Label>
                  <Input
                    id="edit-item-unit"
                    value={itemData.unit}
                    onChange={(e) => setItemData({...itemData, unit: e.target.value})}
                    placeholder="Ex: secondes, points, cm"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-item-direction">Direction du score</Label>
                  <Select value={itemData.direction} onValueChange={handleDirectionChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGHER_IS_BETTER">Plus élevé = mieux</SelectItem>
                      <SelectItem value="LOWER_IS_BETTER">Plus bas = mieux</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={closeEditDialog}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleUpdateItem}
                  disabled={!itemData.name.trim() || !itemData.code.trim() || !itemData.subtheme_id || updateItemMutation.isPending}
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

export default ItemManager;