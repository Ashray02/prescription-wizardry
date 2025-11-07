import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ProfileProps {
  userId: string;
}

const Profile = ({ userId }: ProfileProps) => {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bloodType, setBloodType] = useState("");

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    if (data) {
      setFullName(data.full_name || "");
      setDateOfBirth(data.date_of_birth || "");
      setBloodType(data.blood_type || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        full_name: fullName,
        date_of_birth: dateOfBirth || null,
        blood_type: bloodType || null,
      });

    if (error) {
      toast.error("Failed to update profile");
      console.error("Error updating profile:", error);
    } else {
      toast.success("Profile updated successfully");
    }

    setLoading(false);
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Your Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bloodType">Blood Type</Label>
          <Input
            id="bloodType"
            value={bloodType}
            onChange={(e) => setBloodType(e.target.value)}
            placeholder="A+"
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </Card>
  );
};

export default Profile;
