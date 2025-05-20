
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { UserRole } from "@/types/auth";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const DashboardPage = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [courseCount, setCourseCount] = useState<number>(0);
  
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData.session) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", sessionData.session.user.id)
          .single();
          
        if (profileData) {
          setUserRole(profileData.role as UserRole);
          setUserName(profileData.full_name || sessionData.session.user.email);
        }
      }
    };
    
    const fetchCourseCount = async () => {
      const { count, error } = await supabase
        .from("courses")
        .select("*", { count: 'exact', head: true });
      
      if (!error && count !== null) {
        setCourseCount(count);
      }
    };
    
    fetchUserData();
    fetchCourseCount();
  }, []);
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Welcome{userName ? `, ${userName}` : ""}</h1>
        <p className="text-muted-foreground">
          View your courses, manage your profile, and explore the platform.
        </p>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Courses</CardTitle>
              <CardDescription>Manage your courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-unisphere-lightBlue/10 rounded-full">
                    <BookOpen className="h-5 w-5 text-unisphere-lightBlue" />
                  </div>
                  <div className="text-2xl font-bold">{courseCount}</div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/courses">View All</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {(userRole === "super_admin" || userRole === "admin") && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Course Management</CardTitle>
                  <CardDescription>Create and sync courses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-unisphere-lightBlue/10 rounded-full">
                        <BookOpen className="h-5 w-5 text-unisphere-lightBlue" />
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/course-management">Manage Courses</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Users</CardTitle>
                  <CardDescription>Manage system users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-unisphere-purple/10 rounded-full">
                        <Users className="h-5 w-5 text-unisphere-purple" />
                      </div>
                      <div className="text-2xl font-bold">0</div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/users">Manage</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {(userRole === "super_admin") && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">System Settings</CardTitle>
                <CardDescription>Configure platform settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-unisphere-blue/10 rounded-full">
                      <Settings className="h-5 w-5 text-unisphere-blue" />
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/settings">Configure</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Getting Started</h2>
          <Card>
            <CardContent className="p-6">
              <ul className="list-disc list-inside space-y-2">
                <li>Complete your profile information</li>
                <li>Explore available courses</li>
                {(userRole === "teacher") && <li>Create your first course</li>}
                {(userRole === "super_admin" || userRole === "admin") && (
                  <>
                    <li>Manage users and roles</li>
                    <li><Link to="/course-management" className="text-blue-600 hover:underline">Create and manage courses</Link></li>
                  </>
                )}
                {(userRole === "super_admin") && <li>Configure Google Classroom integration</li>}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
