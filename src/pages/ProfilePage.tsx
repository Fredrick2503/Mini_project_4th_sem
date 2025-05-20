import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";


interface ProfileData {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  google_linked: boolean;
  avatar_url?: string;
}

// Simple Google icon component with proper typing
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
    >
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
    <path d="M17.8 12.2H12.5V14.5H15.8C15.6 15.4 14.9 16.7 13 16.7C11.4 16.7 10.1 15.4 10.1 13.8C10.1 12.2 11.4 10.9 13 10.9C14 10.9 14.8 11.3 15.3 11.8L17.1 10C16.1 9.1 14.7 8.5 13 8.5C10.1 8.5 7.8 10.8 7.8 13.7C7.8 16.6 10.1 18.9 13 18.9C16.4 18.9 18.2 16.5 18.2 13.8C18.2 13.4 18.1 12.8 18 12.2H17.8Z" />
  </svg>
);

const ProfilePage = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
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
    const fetchProfile = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData.session) {
          return;
        }
        
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", sessionData.session.user.id)
          .single();
          
        if (error) throw error;
        
        setProfile(data);
        setFullName(data.full_name || "");
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);
  
  const handleProfileUpdate = async () => {
    if (!profile) return;
    
    setUpdating(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", profile.id);
        
      if (error) throw error;
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      // Update local state
      setProfile({ ...profile, full_name: fullName });
      
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };
  
  // const handleGoogleLink = async () => {
  //   // This would be handled by a secure edge function in production
  //   toast({
  //     title: "Google Integration",
  //     description: "This would redirect to a secure backend route for OAuth flow.",
  //   });
  // };
  const handleLinkGoogle = async () => {
    const { data: session } = await supabase.auth.getSession();
        if (!session?.session) return;
        const userId = session.session.user.id;
    console.log(userId);
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
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <p>Loading profile...</p>
        </div>
      </MainLayout>
    );
  }
  
  if (!profile) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground">There was a problem loading your profile.</p>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile.email} disabled />
            </div>
            <div className="space-y-1">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={profile.role} disabled />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleProfileUpdate} disabled={updating}>
              {updating ? "Updating..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Google Classroom Integration</CardTitle>
            <CardDescription>
              Connect your Google account to integrate with Google Classroom.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <button className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow" onClick={handleLinkGoogle} >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* <GoogleIcon className="h-5 w-5" /> */}
                <img 
                src="https://upload.wikimedia.org/wikipedia/commons/5/59/Google_Classroom_Logo.png" 
                alt="Google Classroom" 
                className="h-5 w-5"
              />
              {profile.google_linked ? (
              <span className="text-sm text-muted-foreground">
                Your account is linked to Google Classroom.
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                Link To Google Classroom
              </span>
            )}
                {/* <span>Google Classroom Connection</span> */}
              </div>
              {/* <Switch checked={profile.google_linked} onCheckedChange={handleGoogleLink} /> */}
            </div></button>
            
            
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
