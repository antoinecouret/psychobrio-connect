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

    const { assessmentId } = await req.json();
    
    console.log('Received request for assessment:', assessmentId);
    
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

    // Fetch assessment item results separately
    console.log('Fetching item results for assessment:', assessmentId);
    const { data: itemResults, error: resultsError } = await supabaseClient
      .from('assessment_item_results')
      .select(`
        *,
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

    console.log('Found', itemResults?.length || 0, 'item results');

    if (!itemResults || itemResults.length === 0) {
      throw new Error('Aucun résultat trouvé pour ce bilan');
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

    // Generate conclusions for each theme with detailed concatenation
    const themeConclusions = [];
    for (const [themeId, themeData] of Object.entries(themeGroups) as [string, any][]) {
      console.log(`Generating conclusion for theme: ${themeData.name} with ${themeData.results.length} results`);
      
      // Concatenate all results for this theme into a single coherent text
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

      console.log('Sending prompt to OpenAI:', fullPrompt.substring(0, 200) + '...');
      
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

      themeConclusions.push({
        themeId,
        themeName: themeData.name,
        conclusion
      });
    }

    // Generate general synthesis
    const synthesisPrompt = `Tu es un psychomotricien expert. Génère une synthèse générale et des recommandations pour ce bilan psychomoteur.

Patient: ${assessment.patients.first_name} ${assessment.patients.last_name}, ${years} ans et ${months} mois, sexe ${assessment.patients.sex}

Conclusions par thème:
${themeConclusions.map(tc => `${tc.themeName}: ${tc.conclusion}`).join('\n\n')}

Génère une réponse structurée avec:

SYNTHÈSE GÉNÉRALE (150-200 mots):
Une synthèse qui intègre tous les thèmes et donne une vision d'ensemble du profil psychomoteur de l'enfant.

OBJECTIFS (100-150 mots):
Des objectifs thérapeutiques spécifiques et réalisables basés sur les résultats.

RECOMMANDATIONS (100-150 mots):
Des recommandations pratiques pour l'enfant, la famille et l'école.

Utilise un format avec ces trois sections clairement identifiées.`;

    const synthesisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'Tu es un psychomotricien expert spécialisé dans la rédaction de synthèses de bilans psychomoteurs. Tes synthèses sont toujours professionnelles, structurées et orientées vers l\'action thérapeutique.' 
          },
          { role: 'user', content: synthesisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 800
      }),
    });

    if (!synthesisResponse.ok) {
      throw new Error(`Erreur OpenAI pour la synthèse: ${synthesisResponse.statusText}`);
    }

    const synthesisData = await synthesisResponse.json();
    const fullSynthesis = synthesisData.choices[0].message.content;

    // Parse the synthesis to extract sections
    const sections = fullSynthesis.split(/(?:SYNTHÈSE GÉNÉRALE|OBJECTIFS|RECOMMANDATIONS)/i);
    const synthesis = sections[1]?.trim() || fullSynthesis;
    const objectives = sections[2]?.trim() || '';
    const recommendations = sections[3]?.trim() || '';

    return new Response(JSON.stringify({ 
      themeConclusions,
      synthesis,
      objectives,
      recommendations,
      model: 'gpt-4o-mini'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

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