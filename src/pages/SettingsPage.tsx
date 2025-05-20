
import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

const SettingsPage = () => {
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  const handleSaveGoogleCredentials = async () => {
    setSaving(true);
    
    try {
      // This would be handled by a secure edge function in production
      // For demo purposes, we're just showing a success toast
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Settings Saved",
        description: "Google Classroom API credentials have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <MainLayout requiredRole="super_admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">System Settings</h1>
        
        <Tabs defaultValue="google">
          <TabsList>
            <TabsTrigger value="google">Google Integration</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>
          
          <TabsContent value="google" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Google Classroom API Configuration</CardTitle>
                <CardDescription>
                  Configure your Google Classroom API credentials to enable integration.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client-id">Client ID</Label>
                  <Input 
                    id="client-id" 
                    value={googleClientId} 
                    onChange={(e) => setGoogleClientId(e.target.value)} 
                    placeholder="Enter your Google Client ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-secret">Client Secret</Label>
                  <Input 
                    id="client-secret" 
                    type="password"
                    value={googleClientSecret} 
                    onChange={(e) => setGoogleClientSecret(e.target.value)} 
                    placeholder="Enter your Google Client Secret"
                  />
                </div>
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground">
                    These credentials are used for the OAuth flow, which is handled securely by the backend.
                    Users will be redirected to a secure endpoint for authentication.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveGoogleCredentials} disabled={saving}>
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="general" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure general system settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-6 text-muted-foreground">
                  General settings will be available in a future update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
