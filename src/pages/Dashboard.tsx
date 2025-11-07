import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Activity, FileText, Pill, AlertTriangle, UserCircle, LogOut, Upload } from "lucide-react";
import MedicalHistory from "@/components/MedicalHistory";
import CurrentMedications from "@/components/CurrentMedications";
import Allergies from "@/components/Allergies";
import PrescriptionUpload from "@/components/PrescriptionUpload";
import DrugInteractionChecker from "@/components/DrugInteractionChecker";
import Profile from "@/components/Profile";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      } else {
        setUser(user);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">MedTrack</h1>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <Card className="p-4">
              <nav className="space-y-2">
                <Button
                  variant={activeTab === "overview" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("overview")}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Overview
                </Button>
                <Button
                  variant={activeTab === "profile" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("profile")}
                >
                  <UserCircle className="h-4 w-4 mr-2" />
                  Profile
                </Button>
                <Button
                  variant={activeTab === "upload" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("upload")}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Prescription
                </Button>
                <Button
                  variant={activeTab === "medications" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("medications")}
                >
                  <Pill className="h-4 w-4 mr-2" />
                  Medications
                </Button>
                <Button
                  variant={activeTab === "history" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("history")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Medical History
                </Button>
                <Button
                  variant={activeTab === "allergies" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("allergies")}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Allergies
                </Button>
                <Button
                  variant={activeTab === "interactions" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("interactions")}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Drug Interactions
                </Button>
              </nav>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2>
                  <p className="text-muted-foreground">
                    Manage your prescriptions and track drug interactions
                  </p>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CurrentMedications userId={user.id} compact />
                  <Allergies userId={user.id} compact />
                </div>
              </div>
            )}

            {activeTab === "profile" && <Profile userId={user.id} />}
            {activeTab === "upload" && <PrescriptionUpload userId={user.id} />}
            {activeTab === "medications" && <CurrentMedications userId={user.id} />}
            {activeTab === "history" && <MedicalHistory userId={user.id} />}
            {activeTab === "allergies" && <Allergies userId={user.id} />}
            {activeTab === "interactions" && <DrugInteractionChecker userId={user.id} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
