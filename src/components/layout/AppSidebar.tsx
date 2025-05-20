
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  Home, BookOpen, Users, Settings, School, User, BarChart
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { UserRole } from "@/types/auth";
import unispere from "@/unisphere.png";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const AppSidebar = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        
        if (data) {
          setUserRole(data.role as UserRole);
        }
      }
    };

    fetchUserProfile();
  }, []);

  const renderNavItems = () => {
    // Common menu items for all users
    const commonItems = [
      { title: "Dashboard", path: "/dashboard", icon: Home },
      { title: "Courses", path: "/courses", icon: BookOpen },
      { title: "Profile", path: "/profile", icon: User },
    ];

    // Role-specific menu items
    const roleSpecificItems = {
      super_admin: [
        { title: "Course Management", path: "/course-management", icon: BookOpen },
        { title: "User Management", path: "/users", icon: Users },
        // { title: "Analytics", path: "/analytics", icon: BarChart },
        { title: "Settings", path: "/settings", icon: Settings },
      ],
      admin: [
        { title: "Course Management", path: "/course-management", icon: BookOpen },
        { title: "User Management", path: "/users", icon: Users },
        { title: "Settings", path: "/settings", icon: Settings },
      ],
      teacher: [
        // { title: "My Students", path: "/students", icon: School },
      ],
      student: []
    };

    const items = [
      ...commonItems,
      ...(userRole ? roleSpecificItems[userRole] : [])
    ];

    return (
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.path}>
            <SidebarMenuButton asChild>
              <NavLink 
                to={item.path}
                className={({ isActive }) => 
                  isActive ? "bg-sidebar-accent text-sidebar-accent-foreground rounded-md" : ""
                }
              >
                <item.icon size={18} />
                <span>{item.title}</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    );
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-2">
          {/* <div className="h-8 w-8 rounded-full bg-unisphere-purple flex items-center justify-center text-white font-bold">U */}
          <img src={unispere} alt="" className="h-16 w-16 rounded-full"/>

          {/* </div> */}
          <span className="font-bold text-white">Unisphere</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {renderNavItems()}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="text-xs text-sidebar-foreground/60">
          Unisphere LMS v1.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
