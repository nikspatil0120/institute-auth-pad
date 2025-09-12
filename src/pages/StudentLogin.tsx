import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Institute { id: number; name: string }

const API_BASE_URL = "http://localhost:5000/api";

export default function StudentLogin() {
  const navigate = useNavigate();
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(false);
  const [roll, setRoll] = useState("");
  const [instituteId, setInstituteId] = useState<string>("");
  const [password, setPassword] = useState("pass123");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstitutes = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/institutes`);
        const data = await res.json();
        if (res.ok) setInstitutes(data.institutes || []);
      } catch {}
    };
    fetchInstitutes();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!roll || !instituteId || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      // Probe access by attempting to fetch documents; if unauthorized, backend will reject
      const params = new URLSearchParams({ roll, institute_id: instituteId, password });
      const res = await fetch(`${API_BASE_URL}/student/documents?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      // Persist minimal session in localStorage
      localStorage.setItem("student_session", JSON.stringify({ roll, institute_id: Number(instituteId), password }));
      navigate(`/students/${encodeURIComponent(roll)}`);
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Minimal student header */}
      <header className="w-full border-b border-border/40 bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/favicon.ico" alt="logo" className="h-6 w-6 rounded" />
            <span className="font-semibold tracking-tight">Student Portal</span>
          </div>
          <div>
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground">Back to Home</a>
          </div>
        </div>
      </header>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>Student Login</CardTitle>
            <CardDescription>Enter your roll number, choose your institute, and sign in with the default password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="roll">Roll Number</Label>
                <Input id="roll" placeholder="e.g., 23102A0001" value={roll} onChange={(e) => setRoll(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Institute</Label>
                <Select value={instituteId} onValueChange={setInstituteId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your institute" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutes.map((i) => (
                      <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <p className="text-xs text-muted-foreground">Default password is <code>pass123</code></p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full bg-gradient-primary" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


