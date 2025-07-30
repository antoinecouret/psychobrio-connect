import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, FileText, Sparkles, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import ConclusionsManager from "@/components/assessments/ConclusionsManager";

interface AssessmentItemResult {
  id?: string;
  item_id: string;
  raw_score: number;
  notes?: string;
  percentile?: number;
  standard_score?: number;
}

interface CatalogItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  unit?: string;
  direction: 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER';
  catalog_subthemes: {
    name: string;
    catalog_themes: {
      name: string;
    };
  };
}

export default function AssessmentEntry() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Debug: Log the ID
  console.log('Assessment ID from useParams:', id);
  console.log('ID type:', typeof id);
  
  const [results, setResults] = useState<Record<string, AssessmentItemResult>>({});
  const [improvingNotes, setImprovingNotes] = useState<Record<string, boolean>>({});

  // Early return if no ID
  if (!id) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Erreur</h1>
          <p>ID du bilan manquant dans l'URL</p>
          <Button onClick={() => navigate('/assessments')} className="mt-4">
            Retour aux bilans
          </Button>
        </div>
      </div>
    );
  }
  
  // Fetch assessment details
  const { data: assessment, isLoading: assessmentLoading } = useQuery({
    queryKey: ['assessment', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          patients (
            id,
            first_name,
            last_name,
            birth_date,
            dossier_number,
            sex
          )
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Fetch catalog items
  const { data: catalogItems, isLoading: catalogLoading } = useQuery({
    queryKey: ['catalog-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_items')
        .select(`
          *,
          catalog_subthemes!fk_catalog_items_subtheme (
            name,
            catalog_themes!fk_catalog_subthemes_theme (
              name
            )
          )
        `)
        .order('code');
      
      if (error) throw error;
      return data as CatalogItem[];
    }
  });

  // Fetch existing results
  const { data: existingResults } = useQuery({
    queryKey: ['assessment-results', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessment_item_results')
        .select('*')
        .eq('assessment_id', id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Initialize results from existing data
  useEffect(() => {
    if (existingResults) {
      const resultsMap: Record<string, AssessmentItemResult> = {};
      existingResults.forEach(result => {
        resultsMap[result.item_id] = {
          id: result.id,
          item_id: result.item_id,
          raw_score: result.raw_score,
          notes: result.notes || '',
          percentile: result.percentile || undefined,
          standard_score: result.standard_score || undefined
        };
      });
      setResults(resultsMap);
    }
  }, [existingResults]);

  // Save results mutation
  const saveResultsMutation = useMutation({
    mutationFn: async (resultsToSave: AssessmentItemResult[]) => {
      if (!id) {
        throw new Error('ID du bilan manquant');
      }

      console.log('Saving results for assessment:', id);
      console.log('Results to save:', resultsToSave);

      const updates = [];
      const inserts = [];

      for (const result of resultsToSave) {
        if (result.id) {
          // Update existing result
          updates.push({
            id: result.id,
            raw_score: result.raw_score,
            notes: result.notes,
            percentile: result.percentile,
            standard_score: result.standard_score
          });
        } else {
          // Insert new result
          inserts.push({
            assessment_id: id,
            item_id: result.item_id,
            raw_score: result.raw_score,
            notes: result.notes,
            percentile: result.percentile,
            standard_score: result.standard_score
          });
        }
      }

      if (updates.length > 0) {
        const { error: updateError } = await supabase
          .from('assessment_item_results')
          .upsert(updates);
        if (updateError) throw updateError;
      }

      if (inserts.length > 0) {
        const { error: insertError } = await supabase
          .from('assessment_item_results')
          .insert(inserts);
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Les résultats ont été sauvegardés.",
      });
      queryClient.invalidateQueries({ queryKey: ['assessment-results', id] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les résultats.",
        variant: "destructive",
      });
      console.error('Error saving results:', error);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: 'DRAFT' | 'READY_FOR_REVIEW' | 'SIGNED' | 'SHARED') => {
      const { error } = await supabase
        .from('assessments')
        .update({ 
          status,
          ...(status === 'SIGNED' && { signed_at: new Date().toISOString() })
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment', id] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    }
  });

  const handleScoreChange = (itemId: string, field: keyof AssessmentItemResult, value: string | number) => {
    setResults(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        item_id: itemId,
        [field]: field === 'raw_score' || field === 'percentile' || field === 'standard_score' 
          ? (value === '' ? 0 : Number(value)) 
          : value
      }
    }));
  };

  const handleSave = () => {
    const resultsToSave = Object.values(results).filter(result => 
      result.raw_score !== undefined && result.raw_score !== 0
    );
    saveResultsMutation.mutate(resultsToSave);
  };

  const handleComplete = () => {
    handleSave();
    updateStatusMutation.mutate('READY_FOR_REVIEW');
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    const months = (today.getFullYear() - birth.getFullYear()) * 12 + 
                   (today.getMonth() - birth.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    return `${years} ans ${remainingMonths} mois`;
  };

  const handleImproveNotes = async (itemId: string, itemName: string, itemCode: string) => {
    const currentNotes = results[itemId]?.notes || '';
    
    if (!currentNotes.trim()) {
      toast({
        title: "Attention",
        description: "Veuillez d'abord saisir des notes avant de les améliorer.",
        variant: "destructive",
      });
      return;
    }

    setImprovingNotes(prev => ({ ...prev, [itemId]: true }));

    try {
      const response = await supabase.functions.invoke('improve-notes', {
        body: {
          text: currentNotes,
          itemName: itemName,
          itemCode: itemCode
        }
      });

      // Gérer les erreurs de la fonction edge
      if (response.error) {
        let errorMessage = "Impossible d'améliorer les notes avec l'IA.";
        
        // Si on a une réponse de données avec un message d'erreur spécifique
        if (response.data?.error) {
          errorMessage = response.data.error;
        } else if (response.error.message) {
          errorMessage = response.error.message;
        }
        
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (response.data?.improvedText) {
        handleScoreChange(itemId, 'notes', response.data.improvedText);
        toast({
          title: "Succès",
          description: "Les notes ont été améliorées avec l'IA.",
        });
      } else if (response.data?.error) {
        toast({
          title: "Erreur",
          description: response.data.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Aucune amélioration reçue de l'IA.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error improving notes:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive",
      });
    } finally {
      setImprovingNotes(prev => ({ ...prev, [itemId]: false }));
    }
  };


  if (assessmentLoading || catalogLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Bilan non trouvé</div>
      </div>
    );
  }

  // Group items by theme
  const groupedItems = catalogItems?.reduce((acc, item) => {
    const themeName = item.catalog_subthemes.catalog_themes.name;
    const subthemeName = item.catalog_subthemes.name;
    
    if (!acc[themeName]) {
      acc[themeName] = {};
    }
    if (!acc[themeName][subthemeName]) {
      acc[themeName][subthemeName] = [];
    }
    acc[themeName][subthemeName].push(item);
    
    return acc;
  }, {} as Record<string, Record<string, CatalogItem[]>>) || {};

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/assessments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux bilans
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Saisie du bilan</h1>
            <p className="text-muted-foreground">
              {assessment.patients?.first_name} {assessment.patients?.last_name} - 
              Dossier #{assessment.patients?.dossier_number}
            </p>
          </div>
        </div>
        <Badge variant={assessment.status === 'DRAFT' ? 'secondary' : 'default'}>
          {assessment.status === 'DRAFT' ? 'Brouillon' : 
           assessment.status === 'READY_FOR_REVIEW' ? 'En relecture' : 
           assessment.status === 'SIGNED' ? 'Signé' : 'Partagé'}
        </Badge>
      </div>

      {/* Patient Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations patient</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground">Nom complet</Label>
            <p className="font-medium">
              {assessment.patients?.first_name} {assessment.patients?.last_name}
            </p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Date de naissance</Label>
            <p className="font-medium">
              {assessment.patients?.birth_date && 
                format(new Date(assessment.patients.birth_date), 'dd MMMM yyyy', { locale: fr })
              }
            </p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Âge</Label>
            <p className="font-medium">
              {assessment.patients?.birth_date && calculateAge(assessment.patients.birth_date)}
            </p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Date d'évaluation</Label>
            <p className="font-medium">
              {format(new Date(assessment.date), 'dd MMMM yyyy', { locale: fr })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Items */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([themeName, subthemes]) => (
          <Card key={themeName}>
            <CardHeader>
              <CardTitle className="text-xl">{themeName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(subthemes).map(([subthemeName, items]) => (
                <div key={subthemeName}>
                  <h3 className="font-semibold text-lg mb-4">{subthemeName}</h3>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Code: {item.code}
                              {item.unit && ` • Unité: ${item.unit}`}
                            </p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="ml-4">
                            {item.direction === 'HIGHER_IS_BETTER' ? '↑ Plus haut = mieux' : '↓ Plus bas = mieux'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor={`raw-${item.id}`}>Score brut *</Label>
                            <Input
                              id={`raw-${item.id}`}
                              type="number"
                              step="0.01"
                              value={results[item.id]?.raw_score || ''}
                              onChange={(e) => handleScoreChange(item.id, 'raw_score', e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`percentile-${item.id}`}>Percentile</Label>
                            <Input
                              id={`percentile-${item.id}`}
                              type="number"
                              min="0"
                              max="100"
                              value={results[item.id]?.percentile || ''}
                              onChange={(e) => handleScoreChange(item.id, 'percentile', e.target.value)}
                              placeholder="0-100"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`standard-${item.id}`}>Score standard</Label>
                            <Input
                              id={`standard-${item.id}`}
                              type="number"
                              step="0.01"
                              value={results[item.id]?.standard_score || ''}
                              onChange={(e) => handleScoreChange(item.id, 'standard_score', e.target.value)}
                              placeholder="Score standard"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label htmlFor={`notes-${item.id}`}>Notes et observations</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleImproveNotes(item.id, item.name, item.code)}
                              disabled={improvingNotes[item.id] || !results[item.id]?.notes?.trim()}
                              className="h-7 px-2 text-xs"
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              {improvingNotes[item.id] ? 'Amélioration...' : 'Améliorer avec IA'}
                            </Button>
                          </div>
                          <Textarea
                            id={`notes-${item.id}`}
                            value={results[item.id]?.notes || ''}
                            onChange={(e) => handleScoreChange(item.id, 'notes', e.target.value)}
                            placeholder="Observations sur cet item..."
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {Object.keys(subthemes).length > 1 && <Separator className="my-6" />}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conclusions Section - Only shown for completed assessments */}
      {(assessment.status === 'READY_FOR_REVIEW' || assessment.status === 'SIGNED' || assessment.status === 'SHARED') && (
        <ConclusionsManager assessmentId={id!} />
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center py-6">
        <div className="text-sm text-muted-foreground">
          * Les scores bruts sont obligatoires
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleSave}
            disabled={saveResultsMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
          <Button 
            onClick={handleComplete}
            disabled={saveResultsMutation.isPending || updateStatusMutation.isPending}
          >
            <FileText className="h-4 w-4 mr-2" />
            Marquer comme terminé
          </Button>
        </div>
      </div>
    </div>
  );
}