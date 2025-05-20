
import { Button } from "@/components/ui/button";

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-unisphere-gray p-6">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-unisphere-blue mb-4">Access Denied</h1>
        <p className="mb-6">You don't have permission to access this page. Please contact an administrator if you believe this is an error.</p>
        <Button asChild>
          <a href="/dashboard">Return to Dashboard</a>
        </Button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
