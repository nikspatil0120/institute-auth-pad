import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, User, GraduationCap, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import DemoModeBanner from "@/components/DemoModeBanner";
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCurrentInstituteName } from "@/lib/institute-utils";

interface Student {
  id: string;
  rollNo: string;
  name: string;
  course: string;
  year: string;
  institute_name?: string;
}

export default function CertificatesDashboard() {
  const { toast } = useToast();
  const { instituteName } = useParams<{ instituteName: string }>();
  const navigate = useNavigate();
  const currentInstituteName = getCurrentInstituteName() || instituteName || 'Unknown Institute';

  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Get students from localStorage (all registered students for current institute)
      let localStorageStudents: Student[] = [];
      try {
        const stored = localStorage.getItem("students");
        if (stored) {
          const allStudents = JSON.parse(stored) as Student[];
          // Filter students for current institute only
          // Handle both old records (without institute_name) and new records (with institute_name)
          localStorageStudents = allStudents.filter(s => 
            !s.institute_name || s.institute_name === currentInstituteName
          );
        }
      } catch (error) {
        console.warn('Error parsing localStorage students:', error);
      }

      // Get students from backend (students with documents in ledger)
      let ledgerStudents: Student[] = [];
      try {
        const res = await fetch('http://localhost:5000/api/students', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          const data = await res.json();
          ledgerStudents = data.students || [];
        } else if (res.status === 401) {
          localStorage.removeItem('auth_token');
          navigate('/login');
          return;
        }
      } catch (error) {
        console.warn('Error fetching ledger students:', error);
      }

      // Merge students: start with localStorage, add any from ledger not in localStorage
      const localStorageMap = new Map(localStorageStudents.map(s => [s.rollNo, s]));
      const mergedStudents = [...localStorageStudents];
      
      ledgerStudents.forEach(ledgerStudent => {
        if (!localStorageMap.has(ledgerStudent.rollNo)) {
          mergedStudents.push(ledgerStudent);
        }
      });

      // Sort by roll number
      mergedStudents.sort((a, b) => a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true, sensitivity: 'base' }));
      
      setStudents(mergedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to fetch students data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading students...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
            <Card 
              key={student.id}
              className="bg-card/95 backdrop-blur-sm border-border/50 shadow-card hover:shadow-glow transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 group"
              onClick={() => navigate(`/institute/${instituteName}/students/${encodeURIComponent(student.rollNo)}`)}
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
        )}

        {/* Empty State (if no students) */}
        {!loading && students.length === 0 && (
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