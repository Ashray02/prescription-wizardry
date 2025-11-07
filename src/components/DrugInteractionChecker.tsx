import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, AlertTriangle, Loader2 } from "lucide-react";

interface DrugInteractionCheckerProps {
  userId: string;
}

interface Interaction {
  id: string;
  medication_1: string;
  medication_2: string;
  risk_level: string;
  risk_percentage: number;
  description: string;
  severity: string;
  created_at: string;
}

const DrugInteractionChecker = ({ userId }: DrugInteractionCheckerProps) => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [medication1, setMedication1] = useState("");
  const [medication2, setMedication2] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchInteractions();
  }, [userId]);

  const fetchInteractions = async () => {
    const { data, error } = await supabase
      .from("drug_interactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching interactions:", error);
      return;
    }

    setInteractions(data || []);
  };

  const handleCheck = async () => {
    if (!medication1 || !medication2) {
      toast.error("Please enter both medication names");
      return;
    }

    if (medication1.length > 200 || medication2.length > 200) {
      toast.error("Medication names must be less than 200 characters");
      return;
    }

    setChecking(true);

    try {
      const { data, error } = await supabase.functions.invoke("check-drug-interaction", {
        body: { medication1, medication2 },
      });

      if (error) throw error;

      if (data.hasInteraction) {
        toast.warning("Drug interaction detected!", {
          description: `Risk level: ${data.risk_level}`
        });
      } else {
        toast.success("No known interactions found");
      }

      fetchInteractions();
      setMedication1("");
      setMedication2("");
    } catch (error: any) {
      console.error("Error checking interaction:", error);
      toast.error("Failed to check drug interaction");
    } finally {
      setChecking(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "severe":
        return "bg-destructive/10 text-destructive border-destructive";
      case "high":
        return "bg-warning/10 text-warning border-warning";
      case "moderate":
        return "bg-warning/5 text-warning border-warning/50";
      case "low":
        return "bg-accent/10 text-accent border-accent";
      default:
        return "bg-secondary text-secondary-foreground border-border";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Manual Drug Interaction Checker</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="medication1">First Medication</Label>
              <Input
                id="medication1"
                value={medication1}
                onChange={(e) => setMedication1(e.target.value)}
                placeholder="e.g., Aspirin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medication2">Second Medication</Label>
              <Input
                id="medication2"
                value={medication2}
                onChange={(e) => setMedication2(e.target.value)}
                placeholder="e.g., Ibuprofen"
              />
            </div>
          </div>

          <Button onClick={handleCheck} disabled={checking} className="w-full">
            {checking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Check Interaction
              </>
            )}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Detected Interactions</h2>

        <div className="space-y-4">
          {interactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No interactions detected yet
            </p>
          ) : (
            interactions.map((interaction) => (
              <div
                key={interaction.id}
                className={`border-2 rounded-lg p-4 ${getRiskColor(interaction.risk_level)}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle className="h-5 w-5 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      {interaction.medication_1} + {interaction.medication_2}
                    </h3>
                    <div className="flex gap-2 mb-2">
                      <span className="px-2 py-1 rounded text-xs font-semibold uppercase">
                        {interaction.risk_level} Risk
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-semibold">
                        {interaction.risk_percentage}% Risk
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm mb-2">{interaction.description}</p>
                
                <p className="text-xs text-muted-foreground">
                  Detected: {new Date(interaction.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default DrugInteractionChecker;
