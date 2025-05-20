
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import unispere from "@/unisphere.png";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-unisphere-gray p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          {/* <div className="h-16 w-16 rounded-full bg-unisphere-purple mx-auto flex items-center justify-center text-white font-bold text-2xl">U */}

          <img src={unispere} alt="" className="h-16 w-16 rounded-full bg-unisphere-purple mx-auto flex items-center justify-center text-white font-bold text-2xl"/>
          {/* </div> */}
          <h1 className="text-2xl font-bold text-unisphere-blue mt-4">Unisphere LMS</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold">{title}</h2>
              {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthLayout;
