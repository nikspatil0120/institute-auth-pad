import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, User, GraduationCap, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import DemoModeBanner from "@/components/DemoModeBanner";
import { useEffect, useMemo, useState } from "react";

interface Student {
  id: string;
  rollNo: string;
  name: string;
  course: string;
  year: string;
}

export default function CertificatesDashboard() {
  const { toast } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("students");
      if (stored) {
        const list = JSON.parse(stored) as Student[];
        const sorted = [...list].sort((a, b) => a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true, sensitivity: 'base' }));
        setStudents(sorted);
      }
    } catch {}
  }, []);

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      s.rollNo.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [students, query]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'issued':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getMarksColor = (marks: number) => {
    if (marks >= 90) return 'text-green-400';
    if (marks >= 75) return 'text-blue-400';
    return 'text-yellow-400';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <Navigation />
        <DemoModeBanner />
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Students</h1>
            <p className="text-muted-foreground">List of all students you’ve added</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Roll No or Name"
              className="h-9 rounded-md border border-border/50 bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
            />
            {query && (
              <Button
                size="sm"
                variant="outline"
                className="border-border/50"
                onClick={() => { setQuery(""); }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Statistics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="bg-card/95 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Users className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-xl font-bold text-foreground">{filteredStudents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <GraduationCap className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Courses</p>
                  <p className="text-xl font-bold text-foreground">{new Set(filteredStudents.map(s => s.course)).size}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <Card 
              key={student.id}
              className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card hover:shadow-glow transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 group"
              onClick={() => window.location.href = `/admin/students/${encodeURIComponent(student.rollNo)}`}
              role="button"
              tabIndex={0}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {student.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{student.rollNo}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Course</span>
                    <span className="text-sm font-medium text-foreground">{student.course}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Year</span>
                    <span className="text-sm font-medium text-foreground">{student.year}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State (if no students) */}
        {students.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Students Found</h3>
            <p className="text-muted-foreground">
              Students will appear here once they are added.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}