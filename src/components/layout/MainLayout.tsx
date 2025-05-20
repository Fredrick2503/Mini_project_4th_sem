
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "../ui/sidebar";
import { Button } from "../ui/button";
import { SidebarProvider, SidebarContent, SidebarTrigger } from "../ui/sidebar";
import { UserRole } from "@/types/auth";
import AppSidebar from "./AppSidebar";

interface MainLayoutProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

const MainLayout = ({ children, requiredRole }: MainLayoutProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        navigate("/login");
        return;
      }

      if (requiredRole) {
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.session.user.id)
          .single();

        if (error || !profileData) {
          console.error("Error fetching profile:", error);
          navigate("/login");
          return;
        }

        const userRole = profileData.role as UserRole;
        
        // Check if user has required role
        const hasRequiredRole = Array.isArray(requiredRole)
          ? requiredRole.includes(userRole)
          : userRole === requiredRole;

        if (!hasRequiredRole) {
          navigate("/unauthorized");
          return;
        }
      }
    };

    checkAuth();
  }, [navigate, requiredRole]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex flex-col flex-grow">
          <header className="bg-white shadow-sm p-4 flex justify-between items-center">
            <div className="flex items-center">
              <SidebarTrigger />
              <h1 className="text-xl font-bold text-unisphere-blue ml-4">Unisphere LMS</h1>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </header>
          <main className="flex-grow p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
