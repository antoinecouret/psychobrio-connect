import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== TEST OPENAI FUNCTION ===');
  console.log('API Key exists:', !!openAIApiKey);
  console.log('API Key prefix:', openAIApiKey?.substring(0, 10));

  if (!openAIApiKey) {
    return new Response(
      JSON.stringify({ 
        error: 'OpenAI API key not found in environment variables',
        debug: { env_vars: Object.keys(Deno.env.toObject()) }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    console.log('Testing simple OpenAI call...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: 'Say "hello" in French' }
        ],
        max_tokens: 10,
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI error response:', errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API call failed',
          status: response.status,
          details: errorText
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    console.log('Success! OpenAI responded with:', data);

    return new Response(
      JSON.stringify({ 
        success: true,
        response: data.choices[0].message.content,
        debug: {
          model_used: 'gpt-4o-mini',
          api_key_prefix: openAIApiKey.substring(0, 10)
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected error occurred',
        details: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});