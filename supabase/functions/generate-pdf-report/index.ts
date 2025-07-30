import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    const { assessmentId } = await req.json();
    
    console.log('Generating PDF report for assessment:', assessmentId);
    
    if (!assessmentId) {
      throw new Error('ID du bilan requis');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch assessment with patient data
    const { data: assessment, error: assessmentError } = await supabaseClient
      .from('assessments')
      .select(`
        *,
        patients (
          first_name,
          last_name,
          birth_date,
          sex,
          dossier_number,
          physician,
          school
        )
      `)
      .eq('id', assessmentId)
      .single();

    if (assessmentError || !assessment) {
      throw new Error(`Bilan non trouvé: ${assessmentError?.message || 'No data'}`);
    }

    // Fetch assessment conclusions
    const { data: assessmentConclusion } = await supabaseClient
      .from('assessment_conclusions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .maybeSingle();

    // Fetch theme conclusions
    const { data: themeConclusions } = await supabaseClient
      .from('theme_conclusions')
      .select(`
        *,
        catalog_themes (
          name,
          order_index
        )
      `)
      .eq('assessment_id', assessmentId)
      .order('catalog_themes(order_index)');

    // Fetch themes and their results
    const { data: themes } = await supabaseClient
      .from('catalog_themes')
      .select('*')
      .order('order_index');

    // Fetch all assessment results grouped by theme
    const { data: itemResults } = await supabaseClient
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
            theme_id,
            catalog_themes (
              id,
              name,
              order_index
            )
          )
        )
      `)
      .eq('assessment_id', assessmentId);

    // Calculate patient age
    const birthDate = new Date(assessment.patients.birth_date);
    const assessmentDate = new Date(assessment.date);
    const ageInMonths = (assessmentDate.getFullYear() - birthDate.getFullYear()) * 12 + 
                       (assessmentDate.getMonth() - birthDate.getMonth());
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;

    // Group results by theme
    const resultsByTheme: Record<string, any> = {};
    
    if (itemResults) {
      itemResults.forEach((result) => {
        const themeId = result.catalog_items?.catalog_subthemes?.catalog_themes?.id;
        const themeName = result.catalog_items?.catalog_subthemes?.catalog_themes?.name;
        
        if (themeId && themeName) {
          if (!resultsByTheme[themeId]) {
            resultsByTheme[themeId] = {
              name: themeName,
              order: result.catalog_items.catalog_subthemes.catalog_themes.order_index || 999,
              results: []
            };
          }
          
          resultsByTheme[themeId].results.push({
            itemName: result.catalog_items.name,
            itemCode: result.catalog_items.code,
            subtheme: result.catalog_items.catalog_subthemes.name,
            rawScore: result.raw_score,
            unit: result.catalog_items.unit,
            percentile: result.percentile,
            standardScore: result.standard_score,
            notes: result.notes,
            direction: result.catalog_items.direction
          });
        }
      });
    }

    // Sort themes by order
    const sortedThemes = Object.values(resultsByTheme).sort((a: any, b: any) => a.order - b.order);

    // Create HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Rapport de Bilan Psychomoteur</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #0066cc;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #0066cc;
            margin: 0;
            font-size: 24px;
        }
        .patient-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .patient-info h2 {
            color: #0066cc;
            margin-top: 0;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 10px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .info-item {
            margin-bottom: 10px;
        }
        .info-label {
            font-weight: bold;
            color: #495057;
        }
        .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        .section-title {
            color: #0066cc;
            font-size: 20px;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .theme-section {
            margin-bottom: 35px;
            border-radius: 8px;
            padding: 20px;
            border-left: 6px solid;
        }
        .theme-color-0 { border-left-color: #3B82F6; background: #EFF6FF; }
        .theme-color-1 { border-left-color: #10B981; background: #ECFDF5; }
        .theme-color-2 { border-left-color: #F59E0B; background: #FFFBEB; }
        .theme-color-3 { border-left-color: #EF4444; background: #FEF2F2; }
        .theme-color-4 { border-left-color: #8B5CF6; background: #F5F3FF; }
        .theme-color-5 { border-left-color: #06B6D4; background: #ECFEFF; }
        .theme-color-6 { border-left-color: #EC4899; background: #FDF2F8; }
        .theme-color-7 { border-left-color: #84CC16; background: #F7FEE7; }
        .theme-color-8 { border-left-color: #F97316; background: #FFF7ED; }
        .theme-color-9 { border-left-color: #6366F1; background: #EEF2FF; }
        .theme-title {
            color: #0066cc;
            font-size: 18px;
            margin-bottom: 15px;
            border-bottom: 1px solid #dee2e6;
            padding-bottom: 8px;
        }
        .conclusion-text {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            white-space: pre-wrap;
        }
        .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .results-table th {
            background: #0066cc;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
        }
        .results-table td {
            padding: 10px;
            border-bottom: 1px solid #dee2e6;
        }
        .results-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        .subtheme {
            font-style: italic;
            color: #6c757d;
            font-size: 14px;
        }
        .notes {
            font-style: italic;
            color: #495057;
            font-size: 14px;
        }
        .score-good {
            color: #28a745;
            font-weight: bold;
        }
        .score-concern {
            color: #ffc107;
            font-weight: bold;
        }
        .score-poor {
            color: #dc3545;
            font-weight: bold;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
            border-top: 1px solid #dee2e6;
            padding-top: 20px;
        }
        @media print {
            body { margin: 0; }
            .theme-section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>RAPPORT DE BILAN PSYCHOMOTEUR</h1>
        <p>Date d'évaluation: ${new Date(assessment.date).toLocaleDateString('fr-FR')}</p>
    </div>

    <div class="patient-info">
        <h2>Informations Patient</h2>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Nom :</span> ${assessment.patients.last_name}
            </div>
            <div class="info-item">
                <span class="info-label">Prénom :</span> ${assessment.patients.first_name}
            </div>
            <div class="info-item">
                <span class="info-label">Date de naissance :</span> ${new Date(assessment.patients.birth_date).toLocaleDateString('fr-FR')}
            </div>
            <div class="info-item">
                <span class="info-label">Âge :</span> ${years} ans et ${months} mois
            </div>
            <div class="info-item">
                <span class="info-label">Sexe :</span> ${assessment.patients.sex}
            </div>
            <div class="info-item">
                <span class="info-label">N° Dossier :</span> ${assessment.patients.dossier_number}
            </div>
            ${assessment.patients.physician ? `
            <div class="info-item">
                <span class="info-label">Médecin :</span> ${assessment.patients.physician}
            </div>
            ` : ''}
            ${assessment.patients.school ? `
            <div class="info-item">
                <span class="info-label">École :</span> ${assessment.patients.school}
            </div>
            ` : ''}
        </div>
    </div>

    ${assessmentConclusion ? `
    <div class="section">
        <h2 class="section-title">CONCLUSIONS GÉNÉRALES</h2>
        
        ${assessmentConclusion.synthesis ? `
        <div class="theme-section">
            <h3 class="theme-title">Synthèse Générale</h3>
            <div class="conclusion-text">${assessmentConclusion.synthesis}</div>
        </div>
        ` : ''}
        
        ${assessmentConclusion.objectives ? `
        <div class="theme-section">
            <h3 class="theme-title">Objectifs Thérapeutiques</h3>
            <div class="conclusion-text">${assessmentConclusion.objectives}</div>
        </div>
        ` : ''}
        
        ${assessmentConclusion.recommendations ? `
        <div class="theme-section">
            <h3 class="theme-title">Recommandations</h3>
            <div class="conclusion-text">${assessmentConclusion.recommendations}</div>
        </div>
        ` : ''}
    </div>
    ` : ''}

    <div class="section">
        <h2 class="section-title">RÉCAPITULATIF PAR THÈME</h2>
        
        ${themes?.map((theme: any, index: number) => {
          const themeConclusion = themeConclusions?.find(tc => tc.theme_id === theme.id);
          const colorClass = `theme-color-${index % 10}`;
          
          return `
          <div class="theme-section ${colorClass}">
              <h3 class="theme-title">${theme.name}</h3>
              
              ${themeConclusion ? `
              <div class="conclusion-text">${themeConclusion.text}</div>
              ` : '<p style="color: #6c757d; font-style: italic;">Aucune conclusion disponible pour ce thème.</p>'}
          </div>
          `;
        }).join('')}
    </div>

    <div class="footer">
        <p>Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
        ${assessmentConclusion?.llm_model ? `<p>Conclusions générées avec ${assessmentConclusion.llm_model}</p>` : ''}
    </div>
</body>
</html>
    `;

    // Return HTML content that can be converted to PDF by the client
    return new Response(JSON.stringify({ 
      htmlContent,
      assessmentData: {
        patient: assessment.patients,
        assessment: assessment,
        age: { years, months }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating PDF report:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Une erreur inattendue s\'est produite lors de la génération du rapport'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});