import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  Upload, 
  Shield, 
  BarChart3,
  LogOut
} from "lucide-react";

export default function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { path: "/students", label: "Student", icon: Users },
    { path: "/upload", label: "Issue", icon: Upload },
    { path: "/verify", label: "Verify", icon: Shield },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
  };

  return (
    <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/src/assets/institute-logo.png" 
              alt="Institute Logo" 
              className="h-8 w-auto"
            />
            <h2 className="text-lg font-semibold text-foreground">Institute Dashboard</h2>
          </div>
          
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  asChild
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="sm"
                  className={`flex items-center gap-2 ${
                    isActive(item.path) 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted/50"
                  }`}
                >
                  <Link to={item.path}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
            
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive ml-4"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </nav>
        </div>
      </CardContent>
    </Card>
  );
}
