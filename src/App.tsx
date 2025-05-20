
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import LoginPage from "./pages/LoginPage";
import GoogleLinkingPage from "./pages/GoogleLinkingPage";
import DashboardPage from "./pages/DashboardPage";
import CoursesPage from "./pages/CoursesPage";
import CourseMaterialsPage from "./pages/CourseMaterialsPage";
import CourseManagementPage from "./pages/CourseManagementPage";
import ProfilePage from "./pages/ProfilePage";
import UserManagementPage from "./pages/UserManagementPage";
import SettingsPage from "./pages/SettingsPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<LoginPage />} />
          <Route path="/link-google" element={<GoogleLinkingPage />} />
          
          {/* App Routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id/materials" element={<CourseMaterialsPage />} />
          <Route path="/course-management" element={<CourseManagementPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          
          {/* Admin Routes */}
          <Route path="/users" element={<UserManagementPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          
          {/* Special Routes */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
