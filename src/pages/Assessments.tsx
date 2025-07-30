import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const statusLabels = {
  DRAFT: { label: 'Brouillon', variant: 'secondary' as const },
  READY_FOR_REVIEW: { label: 'En relecture', variant: 'default' as const },
  SIGNED: { label: 'Signé', variant: 'default' as const },
  SHARED: { label: 'Partagé', variant: 'default' as const },
};

const Assessments = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: assessments, isLoading } = useQuery({
    queryKey: ['assessments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          patients (first_name, last_name, dossier_number)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredAssessments = assessments?.filter(assessment =>
    `${assessment.patients?.first_name} ${assessment.patients?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.patients?.dossier_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Bilans psychomoteurs</h1>
          <p className="text-muted-foreground">
            Créer et gérer les bilans d'évaluation
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau bilan
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par patient..."
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
          {filteredAssessments?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Aucun bilan trouvé.' : 'Aucun bilan créé.'}
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le premier bilan
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredAssessments?.map((assessment) => (
              <Card key={assessment.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>
                      {assessment.patients?.first_name} {assessment.patients?.last_name}
                    </span>
                    <Badge variant={statusLabels[assessment.status].variant}>
                      {statusLabels[assessment.status].label}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Dossier: {assessment.patients?.dossier_number} • 
                    Date d'évaluation: {new Date(assessment.date).toLocaleDateString('fr-FR')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Créé le {new Date(assessment.created_at).toLocaleDateString('fr-FR')}
                      {assessment.signed_at && (
                        <span> • Signé le {new Date(assessment.signed_at).toLocaleDateString('fr-FR')}</span>
                      )}
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">
                        Voir le bilan
                      </Button>
                      {assessment.status === 'DRAFT' && (
                        <Button size="sm">
                          Continuer la saisie
                        </Button>
                      )}
                      {assessment.status === 'SIGNED' && (
                        <Button size="sm">
                          Télécharger PDF
                        </Button>
                      )}
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

export default Assessments;