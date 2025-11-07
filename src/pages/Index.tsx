import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, Shield, FileText, Bell } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Activity className="h-20 w-20 text-primary" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            MedTrack
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Your Personal Prescription Safety Manager
          </p>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Upload prescriptions, track medications, and get instant alerts about dangerous drug interactions. 
            Keep your health data secure and organized in one place.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="text-lg px-8"
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/auth")}
              className="text-lg px-8"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <div className="bg-card p-6 rounded-lg shadow-md border">
            <FileText className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">OCR Prescription Scan</h3>
            <p className="text-muted-foreground">
              Upload prescription images and automatically extract medication information using advanced OCR technology.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-md border">
            <Shield className="h-12 w-12 text-accent mb-4" />
            <h3 className="text-xl font-semibold mb-2">Drug Interaction Alerts</h3>
            <p className="text-muted-foreground">
              AI-powered analysis detects dangerous interactions between your medications with risk percentages.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-md border">
            <Activity className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Medical History Tracking</h3>
            <p className="text-muted-foreground">
              Maintain complete records of your conditions, ongoing medications, and allergies in one secure place.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-md border">
            <Bell className="h-12 w-12 text-warning mb-4" />
            <h3 className="text-xl font-semibold mb-2">Real-time Notifications</h3>
            <p className="text-muted-foreground">
              Get instant alerts when potential drug interactions are detected to keep you safe.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center bg-card p-12 rounded-lg shadow-lg border">
          <h2 className="text-3xl font-bold mb-4">Start Managing Your Health Today</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of users who trust MedTrack to keep their prescriptions safe and organized.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate("/auth")}
            className="text-lg px-8"
          >
            Create Free Account
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
