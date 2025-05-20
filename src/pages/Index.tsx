
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Auto-redirect to login
    navigate("/login");
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-unisphere-gray p-6">
      <div className="text-center max-w-md">
        <div className="h-24 w-24 rounded-full bg-unisphere-purple mx-auto flex items-center justify-center text-white font-bold text-3xl mb-6">U</div>
        <h1 className="text-4xl font-bold text-unisphere-blue mb-4">Unisphere LMS</h1>
        <p className="text-lg text-gray-600 mb-8">
          A lightweight learning management system with Google Classroom integration
        </p>
        <div className="space-y-4">
          <Button size="lg" className="w-full" onClick={() => navigate("/login")}>
            Log In
          </Button>
          <p className="text-sm text-gray-500">
            Contact your administrator for an account if you don't have one.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
