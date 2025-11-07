import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, User, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrescriptionHistoryProps {
  userId: string;
}

interface Prescription {
  id: string;
  doctor_name: string | null;
  prescription_date: string;
  image_url: string;
  extracted_text: string | null;
  analyzed: boolean;
  created_at: string;
}

const PrescriptionHistory = ({ userId }: PrescriptionHistoryProps) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, [userId]);

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("user_id", userId)
        .order("prescription_date", { ascending: false });

      if (error) throw error;
      setPrescriptions(data || []);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">Loading prescription history...</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Prescription History</h2>

        {prescriptions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No prescriptions uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <Card key={prescription.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {formatDate(prescription.prescription_date)}
                      </span>
                      {prescription.analyzed && (
                        <Badge variant="secondary">Analyzed</Badge>
                      )}
                    </div>

                    {prescription.doctor_name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Dr. {prescription.doctor_name}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Uploaded: {formatDate(prescription.created_at)}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPrescription(prescription)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
          </DialogHeader>

          {selectedPrescription && (
            <ScrollArea className="h-full max-h-[70vh]">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Prescription Date</h3>
                  <p>{formatDate(selectedPrescription.prescription_date)}</p>
                </div>

                {selectedPrescription.doctor_name && (
                  <div>
                    <h3 className="font-semibold mb-2">Doctor</h3>
                    <p>Dr. {selectedPrescription.doctor_name}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Prescription Image</h3>
                  <img
                    src={selectedPrescription.image_url}
                    alt="Prescription"
                    className="w-full rounded-lg border"
                  />
                </div>

                {selectedPrescription.extracted_text && (
                  <div>
                    <h3 className="font-semibold mb-2">Extracted Text</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">
                        {selectedPrescription.extracted_text}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PrescriptionHistory;
