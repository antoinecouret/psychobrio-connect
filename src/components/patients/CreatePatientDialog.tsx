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

type PatientSex = 'M' | 'F';

interface CreatePatientDialogProps {
  trigger?: React.ReactNode;
}

const CreatePatientDialog = ({ trigger }: CreatePatientDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    sex: '' as PatientSex | '',
    dossier_number: '',
    physician: '',
    school: '',
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPatientMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) throw new Error('Non authentifié');

      // S'assurer que sex est défini avant l'insertion
      if (!data.sex) throw new Error('Le sexe doit être sélectionné');

      const { data: patient, error } = await supabase
        .from('patients')
        .insert({
          first_name: data.first_name,
          last_name: data.last_name,
          birth_date: data.birth_date,
          sex: data.sex as PatientSex,
          dossier_number: data.dossier_number,
          physician: data.physician || null,
          school: data.school || null,
          created_by_user_id: authUser.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return patient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast({
        title: 'Patient créé',
        description: 'Le nouveau patient a été ajouté avec succès.',
      });
      setOpen(false);
      setFormData({
        first_name: '',
        last_name: '',
        birth_date: '',
        sex: '' as PatientSex | '',
        dossier_number: '',
        physician: '',
        school: '',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la création du patient.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.birth_date || !formData.sex || !formData.dossier_number) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez remplir tous les champs obligatoires.',
        variant: 'destructive',
      });
      return;
    }
    createPatientMutation.mutate(formData);
  };

  const defaultTrigger = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Nouveau patient
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un nouveau patient</DialogTitle>
          <DialogDescription>
            Saisissez les informations du patient. Les champs marqués d'un * sont obligatoires.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Prénom *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Prénom"
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Nom *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Nom de famille"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birth_date">Date de naissance *</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="sex">Sexe *</Label>
              <Select 
                value={formData.sex} 
                onValueChange={(value: PatientSex) => setFormData({ ...formData, sex: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculin</SelectItem>
                  <SelectItem value="F">Féminin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="dossier_number">Numéro de dossier *</Label>
            <Input
              id="dossier_number"
              value={formData.dossier_number}
              onChange={(e) => setFormData({ ...formData, dossier_number: e.target.value })}
              placeholder="ex: DOS-2024-001"
              required
            />
          </div>

          <div>
            <Label htmlFor="physician">Médecin prescripteur</Label>
            <Input
              id="physician"
              value={formData.physician}
              onChange={(e) => setFormData({ ...formData, physician: e.target.value })}
              placeholder="Dr. Nom du médecin"
            />
          </div>

          <div>
            <Label htmlFor="school">École</Label>
            <Input
              id="school"
              value={formData.school}
              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
              placeholder="Nom de l'établissement scolaire"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createPatientMutation.isPending}>
              {createPatientMutation.isPending ? 'Création...' : 'Créer le patient'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePatientDialog;