import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface CurrentMedicationsProps {
  userId: string;
  compact?: boolean;
}

interface Medication {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string | null;
  status: string;
  notes: string | null;
}

const CurrentMedications = ({ userId, compact = false }: CurrentMedicationsProps) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [medicationName, setMedicationName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMedications();
  }, [userId]);

  const fetchMedications = async () => {
    const { data, error } = await supabase
      .from("medications")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching medications:", error);
      return;
    }

    setMedications(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("medications").insert({
      user_id: userId,
      medication_name: medicationName,
      dosage,
      frequency,
      start_date: startDate,
      end_date: endDate || null,
      status: "active",
      notes: notes || null,
    });

    if (error) {
      toast.error("Failed to add medication");
      console.error("Error adding medication:", error);
    } else {
      toast.success("Medication added");
      setShowForm(false);
      setMedicationName("");
      setDosage("");
      setFrequency("");
      setStartDate("");
      setEndDate("");
      setNotes("");
      fetchMedications();
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("medications").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete");
      console.error("Error deleting:", error);
    } else {
      toast.success("Deleted successfully");
      fetchMedications();
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Current Medications</h2>
        {!compact && (
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Medication
          </Button>
        )}
      </div>

      {showForm && !compact && (
        <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="medicationName">Medication Name</Label>
            <Input
              id="medicationName"
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              placeholder="e.g., Lisinopril"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dosage">Dosage</Label>
            <Input
              id="dosage"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g., 10mg"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Input
              id="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              placeholder="e.g., Once daily"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date (Optional)</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
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
        {medications.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No active medications
          </p>
        ) : (
          medications.slice(0, compact ? 3 : undefined).map((med) => (
            <div key={med.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{med.medication_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {med.dosage} - {med.frequency}
                  </p>
                </div>
                {!compact && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(med.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Started: {new Date(med.start_date).toLocaleDateString()}
              </p>
              {med.notes && <p className="text-sm mt-2">{med.notes}</p>}
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default CurrentMedications;
