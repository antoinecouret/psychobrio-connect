import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Brain, Save, Sparkles, FileText } from 'lucide-react';
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
    onSuccess: (data, themeId) => {
      // Update only the specific theme conclusion
      if (data.conclusion) {
        setEditedThemeConclusions(prev => ({
          ...prev,
          [themeId]: data.conclusion
        }));
      }

      const message = data.isEmbedding 
        ? "L'embedding a été préparé et affiché dans la zone de texte."
        : "La conclusion du thème a été générée avec l'IA.";

      toast({
        title: "Succès",
        description: message,
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

  // Save conclusions mutation
  const saveConclusionsMutation = useMutation({
    mutationFn: async () => {
      // Save theme conclusions
      const themeInserts = [];
      const themeUpdates = [];

      for (const [themeId, text] of Object.entries(editedThemeConclusions)) {
        if (!text.trim()) continue;

        const existing = themeConclusions?.find(tc => tc.theme_id === themeId);
        if (existing) {
          themeUpdates.push({
            id: existing.id,
            text: text.trim()
          });
        } else {
          themeInserts.push({
            assessment_id: assessmentId,
            theme_id: themeId,
            text: text.trim()
          });
        }
      }

      if (themeInserts.length > 0) {
        const { error: insertError } = await supabase
          .from('theme_conclusions')
          .insert(themeInserts);
        if (insertError) throw insertError;
      }

      if (themeUpdates.length > 0) {
        const { error: updateError } = await supabase
          .from('theme_conclusions')
          .upsert(themeUpdates);
        if (updateError) throw updateError;
      }

      // Save assessment conclusion
      if (editedAssessmentConclusion.synthesis.trim()) {
        const { error } = await supabase
          .from('assessment_conclusions')
          .upsert({
            assessment_id: assessmentId,
            synthesis: editedAssessmentConclusion.synthesis,
            objectives: editedAssessmentConclusion.objectives,
            recommendations: editedAssessmentConclusion.recommendations,
            llm_model: editedAssessmentConclusion.llm_model
          });
        
        if (error) throw error;
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
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les conclusions.",
        variant: "destructive",
      });
      console.error('Error saving conclusions:', error);
    }
  });

  const handleGenerateThemeConclusion = (themeId: string) => {
    generateThemeConclusionMutation.mutate(themeId);
  };

  const handleSaveConclusions = () => {
    saveConclusionsMutation.mutate();
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
            {themes.map((theme, index) => (
              <div key={theme.id}>
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
                    {generateThemeConclusionMutation.isPending ? "Préparation..." : "Voir embedding"}
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
            ))}
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
            <Label htmlFor="synthesis" className="text-base font-medium">
              Synthèse générale
            </Label>
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
            <Label htmlFor="objectives" className="text-base font-medium">
              Objectifs thérapeutiques
            </Label>
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
            <Label htmlFor="recommendations" className="text-base font-medium">
              Recommandations
            </Label>
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