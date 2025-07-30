import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

type UserRole = 'PSY' | 'ADMIN_PSY' | 'PARENT' | 'SUPERADMIN_TECH';

interface CreateUserDialogProps {
  trigger?: React.ReactNode;
}

const CreateUserDialog = ({ trigger }: CreateUserDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'PSY' as UserRole,
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Créer l'utilisateur via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        user_metadata: {
          name: data.name,
          role: data.role,
        },
        email_confirm: true, // Confirmer automatiquement l'email
      });

      if (authError) throw authError;

      // Mettre à jour le profil avec les informations supplémentaires
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          phone: data.phone,
          role: data.role,
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Utilisateur créé',
        description: 'Le nouvel utilisateur a été créé avec succès.',
      });
      setOpen(false);
      setFormData({
        email: '',
        password: '',
        name: '',
        phone: '',
        role: 'PSY' as UserRole,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la création de l\'utilisateur.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.name) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez remplir tous les champs obligatoires.',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.password.length < 6) {
      toast({
        title: 'Mot de passe trop court',
        description: 'Le mot de passe doit contenir au moins 6 caractères.',
        variant: 'destructive',
      });
      return;
    }
    
    createUserMutation.mutate(formData);
  };

  const defaultTrigger = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Nouvel utilisateur
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
          <DialogDescription>
            Créez un compte utilisateur pour accéder au système. Les champs marqués d'un * sont obligatoires.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom complet *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Prénom Nom"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemple.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Mot de passe temporaire *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 6 caractères"
              required
              minLength={6}
            />
          </div>

          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="06 12 34 56 78"
            />
          </div>

          <div>
            <Label htmlFor="role">Rôle *</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PSY">Psychomotricien</SelectItem>
                <SelectItem value="ADMIN_PSY">Administrateur PSY</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? 'Création...' : 'Créer l\'utilisateur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;