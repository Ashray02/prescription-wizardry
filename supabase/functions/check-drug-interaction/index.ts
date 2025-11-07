import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const validateInput = (medication1: string, medication2: string) => {
  if (!medication1 || typeof medication1 !== 'string' || medication1.trim().length === 0) {
    throw new Error('medication1 is required and must be a non-empty string');
  }
  if (!medication2 || typeof medication2 !== 'string' || medication2.trim().length === 0) {
    throw new Error('medication2 is required and must be a non-empty string');
  }
  if (medication1.length > 200) {
    throw new Error('medication1 must be less than 200 characters');
  }
  if (medication2.length > 200) {
    throw new Error('medication2 must be less than 200 characters');
  }
  return {
    medication1: medication1.trim(),
    medication2: medication2.trim()
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT and get authenticated user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id; // Use authenticated user ID, not from request body

    // Parse and validate request body
    const requestBody = await req.json();
    const { medication1, medication2 } = validateInput(
      requestBody.medication1,
      requestBody.medication2
    );
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`User ${userId} checking interaction between ${medication1} and ${medication2}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a pharmaceutical expert. Analyze drug interactions between medications.
Return a JSON object with:
- hasInteraction (boolean)
- risk_level (string: "none", "low", "moderate", "high", "severe")
- risk_percentage (number: 0-100)
- description (string: detailed description of the interaction and effects)
- severity (string: clinical significance and recommendations)

Base your analysis on known drug interactions, pharmacological data, and clinical guidelines.`,
          },
          {
            role: "user",
            content: `Analyze potential drug interaction between ${medication1} and ${medication2}. Provide detailed information about the interaction mechanism, clinical significance, and patient management recommendations.`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    console.log("Interaction analysis result:", result);

    // Save interaction to database if there is one
    if (result.hasInteraction) {
      const { error: insertError } = await supabase
        .from("drug_interactions")
        .insert({
          user_id: userId,
          medication_1: medication1,
          medication_2: medication2,
          risk_level: result.risk_level,
          risk_percentage: result.risk_percentage,
          description: result.description,
          severity: result.severity,
        });

      if (insertError) {
        console.error("Error saving interaction:", insertError);
      }
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in check-drug-interaction function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
