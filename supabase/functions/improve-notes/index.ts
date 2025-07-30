import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { text, itemName, itemCode } = await req.json();
    console.log('Request received:', { text: text?.length, itemName, itemCode });

    if (!text || !itemName) {
      console.log('Missing required fields:', { hasText: !!text, hasItemName: !!itemName });
      return new Response(
        JSON.stringify({ error: 'Text and item name are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Making OpenAI API call...');
    console.log('API Key present:', !!openAIApiKey);
    console.log('API Key first 10 chars:', openAIApiKey?.substring(0, 10));

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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini-2025-04-14',
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
    console.log('OpenAI response ok:', response.ok);

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      
      let errorMessage = 'Failed to improve text with AI';
      let statusCode = 500;
      
      try {
        const errorData = JSON.parse(error);
        if (errorData.error?.code === 'insufficient_quota') {
          errorMessage = 'Quota OpenAI dépassé. Veuillez vérifier votre abonnement OpenAI.';
          statusCode = 429;
        } else if (errorData.error?.code === 'invalid_api_key') {
          errorMessage = 'Clé API OpenAI invalide. Veuillez vérifier votre configuration.';
          statusCode = 401;
        } else if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch (parseError) {
        console.error('Error parsing OpenAI error response:', parseError);
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage
        }),
        {
          status: statusCode,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    const improvedText = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ improvedText }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in improve-notes function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});