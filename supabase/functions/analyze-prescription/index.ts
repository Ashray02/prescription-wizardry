import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { extractedText, userId, prescriptionId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Analyzing prescription for user:", userId);

    // Get user's current medications
    const { data: medications, error: medError } = await supabase
      .from("medications")
      .select("medication_name")
      .eq("user_id", userId)
      .eq("status", "active");

    if (medError) {
      console.error("Error fetching medications:", medError);
      throw medError;
    }

    // Extract medication names from prescription using AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: "You are a medical prescription analyzer. Extract all medication names from the given prescription text. Return only medication names, one per line, without dosages or instructions.",
          },
          {
            role: "user",
            content: `Extract medication names from this prescription:\n\n${extractedText}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI gateway error:", aiResponse.status);
      throw new Error("Failed to analyze prescription with AI");
    }

    const aiData = await aiResponse.json();
    const extractedMedications = aiData.choices[0].message.content
      .split("\n")
      .filter((line: string) => line.trim())
      .map((line: string) => line.trim());

    console.log("Extracted medications:", extractedMedications);

    // Check interactions between new and existing medications
    const interactions = [];
    const currentMeds = medications?.map((m) => m.medication_name) || [];
    const allMeds = [...currentMeds, ...extractedMedications];

    for (let i = 0; i < allMeds.length; i++) {
      for (let j = i + 1; j < allMeds.length; j++) {
        const interactionResult = await checkDrugInteraction(
          allMeds[i],
          allMeds[j],
          LOVABLE_API_KEY
        );

        if (interactionResult.hasInteraction) {
          // Save interaction to database
          const { error: insertError } = await supabase
            .from("drug_interactions")
            .insert({
              user_id: userId,
              medication_1: allMeds[i],
              medication_2: allMeds[j],
              risk_level: interactionResult.risk_level,
              risk_percentage: interactionResult.risk_percentage,
              description: interactionResult.description,
              severity: interactionResult.severity,
            });

          if (insertError) {
            console.error("Error saving interaction:", insertError);
          } else {
            interactions.push(interactionResult);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        interactions,
        extractedMedications,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in analyze-prescription function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function checkDrugInteraction(
  med1: string,
  med2: string,
  apiKey: string
): Promise<any> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
- description (string: detailed description of the interaction)
- severity (string: description of potential effects)

Base your analysis on known drug interactions and pharmacological data.`,
        },
        {
          role: "user",
          content: `Analyze potential interaction between ${med1} and ${med2}`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    console.error("Drug interaction check failed:", response.status);
    return {
      hasInteraction: false,
      risk_level: "none",
      risk_percentage: 0,
      description: "Unable to check interaction",
      severity: "Unknown",
    };
  }

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);
  return result;
}
