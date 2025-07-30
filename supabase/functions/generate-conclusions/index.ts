import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('Clé API OpenAI non configurée');
    }

    const { assessmentId, themeId } = await req.json();
    
    console.log('Received request for assessment:', assessmentId, 'theme:', themeId || 'ALL');
    
    if (!assessmentId) {
      throw new Error('ID du bilan requis');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Supabase client initialized');

    // Fetch assessment data first
    console.log('Fetching assessment with ID:', assessmentId);
    const { data: assessment, error: assessmentError } = await supabaseClient
      .from('assessments')
      .select(`
        *,
        patients (
          first_name,
          last_name,
          birth_date,
          sex
        )
      `)
      .eq('id', assessmentId)
      .single();

    if (assessmentError || !assessment) {
      console.error('Assessment error:', assessmentError);
      console.log('Assessment data:', assessment);
      throw new Error(`Bilan non trouvé: ${assessmentError?.message || 'No data'}`);
    }

    console.log('Assessment found:', assessment.id);

    // Fetch assessment item results separately with explicit filtering
    console.log('Fetching item results for assessment:', assessmentId);
    console.log('Assessment ID type:', typeof assessmentId);
    
    const { data: itemResults, error: resultsError } = await supabaseClient
      .from('assessment_item_results')
      .select(`
        id,
        assessment_id,
        item_id,
        raw_score,
        percentile,
        standard_score,
        notes,
        catalog_items (
          name,
          code,
          description,
          unit,
          direction,
          catalog_subthemes (
            name,
            catalog_themes (
              id,
              name
            )
          )
        )
      `)
      .eq('assessment_id', assessmentId);

    if (resultsError) {
      console.error('Results error:', resultsError);
      throw new Error(`Erreur lors de la récupération des résultats: ${resultsError.message}`);
    }

    console.log('Found', itemResults?.length || 0, 'item results for assessment', assessmentId);
    console.log('Sample result:', itemResults?.[0] ? JSON.stringify(itemResults[0], null, 2) : 'No results');

    if (!itemResults || itemResults.length === 0) {
      throw new Error(`Aucun résultat trouvé pour le bilan ${assessmentId}`);
    }

    // Group results by theme more systematically
    console.log('Grouping results by theme...');
    const themeGroups = itemResults.reduce((acc: any, result: any) => {
      const theme = result.catalog_items?.catalog_subthemes?.catalog_themes;
      if (!theme) {
        console.warn('Missing theme for result:', result.id);
        return acc;
      }
      
      const themeId = theme.id;
      const themeName = theme.name;
      
      if (!acc[themeId]) {
        acc[themeId] = {
          id: themeId,
          name: themeName,
          results: []
        };
      }
      
      acc[themeId].results.push({
        itemName: result.catalog_items.name,
        itemCode: result.catalog_items.code,
        rawScore: result.raw_score,
        percentile: result.percentile,
        standardScore: result.standard_score,
        notes: result.notes,
        direction: result.catalog_items.direction,
        unit: result.catalog_items.unit,
        subtheme: result.catalog_items.catalog_subthemes.name
      });
      
      return acc;
    }, {});

    console.log('Theme groups created:', Object.keys(themeGroups).length);
    for (const [themeId, themeData] of Object.entries(themeGroups) as [string, any][]) {
      console.log(`Theme ${themeData.name}: ${themeData.results.length} results`);
    }

    // Calculate patient age
    const birthDate = new Date(assessment.patients.birth_date);
    const today = new Date();
    const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                       (today.getMonth() - birthDate.getMonth());
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;

    // If specific theme requested, generate only for that theme
    if (themeId) {
      console.log('Generating conclusion for specific theme:', themeId);
      
      const themeData = themeGroups[themeId];
      if (!themeData) {
        throw new Error(`Thème ${themeId} non trouvé ou sans résultats`);
      }

      // Concatenate all results for this theme
      const allResultsText = themeData.results
        .map((r: any) => {
          let line = `• ${r.itemName} (${r.itemCode})`;
          if (r.subtheme) line += ` [Sous-thème: ${r.subtheme}]`;
          line += `\n  - Score brut: ${r.rawScore}`;
          if (r.unit) line += ` ${r.unit}`;
          if (r.percentile !== null && r.percentile !== undefined) line += `\n  - Percentile: ${r.percentile}`;
          if (r.standardScore !== null && r.standardScore !== undefined) line += `\n  - Score standard: ${r.standardScore}`;
          if (r.notes && r.notes.trim()) line += `\n  - Observations: ${r.notes.trim()}`;
          return line;
        })
        .join('\n\n');

      const fullPrompt = `Tu es un psychomotricien expert. Génère une conclusion clinique pour le thème "${themeData.name}".

PATIENT: ${assessment.patients.first_name} ${assessment.patients.last_name}, ${years} ans et ${months} mois, sexe ${assessment.patients.sex}

THÈME ÉVALUÉ: ${themeData.name}
NOMBRE DE TESTS: ${themeData.results.length}

RÉSULTATS DÉTAILLÉS:
${allResultsText}

MISSION: Rédige une conclusion clinique professionnelle de 120-180 mots qui:
- Synthétise l'ensemble des résultats de ce thème
- Identifie les forces et difficultés observées
- Propose une interprétation clinique appropriée
- Utilise un langage professionnel adapté à un rapport psychomoteur

Conclusion pour ${themeData.name}:`;

      console.log('Sending prompt to OpenAI for theme:', themeData.name);
      console.log('Prompt preview:', fullPrompt.substring(0, 300) + '...');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'Tu es un psychomotricien expert spécialisé dans la rédaction de bilans psychomoteurs. Tes conclusions sont toujours professionnelles, structurées et basées sur les données cliniques.' 
            },
            { role: 'user', content: fullPrompt }
          ],
          temperature: 0.3,
          max_tokens: 350
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur OpenAI: ${response.statusText}`);
      }

      const data = await response.json();
      const conclusion = data.choices[0].message.content;

      console.log('Generated conclusion for theme:', themeData.name);

      return new Response(JSON.stringify({ 
        conclusion,
        themeId,
        themeName: themeData.name
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // If no specific theme requested, generate for all themes (not implemented in this version)
    throw new Error('Génération pour tous les thèmes non implémentée. Utilisez la génération par thème.');

  } catch (error) {
    console.error('Error in generate-conclusions function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Une erreur inattendue s\'est produite'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});