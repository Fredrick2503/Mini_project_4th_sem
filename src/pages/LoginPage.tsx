
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";

const LoginPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate("/dashboard");
      }
    };
    
    checkSession();
  }, [navigate]);

  return (
    <AuthLayout title="Sign in to your account" subtitle="Enter your credentials to access your account">
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage;
