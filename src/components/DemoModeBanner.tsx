import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function DemoModeBanner() {
  const hasAuthToken = localStorage.getItem("auth_token");
  
  if (hasAuthToken) {
    return null; // Don't show banner if authenticated
  }
  
  return (
    <Alert className="mb-4 border-blue-500/20 bg-blue-500/10">
      <Info className="h-4 w-4 text-blue-400" />
      <AlertDescription className="text-blue-400">
        <strong>Demo Mode:</strong> You're viewing the system in demo mode. 
        Some features may show mock data. Sign in for full functionality.
      </AlertDescription>
    </Alert>
  );
}
