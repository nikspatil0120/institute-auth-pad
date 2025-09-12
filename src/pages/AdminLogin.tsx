import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Shield } from "lucide-react";
import instituteLogo from "@/assets/institute-logo.png";

interface FormState {
  userid: string;
  password: string;
}

interface MessageState {
  type: 'error' | 'success' | null;
  text: string;
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const API_BASE_URL = "http://localhost:5000/api";
  
  const [form, setForm] = useState<FormState>({
    userid: '',
    password: '',
  });

  const [message, setMessage] = useState<MessageState>({ type: null, text: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: null, text: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userid: form.userid, password: form.password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Admin login failed');
      }
      localStorage.setItem('admin_token', data.token);
      setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
      navigate('/admin/dashboard');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Admin login failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Branding Area */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src={instituteLogo} 
              alt="Institute Logo" 
              className="h-12 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Admin Portal</h1>
          <p className="text-muted-foreground">System administration access</p>
        </div>

        {/* Auth Card */}
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card">
          <CardHeader className="space-y-1 pb-4">
            <CardContent className="space-y-4 pt-4">
              {/* Message Display */}
              {message.type && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  message.type === 'error' 
                    ? 'bg-destructive/10 text-destructive border border-destructive/20' 
                    : 'bg-primary/10 text-primary border border-primary/20'
                }`}>
                  {message.type === 'error' ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span className="text-sm">{message.text}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-userid" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin User ID
                  </Label>
                  <Input
                    id="admin-userid"
                    type="text"
                    placeholder="admin123"
                    value={form.userid}
                    onChange={(e) => setForm(prev => ({ ...prev, userid: e.target.value }))}
                    className="bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                    className="bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In as Admin'}
                </Button>
              </form>
            </CardContent>
          </CardHeader>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <div className="flex items-center justify-center gap-4">
            <p className="text-sm text-muted-foreground">
              Administrative access for system management
            </p>
            <Button
              variant="outline"
              className="border-border/50 hover:bg-muted/20"
              onClick={() => navigate('/')}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
