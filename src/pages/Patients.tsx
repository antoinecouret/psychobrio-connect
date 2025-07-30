import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import CreatePatientDialog from '@/components/patients/CreatePatientDialog';
import CreateAssessmentDialog from '@/components/assessments/CreateAssessmentDialog';

const Patients = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredPatients = patients?.filter(patient =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.dossier_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Patients</h1>
          <p className="text-muted-foreground">
            Gérer les dossiers patients et représentants légaux
          </p>
        </div>
        <CreatePatientDialog />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou numéro de dossier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPatients?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? 'Aucun patient trouvé.' : 'Aucun patient enregistré.'}
                </p>
                <CreatePatientDialog 
                  trigger={
                    <Button className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Créer le premier patient
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            filteredPatients?.map((patient) => (
              <Card key={patient.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{patient.first_name} {patient.last_name}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {patient.dossier_number}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Né(e) le {new Date(patient.birth_date).toLocaleDateString('fr-FR')} • 
                    Sexe: {patient.sex === 'M' ? 'Masculin' : 'Féminin'}
                    {patient.school && ` • École: ${patient.school}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Créé le {new Date(patient.created_at).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">
                        Voir le dossier
                      </Button>
                      <CreateAssessmentDialog 
                        preselectedPatientId={patient.id}
                        trigger={
                          <Button size="sm">
                            Nouveau bilan
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Patients;