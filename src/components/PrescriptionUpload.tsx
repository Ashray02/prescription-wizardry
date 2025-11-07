import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, FileText, Loader2 } from "lucide-react";
import { createWorker } from "tesseract.js";

interface PrescriptionUploadProps {
  userId: string;
}

const PrescriptionUpload = ({ userId }: PrescriptionUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [prescriptionDate, setPrescriptionDate] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const performOCR = async (imageUrl: string): Promise<string> => {
    const worker = await createWorker("eng");
    const { data: { text } } = await worker.recognize(imageUrl);
    await worker.terminate();
    return text;
  };

  const analyzeInteractions = async (extractedText: string, prescriptionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("analyze-prescription", {
        body: { extractedText, prescriptionId },
      });

      if (error) throw error;
      
      if (data.interactions && data.interactions.length > 0) {
        toast.warning(`Found ${data.interactions.length} potential drug interactions!`, {
          description: "Check the Drug Interactions tab for details"
        });
      } else {
        toast.success("No drug interactions detected");
      }
    } catch (error: any) {
      console.error("Error analyzing interactions:", error);
      toast.error("Failed to analyze drug interactions");
    }
  };

  const handleUpload = async () => {
    if (!file || !prescriptionDate) {
      toast.error("Please select a file and enter prescription date");
      return;
    }

    setUploading(true);

    try {
      // Upload image to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("prescriptions")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("prescriptions")
        .getPublicUrl(fileName);

      setAnalyzing(true);
      
      // Perform OCR
      const extractedText = await performOCR(preview!);

      // Save prescription to database
      const { data: prescriptionData, error: dbError } = await supabase
        .from("prescriptions")
        .insert({
          user_id: userId,
          doctor_name: doctorName || null,
          prescription_date: prescriptionDate,
          image_url: publicUrl,
          extracted_text: extractedText,
          analyzed: false,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Analyze drug interactions
      await analyzeInteractions(extractedText, prescriptionData.id);

      // Mark as analyzed
      await supabase
        .from("prescriptions")
        .update({ analyzed: true })
        .eq("id", prescriptionData.id);

      toast.success("Prescription uploaded and analyzed successfully");
      setFile(null);
      setPreview(null);
      setDoctorName("");
      setPrescriptionDate("");
    } catch (error: any) {
      console.error("Error uploading prescription:", error);
      toast.error("Failed to upload prescription");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Upload Prescription</h2>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prescriptionFile">Prescription Image</Label>
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
            {preview ? (
              <div className="space-y-4">
                <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded" />
                <Button variant="outline" onClick={() => { setFile(null); setPreview(null); }}>
                  Remove Image
                </Button>
              </div>
            ) : (
              <div>
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <Label htmlFor="prescriptionFile" className="cursor-pointer">
                  <span className="text-primary hover:underline">Choose a file</span> or drag and drop
                </Label>
                <Input
                  id="prescriptionFile"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="doctorName">Doctor Name (Optional)</Label>
          <Input
            id="doctorName"
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            placeholder="Dr. Smith"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="prescriptionDate">Prescription Date</Label>
          <Input
            id="prescriptionDate"
            type="date"
            value={prescriptionDate}
            onChange={(e) => setPrescriptionDate(e.target.value)}
            required
          />
        </div>

        <Button
          onClick={handleUpload}
          disabled={uploading || analyzing || !file}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : analyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Upload & Analyze
            </>
          )}
        </Button>

        {analyzing && (
          <div className="text-sm text-muted-foreground text-center">
            <p>Extracting text from prescription...</p>
            <p>Checking for drug interactions...</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PrescriptionUpload;
