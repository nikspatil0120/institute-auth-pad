import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Building2 } from "lucide-react";
import instituteLogo from "@/assets/institute-logo.png";

interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
  instituteName: string;
}

interface MessageState {
  type: 'error' | 'success' | null;
  text: string;
}

export default function AuthForm() {
  const [loginForm, setLoginForm] = useState<Pick<FormState, 'email' | 'password'>>({
    email: '',
    password: '',
  });

  const [registerForm, setRegisterForm] = useState<FormState>({
    email: '',
    password: '',
    confirmPassword: '',
    instituteName: '',
  });

  const [message, setMessage] = useState<MessageState>({ type: null, text: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: null, text: '' });

    // Simulate API call
    setTimeout(() => {
      if (loginForm.email && loginForm.password) {
        setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
      } else {
        setMessage({ type: 'error', text: 'Please fill in all fields.' });
      }
      setLoading(false);
    }, 1500);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: null, text: '' });

    // Simulate API call
    setTimeout(() => {
      if (!registerForm.instituteName || !registerForm.email || !registerForm.password || !registerForm.confirmPassword) {
        setMessage({ type: 'error', text: 'Please fill in all fields.' });
      } else if (registerForm.password !== registerForm.confirmPassword) {
        setMessage({ type: 'error', text: 'Passwords do not match.' });
      } else {
        setMessage({ type: 'success', text: 'Registration successful! Please check your email.' });
        setRegisterForm({ email: '', password: '', confirmPassword: '', instituteName: '' });
      }
      setLoading(false);
    }, 1500);
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
          <h1 className="text-2xl font-bold text-foreground mb-2">Institute Portal</h1>
          <p className="text-muted-foreground">Access your educational platform</p>
        </div>

        {/* Auth Card */}
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card">
          <CardHeader className="space-y-1 pb-4">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Message Display */}
              {message.type && (
                <div className={`flex items-center gap-2 p-3 rounded-lg mt-4 ${
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

              <TabsContent value="login">
                <CardContent className="space-y-4 pt-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="institute@example.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                        className="bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300 disabled:opacity-50"
                      disabled={loading}
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = '/students';
                      }}
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>

              <TabsContent value="register">
                <CardContent className="space-y-4 pt-4">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="institute-name" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Institute Name
                      </Label>
                      <Input
                        id="institute-name"
                        type="text"
                        placeholder="Your Institute Name"
                        value={registerForm.instituteName}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, instituteName: e.target.value }))}
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
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
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
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
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
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300 disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Secure authentication for educational institutions
          </p>
        </div>
      </div>
    </div>
  );
}