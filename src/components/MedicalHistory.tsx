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

interface MedicalHistoryProps {
  userId: string;
}

interface HistoryItem {
  id: string;
  condition_name: string;
  diagnosis_date: string | null;
  status: string;
  notes: string | null;
}

const MedicalHistory = ({ userId }: MedicalHistoryProps) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [conditionName, setConditionName] = useState("");
  const [diagnosisDate, setDiagnosisDate] = useState("");
  const [status, setStatus] = useState("ongoing");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from("medical_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching history:", error);
      return;
    }

    setHistory(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("medical_history").insert({
      user_id: userId,
      condition_name: conditionName,
      diagnosis_date: diagnosisDate || null,
      status,
      notes: notes || null,
    });

    if (error) {
      toast.error("Failed to add medical history");
      console.error("Error adding history:", error);
    } else {
      toast.success("Medical history added");
      setShowForm(false);
      setConditionName("");
      setDiagnosisDate("");
      setStatus("ongoing");
      setNotes("");
      fetchHistory();
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("medical_history").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete");
      console.error("Error deleting:", error);
    } else {
      toast.success("Deleted successfully");
      fetchHistory();
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Medical History</h2>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Condition
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="conditionName">Condition Name</Label>
            <Input
              id="conditionName"
              value={conditionName}
              onChange={(e) => setConditionName(e.target.value)}
              placeholder="e.g., Hypertension"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosisDate">Diagnosis Date</Label>
            <Input
              id="diagnosisDate"
              type="date"
              value={diagnosisDate}
              onChange={(e) => setDiagnosisDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="chronic">Chronic</SelectItem>
              </SelectContent>
            </Select>
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
        {history.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No medical history recorded yet
          </p>
        ) : (
          history.map((item) => (
            <div key={item.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{item.condition_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.diagnosis_date && `Diagnosed: ${new Date(item.diagnosis_date).toLocaleDateString()}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="flex gap-2 items-center mb-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  item.status === 'ongoing' ? 'bg-warning/10 text-warning' :
                  item.status === 'resolved' ? 'bg-accent/10 text-accent' :
                  'bg-secondary text-secondary-foreground'
                }`}>
                  {item.status}
                </span>
              </div>
              {item.notes && <p className="text-sm">{item.notes}</p>}
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default MedicalHistory;
