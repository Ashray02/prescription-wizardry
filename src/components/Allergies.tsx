import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, AlertTriangle } from "lucide-react";

interface AllergiesProps {
  userId: string;
  compact?: boolean;
}

interface Allergy {
  id: string;
  allergen: string;
  severity: string;
  reaction: string | null;
}

const Allergies = ({ userId, compact = false }: AllergiesProps) => {
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [allergen, setAllergen] = useState("");
  const [severity, setSeverity] = useState("mild");
  const [reaction, setReaction] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllergies();
  }, [userId]);

  const fetchAllergies = async () => {
    const { data, error } = await supabase
      .from("allergies")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching allergies:", error);
      return;
    }

    setAllergies(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("allergies").insert({
      user_id: userId,
      allergen,
      severity,
      reaction: reaction || null,
    });

    if (error) {
      toast.error("Failed to add allergy");
      console.error("Error adding allergy:", error);
    } else {
      toast.success("Allergy added");
      setShowForm(false);
      setAllergen("");
      setSeverity("mild");
      setReaction("");
      fetchAllergies();
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("allergies").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete");
      console.error("Error deleting:", error);
    } else {
      toast.success("Deleted successfully");
      fetchAllergies();
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Allergies</h2>
        {!compact && (
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Allergy
          </Button>
        )}
      </div>

      {showForm && !compact && (
        <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="allergen">Allergen</Label>
            <Input
              id="allergen"
              value={allergen}
              onChange={(e) => setAllergen(e.target.value)}
              placeholder="e.g., Penicillin"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mild">Mild</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="severe">Severe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reaction">Reaction</Label>
            <Textarea
              id="reaction"
              value={reaction}
              onChange={(e) => setReaction(e.target.value)}
              placeholder="Describe the reaction..."
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {allergies.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No allergies recorded
          </p>
        ) : (
          allergies.slice(0, compact ? 3 : undefined).map((allergy) => (
            <div key={allergy.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-5 w-5 ${
                    allergy.severity === 'severe' ? 'text-destructive' :
                    allergy.severity === 'moderate' ? 'text-warning' :
                    'text-muted-foreground'
                  }`} />
                  <div>
                    <h3 className="font-semibold text-lg">{allergy.allergen}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      allergy.severity === 'severe' ? 'bg-destructive/10 text-destructive' :
                      allergy.severity === 'moderate' ? 'bg-warning/10 text-warning' :
                      'bg-secondary text-secondary-foreground'
                    }`}>
                      {allergy.severity}
                    </span>
                  </div>
                </div>
                {!compact && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(allergy.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              {allergy.reaction && <p className="text-sm mt-2">{allergy.reaction}</p>}
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default Allergies;
