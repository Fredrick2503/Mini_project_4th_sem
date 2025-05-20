
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import MainLayout from "@/components/layout/MainLayout";
import { useToast } from "@/components/ui/use-toast";

const GoogleLinkingPage = () => {
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        navigate("/login");
        return;
      }
      
      setUserId(data.session.user.id);
      
      // Check if already linked
      const { data: profileData } = await supabase
        .from("profiles")
        .select("google_linked")
        .eq("id", data.session.user.id)
        .single();
        
      if (profileData?.google_linked) {
        toast({
          title: "Already Connected",
          description: "Your account is already linked to Google Classroom.",
        });
        navigate("/dashboard");
      }
    };
    
    checkAuth();
  }, [navigate, toast]);

  const handleLinkGoogle = async () => {
    if (!userId) return;
    
    setLoading(true);
    
    try {
      // Initiate OAuth flow through backend endpoint
      // The backend will handle all token exchange, storage, and account linking
      window.location.href = `https://xhwgwwxmzfedaijvgvld.supabase.co/functions/v1/google-oauth?user_id=${userId}`;
    } catch (error) {
      setLoading(false);
      toast({
        title: "Connection Failed",
        description: "Failed to initiate Google Classroom connection.",
        variant: "destructive",
      });
    }
  };

  const handleSkip = () => {
    toast({
      title: "Connection Skipped",
      description: "You can connect Google Classroom later from your profile.",
    });
    navigate("/dashboard");
  };
  
  return (
    <MainLayout>
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Connect Google Classroom</CardTitle>
            <CardDescription>
              Link your account with Google Classroom to access additional features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-md text-sm">
              <p className="font-medium mb-2">Why connect Google Classroom?</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Sync your courses and assignments automatically</li>
                <li>Import students and class rosters</li>
                <li>Access Google Classroom materials directly</li>
                <li>Submit grades back to Google Classroom</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              You'll be redirected to Google to authorize this connection.
              No personal data is shared without your explicit permission.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              className="w-full" 
              onClick={handleLinkGoogle}
              disabled={loading}
            >
              {loading ? "Connecting..." : "Connect Google Classroom"}
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleSkip}
            >
              Skip for now
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
};

export default GoogleLinkingPage;
