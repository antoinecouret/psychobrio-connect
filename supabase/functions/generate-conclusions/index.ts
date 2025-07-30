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

    // Fetch assessment item results with minimal joins to avoid ambiguity
    console.log('Fetching item results for assessment:', assessmentId);
    const { data: itemResults, error: resultsError } = await supabaseClient
      .from('assessment_item_results')
      .select(`
        id,
        assessment_id,
        item_id,
        raw_score,
        percentile,
        standard_score,
        notes
      `)
      .eq('assessment_id', assessmentId);

    if (resultsError) {
      console.error('Results error:', resultsError);
      throw new Error(`Erreur lors de la récupération des résultats: ${resultsError.message}`);
    }

    console.log('Found', itemResults?.length || 0, 'item results for assessment', assessmentId);

    if (!itemResults || itemResults.length === 0) {
      throw new Error(`Aucun résultat trouvé pour le bilan ${assessmentId}`);
    }

    // Get all unique item IDs
    const itemIds = [...new Set(itemResults.map(r => r.item_id))];
    console.log('Unique item IDs:', itemIds);

    // Fetch catalog items separately
    const { data: catalogItems, error: catalogError } = await supabaseClient
      .from('catalog_items')
      .select(`
        id,
        name,
        code,
        description,
        unit,
        direction,
        subtheme_id
      `)
      .in('id', itemIds);

    if (catalogError) {
      console.error('Catalog items error:', catalogError);
      throw new Error(`Erreur lors de la récupération des items du catalogue: ${catalogError.message}`);
    }

    // Get all unique subtheme IDs
    const subthemeIds = [...new Set(catalogItems?.map(c => c.subtheme_id) || [])];
    console.log('Unique subtheme IDs:', subthemeIds);

    // Fetch subthemes separately
    const { data: subthemes, error: subthemeError } = await supabaseClient
      .from('catalog_subthemes')
      .select(`
        id,
        name,
        theme_id
      `)
      .in('id', subthemeIds);

    if (subthemeError) {
      console.error('Subthemes error:', subthemeError);
      throw new Error(`Erreur lors de la récupération des sous-thèmes: ${subthemeError.message}`);
    }

    // Get all unique theme IDs
    const themeIds = [...new Set(subthemes?.map(s => s.theme_id) || [])];
    console.log('Unique theme IDs:', themeIds);

    // Fetch themes separately
    const { data: themes, error: themeError } = await supabaseClient
      .from('catalog_themes')
      .select(`
        id,
        name
      `)
      .in('id', themeIds);

    if (themeError) {
      console.error('Themes error:', themeError);
      throw new Error(`Erreur lors de la récupération des thèmes: ${themeError.message}`);
    }

    console.log('Found themes:', themes?.length || 0);
    console.log('Found subthemes:', subthemes?.length || 0);
    console.log('Found catalog items:', catalogItems?.length || 0);

    // Create lookup maps for easier access
    const catalogItemsMap = new Map(catalogItems?.map(item => [item.id, item]) || []);
    const subthemesMap = new Map(subthemes?.map(sub => [sub.id, sub]) || []);
    const themesMap = new Map(themes?.map(theme => [theme.id, theme]) || []);

    // Group results by theme using the separate data
    console.log('Starting to group results by theme...');
    const themeGroups: Record<string, any> = {};
    
    itemResults.forEach((result, index) => {
      console.log(`Processing result ${index + 1}:`, result.item_id);
      
      const catalogItem = catalogItemsMap.get(result.item_id);
      if (!catalogItem) {
        console.warn(`Result ${index + 1} has no catalog item for ID ${result.item_id}`);
        return;
      }
      
      const subtheme = subthemesMap.get(catalogItem.subtheme_id);
      if (!subtheme) {
        console.warn(`Result ${index + 1} has no subtheme for ID ${catalogItem.subtheme_id}`);
        return;
      }
      
      const theme = themesMap.get(subtheme.theme_id);
      if (!theme) {
        console.warn(`Result ${index + 1} has no theme for ID ${subtheme.theme_id}`);
        return;
      }
      
      const themeId = theme.id;
      const themeName = theme.name;
      
      console.log(`Found theme for result ${index + 1}: ${themeName} (${themeId})`);
      
      if (!themeGroups[themeId]) {
        themeGroups[themeId] = {
          id: themeId,
          name: themeName,
          results: []
        };
        console.log(`Created new theme group: ${themeName}`);
      }
      
      const resultData = {
        itemName: catalogItem.name,
        itemCode: catalogItem.code,
        rawScore: result.raw_score,
        percentile: result.percentile,
        standardScore: result.standard_score,
        notes: result.notes,
        direction: catalogItem.direction,
        unit: catalogItem.unit,
        subtheme: subtheme.name
      };
      
      themeGroups[themeId].results.push(resultData);
      console.log(`Added result to theme ${themeName}:`, resultData);
    });

    console.log('Final theme groups:', Object.keys(themeGroups).length);
    for (const [themeId, themeData] of Object.entries(themeGroups)) {
      console.log(`Theme ${themeData.name}: ${themeData.results.length} results`);
    }

    // Calculate patient age
    const birthDate = new Date(assessment.patients.birth_date);
    const today = new Date();
    const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                       (today.getMonth() - birthDate.getMonth());
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;

    // If specific theme requested, prepare the embedding for that theme
    if (themeId) {
      console.log('Preparing embedding for specific theme:', themeId);
      console.log('Available theme groups:', Object.keys(themeGroups));
      console.log('Theme groups details:', JSON.stringify(themeGroups, null, 2));
      
      const themeData = themeGroups[themeId];
      if (!themeData) {
        console.error(`Theme ${themeId} not found in themeGroups`);
        console.error('Available themes:', Object.keys(themeGroups));
        throw new Error(`Thème ${themeId} non trouvé ou sans résultats`);
      }

      console.log(`Preparing embedding for theme: ${themeData.name} with ${themeData.results.length} results`);

      // Ensure results exist and are properly structured
      if (!themeData.results || themeData.results.length === 0) {
        console.warn(`No results found for theme ${themeData.name}`);
        throw new Error(`Aucun résultat trouvé pour le thème ${themeData.name}`);
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

      const embeddingText = `=== DONNÉES PRÉPARÉES POUR L'IA ===

PATIENT: ${assessment.patients.first_name} ${assessment.patients.last_name}, ${years} ans et ${months} mois, sexe ${assessment.patients.sex}

THÈME ÉVALUÉ: ${themeData.name}
NOMBRE DE TESTS: ${themeData.results.length}

RÉSULTATS DÉTAILLÉS:
${allResultsText}

=== FIN DES DONNÉES ===

PROMPT QUI SERAIT ENVOYÉ À L'IA:
"Tu es un psychomotricien expert. Génère une conclusion clinique pour le thème "${themeData.name}".

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

Conclusion pour ${themeData.name}:"`;

      console.log('Embedding prepared for theme:', themeData.name);
      console.log('Embedding length:', embeddingText.length);

      return new Response(JSON.stringify({ 
        conclusion: embeddingText,
        themeId,
        themeName: themeData.name,
        isEmbedding: true
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