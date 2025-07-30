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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

interface CreateAssessmentDialogProps {
  trigger?: React.ReactNode;
  preselectedPatientId?: string;
}

const CreateAssessmentDialog = ({ trigger, preselectedPatientId }: CreateAssessmentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: preselectedPatientId || '',
    date: new Date().toISOString().split('T')[0],
    template_id: '',
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer la liste des patients
  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, dossier_number')
        .order('last_name');
      
      if (error) throw error;
      return data;
    },
  });

  // Récupérer la liste des gabarits
  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('id, name, description, is_default')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const createAssessmentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) throw new Error('Non authentifié');

      const { data: assessment, error } = await supabase
        .from('assessments')
        .insert({
          patient_id: data.patient_id,
          practitioner_id: authUser.user.id,
          date: data.date,
          template_id: data.template_id === 'none' ? null : data.template_id || null,
          status: 'DRAFT',
        })
        .select()
        .single();

      if (error) throw error;
      return assessment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast({
        title: 'Bilan créé',
        description: 'Le nouveau bilan a été créé avec succès.',
      });
      setOpen(false);
      setFormData({
        patient_id: preselectedPatientId || '',
        date: new Date().toISOString().split('T')[0],
        template_id: '',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la création du bilan.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.date) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez sélectionner un patient et une date.',
        variant: 'destructive',
      });
      return;
    }
    createAssessmentMutation.mutate(formData);
  };

  const defaultTrigger = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Nouveau bilan
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un nouveau bilan</DialogTitle>
          <DialogDescription>
            Sélectionnez le patient et les paramètres pour créer un nouveau bilan psychomoteur.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="patient_id">Patient *</Label>
            <Select 
              value={formData.patient_id} 
              onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
              disabled={!!preselectedPatientId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un patient" />
              </SelectTrigger>
              <SelectContent>
                {patients?.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name} ({patient.dossier_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date">Date d'évaluation *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="template_id">Gabarit (optionnel)</Label>
            <Select 
              value={formData.template_id} 
              onValueChange={(value) => setFormData({ ...formData, template_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un gabarit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun gabarit</SelectItem>
                {templates?.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} {template.is_default && '(Par défaut)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createAssessmentMutation.isPending}>
              {createAssessmentMutation.isPending ? 'Création...' : 'Créer le bilan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAssessmentDialog;