import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Brain, Save, Sparkles, FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConclusionsManagerProps {
  assessmentId: string;
}

interface ThemeConclusion {
  id?: string;
  theme_id: string;
  text: string;
  confidence?: number;
}

interface AssessmentConclusion {
  synthesis: string;
  objectives: string;
  recommendations: string;
  llm_model?: string;
}

const ConclusionsManager: React.FC<ConclusionsManagerProps> = ({ assessmentId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [editedThemeConclusions, setEditedThemeConclusions] = useState<Record<string, string>>({});
  const [editedAssessmentConclusion, setEditedAssessmentConclusion] = useState<AssessmentConclusion>({
    synthesis: '',
    objectives: '',
    recommendations: ''
  });

  // Fetch themes
  const { data: themes } = useQuery({
    queryKey: ['catalog-themes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_themes')
        .select('*')
        .order('order_index');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch existing theme conclusions
  const { data: themeConclusions, isLoading: themeLoading } = useQuery({
    queryKey: ['theme-conclusions', assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('theme_conclusions')
        .select('*')
        .eq('assessment_id', assessmentId);
      
      if (error) throw error;
      return data as ThemeConclusion[];
    },
    enabled: !!assessmentId
  });

  // Fetch existing assessment conclusion
  const { data: assessmentConclusion, isLoading: assessmentLoading } = useQuery({
    queryKey: ['assessment-conclusion', assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessment_conclusions')
        .select('*')
        .eq('assessment_id', assessmentId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!assessmentId
  });

  // Initialize edited conclusions when data loads
  React.useEffect(() => {
    if (themeConclusions) {
      const conclusionsMap: Record<string, string> = {};
      themeConclusions.forEach(tc => {
        conclusionsMap[tc.theme_id] = tc.text;
      });
      setEditedThemeConclusions(conclusionsMap);
    }
  }, [themeConclusions]);

  React.useEffect(() => {
    if (assessmentConclusion) {
      setEditedAssessmentConclusion({
        synthesis: assessmentConclusion.synthesis || '',
        objectives: assessmentConclusion.objectives || '',
        recommendations: assessmentConclusion.recommendations || '',
        llm_model: assessmentConclusion.llm_model
      });
    }
  }, [assessmentConclusion]);

  // Generate conclusions mutation for single theme
  const generateThemeConclusionMutation = useMutation({
    mutationFn: async (themeId: string) => {
      const response = await supabase.functions.invoke('generate-conclusions', {
        body: { assessmentId, themeId }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erreur lors de la génération de la conclusion');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: async (data, themeId) => {
      // Update only the specific theme conclusion
      if (data.conclusion) {
        setEditedThemeConclusions(prev => ({
          ...prev,
          [themeId]: data.conclusion
        }));

        // Save automatically to database
        try {
          const existing = themeConclusions?.find(tc => tc.theme_id === themeId);
          
          if (existing) {
            // Update existing conclusion
            const { error } = await supabase
              .from('theme_conclusions')
              .update({ text: data.conclusion })
              .eq('assessment_id', assessmentId)
              .eq('theme_id', themeId);
            
            if (error) throw error;
          } else {
            // Insert new conclusion
            const { error } = await supabase
              .from('theme_conclusions')
              .insert({
                assessment_id: assessmentId,
                theme_id: themeId,
                text: data.conclusion
              });
            
            if (error) throw error;
          }

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['theme-conclusions', assessmentId] });

          toast({
            title: "Succès",
            description: "La conclusion du thème a été générée et sauvegardée automatiquement.",
          });
        } catch (error) {
          console.error('Auto-save error for theme conclusion:', error);
          toast({
            title: "Attention",
            description: "La conclusion a été générée mais pas sauvegardée. Cliquez sur Sauvegarder.",
            variant: "destructive",
          });
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Generate assessment conclusion mutation
  const generateAssessmentConclusionMutation = useMutation({
    mutationFn: async (type: 'synthesis' | 'objectives' | 'recommendations') => {
      // Validate assessment exists first
      const { data: assessmentExists, error: validationError } = await supabase
        .from('assessments')
        .select('id')
        .eq('id', assessmentId)
        .maybeSingle();

      if (validationError) {
        console.error('Error validating assessment for conclusions:', validationError);
        throw new Error(`Erreur de validation du bilan: ${validationError.message}`);
      }

      if (!assessmentExists) {
        console.error('Assessment not found for conclusions:', assessmentId);
        throw new Error(`Le bilan avec l'ID ${assessmentId} n'existe pas`);
      }

      const response = await supabase.functions.invoke('generate-conclusions', {
        body: { assessmentId, conclusionType: type }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erreur lors de la génération de la conclusion');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return { ...response.data, type };
    },
    onSuccess: async (data) => {
      if (data.conclusion) {
        // Update local state
        setEditedAssessmentConclusion(prev => ({
          ...prev,
          [data.type]: data.conclusion,
          llm_model: 'gpt-4o-mini'
        }));

        // Save directly to database
        try {
          const currentConclusion = editedAssessmentConclusion;
          const updatedConclusion = {
            ...currentConclusion,
            [data.type]: data.conclusion,
            llm_model: 'gpt-4o-mini'
          };

          const conclusionData = {
            assessment_id: assessmentId,
            synthesis: updatedConclusion.synthesis || '',
            objectives: updatedConclusion.objectives || '',
            recommendations: updatedConclusion.recommendations || '',
            llm_model: updatedConclusion.llm_model
          };

          console.log('Auto-saving generated conclusion:', conclusionData);

          const { error } = await supabase
            .from('assessment_conclusions')
            .upsert(conclusionData, {
              onConflict: 'assessment_id'
            });

          if (error) {
            console.error('Error auto-saving assessment conclusion:', error);
            throw error;
          }

          console.log('Assessment conclusion auto-saved successfully');
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['assessment-conclusion', assessmentId] });

          toast({
            title: "Succès",
            description: "La conclusion a été générée et sauvegardée automatiquement.",
          });
        } catch (error) {
          console.error('Auto-save error:', error);
          toast({
            title: "Attention",
            description: "La conclusion a été générée mais pas sauvegardée. Cliquez sur Sauvegarder.",
            variant: "destructive",
          });
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Save conclusions mutation
  const saveConclusionsMutation = useMutation({
    mutationFn: async () => {
      console.log('Starting save process...');
      console.log('Theme conclusions to save:', editedThemeConclusions);
      console.log('Assessment conclusion to save:', editedAssessmentConclusion);

      // Save theme conclusions
      const themeInserts = [];
      const themeUpdates = [];

      for (const [themeId, text] of Object.entries(editedThemeConclusions)) {
        if (!text.trim()) continue;

        const existing = themeConclusions?.find(tc => tc.theme_id === themeId);
        if (existing) {
          // Update existing conclusion
          const { error } = await supabase
            .from('theme_conclusions')
            .update({ text: text.trim() })
            .eq('assessment_id', assessmentId)
            .eq('theme_id', themeId);
          
          if (error) {
            console.error('Error updating theme conclusion:', error);
            throw error;
          }
          console.log('Updated theme conclusion for theme:', themeId);
        } else {
          // Insert new conclusion
          const { error } = await supabase
            .from('theme_conclusions')
            .insert({
              assessment_id: assessmentId,
              theme_id: themeId,
              text: text.trim()
            });
          
          if (error) {
            console.error('Error inserting theme conclusion:', error);
            throw error;
          }
          console.log('Inserted new theme conclusion for theme:', themeId);
        }
      }

      // Save assessment conclusion
      if (editedAssessmentConclusion.synthesis.trim() || 
          editedAssessmentConclusion.objectives.trim() || 
          editedAssessmentConclusion.recommendations.trim()) {
        
        // First, fetch current data to preserve existing fields
        const { data: currentData } = await supabase
          .from('assessment_conclusions')
          .select('*')
          .eq('assessment_id', assessmentId)
          .maybeSingle();
        
        const conclusionData = {
          assessment_id: assessmentId,
          synthesis: editedAssessmentConclusion.synthesis.trim() || currentData?.synthesis || '',
          objectives: editedAssessmentConclusion.objectives.trim() || currentData?.objectives || '',
          recommendations: editedAssessmentConclusion.recommendations.trim() || currentData?.recommendations || '',
          llm_model: editedAssessmentConclusion.llm_model || currentData?.llm_model || null
        };

        console.log('Manual save - assessment conclusion data:', conclusionData);

        const { error } = await supabase
          .from('assessment_conclusions')
          .upsert(conclusionData, {
            onConflict: 'assessment_id'
          });
        
        if (error) {
          console.error('Error saving assessment conclusion:', error);
          throw error;
        }
        console.log('Assessment conclusion saved successfully');
      }
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Les conclusions ont été sauvegardées.",
      });
      queryClient.invalidateQueries({ queryKey: ['theme-conclusions', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['assessment-conclusion', assessmentId] });
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast({
        title: "Erreur",
        description: `Impossible de sauvegarder les conclusions: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Generate PDF report mutation
  const generatePdfMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('generate-pdf-report', {
        body: { assessmentId }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erreur lors de la génération du PDF');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: (data) => {
      if (data.htmlContent) {
        // Create a new window with the HTML content that can be printed as PDF
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(data.htmlContent);
          printWindow.document.close();
          
          // Wait for content to load then trigger print dialog
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
            }, 500);
          };
        }
      }

      toast({
        title: "Succès",
        description: "Le rapport PDF a été généré. Utilisez Ctrl+P pour l'imprimer ou le sauvegarder.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleGenerateThemeConclusion = (themeId: string) => {
    generateThemeConclusionMutation.mutate(themeId);
  };

  const handleGenerateAssessmentConclusion = (type: 'synthesis' | 'objectives' | 'recommendations') => {
    generateAssessmentConclusionMutation.mutate(type);
  };

  const handleSaveConclusions = () => {
    console.log('=== SAVE BUTTON CLICKED ===');
    console.log('Current editedThemeConclusions:', editedThemeConclusions);
    console.log('Current editedAssessmentConclusion:', editedAssessmentConclusion);
    console.log('Assessment ID:', assessmentId);
    
    try {
      console.log('About to call saveConclusionsMutation.mutate()...');
      saveConclusionsMutation.mutate();
      console.log('Mutation called successfully');
    } catch (error) {
      console.error('Error calling mutation:', error);
    }
  };

  const handleGeneratePdf = () => {
    generatePdfMutation.mutate();
  };

  const updateThemeConclusion = (themeId: string, text: string) => {
    setEditedThemeConclusions(prev => ({
      ...prev,
      [themeId]: text
    }));
  };

  const updateAssessmentConclusion = (field: keyof AssessmentConclusion, value: string) => {
    setEditedAssessmentConclusion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const hasConclusions = themeConclusions && themeConclusions.length > 0;
  const hasAssessmentConclusion = assessmentConclusion && assessmentConclusion.synthesis;

  if (themeLoading || assessmentLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">Chargement des conclusions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with generate button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Conclusions automatiques
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSaveConclusions}
                disabled={saveConclusionsMutation.isPending}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Générez automatiquement des conclusions professionnelles basées sur les résultats du bilan, 
            puis modifiez-les selon vos observations cliniques.
          </p>
        </CardContent>
      </Card>

      {/* Theme conclusions */}
      {themes && themes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Conclusions par thème</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {themes.map((theme, index) => {
              const colorIndex = index % 10;
              return (
                <div 
                  key={theme.id} 
                  className="p-4 rounded-lg"
                  style={{
                    borderLeft: `6px solid hsl(var(--theme-color-${colorIndex}))`,
                    background: `hsl(var(--theme-color-${colorIndex}-bg))`
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                  <Label htmlFor={`theme-${theme.id}`} className="text-base font-medium">
                    {theme.name}
                  </Label>
                  <Button
                    onClick={() => handleGenerateThemeConclusion(theme.id)}
                    disabled={generateThemeConclusionMutation.isPending}
                    size="sm"
                    variant="outline"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generateThemeConclusionMutation.isPending ? "Génération..." : "Générer par IA"}
                  </Button>
                </div>
                <Textarea
                  id={`theme-${theme.id}`}
                  value={editedThemeConclusions[theme.id] || ''}
                  onChange={(e) => updateThemeConclusion(theme.id, e.target.value)}
                  placeholder={`Conclusion pour le thème ${theme.name}...`}
                  rows={8}
                  className="mt-2 font-mono text-sm"
                />
                {index < themes.length - 1 && <Separator className="mt-6" />}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* General assessment conclusion */}
      <Card>
        <CardHeader>
          <CardTitle>Conclusion générale du bilan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="synthesis" className="text-base font-medium">
                Synthèse générale
              </Label>
              <Button
                onClick={() => handleGenerateAssessmentConclusion('synthesis')}
                disabled={generateAssessmentConclusionMutation.isPending}
                size="sm"
                variant="outline"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {generateAssessmentConclusionMutation.isPending ? "Génération..." : "Générer par IA"}
              </Button>
            </div>
            <Textarea
              id="synthesis"
              value={editedAssessmentConclusion.synthesis}
              onChange={(e) => updateAssessmentConclusion('synthesis', e.target.value)}
              placeholder="Synthèse générale du profil psychomoteur..."
              rows={5}
              className="mt-2"
            />
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="objectives" className="text-base font-medium">
                Objectifs thérapeutiques
              </Label>
              <Button
                onClick={() => handleGenerateAssessmentConclusion('objectives')}
                disabled={generateAssessmentConclusionMutation.isPending}
                size="sm"
                variant="outline"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {generateAssessmentConclusionMutation.isPending ? "Génération..." : "Générer par IA"}
              </Button>
            </div>
            <Textarea
              id="objectives"
              value={editedAssessmentConclusion.objectives}
              onChange={(e) => updateAssessmentConclusion('objectives', e.target.value)}
              placeholder="Objectifs thérapeutiques spécifiques..."
              rows={4}
              className="mt-2"
            />
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="recommendations" className="text-base font-medium">
                Recommandations
              </Label>
              <Button
                onClick={() => handleGenerateAssessmentConclusion('recommendations')}
                disabled={generateAssessmentConclusionMutation.isPending}
                size="sm"
                variant="outline"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {generateAssessmentConclusionMutation.isPending ? "Génération..." : "Générer par IA"}
              </Button>
            </div>
            <Textarea
              id="recommendations"
              value={editedAssessmentConclusion.recommendations}
              onChange={(e) => updateAssessmentConclusion('recommendations', e.target.value)}
              placeholder="Recommandations pour l'enfant, la famille et l'école..."
              rows={4}
              className="mt-2"
            />
          </div>

          {editedAssessmentConclusion.llm_model && (
            <div className="text-xs text-muted-foreground">
              Généré avec {editedAssessmentConclusion.llm_model}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConclusionsManager;