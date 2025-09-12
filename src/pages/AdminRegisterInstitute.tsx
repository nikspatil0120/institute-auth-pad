import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Building2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FormState {
  instituteName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface MessageState {
  type: 'error' | 'success' | null;
  text: string;
}

export default function AdminRegisterInstitute() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const API_BASE_URL = "http://localhost:5000/api";
  
  const [form, setForm] = useState<FormState>({
    instituteName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [message, setMessage] = useState<MessageState>({ type: null, text: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: null, text: '' });

    if (!form.instituteName || !form.email || !form.password || !form.confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields.' });
      setLoading(false);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/admin/register-institute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: form.instituteName, 
          email: form.email, 
          password: form.password 
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Institute registration failed');
      }
      
      setMessage({ type: 'success', text: 'Institute registered successfully!' });
      setForm({ email: '', password: '', confirmPassword: '', instituteName: '' });
      
      toast({
        title: "Success",
        description: "Institute has been registered successfully",
      });
      
      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Institute registration failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToDashboard}
            className="border-border/50 hover:bg-muted/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Branding Area */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Register Institute</h1>
          <p className="text-muted-foreground">Create a new institute account</p>
        </div>

        {/* Registration Card */}
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="text-center">Institute Registration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="institute-name" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Institute Name
                </Label>
                <Input
                  id="institute-name"
                  type="text"
                  placeholder="Your Institute Name"
                  value={form.instituteName}
                  onChange={(e) => setForm(prev => ({ ...prev, instituteName: e.target.value }))}
                  className="bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="admin@institute.com"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                  className="bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Register Institute'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Institute will be able to access their portal after registration
          </p>
        </div>
      </div>
    </div>
  );
}
