import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Request method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('API Key exists:', !!openAIApiKey);
  
  if (!openAIApiKey) {
    return new Response(
      JSON.stringify({ 
        error: 'OpenAI API key not configured. Please set the OPENAI_API_KEY secret.' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const requestBody = await req.json();
    console.log('Request body received:', JSON.stringify(requestBody));
    
    const { text, itemName, itemCode } = requestBody;

    if (!text || !itemName) {
      console.log('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Text and item name are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const prompt = `Tu es un psychomotricien expérimenté. Je vais te donner des notes d'observation pour un item d'évaluation psychomotrice.

Item évalué : ${itemName} (Code: ${itemCode || 'N/A'})
Notes actuelles : "${text}"

Améliore ces notes en :
1. Rendant le texte plus professionnel et structuré
2. Utilisant un vocabulaire technique approprié en psychomotricité
3. Gardant toutes les informations importantes
4. Ajoutant des observations cliniques pertinentes si nécessaire
5. Respectant une structure claire et concise

Réponds uniquement avec le texte amélioré, sans introduction ni explication.`;

    console.log('Making OpenAI request...');

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
            content: 'Tu es un assistant spécialisé en psychomotricité qui aide à rédiger des observations cliniques professionnelles.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      
      let errorMessage = 'Erreur lors de l\'appel à l\'API OpenAI';
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.code === 'insufficient_quota') {
          errorMessage = 'Quota OpenAI dépassé. Veuillez vérifier votre abonnement OpenAI.';
        } else if (errorData.error?.code === 'invalid_api_key') {
          errorMessage = 'Clé API OpenAI invalide. Veuillez vérifier votre configuration.';
        } else if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch (parseError) {
        console.error('Error parsing OpenAI error response:', parseError);
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    console.log('OpenAI response data:', JSON.stringify(data));
    
    const improvedText = data.choices?.[0]?.message?.content;

    if (!improvedText) {
      console.error('No improved text in response');
      return new Response(
        JSON.stringify({ error: 'Aucun texte amélioré reçu de l\'IA' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ improvedText }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error in improve-notes function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Une erreur inattendue s\'est produite: ' + error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});