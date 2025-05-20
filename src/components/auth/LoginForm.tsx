import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log("🔑 handleLogin called with:", { email, password });

    try {
      // 1) Attempt sign in
      console.log("⏳ Calling supabase.auth.signInWithPassword...");
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });
      console.log("✅ signInWithPassword returned:", { signInData, signInError });

      if (signInError) {
        console.error("❌ signIn error object:", signInError);
        throw signInError;
      }

      if (!signInData.user) {
        console.error("❌ No user object returned:", signInData);
        throw new Error("No user returned from Supabase.");
      }

      // 2) Fetch the user's profile role and Google link status
      console.log("⏳ Fetching profile for userId:", signInData.user.id);
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role, google_linked")
        .eq("id", signInData.user.id)
        .single();
      console.log("✅ profile fetch returned:", { profileData, profileError });

      if (profileError) {
        console.error("❌ profile fetch error:", profileError);
        throw profileError;
      }

      if (!profileData) {
        console.error("❌ No profile data found for:", signInData.user.id);
        throw new Error("Profile not found.");
      }

      // 3) Success!
      console.log("🎉 Login successful! Role:", profileData.role, "Google linked:", profileData.google_linked);
      toast({
        title: "Login successful",
        description: `Welcome back, ${profileData.role}!`,
      });

      // Redirect to Google linking page if not linked
      if (!profileData.google_linked) {
        navigate("/link-google");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      console.error("🔥 Login flow caught error:", err);
      toast({
        title: "Login failed",
        description: err.message || JSON.stringify(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="password">Password</Label>
          <Button variant="link" className="p-0 h-auto text-xs" asChild>
            <a href="/forgot-password">Forgot password?</a>
          </Button>
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Logging in..." : "Log in"}
      </Button>
    </form>
  );
};

export default LoginForm;
